import {getCatalogue,putCatalogue} from './storage.mjs?v=0.8.0';

const zone='Europe/Vienna', dayMs=86400_000;
const dateParts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function timetableDate(time=Date.now()){
 const p=Object.fromEntries(dateParts.formatToParts(new Date(time)).map(p=>[p.type,p.value]));
 return `${p.year}-${p.month}-${p.day}`;
}
// GTFS times are seconds since "noon minus 12h" on the service date.
// Derive the offset at noon; adding seconds remains correct on DST days.
export function serviceDayStart(day){
 const noon=Date.parse(day+'T12:00:00Z');if(!Number.isFinite(noon))return NaN;
 const p=Object.fromEntries(dateParts.formatToParts(new Date(noon)).map(p=>[p.type,p.value]));
 return noon-((Number(p.hour)-12)*3600+Number(p.minute)*60+Number(p.second))*1000-12*3600_000;
}
export function timetableDepartures(manifest,stationRows,now=Date.now()){
 const today=timetableDate(now);
 if(manifest?.format!==1||manifest.timezone!==zone||today<manifest.validFrom||today>manifest.validThrough||!Array.isArray(manifest.services))return [];
 const date=new Date(today+'T12:00:00Z'),days=[-1,0,1].map(shift=>new Date(+date+shift*dayMs).toISOString().slice(0,10));
 const origins=new Map(days.map(day=>[day,serviceDayStart(day)])),out=[],seen=new Set();
 for(const [stopId,groups] of Object.entries(stationRows||{}))for(const group of groups||[]){
  const [route,towards,mode,providerStopId,directionId,service,seconds]=group;
  if(!route||!towards||!Array.isArray(seconds)||!Array.isArray(manifest.services[service]))continue;
  for(const day of days){if(!manifest.services[service].includes(day))continue;
   for(const value of seconds){
    if(!Number.isInteger(value)||value<0||value>=172800)continue;
    const time=origins.get(day)+value*1000;
    if(time<now-30_000||time>now+2*3600_000)continue;
    const key=JSON.stringify([stopId,route,towards,mode,time]);if(seen.has(key))continue;seen.add(key);
    const at=new Date(time).toISOString();
    out.push({id:'gtfs:'+key,provider:stopId.startsWith('wl:')?'wl':'timetable',stopId,providerStopId,directionId,route,towards,mode,scheduled:at,actual:at,realtime:null,quality:'schedule',source:'gtfs',serviceDay:day,fetchedAt:null,platform:'',barrierFree:null});
   }
  }
 }
 return out.sort((a,b)=>Date.parse(a.actual)-Date.parse(b.actual));
}
const direction=value=>String(value||'').replace(/^Wien\s+/i,'').replace(/\s+\((?:über|üb\.?|via)\s+.+\)$/iu,'').replace(/\s+(?:S\s+U|U\s+S|S|U)$/iu,'').trim().toLocaleLowerCase('de-AT');
export function mergeTimetableDepartures(current=[],planned=[],stops=[],now=Date.now()){
 const byRbl=new Map(stops.filter(s=>s.provider==='wl').flatMap(s=>(s.rbl||[]).map(id=>[String(id),s.id])));
 const group=d=>JSON.stringify([d.stopId||byRbl.get(String(d.rbl)),d.route,d.mode,direction(d.towards)]);
 const fresh=d=>{const at=Date.parse(d.fetchedAt);return Number.isFinite(at)&&at<=now+30_000&&now-at<=90_000;};
 const confirmed=new Set(current.filter(fresh).map(group));
 const fallback=planned.filter(d=>!confirmed.has(group(d))),replaced=new Set(fallback.map(group));
 return [...current.filter(d=>!replaced.has(group(d))||fresh(d)),...fallback];
}

async function decodeShard(data,version){
 if(data?.format!==1||data.version!==version||data.encoding!=='gzip-base64'||typeof data.payload!=='string'||data.payload.length>2_000_000)throw Error('Ungültiges Fahrplanpaket');
 const bytes=Uint8Array.from(atob(data.payload),c=>c.charCodeAt(0));
 const result=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
 if(result.length>16_000_000)throw Error('Fahrplanpaket zu groß');return JSON.parse(result);
}
export function createTimetable({fetch=globalThis.fetch,get=getCatalogue,put=putCatalogue,now=()=>Date.now()}={}){
 let manifest=null,checked=0,manifestStored=false;const shards=new Map(),savedShards=new Set();
 async function metadata(signal){
  if(manifest&&now()-checked<600000)return manifest;
  const key='timetable:wien:manifest';
  try{
   const response=await fetch('./data/timetables/wien/manifest.json',{signal,cache:'no-cache',credentials:'omit'});
   if(!response.ok)throw Error('Fahrplan nicht verfügbar');
   const data=await response.json();
   if(data?.format!==1||typeof data.version!=='string'||!data.stations||!data.shards||!Array.isArray(data.services))throw Error('Fahrplanformat');
   if(signal?.aborted)throw new DOMException('Beendet','AbortError');
   if(manifest?.version!==data.version){shards.clear();savedShards.clear();}manifest=data;checked=now();
   manifestStored=await put(key,data).then(()=>true).catch(()=>false);return data;
  }catch(error){
   if(signal?.aborted)throw error;
   const cached=await get(key).catch(()=>null);manifest=manifest||cached;manifestStored=!!cached&&cached.version===manifest?.version;checked=now();return manifest;
  }
 }
 async function stationRows(stops,{signal}={}){
  const selected=stops.filter(stop=>stop.provider==='wl');if(!selected.length)return {manifest:null,rows:{},offline:false};
  const data=await metadata(signal);if(!data)return {manifest:null,rows:{},offline:false};
  const ids=[...new Set(selected.map(stop=>data.stations[stop.id]).filter(id=>Number.isInteger(id)))];
  const rows={};let offline=manifestStored;
  for(const id of ids){
   if(signal?.aborted)throw new DOMException('Beendet','AbortError');
   let shard=shards.get(id);const key='timetable:wien:shard:'+id;
   if(!shard){
    const cached=await get(key).catch(()=>null);
    if(cached?.version===data.version){shard=await decodeShard(cached.data,data.version).catch(()=>null);if(shard)savedShards.add(id);}
    if(!shard){
     const response=await fetch(`./data/timetables/wien/${id}.json?v=${data.shards[id]}`,{signal,credentials:'omit'});
     if(!response.ok){offline=false;continue;}const packed=await response.json();shard=await decodeShard(packed,data.version);
     if(signal?.aborted)throw new DOMException('Beendet','AbortError');
     if(await put(key,{version:data.version,data:packed}).then(()=>true).catch(()=>false))savedShards.add(id);else savedShards.delete(id);
    }
    shards.set(id,shard);while(shards.size>12)shards.delete(shards.keys().next().value);
   }
   offline=offline&&savedShards.has(id);
   for(const stop of selected)if(data.stations[stop.id]===id&&shard[stop.id])rows[stop.id]=shard[stop.id];
  }
  return {manifest:data,rows,offline};
 }
 async function load(stops,options={}){const result=await stationRows(stops,options);return timetableDepartures(result.manifest,result.rows,now());}
 return {load,metadata,stationRows};
}
