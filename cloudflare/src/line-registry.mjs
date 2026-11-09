import {CONFIRMATION_MS,EVIDENCE_RETENTION_MS,lineKey,validEvidenceLine} from '../../pwa/src/line-evidence.mjs';

const localParts=now=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
function localCheck(now){const p=localParts(now);return {day:p.year+'-'+p.month+'-'+p.day,band:Math.floor(Number(p.hour)/6)};}
function inferMode(type,route){const text=String(type||'').toLowerCase();return text.includes('metro')||/^U\d$/i.test(route)?'metro':text.includes('tram')||text.includes('wlb')?'tram':text.includes('trains')||/^S\d/i.test(route)?'sbahn':text.includes('train')?'regional':'bus';}
const idFor=(...parts)=>JSON.stringify(parts);

export function shouldSuppressLine(line,observation,checks,baseline,now){
 // Scheduled passenger service is independent positive evidence. A 70-minute
 // absence must never silently erase a timetable/night/on-demand connection.
 if(baseline.some(item=>lineKey(item)===lineKey(line)))return false;
 const lastSeen=Number(observation?.last_seen||0);
 if(lastSeen&&now-lastSeen<=CONFIRMATION_MS)return false;
 if(/R$/i.test(line.route))return false; // Rufbus is not disproved by absence.
 const eligible=checks.filter(check=>Number(check.last_checked)>lastSeen&&(/^N/i.test(line.route)?check.band===0:check.band!==0));
 const first=lastSeen||Math.min(...eligible.map(check=>Number(check.first_checked)));
 return Number.isFinite(first)&&now-first>CONFIRMATION_MS&&new Set(eligible.map(check=>check.day)).size>=3&&(/^N/i.test(line.route)||new Set(eligible.map(check=>check.band)).size>=2);
}

export async function stationLineRegistry(payload,requestedIds,catalogue,db,{fresh=false,now=Date.now()}={}){
 const unavailable={version:1,status:'unavailable',stations:[]};
 if(!db||!Array.isArray(catalogue))return unavailable;
 const requested=new Set(requestedIds.map(String)),byRbl=new Map(),selected=[];
 for(const stop of catalogue){if(stop.provider!=='wl')continue;for(const id of stop.rbl||[])byRbl.set(String(id),stop);if((stop.rbl||[]).some(id=>requested.has(String(id))))selected.push(stop);}
 if(!selected.length||selected.length>24)return unavailable;
 try{
  const monitors=payload?.data?.monitors,code=Number(payload?.message?.messageCode??1);
  if(!Array.isArray(monitors)||code!==1)return unavailable;
  const stamp=payload.message?.serverTime||payload.foamaMonitorAt||'',sourceTime=Date.parse(stamp);
  const observedAt=Number.isFinite(sourceTime)?sourceTime:stamp?NaN:now;
  const validFresh=fresh&&Number.isFinite(observedAt)&&observedAt<=now+30_000&&now-observedAt<=120_000;
  if(validFresh){
   const observed=new Map(),invalid=new Set();
   for(const monitor of monitors){
    const rbl=String(monitor.locationStop?.properties?.attributes?.rbl??''),stop=byRbl.get(rbl);
    if(!requested.has(rbl)||!stop)continue;
    if(!Array.isArray(monitor.lines)){invalid.add(stop.id);continue;}
    for(const line of monitor.lines.slice(0,64)){
     for(const source of [line,...(line.departures?.departure||[]).slice(0,100).map(d=>d.vehicle).filter(Boolean)]){
      const route=String(source.name||line.name||'').trim(),mode=inferMode(source.type||line.type||monitor.type,route),item={route,mode};
      if(validEvidenceLine(item))observed.set(idFor(stop.id,route,mode),{...item,stopId:stop.id});
     }
    }
   }
   const statements=[];
   for(const [id,line] of observed)statements.push(db.prepare('INSERT INTO foama_station_lines (id,station_id,route,mode,first_seen,last_seen) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET first_seen=MIN(first_seen,excluded.first_seen),last_seen=MAX(last_seen,excluded.last_seen)').bind(id,line.stopId,line.route,line.mode,observedAt,observedAt));
   const {day,band}=localCheck(observedAt);
   for(const stop of selected){
    const expected=(stop.platforms?.length?stop.platforms.map(p=>p.id):stop.rbl||[]).map(String);
    // Every known platform must have been requested. Filtered/rotated/detail
    // batches cannot count as a full station check. Missing monitors by itself
    // means no departures in the operator's horizon, never immediate removal.
    if(!expected.length||!expected.every(id=>requested.has(id))||invalid.has(stop.id)||payload.data.partial===true)continue;
    statements.push(db.prepare('INSERT INTO foama_station_check_days (id,station_id,day,band,first_checked,last_checked) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET first_checked=MIN(first_checked,excluded.first_checked),last_checked=MAX(last_checked,excluded.last_checked)').bind(idFor(stop.id,day,band),stop.id,day,band,observedAt,observedAt));
   }
   statements.push(db.prepare('DELETE FROM foama_station_lines WHERE last_seen<?').bind(now-EVIDENCE_RETENTION_MS),db.prepare('DELETE FROM foama_station_check_days WHERE last_checked<?').bind(now-EVIDENCE_RETENTION_MS));
   for(let i=0;i<statements.length;i+=32){const chunk=statements.slice(i,i+32);if(db.batch)await db.batch(chunk);else for(const statement of chunk)await statement.run();}
  }
  const placeholders=selected.map(()=>'?').join(','),ids=selected.map(stop=>stop.id);
  const observations=(await db.prepare('SELECT station_id,route,mode,first_seen,last_seen FROM foama_station_lines WHERE station_id IN ('+placeholders+') AND last_seen>=?').bind(...ids,now-EVIDENCE_RETENTION_MS).all()).results||[];
  const checks=(await db.prepare('SELECT station_id,day,band,first_checked,last_checked FROM foama_station_check_days WHERE station_id IN ('+placeholders+') AND last_checked>=?').bind(...ids,now-EVIDENCE_RETENTION_MS).all()).results||[];
  const stations=selected.map(stop=>{
   const seen=observations.filter(row=>row.station_id===stop.id),history=checks.filter(row=>row.station_id===stop.id);
   const candidates=new Map([...(stop.candidateLines||[]),...seen].filter(validEvidenceLine).map(line=>[lineKey(line),line]));
   const suppressed=[...candidates.values()].filter(line=>shouldSuppressLine(line,seen.find(row=>lineKey(row)===lineKey(line)),history,stop.lines||[],now)).map(({route,mode})=>({route,mode}));
   return {stopId:stop.id,checkedAt:now,lines:seen.map(row=>({route:row.route,mode:row.mode,lastSeen:row.last_seen,confirmed:now-row.last_seen<=CONFIRMATION_MS})),suppressed};
  });
  return {version:1,status:'available',confirmationDays:30,stations};
 }catch{return unavailable;}
}
