import {decodeVehiclePilot,validateVehiclePilot,createVehicleTracker,normalizePilotSnapshot} from '../pwa/src/vehicle-tracker.mjs';
import {preferredVehicleDirection,stationVehicleRange,vehicleDisplayId} from '../pwa/src/vehicle-data.mjs';
import {nextVehicleArrival,vehicleArrival} from '../pwa/src/vehicle-arrival.mjs';
import {timetableDate} from '../pwa/src/timetable.mjs';

// Public transit state only. No device identity, location or persisted history.
// Reuse the PWA's conservative two-source tracker rather than another estimator.
export function createWearApproach({assets,monitor,now=()=>Date.now()}){
 const packages=new Map(),sessions=new Map();
 const read=path=>{const asset=assets[path];if(!asset)throw Error('missing');return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0))));};
 const reply=(body,status=200,seconds=30)=>Response.json(body,{status,headers:{'cache-control':'no-store','retry-after':String(seconds),'x-content-type-options':'nosniff'}});
 async function load(route,mode){
  const key=mode+'|'+route;
  if(packages.has(key))return packages.get(key);
  const pending=(async()=>{
   const manifest=read('/data/timetables/wien/manifest.json'),index=read('/data/vehicle-pilot/index.json'),maps=read('/data/line-maps/wien/index.json');
   const entry=index.lines.find(l=>l.id===key),mapEntry=maps.lines.find(l=>l.id===key);
   if(!entry||!mapEntry)return null;
   const line=read('/data/line-maps/wien/'+mapEntry.file),data=await decodeVehiclePilot(read('/data/vehicle-pilot/'+entry.file));
   validateVehiclePilot(data,manifest,line);return {manifest,line,data};
  })().catch(error=>{packages.delete(key);throw error;});
  packages.set(key,pending);while(packages.size>4)packages.delete(packages.keys().next().value);return pending;
 }
 return async function handle(request,monitorOverride){
  if(request.method!=='GET')return reply({error:'Nur GET erlaubt.'},405);
  const p=new URL(request.url).searchParams,route=p.get('route')||'',mode=p.get('mode')||'',stopId=p.get('stop')||'',towards=p.get('towards')||'';
  if(!/^[A-Za-z0-9]{1,12}$/.test(route)||!['metro','tram','bus'].includes(mode)||!/^wl:\d{1,10}$/.test(stopId)||!towards||towards.length>160||[...p.keys()].some(k=>!['route','mode','stop','towards'].includes(k)))return reply({error:'Ungültige Verbindung.'},400);
  let bundle;try{bundle=await load(route,mode);}catch{return reply({available:false,status:'Linienbasis vorübergehend nicht verfügbar.'},503,60);}
  if(!bundle)return reply({available:false,status:'Für diese Linie gibt es noch keine Fahrzeugschätzung.'});
  const {manifest,line,data}=bundle,day=timetableDate(now());
  if(day<manifest.validFrom||day>manifest.validThrough)return reply({available:false,status:'Fahrplanbasis abgelaufen. Abfahrten bleiben verfügbar.'});
  const direction=preferredVehicleDirection(data,line,manifest,{stopId,towards,day});
  // Never silently substitute a different direction for the requested connection.
  const normalize=s=>s.replace(/^Wien\s+/i,'').trim().toLocaleLowerCase('de-AT');
  if(!direction||![direction.towards,...Object.values(direction.targetAliases||{}).flat()].some(s=>normalize(s)===normalize(towards)))return reply({available:false,status:'Diese Richtung kann noch nicht sicher zugeordnet werden.'});
  const range=stationVehicleRange(direction,stopId),key=route+'|'+mode+'|'+direction.id+'|'+stopId,time=now();
  for(const [k,s] of sessions)if(time-s.used>300000&&!s.pending)sessions.delete(k);
  let session=sessions.get(key);
  if(!session){session={tracker:createVehicleTracker(direction,manifest),used:time,attempt:0,retry:0,raw:null};sessions.set(key,session);while(sessions.size>24)sessions.delete(sessions.keys().next().value);}
  session.used=time;
  if(session.pending)await session.pending;
  else if(time>=session.retry&&time-session.attempt>=30000){
   session.attempt=time;session.retry=time+30000;
   session.pending=(async()=>{
    try{
     const url=new URL('/api/monitor',request.url);for(const id of range.ids)url.searchParams.append('stopId',id);
     const response=await (monitorOverride||monitor)(new Request(url,{headers:request.headers}));
     if(!response.ok){session.retry=Math.max(session.retry,now()+Math.min(300,Math.max(30,Number(response.headers.get('retry-after'))||60))*1000);throw Error('source');}
     const raw=await response.json();session.tracker.ingest(normalizePilotSnapshot(raw,direction,now(),range.ids));session.raw=raw;
    }catch{session.retry=Math.max(session.retry,now()+60000);session.tracker.fail('Stationsdaten vorübergehend nicht verfügbar.');}
    finally{session.pending=null;}
   })();await session.pending;
  }
  const state=session.tracker.view(now()),arrival=nextVehicleArrival(state,direction,stopId,now());
  const visible=state.tracks.filter(t=>t.position&&t.position.progress>=range.start&&t.position.progress<=range.center+.01).sort((a,b)=>b.position.progress-a.position.progress).slice(0,2);
  const tracks=visible.map(t=>({id:vehicleDisplayId(t.id,route),progress:t.position.progress-range.start,stale:!!t.position.stale,uncertain:!!t.position.uncertain,lastSeen:t.lastSeen,arrivalAt:vehicleArrival(t,direction,stopId,now())?.at||null}));
  const candidates=state.tracks.some(t=>t.hits===1),status=state.problem||(!state.at?'Stationsdaten werden geladen.':tracks.length?'Position geschätzt':state.stale?'Älterer Stand · warte auf Stationsdaten.':candidates?'Erster Stand da · Bestätigung folgt.':'Noch keine eindeutige Fahrzeuglage.');
  const target=direction.stops[range.center],raw=session.raw;
  // Return the same target board so opening this screen replaces the ordinary
  // monitor call; it never adds a second Wiener Linien request on the watch.
  const board=raw?{...raw,data:{...raw.data,monitors:raw.data.monitors.filter(m=>String(m.locationStop?.properties?.attributes?.rbl)===String(target.rbl))}}:null;
  return reply({available:true,route,mode,towards:direction.towards,at:state.at,generatedAt:now(),retryAfterMs:Math.max(1000,session.retry-now()),status,arrivalAt:arrival?.at||null,arrivalKind:arrival?.kind||null,center:range.center-range.start,boardIds:target.rbl?[target.rbl]:[],stops:direction.stops.slice(range.start,range.center+1).map(s=>({id:s.id,name:s.name,lat:s.lat,lon:s.lon})),tracks,board});
 };
}
