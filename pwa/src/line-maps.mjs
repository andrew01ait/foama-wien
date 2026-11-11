import {getCatalogue,putCatalogue} from './storage.mjs?v=0.11.3';
import {decodeJourneyPolyline} from './journey-geometry.mjs?v=0.11.3';
import {connectionMonitorUrl} from './connection-detail.mjs?v=0.11.3';

const abort=signal=>{if(signal?.aborted)throw new DOMException('Beendet','AbortError');};
export function nearestLineStop(points,pointer,fallback){
 if(!Number.isFinite(pointer?.x)||!Number.isFinite(pointer?.y))return fallback;
 let selected=fallback,best=Infinity;
 points.forEach((point,i)=>{const distance=(point.x-pointer.x)**2+(point.y-pointer.y)**2;if(distance<best-0.01||Math.abs(distance-best)<=0.01&&i===fallback){best=distance;selected=i;}});
 return best<=32*32?selected:fallback;
}
export function bindLineStopInteraction(marker,map,stops,index,{hover,leave,select}){
 // Hover and click must resolve the same physical point even when a neighbour's
 // 44px accessible hit area is on top. Keyboard activation keeps its own marker.
 const resolve=event=>{
  const mouse=event?.originalEvent;
  return Number.isFinite(mouse?.clientX)&&Number.isFinite(mouse?.clientY)?nearestLineStop(stops.map(s=>map.latLngToContainerPoint([s.lat,s.lon])),map.mouseEventToContainerPoint(mouse),index):index;
 };
 marker.on('mouseover mousemove',event=>hover(resolve(event)));
 marker.on('mouseout',leave);
 marker.on('click',event=>{leave();select(resolve(event));});
 marker.on('keypress',event=>{
  const key=event?.originalEvent;
  if(key?.key==='Enter'||key?.keyCode===13){leave();select(index);}
 });
}
export function validateLineMap(data,entry,manifest){
 if(data?.format!==1||data.city!=='wien'||data.version!==manifest.version||data.sourceSha256!==manifest.sourceSha256||data.id!==entry.id||data.route!==entry.route||data.mode!==entry.mode||!Array.isArray(data.patterns)||!data.patterns.length||data.patterns.length>500||!data.shapes)throw Error('Linienkarte und Fahrplan passen nicht zusammen. Bitte die Seite neu öffnen.');
 const ids=new Set();
 for(const p of data.patterns){
  if(typeof p.id!=='string'||ids.has(p.id)||typeof p.direction!=='string'||typeof p.towards!=='string'||!Array.isArray(p.stops)||p.stops.length<2||p.stops.length>400||!Array.isArray(p.services)||p.services.some(n=>!Number.isInteger(n)||!manifest.services[n]))throw Error('Ungültiger Linienverlauf.');
  ids.add(p.id);let last=-1;
  for(const s of p.stops){if(typeof s.id!=='string'||typeof s.platformId!=='string'||typeof s.name!=='string'||!Number.isFinite(s.lat)||!Number.isFinite(s.lon)||s.lat<47||s.lat>50||s.lon<14||s.lon>18||!Number.isInteger(s.sequence)||s.sequence<=last)throw Error('Ungültige Haltefolge.');last=s.sequence;}
  if(p.geometry&&!decodeJourneyPolyline(data.shapes[p.geometry]).length)throw Error('Der geografische Linienverlauf fehlt oder ist ungültig.');
 }
 return data;
}
export function lineMapDirections(data){
 const result=new Map();
 for(const p of data.patterns){const row=result.get(p.direction);if(!row||p.stops.length>row.stops.length||p.stops.length===row.stops.length&&p.tripCount>row.tripCount)result.set(p.direction,p);}
 return [...result].map(([id,p])=>({id,label:p.towards||p.stops.at(-1).name}));
}
export function preferredLinePattern(patterns,manifest,{day,stopId,towards}={}){
 const sorted=patterns.slice().sort((a,b)=>Number(b.services.some(n=>manifest.services[n].includes(day)))-Number(a.services.some(n=>manifest.services[n].includes(day)))||b.stops.length-a.stops.length||b.tripCount-a.tripCount);
 return sorted.find(p=>(!towards||p.towards===towards)&&(!stopId||p.stops.some(s=>s.id===stopId)))||sorted[0]||null;
}
export function lineMapTimetableUrl(line,pattern,stop){
 if(!stop.id.startsWith('wl:'))return null;
 return './fahrplan.html?'+new URLSearchParams({linie:line.route,verkehrsmittel:line.mode,halt:stop.id,richtung:pattern.towards});
}
export function lineMapMonitorUrl(line,pattern,stop,stops){
 return connectionMonitorUrl({stopId:stop.id,route:line.route,mode:line.mode,towards:pattern.towards},stops);
}
export function createLineMaps({fetch=globalThis.fetch,get=getCatalogue,put=putCatalogue}={}){
 async function index(manifest,{signal}={}){
  const key='linemaps:wien:index';let data;
  try{const response=await fetch('./data/line-maps/wien/index.json?v='+encodeURIComponent(manifest.version),{signal,credentials:'omit'});if(!response.ok)throw Error();data=await response.json();abort(signal);}
  catch(error){abort(signal);data=await get(key).catch(()=>null);}
  if(data?.format!==1||data.city!=='wien'||data.version!==manifest.version||data.sourceSha256!==manifest.sourceSha256||!Array.isArray(data.lines)||data.lines.length>400||data.lines.some(line=>typeof line.id!=='string'||typeof line.route!=='string'||typeof line.mode!=='string'||!/^[a-f0-9]{16}\.json$/.test(line.file)||!/^[a-f0-9]{64}$/.test(line.sha256)))throw Error('Die Linienübersicht fehlt oder gehört zu einem anderen Fahrplan. Bitte einmal mit Internetverbindung öffnen.');
  abort(signal);await put(key,data).catch(()=>{});return data;
 }
 async function line(entry,manifest,{signal}={}){
  if(!/^[a-f0-9]{16}\.json$/.test(entry?.file||''))throw Error('Unbekannte Linie.');
  const key='linemaps:wien:'+entry.id;let data,offline=false;
  const cached=await get(key).catch(()=>null);abort(signal);
  if(cached?.version===manifest.version&&cached.hash===entry.sha256){data=validateLineMap(cached.data,entry,manifest);offline=true;}
  else{
   const response=await fetch('./data/line-maps/wien/'+entry.file+'?v='+entry.sha256,{signal,credentials:'omit'});
   if(!response.ok)throw Error('Diese Linienkarte ist noch nicht auf dem Gerät gespeichert. Bitte mit Internetverbindung öffnen.');
   const raw=await response.text();abort(signal);if(raw.length>2_000_000)throw Error('Linienpaket zu groß.');
   if(globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));if(Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')!==entry.sha256)throw Error('Linienpaket hat sich geändert. Bitte die Seite neu öffnen.');}
   data=validateLineMap(JSON.parse(raw),entry,manifest);abort(signal);
   offline=await put(key,{version:manifest.version,hash:entry.sha256,data}).then(()=>true).catch(()=>false);
  }
  return {data,offline};
 }
 return {index,line};
}
