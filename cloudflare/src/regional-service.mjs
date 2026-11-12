import {reserveJourneyRequest} from './journey-service.mjs';
import {normalizeRegionalBoard,normalizeLinzBoard} from '../../pwa/src/regional-departures.mjs';

const UA='foama-wien/0.11.28 (+https://foama-wien.endruuu.chatgpt.site; noncommercial open-source transit app)';
const inflight=new Map();
const answer=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
async function boundedJson(response){
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000)throw Error('response-size');chunks.push(value);}}
 catch(error){await reader.cancel().catch(()=>{});throw error;}
 const raw=new Uint8Array(size);let at=0;for(const chunk of chunks){raw.set(chunk,at);at+=chunk.length;}return JSON.parse(new TextDecoder().decode(raw));
}
async function publicJson(url,fetcher,signal){
 const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,5000);signal.addEventListener('abort',abort,{once:true});
 try{if(signal.aborted)throw new DOMException('Beendet','AbortError');const response=await fetcher(url,{headers:{Accept:'application/json','User-Agent':UA},signal:controller.signal,redirect:'manual'});
  if(!response.ok){await response.body?.cancel();throw Error('provider-http');}const data=await boundedJson(response);if(controller.signal.aborted)throw new DOMException('Beendet','AbortError');return data;
 }finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
}
async function stationBoard(stop,env,{fetcher,now,cache,origin,signal}){
 const key=new Request(new URL('/_cache/regional-board-v2/'+encodeURIComponent(stop.id),origin));
 if(cache){const hit=await cache.match(key);if(hit){const body=await hit.json();if(body.checkedAt<=now+1000&&now-body.checkedAt<30000)return body;}}
 const flightKey=origin+'|'+stop.id;if(inflight.has(flightKey))return inflight.get(flightKey);
 if(inflight.size>=8)throw Error('overloaded');
 const operation=(async()=>{
  // Public station boards share the existing aggregate Transitous allowance.
  // No city can multiply the 700-request plan/walk/board budget.
  if(!await reserveJourneyRequest(env.DB,{now,kind:'plan'}))throw Error('budget');
  let departures=null,source='Transitous';
  if(stop.city==='linz'){
   const url=new URL('https://www.linzag.at/static/XML_DM_REQUEST');url.search=new URLSearchParams({outputFormat:'JSON',type_dm:'stop',name_dm:stop.ifopt,locationServerActive:'1',stateless:'1',mode:'direct',useRealtime:'1',limit:'64',coordOutputFormat:'WGS84[DD.ddddd]'}).toString();
   try{departures=normalizeLinzBoard(await publicJson(url.href,fetcher,signal),stop,now);source='LINZ AG EFA';}catch(error){if(signal.aborted)throw error;}
  }
  if(!departures?.length){
   // An additional fallback request is accounted separately as well.
   if(stop.city==='linz'&&!await reserveJourneyRequest(env.DB,{now,kind:'plan'}))throw Error('budget');
   const url=new URL('https://api.transitous.org/api/v6/stoptimes');url.search=new URLSearchParams({stopId:stop.providerStopId,n:'64',language:'de',arriveBy:'false',exactRadius:'false'}).toString();
   departures=normalizeRegionalBoard(await publicJson(url.href,fetcher,signal),stop,now);
  }
  const body={station:stop.id,checkedAt:now,source,departures};
  if(!signal.aborted&&cache)await cache.put(key,Response.json(body,{headers:{'cache-control':'public,max-age=30'}})).catch(()=>{});
  return body;
 })();inflight.set(flightKey,operation);
 try{return await operation;}finally{if(inflight.get(flightKey)===operation)inflight.delete(flightKey);}
}
export async function regionalApi(request,env,{fetcher=globalThis.fetch,now=Date.now(),cache}={}){
 if(request.method!=='GET')return answer({error:'Methode nicht erlaubt.'},405);
 const url=new URL(request.url),ids=[...new Set(url.searchParams.getAll('station'))];
 if([...url.searchParams.keys()].some(key=>key!=='station')||!ids.length||ids.length>3)return answer({error:'Eine bis drei bekannte Stationen auswählen.'},400);
 const stops=ids.map(id=>(env.REGIONAL_STOPS||[]).find(stop=>stop.id===id&&stop.provider==='transitous'));
 if(stops.some(stop=>!stop))return answer({error:'Unbekannte Stationskennung.'},400);
 if(cache===undefined)try{cache=await caches.open('foama-regional-api-v1');}catch{cache=null;}
 const controller=new AbortController(),abort=()=>controller.abort(),timeout=setTimeout(abort,11000);request.signal.addEventListener('abort',abort,{once:true});
 try{
  if(request.signal.aborted)controller.abort();
  const results=await Promise.allSettled(stops.map(stop=>stationBoard(stop,env,{fetcher,now,cache,origin:url.origin,signal:controller.signal})));
  const good=results.filter(row=>row.status==='fulfilled').map(row=>row.value);
  if(!good.length)return answer({error:results.some(row=>row.reason?.message==='budget')?'Das gemeinsame Datenbudget ist vorübergehend ausgeschöpft. Bereits geladene Fahrpläne bleiben sichtbar.':'Regionale Abfahrten gerade nicht erreichbar.'},results.some(row=>row.reason?.message==='budget')?429:502);
  return answer({stations:good.map(row=>row.station),checkedAt:Math.min(...good.map(row=>row.checkedAt)),departures:good.flatMap(row=>row.departures),partial:good.length!==stops.length});
 }catch{return answer({error:'Regionale Abfahrten gerade nicht erreichbar.'},502);}
 finally{clearTimeout(timeout);request.signal.removeEventListener('abort',abort);}
}
