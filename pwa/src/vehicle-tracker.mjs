import {serviceDayStart,timetableDate} from './timetable.mjs?v=0.10.0';

export const VEHICLE_FRESH_MS=60_000,VEHICLE_EXPIRE_MS=90_000;
// This U6 GTFS rounds to minutes; the monitor supplies second-level plan times.
export const PILOT_SCHEDULE_MATCH_MS=60_000;
const norm=s=>String(s??'').replace(/^Wien\s+/i,'').trim().toLocaleLowerCase('de-AT');
const time=s=>typeof s==='string'?Date.parse(s):NaN;
export function validateVehiclePilot(data,manifest,line){
 if(data?.format!==1||data.route!=='U6'||data.mode!=='metro'||data.version!==manifest?.version||data.sourceSha256!==manifest?.sourceSha256||line?.sourceSha256!==data.sourceSha256||!Array.isArray(data.directions)||data.directions.length!==2)throw Error('Pilot und Fahrplan passen nicht zusammen.');
 for(const d of data.directions){
  const pattern=line.patterns.find(p=>p.id===d.patternId);
  if(!pattern||pattern.direction!==d.id||pattern.towards!==d.towards||!['H','R'].includes(d.monitorDirection)||!Array.isArray(d.stops)||d.stops.length!==3||new Set(d.stops.map(s=>s.rbl)).size!==3||!Array.isArray(d.trips)||!d.trips.length||d.trips.length>20_000||new Set(d.trips.map(t=>t.ref)).size!==d.trips.length)throw Error('Ungültiger Pilotabschnitt.');
  let previous=-1;for(const s of d.stops){const index=pattern.stops.findIndex(p=>p.platformId===s.platformId&&p.id===s.id);if(index<=previous||!/^\d+$/.test(s.rbl))throw Error('Ungültige Pilot-Haltefolge.');previous=index;}
  for(const t of d.trips){if(!/^[a-f0-9]{16}$/.test(t.ref)||!manifest.services[t.service]||!Array.isArray(t.times)||t.times.length!==3||t.times.some((p,i)=>p.length!==2||p.some(x=>!Number.isInteger(x)||x<0||x>=172800)||p[0]>p[1]||i>0&&p[0]<=t.times[i-1][1]))throw Error('Ungültige Pilot-Fahrtzeiten.');}
 }
 return data;
}
export function pilotSchedules(direction,manifest,at){
 const today=timetableDate(at),date=Date.parse(today+'T12:00Z'),days=[-1,0,1].map(n=>new Date(date+n*86400_000).toISOString().slice(0,10)),out=[];
 if(today<manifest.validFrom||today>manifest.validThrough)return out;
 for(const day of days){const origin=serviceDayStart(day);for(const t of direction.trips){if(!manifest.services[t.service]?.includes(day))continue;const times=t.times.map(([a,d])=>[origin+a*1000,origin+d*1000]);if(times.at(-1)[1]<at-600_000||times[0][0]>at+2*3600_000)continue;out.push({key:day+'|'+direction.id+'|'+t.ref,ref:t.ref,day,times});}}
 return out;
}
export function normalizePilotSnapshot(raw,direction,now=Date.now()){
 const source=time(raw?.foamaMonitorAt),server=time(raw?.message?.serverTime),at=Math.min(source,server);
 if(!Number.isFinite(at)||Math.max(source,server)>now+30_000||now-at>VEHICLE_FRESH_MS||!Array.isArray(raw?.data?.monitors))throw Error('Live-Daten fehlen oder sind zu alt.');
 if(Number(raw.message?.messageCode||0)>1)throw Error('Die Quelle meldet einen Fehler.');
 const rows=[],coverage=new Set();
 for(const m of raw.data.monitors){const rbl=String(m.locationStop?.properties?.attributes?.rbl??''),index=direction.stops.findIndex(s=>s.rbl===rbl);if(index<0)continue;
  for(const l of m.lines||[]){if(l.name!=='U6'||l.type!=='ptMetro'||l.direction!==direction.monitorDirection||String(l.richtungsId)!==direction.monitorDirectionId||norm(l.towards)!==norm(direction.towards))continue;coverage.add(index);
   for(const d of l.departures?.departure||[]){const v=d.vehicle||{},scheduled=time(d.departureTime?.timePlanned),actual=time(d.departureTime?.timeReal);
    if((v.name??l.name)!=='U6'||(v.type??l.type)!=='ptMetro'||(v.direction??l.direction)!==direction.monitorDirection||String(v.richtungsId??l.richtungsId)!==direction.monitorDirectionId||norm(v.towards??l.towards)!==norm(direction.towards)||(v.realtimeSupported??l.realtimeSupported)===false||!Number.isFinite(scheduled)||!Number.isFinite(actual)||actual<at-30_000||actual>at+2*3600_000)continue;
    rows.push({index,rbl,scheduled,actual,onStop:v.onStop===true,at,key:rbl+'|'+scheduled});
   }
  }
 }
 return {at,rows,coverage:[...coverage],complete:coverage.size===direction.stops.length};
}
function consistent(anchors,schedule){
 const entries=[...anchors].sort((a,b)=>a[0]-b[0]),latest=Math.max(...entries.map(([,v])=>v.at));if(entries.filter(([,v])=>v.onStop&&v.at===latest).length>1)return false;
 for(let n=1;n<entries.length;n++){const [a,x]=entries[n-1],[b,y]=entries[n],expected=schedule.times[b][1]-schedule.times[a][1],delta=y.actual-x.actual;if(delta<Math.max(15_000,expected*.25)||delta>expected*3+60_000)return false;}
 return true;
}
export function vehiclePosition(track,now){
 if(track.hits<2||track.blocked||now-track.lastSeen>VEHICLE_EXPIRE_MS)return null;
 const stale=now-track.lastSeen>VEHICLE_FRESH_MS,at=stale?track.lastSeen+VEHICLE_FRESH_MS:now;
 const anchors=track.anchors,times=track.schedule.times;
 for(const [index,o] of anchors){if(o.onStop&&at>=o.at&&at<=Math.max(o.actual,o.at+10_000)&&at-o.at<=VEHICLE_FRESH_MS)return {progress:index,station:index,next:index,stale,basis:'onStop'};}
 for(let i=0;i<times.length-1;i++){
  const a=anchors.get(i),b=anchors.get(i+1);if(!a||!b||at-b.at>VEHICLE_FRESH_MS||at-a.at>300_000)continue;
  const departure=Math.max(a.actual,a.onStop?a.at+10_000:a.actual),arrival=b.actual-(times[i+1][1]-times[i+1][0]),expected=times[i+1][0]-times[i][1];
  if(arrival-departure<Math.max(15_000,expected*.25)||arrival-departure>expected*3+60_000)continue;
  if(at>=departure&&at<=arrival)return {progress:i+(at-departure)/(arrival-departure),station:null,next:i+1,stale,basis:'interpolated'};
  if(at>=arrival&&at<=b.actual)return {progress:i+1,station:i+1,next:i+1,stale,basis:'scheduled-dwell'};
 }
 return null;
}
export function createVehicleTracker(direction,manifest,{prefix='U6-'+direction.monitorDirection}={}){
 let lastAt=0,serial=0,latest=null,problem='',partial=false;const tracks=new Map(),events=[];
 function event(track,kind,from,to,at){events.unshift({id:track.id,kind,from,to,at});events.splice(80);}
 function ingest(snapshot){
  if(snapshot.at<=lastAt)return {ignored:true};lastAt=snapshot.at;latest=snapshot;partial=!snapshot.complete;problem='';
  if(partial)return {partial:true};
  const schedules=pilotSchedules(direction,manifest,snapshot.at),bundles=new Map();
  for(const observation of snapshot.rows){const candidates=schedules.filter(s=>Math.abs(s.times[observation.index][1]-observation.scheduled)<=PILOT_SCHEDULE_MATCH_MS);observation.candidates=candidates.map(s=>s.key);
   for(const schedule of candidates){let b=bundles.get(schedule.key);if(!b){b={schedule,anchors:new Map(),duplicate:false};bundles.set(schedule.key,b);}if(b.anchors.has(observation.index))b.duplicate=true;b.anchors.set(observation.index,observation);}
  }
  const viable=new Map([...bundles].filter(([key,b])=>b.anchors.size>=2||tracks.has(key)));
  for(const [key,b] of viable){let track=tracks.get(key);const ambiguous=b.duplicate||[...b.anchors.values()].some(o=>o.candidates.filter(k=>viable.has(k)).length!==1);
   if(!track){if(ambiguous||b.anchors.size<2)continue;track={id:prefix+'-T'+String(++serial).padStart(3,'0'),schedule:b.schedule,hits:0,anchors:new Map(),lastSeen:0,lastReported:null,blocked:''};tracks.set(key,track);}
   const previous=vehiclePosition(track,snapshot.at),nextAnchors=new Map([...track.anchors].filter(([,o])=>snapshot.at-o.at<300_000));for(const [i,o] of b.anchors)nextAnchors.set(i,o);
   const bad=ambiguous||!consistent(nextAnchors,b.schedule);if(bad){track.blocked=ambiguous?'Mehrdeutige Fahrtzuordnung':'Widersprüchliche Stationsprognosen';track.hits=0;continue;}
   track.hits=snapshot.at-track.lastSeen<=VEHICLE_EXPIRE_MS?track.hits+1:1;track.anchors=nextAnchors;track.lastSeen=snapshot.at;track.blocked='';
   const next=vehiclePosition(track,snapshot.at);if(previous&&next&&next.progress<previous.progress-.15){track.hits=1;track.blocked='Prognosekorrektur · Zuordnung wird erneut geprüft';event(track,'correction',null,null,snapshot.at);}
   const reported=[...b.anchors].filter(([,o])=>o.onStop).map(([i])=>i);
   if(reported.length===1){const stop=reported[0];if(track.lastReported!=null&&stop<track.lastReported){track.hits=0;track.blocked='Stationsanker in falscher Reihenfolge';}else{if(track.lastReported!=null&&stop>track.lastReported)event(track,'handover',track.lastReported,stop,snapshot.at);track.lastReported=stop;}}
   if(track.hits===1&&!track.blocked)event(track,'candidate',null,null,snapshot.at);
  }
  for(const [key,t] of tracks)if(snapshot.at-t.lastSeen>600_000)tracks.delete(key);
  while(tracks.size>64)tracks.delete(tracks.keys().next().value);
  return {accepted:true};
 }
 function view(now=Date.now()){
  const stale=!lastAt||now-lastAt>VEHICLE_FRESH_MS;
  return {at:lastAt,problem,partial,stale,rows:latest?.rows||[],coverage:latest?.coverage||[],events:events.slice(),tracks:[...tracks.values()].filter(t=>now-t.lastSeen<=VEHICLE_EXPIRE_MS).map(t=>({...t,position:problem||partial||t.lastSeen!==lastAt?null:vehiclePosition(t,now),status:t.blocked||(t.lastSeen!==lastAt?'Keine aktuelle Zuordnung':t.hits<2?'Zuordnung wird geprüft':stale?'Daten veraltet':'Plausibel zugeordnet')}))};
 }
 return {ingest,view,fail(message){problem=message;},clear(){tracks.clear();events.length=0;lastAt=0;latest=null;problem='';partial=false;}};
}

const metres=(a,b)=>Math.hypot((a[0]-b[0])*111_320,(a[1]-b[1])*111_320*Math.cos((a[0]+b[0])*Math.PI/360));
// Project stations onto the real GTFS polyline, preserving distance along it.
export function pilotGeometry(points,stops){
 if(points.length<2)throw Error('Geografischer Linienverlauf fehlt.');const cumulative=[0];for(let i=1;i<points.length;i++)cumulative.push(cumulative.at(-1)+metres(points[i-1],points[i]));
 const anchors=stops.map(s=>{let best=Infinity,along=0;const p=[s.lat,s.lon];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],scale=Math.cos(s.lat*Math.PI/180),dx=(b[1]-a[1])*scale,dy=b[0]-a[0],den=dx*dx+dy*dy,q=den?Math.max(0,Math.min(1,((p[1]-a[1])*scale*dx+(p[0]-a[0])*dy)/den)):0,project=[a[0]+q*(b[0]-a[0]),a[1]+q*(b[1]-a[1])],distance=metres(p,project);if(distance<best){best=distance;along=cumulative[i-1]+q*(cumulative[i]-cumulative[i-1]);}}if(best>100)throw Error('Station liegt nicht am Linienverlauf.');return along;});
 if(anchors.some((a,i)=>i&&a<=anchors[i-1]))throw Error('Fahrtrichtung und Linienverlauf widersprechen sich.');
 const at=distance=>{let i=1;while(i<cumulative.length-1&&cumulative[i]<distance)i++;const q=(distance-cumulative[i-1])/(cumulative[i]-cumulative[i-1]||1);return [points[i-1][0]+q*(points[i][0]-points[i-1][0]),points[i-1][1]+q*(points[i][1]-points[i-1][1])];};
 return {points:[at(anchors[0]),...points.filter((p,i)=>cumulative[i]>anchors[0]&&cumulative[i]<anchors.at(-1)),at(anchors.at(-1))],at(progress){const i=Math.min(anchors.length-2,Math.max(0,Math.floor(progress))),fraction=Math.max(0,Math.min(1,progress-i));return at(anchors[i]+fraction*(anchors[i+1]-anchors[i]));}};
}
