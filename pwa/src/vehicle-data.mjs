import {getCatalogue,putCatalogue} from './storage.mjs?v=0.11.29';
import {createTimetable,timetableDate} from './timetable.mjs?v=0.11.29';
import {createLineMaps,preferredLinePattern} from './line-maps.mjs?v=0.11.29';
import {decodeVehiclePilot,validateVehiclePilot,vehicleTargetMatches,vehiclePosition} from './vehicle-tracker.mjs?v=0.11.29';

export function stationVehicleTracks(state,range){
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 return state.tracks.map(t=>reduced&&t.position&&!t.position.stale&&!t.position.uncertain?{...t,position:vehiclePosition(t,state.at)||t.position}:t).filter(t=>t.position&&t.position.progress>=range.start&&t.position.progress<=range.end);
}
export function vehicleDisplayId(id,route){
 const sequence=String(id??'').match(/T(\d+)$/)?.[1];
 return String(route??'')+(sequence?' · '+String(Number(sequence)).padStart(2,'0'):'');
}
export function stationVehicleStatus(state,direction,range,chosen){
 const selected=state.tracks.find(t=>t.id===chosen),tracks=stationVehicleTracks(state,range);
 return selected?vehicleDisplayId(selected.id,direction.route)+' · '+(selected.position?.basis==='held'?'Letzte geschätzte Lage · '+selected.status:selected.position?'Geschätzt vor '+direction.stops[selected.position.next].name:selected.status):state.problem||(!state.at?'Zuordnung wird aufgebaut · zwei frische Quellenstände nötig.':state.stale?'Älterer Stand · warte auf frische Stationsmeldungen.':tracks.length?tracks.length+' geschätzte Lage'+(tracks.length===1?'':'n')+' im Ausschnitt.':state.tracks.some(t=>t.hits===1&&!t.blocked)?'Erster Quellenstand zugeordnet · Bestätigung beim nächsten Live-Abruf.':'Noch keine eindeutig ableitbare Lage im Ausschnitt.');
}

export function vehicleWindows(direction,limit=24){
 limit=Math.max(3,Math.min(24,Math.trunc(limit)||24));
 const monitored=direction.stops.flatMap((s,i)=>s.rbl?[i]:[]),out=[];
 for(let from=0;from<monitored.length;from+=limit-2){const indices=monitored.slice(from,from+limit);if(!indices.length)break;out.push({start:indices[0],end:indices.at(-1),ids:indices.map(i=>direction.stops[i].rbl)});if(from+limit>=monitored.length)break;}
 return out;
}
export function stationVehicleRange(direction,stopId){
 const center=direction.stops.findIndex(s=>s.id===stopId);if(center<0)return null;
 const start=Math.max(0,center-5),end=Math.min(direction.stops.length-1,center+2);
 return {start,end,center,ids:direction.stops.slice(start,end+1).map(s=>s.rbl).filter(Boolean)};
}
export function preferredVehicleDirection(data,line,manifest,{stopId,towards,gtfsDirection,day=timetableDate(Date.now())}={}){
 const allowed=data.directions.filter(d=>(!gtfsDirection||d.gtfsDirection===gtfsDirection)&&(!stopId||d.stops.some(s=>s.id===stopId)));
 const exact=towards?allowed.filter(d=>vehicleTargetMatches(d,d.towards,towards)):allowed;
 const pool=exact.length?exact:allowed,ids=new Set(pool.map(d=>d.patternId));
 const p=preferredLinePattern(line.patterns.filter(p=>ids.has(p.id)),manifest,{day,stopId});return pool.find(d=>d.patternId===p?.id)||null;
}
export function vehicleUrl({route,mode,stopId,towards,view='karte',patternId}={}){
 const p=new URLSearchParams({linie:route,verkehrsmittel:mode,ansicht:view});if(stopId)p.set('halt',stopId);if(towards)p.set('richtung',towards);if(patternId)p.set('variante',patternId);return './fahrzeuge.html?'+p;
}
export function createVehicleData({fetch=globalThis.fetch,get=getCatalogue,put=putCatalogue,timetable=createTimetable(),maps=createLineMaps(),now=()=>Date.now()}={}){
 let setup,mapSetup;const lines=new Map();
 async function index(){
  if(setup)return setup;
  setup=(async()=>{const key='vehicles:index:v3';
   const catalog=(async()=>{try{const response=await fetch('./data/vehicle-pilot/index.json?v=0.11.29',{credentials:'omit'});if(!response.ok)throw Error();return await response.json();}catch{return await get(key).catch(()=>null);}})();
   const [manifest,index]=await Promise.all([timetable.metadata(),catalog]);if(!manifest)throw Error('Fahrplanbasis fehlt. Bitte einmal online öffnen.');
   if(index?.format!==3||index.city!=='wien'||index.version!==manifest.version||index.sourceSha256!==manifest.sourceSha256||!Array.isArray(index.lines)||index.lines.length>400||index.lines.some(l=>!['metro','tram','bus'].includes(l.mode)||typeof l.route!=='string'||l.id!==l.mode+'|'+l.route||!/^[a-f0-9]{16}\.json$/.test(l.file)||!/^[a-f0-9]{64}$/.test(l.sha256)))throw Error('Fahrzeugübersicht fehlt oder gehört zu einem anderen Fahrplan.');
   await put(key,index).catch(()=>{});return {manifest,index};})();
  try{return await setup;}catch(error){setup=null;throw error;}
 }
 async function loadLine(entry,manifest){
  // Geometry and tracking data are independent downloads. Validate them together
  // after both arrive, rather than putting three network round trips in series.
  mapSetup??=maps.index(manifest).catch(error=>{mapSetup=null;throw error;});
  const geometry=mapSetup.then(async mapIndex=>{const mapEntry=mapIndex.lines.find(l=>l.id===entry.id);if(!mapEntry)throw Error('Linienverlauf fehlt.');return (await maps.line(mapEntry,manifest)).data;});
  const key='vehicles:line:v3:'+entry.id;
  const packet=(async()=>{
   const cached=await get(key).catch(()=>null);
   if(cached?.version===manifest.version&&cached.hash===entry.sha256)return {data:cached.data,cached:true};
   const response=await fetch('./data/vehicle-pilot/'+entry.file+'?v='+entry.sha256,{credentials:'omit'});if(!response.ok)throw Error('Diese Fahrzeuglinie ist noch nicht lokal gespeichert. Bitte online öffnen.');const raw=await response.text();if(raw.length>4_100_000)throw Error('Fahrzeugpaket zu groß.');
   if(globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));if([...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')!==entry.sha256)throw Error('Fahrzeugpaket stimmt nicht mit der Übersicht überein.');}
   return {data:await decodeVehiclePilot(JSON.parse(raw)),cached:false};
  })();
  const [line,payload]=await Promise.all([geometry,packet]);
  const data=validateVehiclePilot(payload.data,manifest,line);
  if(!payload.cached)await put(key,{version:manifest.version,hash:entry.sha256,data}).catch(()=>{});
  return {data,line,manifest};
 }
 async function line(entry){
  const {manifest,index:catalogue}=await index();if(!catalogue.lines.some(l=>l.id===entry.id&&l.sha256===entry.sha256))throw Error('Unbekannte Fahrzeuglinie.');const day=timetableDate(now());if(day<manifest.validFrom||day>manifest.validThrough)throw Error('Die Fahrplanbasis ist nicht mehr gültig. Bitte zuerst erneuern.');
  const key=entry.id+'|'+entry.sha256;
  if(!lines.has(key)){
   const pending=loadLine(entry,manifest).catch(error=>{if(lines.get(key)===pending)lines.delete(key);throw error;});lines.set(key,pending);
   while(lines.size>4)lines.delete(lines.keys().next().value);
  }
  return lines.get(key);
 }
 return {index,line};
}
