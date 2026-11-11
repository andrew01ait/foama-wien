import {getCatalogue,putCatalogue} from './storage.mjs?v=0.11.5';
import {createTimetable,timetableDate} from './timetable.mjs?v=0.11.5';
import {createLineMaps,preferredLinePattern} from './line-maps.mjs?v=0.11.5';
import {decodeVehiclePilot,validateVehiclePilot,vehicleTargetMatches} from './vehicle-tracker.mjs?v=0.11.5';

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
 let setup;
 async function index(){
  if(setup)return setup;
  setup=(async()=>{const manifest=await timetable.metadata();if(!manifest)throw Error('Fahrplanbasis fehlt. Bitte einmal online öffnen.');let index;const key='vehicles:index:v3';
   try{const response=await fetch('./data/vehicle-pilot/index.json?v=0.11.5&fahrplan='+manifest.version,{credentials:'omit'});if(!response.ok)throw Error();index=await response.json();}catch{index=await get(key).catch(()=>null);}
   if(index?.format!==3||index.city!=='wien'||index.version!==manifest.version||index.sourceSha256!==manifest.sourceSha256||!Array.isArray(index.lines)||index.lines.length>400||index.lines.some(l=>!['metro','tram','bus'].includes(l.mode)||typeof l.route!=='string'||l.id!==l.mode+'|'+l.route||!/^[a-f0-9]{16}\.json$/.test(l.file)||!/^[a-f0-9]{64}$/.test(l.sha256)))throw Error('Fahrzeugübersicht fehlt oder gehört zu einem anderen Fahrplan.');
   await put(key,index).catch(()=>{});return {manifest,index};})();
  try{return await setup;}catch(error){setup=null;throw error;}
 }
 async function line(entry){
  const {manifest,index:catalogue}=await index();if(!catalogue.lines.some(l=>l.id===entry.id&&l.sha256===entry.sha256))throw Error('Unbekannte Fahrzeuglinie.');const day=timetableDate(now());if(day<manifest.validFrom||day>manifest.validThrough)throw Error('Die Fahrplanbasis ist nicht mehr gültig. Bitte zuerst erneuern.');
  const mapIndex=await maps.index(manifest),mapEntry=mapIndex.lines.find(l=>l.id===entry.id);if(!mapEntry)throw Error('Linienverlauf fehlt.');const line=(await maps.line(mapEntry,manifest)).data;
  const key='vehicles:line:v3:'+entry.id,cached=await get(key).catch(()=>null);let data;
  if(cached?.version===manifest.version&&cached.hash===entry.sha256)data=validateVehiclePilot(cached.data,manifest,line);
  else{const response=await fetch('./data/vehicle-pilot/'+entry.file+'?v='+entry.sha256,{credentials:'omit'});if(!response.ok)throw Error('Diese Fahrzeuglinie ist noch nicht lokal gespeichert. Bitte online öffnen.');const raw=await response.text();if(raw.length>4_100_000)throw Error('Fahrzeugpaket zu groß.');
   if(globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));if([...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')!==entry.sha256)throw Error('Fahrzeugpaket stimmt nicht mit der Übersicht überein.');}
   data=validateVehiclePilot(await decodeVehiclePilot(JSON.parse(raw)),manifest,line);await put(key,{version:manifest.version,hash:entry.sha256,data}).catch(()=>{});
  }return {data,line,manifest};
 }
 return {index,line};
}
