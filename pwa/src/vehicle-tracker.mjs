import {serviceDayStart,timetableDate} from './timetable.mjs?v=0.11.29';

export const VEHICLE_FRESH_MS=60_000,VEHICLE_EXPIRE_MS=90_000;
export const PILOT_SCHEDULE_MATCH_MS=60_000;
const norm=s=>String(s??'').replace(/^Wien\s+/i,'').trim().toLocaleLowerCase('de-AT');
const time=s=>typeof s==='string'?Date.parse(s):NaN;
const range=times=>{const indices=times.flatMap((t,i)=>t?[i]:[]);return {start:indices[0],end:indices.at(-1)};};
const modeMatches=(type,mode)=>mode==='metro'?type==='ptMetro':mode==='tram'?['ptTram','ptTramWLB'].includes(type):mode==='bus'?/^ptBus/.test(type)||type==='ptRufBus':false;
export const vehicleTargetMatches=(direction,expected,actual)=>norm(expected)===norm(actual)||(direction.targetAliases?.[expected]||[]).some(alias=>norm(alias)===norm(actual));

export async function decodeVehiclePilot(envelope){
 if(![2,3].includes(envelope?.format)||envelope.encoding!=='gzip-base64'||typeof envelope.payload!=='string'||envelope.payload.length>4_000_000)throw Error('Ungültiges Fahrzeug-Fahrplanpaket.');
 const bytes=Uint8Array.from(atob(envelope.payload),c=>c.charCodeAt(0)),reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),decoder=new TextDecoder();let size=0,raw='';
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12_000_000)throw Error('Fahrzeug-Fahrplanpaket zu groß.');raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
 const data=JSON.parse(raw);if(data.format!==envelope.format||data.version!==envelope.version||data.sourceSha256!==envelope.sourceSha256)throw Error('Paketversion stimmt nicht überein.');return data;
}
export function validateVehiclePilot(data,manifest,line){
 if(![2,3].includes(data?.format)||data.route!==line?.route||data.mode!==line?.mode||!['metro','tram','bus'].includes(data.mode)||data.version!==manifest?.version||data.sourceSha256!==manifest?.sourceSha256||line?.sourceSha256!==data.sourceSha256||!Array.isArray(data.directions)||!data.directions.length||data.directions.length>100||new Set(data.directions.map(d=>d.id)).size!==data.directions.length)throw Error('Fahrzeugdaten und Fahrplan passen nicht zusammen.');
 for(const d of data.directions){
  const pattern=line.patterns.find(p=>p.id===d.patternId),count=d.stops?.length;
  if(!pattern||pattern.direction!==(d.gtfsDirection??d.id)||pattern.towards!==d.towards||!['H','R'].includes(d.monitorDirection)||!['1','2'].includes(d.monitorDirectionId)||count<3||count>400||count!==pattern.stops.length||!Array.isArray(d.trips)||!d.trips.length||d.trips.length>20_000||new Set(d.trips.map(t=>t.ref)).size!==d.trips.length||(data.format===3&&(d.route!==data.route||d.mode!==data.mode||d.id!==d.patternId)))throw Error('Ungültige Fahrzeugstrecke.');
  const rbls=d.stops.map(s=>s.rbl).filter(Boolean);if(new Set(rbls).size!==rbls.length||rbls.length<2||(data.format===2&&rbls.length!==count-1))throw Error('Ungültige Monitorabdeckung.');
  for(let i=0;i<count;i++){const s=d.stops[i],p=pattern.stops[i];if(p.platformId!==s.platformId||p.id!==s.id||(i===count-1?s.rbl!==null:s.rbl!==null&&!/^\d{1,7}$/.test(s.rbl)))throw Error('Ungültige Haltefolge.');}
  if(d.targetAliases&&(typeof d.targetAliases!=='object'||Object.entries(d.targetAliases).some(([name,aliases])=>!name||!Array.isArray(aliases)||aliases.length>100||aliases.some(a=>typeof a!=='string'||a.length>200))))throw Error('Ungültige Zielzuordnung.');
  for(const t of d.trips){
   if(!/^[a-f0-9]{16}$/.test(t.ref)||!manifest.services[t.service]||typeof t.towards!=='string'||!t.towards||!Array.isArray(t.times)||t.times.length!==count)throw Error('Ungültige Fahrtzeiten.');
   const r=range(t.times);if(r.start==null||r.end<=r.start)throw Error('Fahrtabschnitt fehlt.');
   let previous=null;for(const p of t.times){if(p===null)continue;if(!Array.isArray(p)||p.length!==2||p.some(x=>!Number.isInteger(x)||x<0||x>=172800)||p[0]>p[1]||previous&&(data.format===2?p[0]<=previous[1]:p[0]<previous[1]))throw Error('Ungültige Fahrtzeitfolge.');previous=p;}
  }
 }
 return data;
}
export function pilotSchedules(direction,manifest,at,{profiles=false}={}){
 const today=timetableDate(at),date=Date.parse(today+'T12:00Z'),days=[-1,0,1].map(n=>new Date(date+n*86400_000).toISOString().slice(0,10)),out=[];
 if(today<manifest.validFrom||today>manifest.validThrough)return out;
 for(const day of days){const origin=serviceDayStart(day);for(const t of direction.trips){
  if(!manifest.services[t.service]?.includes(day))continue;
  const times=t.times.map(p=>p?[origin+p[0]*1000,origin+p[1]*1000]:null),r=range(times);
  if(!(profiles&&day===today)&&(times[r.end][1]<at-600_000||times[r.start][0]>at+2*3600_000))continue;
  out.push({key:day+'|'+direction.id+'|'+t.ref,ref:t.ref,day,towards:t.towards||direction.towards,times,...r});
 }}return out;
}
export function normalizePilotSnapshot(raw,direction,now=Date.now(),requestedIds=direction.stops.map(s=>s.rbl).filter(Boolean),desiredIds=requestedIds){
 const source=time(raw?.foamaMonitorAt),server=time(raw?.message?.serverTime),at=Math.min(source,server);
 if(!Number.isFinite(at)||Math.max(source,server)>now+30_000||now-at>VEHICLE_FRESH_MS||!Array.isArray(raw?.data?.monitors))throw Error('Live-Daten fehlen oder sind zu alt.');
 if(Number(raw.message?.messageCode||0)>1)throw Error('Die Quelle meldet einen Fehler.');
 const rows=[],coverage=new Set(),targets=new Set([direction.towards,...direction.trips.map(t=>t.towards),...Object.values(direction.targetAliases||{}).flat()].map(norm)),requested=new Set(requestedIds),route=direction.route||'U6',mode=direction.mode||'metro';
 for(const m of raw.data.monitors){
  const rbl=String(m.locationStop?.properties?.attributes?.rbl??''),index=direction.stops.findIndex(s=>s.rbl===rbl);if(index<0||!requested.has(rbl))continue;
  for(const l of m.lines||[]){
   if(l.name!==route||!modeMatches(l.type,mode)||l.direction!==direction.monitorDirection||String(l.richtungsId)!==direction.monitorDirectionId)continue;coverage.add(index);
   for(const d of l.departures?.departure||[]){
    const v=d.vehicle||{},scheduled=time(d.departureTime?.timePlanned),actual=time(d.departureTime?.timeReal),towards=norm(v.towards??l.towards);
    if((v.name??l.name)!==route||!modeMatches(v.type??l.type,mode)||(v.direction??l.direction)!==direction.monitorDirection||String(v.richtungsId??l.richtungsId)!==direction.monitorDirectionId||!targets.has(towards)||(v.realtimeSupported??l.realtimeSupported)===false||!Number.isFinite(scheduled)||!Number.isFinite(actual)||actual<at-30_000||actual>at+2*3600_000)continue;
    rows.push({index,rbl,scheduled,actual,towards,onStop:v.onStop===true,at,key:rbl+'|'+scheduled});
   }
  }
 }
 const expected=requested.size,budgetLimited=[...new Set(desiredIds)].filter(id=>!requested.has(id)).length;
 return {at,rows,coverage:[...coverage],requested:direction.stops.flatMap((s,i)=>s.rbl&&requested.has(s.rbl)?[i]:[]),expected,budgetLimited,complete:expected>0&&coverage.size===expected};
}
function consistent(anchors,schedule){
 const entries=[...anchors].sort((a,b)=>a[0]-b[0]),latest=Math.max(...entries.map(([,v])=>v.at));if(entries.filter(([,v])=>v.onStop&&v.at===latest).length>1)return false;
 for(let n=1;n<entries.length;n++){const [a,x]=entries[n-1],[b,y]=entries[n],expected=schedule.times[b][1]-schedule.times[a][1],delta=y.actual-x.actual;if(delta<(expected===0?0:Math.max(15_000,expected*.25))||delta>expected*3+60_000)return false;}return true;
}
const departure=o=>Math.max(o.actual,o.onStop?o.at+10_000:o.actual);
export function vehiclePosition(track,now){
 if(track.hits<2||track.blocked||now-track.lastSeen>VEHICLE_EXPIRE_MS)return null;
 const stale=now-track.lastSeen>VEHICLE_FRESH_MS,at=stale?track.lastSeen+VEHICLE_FRESH_MS:now,anchors=track.anchors,times=track.schedule.times;
 for(const [index,o] of anchors)if(o.onStop&&at>=o.at&&at<=departure(o)&&at-o.at<=VEHICLE_FRESH_MS)return {progress:index,station:index,next:index,stale,basis:'onStop'};
 const served=times.flatMap((p,i)=>p?[i]:[]);
 for(let k=0;k<served.length-1;k++){
  const i=served[k],j=served[k+1],a=anchors.get(i),b=anchors.get(j);if(!a||!b||at-b.at>VEHICLE_FRESH_MS||at-a.at>300_000)continue;
  const start=departure(a),arrival=b.actual-(times[j][1]-times[j][0]),expected=times[j][0]-times[i][1];
  if(arrival-start<Math.max(15_000,expected*.25)||arrival-start>expected*3+60_000)continue;
  if(at>=start&&at<=arrival){const fraction=(at-start)/(arrival-start);return {progress:i+(j-i)*fraction,from:i,to:j,fraction,station:null,next:j,stale,basis:'interpolated'};}
  if(at>=arrival&&at<=b.actual)return {progress:j,station:j,next:j,stale,basis:'scheduled-dwell'};
 }
 // An excerpt edge may lack the preceding board. Estimate only its adjacent
 // served segment from two fresh downstream anchors of a confirmed identity.
 const fresh=served.filter(i=>anchors.has(i)&&at-anchors.get(i).at<=VEHICLE_FRESH_MS);
 if(fresh.length>=2){const j=fresh[0],k=served.indexOf(j),i=served[k-1],b=anchors.get(j);
  if(i!=null&&!anchors.has(i)&&!b.onStop){const arrival=b.actual-(times[j][1]-times[j][0]),duration=times[j][0]-times[i][1],start=arrival-duration;
   if(duration>=15000&&at>=start&&at<=arrival){const fraction=(at-start)/duration;return {progress:i+(j-i)*fraction,from:i,to:j,fraction,station:null,next:j,stale,basis:'approach-estimate',uncertain:true};}
  }
 }
 // One missing next-stop forecast can use a distinctly marked schedule projection.
 for(let k=served.length-2;k>=0;k--){
  const i=served[k],j=served[k+1],a=anchors.get(i);if(!a||at-a.at>VEHICLE_FRESH_MS)continue;
  const start=departure(a),arrival=start+times[j][0]-times[i][1];if(arrival<=start)continue;
  if(at>=start&&at<=arrival){const fraction=(at-start)/(arrival-start);return {progress:i+(j-i)*fraction,from:i,to:j,fraction,station:null,next:j,stale,basis:'schedule-bridge',uncertain:true};}
  const end=track.schedule.end??range(times).end;
  if(j===end&&at>=arrival&&at<=arrival+20_000)return {progress:j,station:j,next:j,stale,basis:'terminal-estimate',uncertain:true,until:arrival+20_000};
 }
 return null;
}
// Surface monitors may use a different departure timetable. Their live planned
// times identify a station chain; GTFS supplies only a compatible time profile.
// No nearest GTFS departure, rank-based ID, or inferred training data is used.
function stationChainBundles(direction,snapshot,schedules,tracks){
 const rows=[],perStop=new Map();for(const row of snapshot.rows){row.candidates=[];const count=perStop.get(row.index)||0;if(count<8){rows.push(row);perStop.set(row.index,count+1);}}
 const profiles=new Map();for(const schedule of schedules){const first=schedule.times[schedule.start][1],signature=JSON.stringify([schedule.towards,schedule.times.map(p=>p?[p[0]-first,p[1]-first]:null)]);if(!profiles.has(signature))profiles.set(signature,schedule);}
 const groups=new Map(),ambiguousKeys=new Set();
 for(const profile of profiles.values()){
  const possible=rows.filter(r=>profile.times[r.index]&&vehicleTargetMatches(direction,profile.towards,r.towards)).map(row=>({row,delta:row.scheduled-profile.times[row.index][1]}));
  for(const lower of new Set(possible.map(x=>x.delta))){
   const options=new Map();for(const x of possible){if(x.delta<lower||x.delta>lower+60_000)continue;const at=options.get(x.row.index)||[];at.push(x);options.set(x.row.index,at);}
   if(options.size>=3)for(const alternatives of options.values())if(alternatives.length>1)for(const x of alternatives)ambiguousKeys.add(x.row.key);
   const unique=[...options.values()].filter(v=>v.length===1).map(v=>v[0]).sort((a,b)=>a.row.index-b.row.index);if(unique.length<3||unique.some((v,i)=>i&&v.row.scheduled<unique[i-1].row.scheduled))continue;
   const anchors=new Map(unique.map(x=>[x.row.index,x.row]));if(!consistent(anchors,profile))continue;
   const keys=new Set(unique.map(x=>x.row.key)),signature=[...keys].sort().join(';'),spread=Math.max(...unique.map(x=>x.delta))-Math.min(...unique.map(x=>x.delta));
   if(groups.has(signature)&&groups.get(signature).spread<=spread)continue;
   const deltas=unique.map(x=>x.delta).sort((a,b)=>a-b),offset=deltas[Math.floor(deltas.length/2)];groups.set(signature,{keys,anchors,spread,schedule:{...profile,inferred:true,prototypeRef:profile.ref,times:profile.times.map(p=>p?[p[0]+offset,p[1]+offset]:null)}});
  }
 }
 const maximal=[];for(const candidate of [...groups.values()].sort((a,b)=>b.keys.size-a.keys.size))if(!maximal.some(other=>[...candidate.keys].every(k=>other.keys.has(k))))maximal.push(candidate);
 const used=new Map();for(const c of maximal)for(const key of c.keys)used.set(key,(used.get(key)||0)+1);
 const candidates=[];
 for(const c of maximal){const anchors=new Map([...c.anchors].filter(([,r])=>used.get(r.key)===1&&!ambiguousKeys.has(r.key)));if(anchors.size<3)continue;const keys=new Set([...anchors.values()].map(r=>r.key)),matches=[],weak=[];
  for(const [key,t] of tracks){if(snapshot.at-t.lastSeen>VEHICLE_EXPIRE_MS)continue;const old=new Set([...t.anchors.values()].map(r=>r.key)),overlap=[...keys].filter(k=>old.has(k)).length;if(overlap>=2)matches.push(key);else if(overlap&&t.hadPosition)weak.push(key);}
  candidates.push({...c,anchors,keys,matches,weak});
 }
 const claimed=new Map();for(const c of candidates)for(const key of c.matches)claimed.set(key,(claimed.get(key)||0)+1);
 const bundles=new Map();
 for(const c of candidates){if(c.matches.length>1||c.matches.length===1&&claimed.get(c.matches[0])!==1||!c.matches.length&&c.weak.length)continue;
  const key=c.matches[0]||'live|'+[...c.keys].sort().join(';'),schedule={...c.schedule,key};const options=new Map();for(const [index,row] of c.anchors){row.candidates=[key];options.set(index,[row]);}bundles.set(key,{schedule,options});
 }
 // Two exact shared keys can continue an established surface identity at an
 // excerpt edge. They still cannot create a new surface identity.
 const claimedRows=new Set([...bundles.values()].flatMap(b=>[...b.options.values()].flat().map(r=>r.key)));
 for(const [key,t] of tracks){
  if(bundles.has(key)||t.retired||snapshot.at-t.lastSeen>VEHICLE_EXPIRE_MS)continue;
  const previous=new Set([...t.anchors.values()].map(r=>r.key)),anchors=new Map();
  for(const row of rows){if(!previous.has(row.key)||ambiguousKeys.has(row.key)||claimedRows.has(row.key)||rows.filter(r=>r.key===row.key).length!==1)continue;
   if([...tracks.values()].some(other=>other!==t&&snapshot.at-other.lastSeen<=VEHICLE_EXPIRE_MS&&[...other.anchors.values()].some(r=>r.key===row.key)))continue;
   anchors.set(row.index,row);
  }
  if(anchors.size<2||!consistent(anchors,t.schedule))continue;
  const options=new Map();for(const [index,row] of anchors){row.candidates=[key];options.set(index,[row]);claimedRows.add(row.key);}bundles.set(key,{schedule:t.schedule,options});
 }
 return bundles;
}
export function createVehicleTracker(direction,manifest,{prefix=(direction.route||'U6')+'-'+direction.monitorDirection,fullLine=false}={}){
 let lastAt=0,serial=0,latest=null,problem='',partial=false;const tracks=new Map(),events=[],samples=new Map(),boards=new Map();
 const identity=JSON.stringify([manifest.version,manifest.sourceSha256,direction.route,direction.mode,direction.id,direction.monitorDirection,direction.monitorDirectionId,direction.stops.map(s=>[s.id,s.rbl]),direction.trips.map(t=>t.ref)]);
 // Navigation restores evidence directly, never replays it as another live
 // observation. Keep source times, duplicate guards and ID allocation intact.
 function checkpoint(){return {format:1,identity,prefix,fullLine,lastAt,serial,latest,problem,partial,tracks:[...tracks].map(([key,t])=>[key,{...t,anchors:[...t.anchors]}]),events:events.slice(),samples:[...samples],boards:[...boards]};}
 function restore(saved,now=Date.now()){
  try{
   const list=(value,limit)=>Array.isArray(value)&&value.length<=limit,index=i=>Number.isInteger(i)&&i>=0&&i<direction.stops.length;
   const row=r=>r&&index(r.index)&&[r.at,r.scheduled,r.actual].every(Number.isFinite)&&typeof r.key==='string';
   if(saved?.format!==1||saved.identity!==identity||saved.fullLine!==fullLine||typeof saved.prefix!=='string'||saved.prefix.length>160||!Number.isFinite(saved.lastAt)||!saved.lastAt||saved.lastAt>now+30000||now-saved.lastAt>VEHICLE_EXPIRE_MS||!Number.isSafeInteger(saved.serial)||saved.serial<0||!list(saved.tracks,128)||!list(saved.events,80)||!list(saved.samples,64)||!list(saved.boards,400)||typeof saved.problem!=='string')return false;
   const restored=new Map();
   for(const [key,t] of saved.tracks){
    if(typeof key!=='string'||typeof t.id!=='string'||!t.id.startsWith(saved.prefix+'-T')||!Number.isInteger(t.hits)||t.hits<0||!Number.isFinite(t.lastSeen)||t.lastSeen>saved.lastAt||!list(t.anchors,400)||!list(t.schedule?.times,400)||t.schedule.times.length!==direction.stops.length||t.schedule.key!==key||!index(t.schedule.start)||!index(t.schedule.end))return false;
    if(t.schedule.times.some(p=>p!==null&&(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))))return false;
    if(t.anchors.some(([i,r])=>!index(i)||!row(r)||r.index!==i||!t.schedule.times[i]))return false;
    if(t.lastPosition&&(!Number.isFinite(t.lastPositionAt)||!Number.isFinite(t.lastPosition.progress)||t.lastPosition.progress<0||t.lastPosition.progress>direction.stops.length-1))return false;
    restored.set(key,{...t,anchors:new Map(t.anchors)});
   }
   if(saved.samples.some(([scope,at])=>typeof scope!=='string'||!Number.isFinite(at))||saved.boards.some(([i,b])=>!index(i)||!Number.isFinite(b.at)||!list(b.rows,1000)||!b.rows.every(row)))return false;
   tracks.clear();for(const [key,t] of restored)tracks.set(key,t);samples.clear();for(const [key,at] of saved.samples)samples.set(key,at);boards.clear();for(const [i,b] of saved.boards)boards.set(i,b);
   events.splice(0,events.length,...saved.events);({lastAt,serial,latest,problem,partial,prefix}=saved);return true;
  }catch{return false;}
 }
 function event(track,kind,from,to,at){events.unshift({id:track.id,kind,from,to,at});events.splice(80);}
 function remember(t,p,at){if(p&&!p.stale){t.lastPosition={...p};t.lastPositionAt=at;t.hadPosition=true;}}
 function ingest(snapshot){
  const scoped=fullLine&&Array.isArray(snapshot.requested),scope=scoped?snapshot.requested.join(','):'all';
  if(snapshot.at<=(scoped?samples.get(scope)||0:lastAt))return {ignored:true};
  if(scoped){samples.set(scope,snapshot.at);while(samples.size>64)samples.delete(samples.keys().next().value);for(const index of snapshot.requested){if((boards.get(index)?.at||0)>snapshot.at)continue;boards.set(index,{at:snapshot.at,covered:snapshot.coverage.includes(index),rows:snapshot.rows.filter(row=>row.index===index)});}}
  if(snapshot.at>=lastAt){lastAt=snapshot.at;latest=snapshot;}partial=!snapshot.complete;problem='';
  const chain=['bus','tram'].includes(direction.mode),nearby=pilotSchedules(direction,manifest,snapshot.at),schedules=chain&&!nearby.length?pilotSchedules(direction,manifest,snapshot.at,{profiles:true}):nearby,bundles=chain?stationChainBundles(direction,snapshot,schedules,tracks):new Map();
  for(const observation of chain?[]:snapshot.rows){
   const candidates=schedules.filter(s=>s.times[observation.index]&&(!observation.towards||vehicleTargetMatches(direction,s.towards,observation.towards))&&Math.abs(s.times[observation.index][1]-observation.scheduled)<=PILOT_SCHEDULE_MATCH_MS);observation.candidates=candidates.map(s=>s.key);
   for(const schedule of candidates){let b=bundles.get(schedule.key);if(!b){b={schedule,options:new Map()};bundles.set(schedule.key,b);}const options=b.options.get(observation.index)||[];options.push(observation);b.options.set(observation.index,options);}
  }
  const viable=new Map([...bundles].filter(([key,b])=>b.options.size>=2||tracks.has(key))),updated=new Set();
  for(const [key,b] of viable){
   const anchors=new Map();for(const [i,options] of b.options){const unique=options.filter(o=>o.candidates.filter(k=>viable.has(k)).length===1);if(unique.length===1)anchors.set(i,unique[0]);}
   let t=tracks.get(key);if(scoped&&t&&snapshot.at<=t.lastSeen){updated.add(key);continue;}if(!t){if(anchors.size<(chain?3:2))continue;t={id:prefix+'-T'+String(++serial).padStart(3,'0'),schedule:b.schedule,hits:0,anchors:new Map(),lastSeen:0,lastReported:null,blocked:'',awaiting:false};tracks.set(key,t);}
   if(t.retired&&anchors.size<(chain?3:2))continue;
   if(!anchors.size){t.awaitingReason='Mehrdeutige Stationsmeldung';continue;}
   const before=t.awaiting||t.correction?t.lastPosition:vehiclePosition(t,snapshot.at);if(!t.awaiting&&!t.correction)remember(t,before,Math.min(snapshot.at,t.lastSeen+VEHICLE_FRESH_MS));
   if(!consistent(anchors,b.schedule)){t.blocked='Widersprüchliche Stationsprognosen';t.hits=0;t.awaitingReason=t.blocked;continue;}
   const shared=[...anchors].filter(([i,o])=>t.anchors.get(i)?.key===o.key).length;
   const nextAnchors=new Map([...t.anchors].filter(([i,o])=>snapshot.at-o.at<300_000&&b.schedule.times[i]));for(const [i,o] of anchors)nextAnchors.set(i,o);
   t.hits=snapshot.at-t.lastSeen<=VEHICLE_EXPIRE_MS?t.hits+1:1;t.schedule=b.schedule;t.anchors=nextAnchors;t.lastSeen=snapshot.at;t.blocked='';t.awaiting=false;t.awaitingReason='';t.expiryLogged=false;t.completed=false;t.retired=false;updated.add(key);
   const next=vehiclePosition(t,snapshot.at);
   if(before&&next&&next.progress<before.progress-.15){
    if(shared>=2){if(!t.correction){t.correction={progress:before.progress};event(t,'correction',null,null,snapshot.at);}}
    else{t.hits=1;t.blocked='Prognosekorrektur · Zuordnung wird erneut geprüft';event(t,'correction',null,null,snapshot.at);}
   }else if(!t.correction)remember(t,next,snapshot.at);
   const reported=[...anchors].filter(([,o])=>o.onStop).map(([i])=>i);
   if(reported.length===1){const stop=reported[0];if(t.lastReported!=null&&stop<t.lastReported){t.hits=0;t.blocked='Stationsanker in falscher Reihenfolge';}else{if(t.lastReported!=null&&stop>t.lastReported)event(t,'handover',t.lastReported,stop,snapshot.at);t.lastReported=stop;}}
   if(t.hits===1&&!t.blocked)event(t,'candidate',null,null,snapshot.at);
  }
  for(const [key,t] of tracks){const observed=!scoped||snapshot.requested.some(index=>t.anchors.has(index));if(!updated.has(key)&&(t.hadPosition||scoped)&&!t.awaiting&&observed&&(!scoped||snapshot.at>t.lastSeen)){t.awaiting=true;t.awaitingReason=t.awaitingReason||'Stationsmeldung fehlt';event(t,'gap',null,null,snapshot.at);}if(snapshot.at-t.lastSeen>600_000)tracks.delete(key);}
  while(tracks.size>128)tracks.delete(tracks.keys().next().value);
  return {accepted:true,partial};
 }
 function view(now=Date.now()){
  const stale=!lastAt||now-lastAt>VEHICLE_FRESH_MS,out=[];
  for(const t of tracks.values()){
   const expired=now-t.lastSeen>VEHICLE_EXPIRE_MS;
   if(expired&&t.hadPosition&&!t.expiryLogged){event(t,'expired',null,null,now);t.expiryLogged=true;}
   let position=!problem&&(fullLine?!t.awaiting:t.lastSeen===lastAt)&&!expired?vehiclePosition(t,now):null;
   if(t.correction){if(position&&position.progress>=t.correction.progress-.01){t.correction=null;}else position=null;}
   if(position&&!position.stale)remember(t,position,now);
   let status=t.blocked||((fullLine?t.awaiting:t.lastSeen!==lastAt)?t.awaitingReason||'Stationsmeldung fehlt':t.hits<2?'Zuordnung wird geprüft':now-t.lastSeen>VEHICLE_FRESH_MS?'Daten veraltet':'Plausibel zugeordnet');
   if((!position||position.stale||problem)&&t.lastPosition&&!expired&&now-t.lastPositionAt<=VEHICLE_EXPIRE_MS){position={...t.lastPosition,stale:true,uncertain:true,basis:'held'};status=problem||t.blocked||t.awaitingReason||(t.correction?'Prognosekorrektur · letzte Lage kurz gehalten':'Warte auf nächste Stationsmeldung');}
   const holding=position?.basis==='held';if(holding&&!t.holding&&!t.awaiting)event(t,'gap',null,null,now);if(position&&!holding&&t.holding)event(t,'reacquired',null,null,now);t.holding=holding;
   if(!position&&t.hadPosition&&!expired)status=t.blocked||t.awaitingReason||'Keine aktuelle Lage aus den Stationsmeldungen ableitbar';
   if(t.lastPosition?.basis==='terminal-estimate'&&now>t.lastPosition.until&&!t.completed){t.completed=true;event(t,'end',null,Math.round(t.lastPosition.progress),now);}
   if(expired){position=null;status='Keine frische Zuordnung seit 90 Sekunden';}
   if(t.completed){position=null;status='Geschätzte Endstation erreicht';}
   if(t.retired){position=null;status=t.awaitingReason;}
   if(!expired||t.hadPosition&&now-t.lastSeen<300_000)out.push({...t,position,status});
  }
  if(!stale&&!problem)for(const lost of out){
   if(lost.position?.basis!=='held'||lost.retired||lost.correction)continue;
   const following=out.find(fresh=>{
    if(fresh.id===lost.id||fresh.lastSeen!==lastAt||fresh.hits<2||fresh.blocked||!fresh.position||fresh.position.stale||fresh.position.uncertain||fresh.position.progress<lost.position.progress+.35||!vehicleTargetMatches(direction,lost.schedule.towards,fresh.schedule.towards))return false;
    const shared=[...fresh.anchors].filter(([index,row])=>row.at===lastAt&&lost.anchors.has(index));
    return shared.length>=2&&shared.every(([index,row])=>row.scheduled-lost.anchors.get(index).scheduled>PILOT_SCHEDULE_MATCH_MS);
   });
   if(following){const t=tracks.get(lost.schedule.key);t.retired=true;t.hits=0;t.lastPosition=null;t.lastPositionAt=0;t.holding=false;t.awaiting=true;t.awaitingReason='Letzte Lage durch bestätigte Folgefahrt überholt';event(t,'superseded',null,null,lastAt);Object.assign(lost,{retired:true,position:null,status:t.awaitingReason});}
  }
  const freshBoards=fullLine?[...boards].filter(([,board])=>now-board.at<=VEHICLE_FRESH_MS):[],coverage=fullLine?freshBoards.filter(([,board])=>board.covered).map(([index])=>index):latest?.coverage||[],expected=fullLine?direction.stops.filter(s=>s.rbl).length:latest?.expected??direction.stops.filter(s=>s.rbl).length;
  return {at:lastAt,problem,fullLine,partial:fullLine?coverage.length<expected:partial,stale,rows:fullLine?freshBoards.flatMap(([,board])=>board.rows):latest?.rows||[],coverage,expected,budgetLimited:fullLine?0:latest?.budgetLimited||0,events:events.slice(),tracks:out};
 }
 return {ingest,view,checkpoint,restore,fail(message){problem=message;for(const t of tracks.values())if(t.hadPosition&&!t.awaiting){t.awaiting=true;t.awaitingReason=message;event(t,'gap',null,null,lastAt);}},clear(){tracks.clear();samples.clear();boards.clear();events.length=0;lastAt=0;latest=null;problem='';partial=false;}};
}


const metres=(a,b)=>Math.hypot((a[0]-b[0])*111_320,(a[1]-b[1])*111_320*Math.cos((a[0]+b[0])*Math.PI/360));
// Project stations onto the real GTFS polyline, preserving distance along it.
export function pilotGeometry(points,stops){
 if(points.length<2)throw Error('Geografischer Linienverlauf fehlt.');const cumulative=[0];for(let i=1;i<points.length;i++)cumulative.push(cumulative.at(-1)+metres(points[i-1],points[i]));
 const anchors=stops.map(s=>{let best=Infinity,along=0;const p=[s.lat,s.lon];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],scale=Math.cos(s.lat*Math.PI/180),dx=(b[1]-a[1])*scale,dy=b[0]-a[0],den=dx*dx+dy*dy,q=den?Math.max(0,Math.min(1,((p[1]-a[1])*scale*dx+(p[0]-a[0])*dy)/den)):0,project=[a[0]+q*(b[0]-a[0]),a[1]+q*(b[1]-a[1])],distance=metres(p,project);if(distance<best){best=distance;along=cumulative[i-1]+q*(cumulative[i]-cumulative[i-1]);}}if(best>100)throw Error('Station liegt nicht am Linienverlauf.');return along;});
 if(anchors.some((a,i)=>i&&a<=anchors[i-1]))throw Error('Fahrtrichtung und Linienverlauf widersprechen sich.');
 const at=distance=>{let i=1;while(i<cumulative.length-1&&cumulative[i]<distance)i++;const q=(distance-cumulative[i-1])/(cumulative[i]-cumulative[i-1]||1);return [points[i-1][0]+q*(points[i][0]-points[i-1][0]),points[i-1][1]+q*(points[i][1]-points[i-1][1])];};
 return {points:[at(anchors[0]),...points.filter((p,i)=>cumulative[i]>anchors[0]&&cumulative[i]<anchors.at(-1)),at(anchors.at(-1))],at(progress){const i=Math.min(anchors.length-2,Math.max(0,Math.floor(progress))),fraction=Math.max(0,Math.min(1,progress-i));return at(anchors[i]+fraction*(anchors[i+1]-anchors[i]));},between(from,to,fraction){if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to>=anchors.length||to<=from)throw Error('Ungültiger Fahrabschnitt.');return at(anchors[from]+Math.max(0,Math.min(1,fraction))*(anchors[to]-anchors[from]));}};
}
