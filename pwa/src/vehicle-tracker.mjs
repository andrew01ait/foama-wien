import {serviceDayStart,timetableDate} from './timetable.mjs?v=0.10.2';

export const VEHICLE_FRESH_MS=60_000,VEHICLE_EXPIRE_MS=90_000;
export const PILOT_SCHEDULE_MATCH_MS=60_000;
const norm=s=>String(s??'').replace(/^Wien\s+/i,'').trim().toLocaleLowerCase('de-AT');
const time=s=>typeof s==='string'?Date.parse(s):NaN;
const range=times=>{const indices=times.flatMap((t,i)=>t?[i]:[]);return {start:indices[0],end:indices.at(-1)};};

export async function decodeVehiclePilot(envelope){
 if(envelope?.format!==2||envelope.encoding!=='gzip-base64'||typeof envelope.payload!=='string'||envelope.payload.length>4_000_000)throw Error('Ungültiges U6-Fahrplanpaket.');
 const bytes=Uint8Array.from(atob(envelope.payload),c=>c.charCodeAt(0)),reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),decoder=new TextDecoder();let size=0,raw='';
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12_000_000)throw Error('U6-Fahrplanpaket zu groß.');raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
 const data=JSON.parse(raw);if(data.version!==envelope.version||data.sourceSha256!==envelope.sourceSha256)throw Error('U6-Paketversion stimmt nicht überein.');return data;
}
export function validateVehiclePilot(data,manifest,line){
 if(data?.format!==2||data.route!=='U6'||data.mode!=='metro'||data.version!==manifest?.version||data.sourceSha256!==manifest?.sourceSha256||line?.sourceSha256!==data.sourceSha256||!Array.isArray(data.directions)||data.directions.length!==2)throw Error('Pilot und Fahrplan passen nicht zusammen.');
 for(const d of data.directions){
  const pattern=line.patterns.find(p=>p.id===d.patternId),count=d.stops?.length;
  if(!pattern||pattern.direction!==d.id||pattern.towards!==d.towards||!['H','R'].includes(d.monitorDirection)||count!==24||count!==pattern.stops.length||!Array.isArray(d.trips)||!d.trips.length||d.trips.length>20_000||new Set(d.trips.map(t=>t.ref)).size!==d.trips.length)throw Error('Ungültige U6-Strecke.');
  const rbls=d.stops.map(s=>s.rbl).filter(Boolean);if(new Set(rbls).size!==rbls.length||rbls.length!==count-1)throw Error('Ungültige Monitorabdeckung.');
  for(let i=0;i<count;i++){const s=d.stops[i],p=pattern.stops[i];if(p.platformId!==s.platformId||p.id!==s.id||(i===count-1?s.rbl!==null:!/^\d+$/.test(s.rbl)))throw Error('Ungültige U6-Haltefolge.');}
  for(const t of d.trips){
   if(!/^[a-f0-9]{16}$/.test(t.ref)||!manifest.services[t.service]||typeof t.towards!=='string'||!t.towards||!Array.isArray(t.times)||t.times.length!==count)throw Error('Ungültige Pilot-Fahrtzeiten.');
   const r=range(t.times);if(r.start==null||r.end<=r.start)throw Error('Fahrtabschnitt fehlt.');
   let previous=null;for(const p of t.times){if(p===null)continue;if(!Array.isArray(p)||p.length!==2||p.some(x=>!Number.isInteger(x)||x<0||x>=172800)||p[0]>p[1]||previous&&p[0]<=previous[1])throw Error('Ungültige Fahrtzeitfolge.');previous=p;}
  }
 }
 return data;
}
export function pilotSchedules(direction,manifest,at){
 const today=timetableDate(at),date=Date.parse(today+'T12:00Z'),days=[-1,0,1].map(n=>new Date(date+n*86400_000).toISOString().slice(0,10)),out=[];
 if(today<manifest.validFrom||today>manifest.validThrough)return out;
 for(const day of days){const origin=serviceDayStart(day);for(const t of direction.trips){
  if(!manifest.services[t.service]?.includes(day))continue;
  const times=t.times.map(p=>p?[origin+p[0]*1000,origin+p[1]*1000]:null),r=range(times);
  if(times[r.end][1]<at-600_000||times[r.start][0]>at+2*3600_000)continue;
  out.push({key:day+'|'+direction.id+'|'+t.ref,ref:t.ref,day,towards:t.towards||direction.towards,times,...r});
 }}return out;
}
export function normalizePilotSnapshot(raw,direction,now=Date.now()){
 const source=time(raw?.foamaMonitorAt),server=time(raw?.message?.serverTime),at=Math.min(source,server);
 if(!Number.isFinite(at)||Math.max(source,server)>now+30_000||now-at>VEHICLE_FRESH_MS||!Array.isArray(raw?.data?.monitors))throw Error('Live-Daten fehlen oder sind zu alt.');
 if(Number(raw.message?.messageCode||0)>1)throw Error('Die Quelle meldet einen Fehler.');
 const rows=[],coverage=new Set(),targets=new Set([direction.towards,...direction.trips.map(t=>t.towards)].map(norm));
 for(const m of raw.data.monitors){
  const rbl=String(m.locationStop?.properties?.attributes?.rbl??''),index=direction.stops.findIndex(s=>s.rbl===rbl);if(index<0)continue;
  for(const l of m.lines||[]){
   if(l.name!=='U6'||l.type!=='ptMetro'||l.direction!==direction.monitorDirection||String(l.richtungsId)!==direction.monitorDirectionId||!targets.has(norm(l.towards)))continue;coverage.add(index);
   for(const d of l.departures?.departure||[]){
    const v=d.vehicle||{},scheduled=time(d.departureTime?.timePlanned),actual=time(d.departureTime?.timeReal),towards=norm(v.towards??l.towards);
    if((v.name??l.name)!=='U6'||(v.type??l.type)!=='ptMetro'||(v.direction??l.direction)!==direction.monitorDirection||String(v.richtungsId??l.richtungsId)!==direction.monitorDirectionId||!targets.has(towards)||(v.realtimeSupported??l.realtimeSupported)===false||!Number.isFinite(scheduled)||!Number.isFinite(actual)||actual<at-30_000||actual>at+2*3600_000)continue;
    rows.push({index,rbl,scheduled,actual,towards,onStop:v.onStop===true,at,key:rbl+'|'+scheduled});
   }
  }
 }
 const expected=direction.stops.filter(s=>s.rbl).length;
 return {at,rows,coverage:[...coverage],expected,complete:coverage.size===expected};
}
function consistent(anchors,schedule){
 const entries=[...anchors].sort((a,b)=>a[0]-b[0]),latest=Math.max(...entries.map(([,v])=>v.at));if(entries.filter(([,v])=>v.onStop&&v.at===latest).length>1)return false;
 for(let n=1;n<entries.length;n++){const [a,x]=entries[n-1],[b,y]=entries[n],expected=schedule.times[b][1]-schedule.times[a][1],delta=y.actual-x.actual;if(delta<Math.max(15_000,expected*.25)||delta>expected*3+60_000)return false;}return true;
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
export function createVehicleTracker(direction,manifest,{prefix='U6-'+direction.monitorDirection}={}){
 let lastAt=0,serial=0,latest=null,problem='',partial=false;const tracks=new Map(),events=[];
 function event(track,kind,from,to,at){events.unshift({id:track.id,kind,from,to,at});events.splice(80);}
 function remember(t,p,at){if(p&&!p.stale){t.lastPosition={...p};t.lastPositionAt=at;t.hadPosition=true;}}
 function ingest(snapshot){
  if(snapshot.at<=lastAt)return {ignored:true};lastAt=snapshot.at;latest=snapshot;partial=!snapshot.complete;problem='';
  const schedules=pilotSchedules(direction,manifest,snapshot.at),bundles=new Map();
  for(const observation of snapshot.rows){
   const candidates=schedules.filter(s=>s.times[observation.index]&&(!observation.towards||norm(s.towards)===observation.towards)&&Math.abs(s.times[observation.index][1]-observation.scheduled)<=PILOT_SCHEDULE_MATCH_MS);observation.candidates=candidates.map(s=>s.key);
   for(const schedule of candidates){let b=bundles.get(schedule.key);if(!b){b={schedule,options:new Map()};bundles.set(schedule.key,b);}const options=b.options.get(observation.index)||[];options.push(observation);b.options.set(observation.index,options);}
  }
  const viable=new Map([...bundles].filter(([key,b])=>b.options.size>=2||tracks.has(key))),updated=new Set();
  for(const [key,b] of viable){
   const anchors=new Map();for(const [i,options] of b.options){const unique=options.filter(o=>o.candidates.filter(k=>viable.has(k)).length===1);if(unique.length===1)anchors.set(i,unique[0]);}
   let t=tracks.get(key);if(!t){if(anchors.size<2)continue;t={id:prefix+'-T'+String(++serial).padStart(3,'0'),schedule:b.schedule,hits:0,anchors:new Map(),lastSeen:0,lastReported:null,blocked:'',awaiting:false};tracks.set(key,t);}
   if(!anchors.size){t.awaitingReason='Mehrdeutige Stationsmeldung';continue;}
   const before=t.awaiting?t.lastPosition:vehiclePosition(t,snapshot.at);if(!t.awaiting)remember(t,before,Math.min(snapshot.at,t.lastSeen+VEHICLE_FRESH_MS));
   if(!consistent(anchors,b.schedule)){t.blocked='Widersprüchliche Stationsprognosen';t.hits=0;t.awaitingReason=t.blocked;continue;}
   const nextAnchors=new Map([...t.anchors].filter(([i,o])=>snapshot.at-o.at<300_000&&b.schedule.times[i]));for(const [i,o] of anchors)nextAnchors.set(i,o);
   t.hits=snapshot.at-t.lastSeen<=VEHICLE_EXPIRE_MS?t.hits+1:1;t.anchors=nextAnchors;t.lastSeen=snapshot.at;t.blocked='';t.awaiting=false;t.awaitingReason='';t.expiryLogged=false;t.completed=false;updated.add(key);
   const next=vehiclePosition(t,snapshot.at);if(before&&next&&next.progress<before.progress-.15){t.hits=1;t.blocked='Prognosekorrektur · Zuordnung wird erneut geprüft';event(t,'correction',null,null,snapshot.at);}else remember(t,next,snapshot.at);
   const reported=[...anchors].filter(([,o])=>o.onStop).map(([i])=>i);
   if(reported.length===1){const stop=reported[0];if(t.lastReported!=null&&stop<t.lastReported){t.hits=0;t.blocked='Stationsanker in falscher Reihenfolge';}else{if(t.lastReported!=null&&stop>t.lastReported)event(t,'handover',t.lastReported,stop,snapshot.at);t.lastReported=stop;}}
   if(t.hits===1&&!t.blocked)event(t,'candidate',null,null,snapshot.at);
  }
  for(const [key,t] of tracks){if(!updated.has(key)&&t.hadPosition&&!t.awaiting){t.awaiting=true;t.awaitingReason=t.awaitingReason||'Stationsmeldung fehlt';event(t,'gap',null,null,snapshot.at);}if(snapshot.at-t.lastSeen>600_000)tracks.delete(key);}
  while(tracks.size>128)tracks.delete(tracks.keys().next().value);
  return {accepted:true,partial};
 }
 function view(now=Date.now()){
  const stale=!lastAt||now-lastAt>VEHICLE_FRESH_MS,out=[];
  for(const t of tracks.values()){
   const expired=now-t.lastSeen>VEHICLE_EXPIRE_MS;
   if(expired&&t.hadPosition&&!t.expiryLogged){event(t,'expired',null,null,now);t.expiryLogged=true;}
   let position=!problem&&t.lastSeen===lastAt&&!expired?vehiclePosition(t,now):null;
   if(position&&!position.stale)remember(t,position,now);
   let status=t.blocked||(t.lastSeen!==lastAt?t.awaitingReason||'Stationsmeldung fehlt':t.hits<2?'Zuordnung wird geprüft':stale?'Daten veraltet':'Plausibel zugeordnet');
   if((!position||position.stale||problem)&&t.lastPosition&&!expired&&now-t.lastPositionAt<=VEHICLE_EXPIRE_MS){position={...t.lastPosition,stale:true,uncertain:true,basis:'held'};status=problem||t.blocked||t.awaitingReason||'Warte auf nächste Stationsmeldung';}
   const holding=position?.basis==='held';if(holding&&!t.holding&&!t.awaiting)event(t,'gap',null,null,now);if(position&&!holding&&t.holding)event(t,'reacquired',null,null,now);t.holding=holding;
   if(!position&&t.hadPosition&&!expired)status=t.blocked||t.awaitingReason||'Keine aktuelle Lage aus den Stationsmeldungen ableitbar';
   if(t.lastPosition?.basis==='terminal-estimate'&&now>t.lastPosition.until&&!t.completed){t.completed=true;event(t,'end',null,Math.round(t.lastPosition.progress),now);}
   if(expired){position=null;status='Keine frische Zuordnung seit 90 Sekunden';}
   if(t.completed){position=null;status='Geschätzte Endstation erreicht';}
   if(!expired||t.hadPosition&&now-t.lastSeen<300_000)out.push({...t,position,status});
  }
  return {at:lastAt,problem,partial,stale,rows:latest?.rows||[],coverage:latest?.coverage||[],expected:latest?.expected??direction.stops.filter(s=>s.rbl).length,events:events.slice(),tracks:out};
 }
 return {ingest,view,fail(message){problem=message;for(const t of tracks.values())if(t.hadPosition&&!t.awaiting){t.awaiting=true;t.awaitingReason=message;event(t,'gap',null,null,lastAt);}},clear(){tracks.clear();events.length=0;lastAt=0;latest=null;problem='';partial=false;}};
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
