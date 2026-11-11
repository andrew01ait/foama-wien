import {regionalApi} from './regional-service.mjs';
import {transferRelay,purgeTransfers} from './transfer-relay.mjs';
import {pushApi,dispatchDisruptions,activeDisruptionCheck} from './push-service.mjs';
import {pushMcp} from './push-mcp.mjs';
import {stationLineRegistry} from './line-registry.mjs';
import {journeyApi} from './journey-service.mjs';
/* Cloudflare Worker: same-origin static PWA, modest WL CORS relay, short-lived QR transfer.
 * Transfer key is NEVER transmitted: only URL fragment on client, and AES-GCM ciphertext here.
 */
const WL='https://www.wienerlinien.at/ogd_realtime';
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...headers}});}
function fail(message,status=400){return json({error:message},status);}
function pathToken(path){const t=path.split('/').filter(Boolean).at(-1);return /^[A-Za-z0-9_-]{16,64}$/.test(t||'')?t:null;}
const MAX_STOPS=24;
async function apiCache(request){
  // Sites uses an isolated Workers-for-Platforms namespace; caches.default is forbidden.
  try{const cache=await caches.open('foama-wien-api-v1');return {cache,hit:await cache.match(request)};}
  catch{return {cache:null,hit:null};}
}
export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);if(url.pathname==='/mcp')return pushMcp(request,env);if(!url.pathname.startsWith('/api/')){return env.ASSETS.fetch(request);}
    const origin=request.headers.get('Origin');if(origin&&origin!==url.origin){return fail('Nur gleiche Website erlaubt',403);}
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':url.origin,'access-control-allow-methods':'GET,PUT,POST,DELETE,OPTIONS','access-control-allow-headers':'Content-Type','access-control-max-age':'300'}});
    if(env.DB&&!url.pathname.startsWith('/api/transfer/'))ctx.waitUntil(purgeTransfers(env.DB).catch(()=>{}));
    if(url.pathname==='/api/health')return json({ok:true,service:'foama-wien',version:'0.11.2',serverTime:new Date().toISOString()});
    if(url.pathname.startsWith('/api/push/')||url.pathname==='/api/disruptions')return pushApi(request,env);
    if(url.pathname==='/api/regional/board')return regionalApi(request,env);
    if(url.pathname.startsWith('/api/journeys/'))return journeyApi(request,env);
    if(url.pathname==='/api/monitor'&&request.method==='GET'){activeDisruptionCheck(env,ctx);return proxyMonitor(request,env,ctx);}
    if(url.pathname==='/api/stops-index'&&request.method==='GET')return stopsIndex(request,ctx);
    if(url.pathname.startsWith('/api/transfer/'))return transferRelay(request,env);
    return fail('Nicht gefunden',404);
  },
  async scheduled(controller,env,ctx){ctx.waitUntil(dispatchDisruptions(env));}
};
async function proxyMonitor(request,env,ctx){
  const u=new URL(request.url);const stopIds=u.searchParams.getAll('stopId');
  if([...u.searchParams.keys()].some(key=>key!=='stopId')||stopIds.some(x=>!/^\d{1,7}$/.test(x)))return fail('Nur numerische stopId-Parameter erlaubt');
  const uniq=[...new Set(stopIds)].slice(0,MAX_STOPS);if(!uniq.length)return fail('Mindestens eine numerische Haltepunktnummer nötig');if(stopIds.length>MAX_STOPS)return fail('Zu viele Haltepunkte',413);
  const q=new URLSearchParams();for(const stop of uniq.sort((a,b)=>Number(a)-Number(b)))q.append('stopId',stop);
  // Fixed notice categories; callers still supply only numeric stop IDs.
  for(const category of ['stoerunglang','stoerungkurz','aufzugsinfo','fahrtreppeninfo','information'])q.append('activateTrafficInfo',category);
  const source=`${WL}/monitor?${q}`;const cacheUrl=new Request(new URL('/_cache/monitor?'+q,u.origin));
  const {cache,hit}=await apiCache(cacheUrl);
  if(hit){const payload=await hit.json();payload.foamaLines=await stationLineRegistry(payload,uniq,env.LINE_STOPS,env.DB);return withLineNotices(payload,cache,u.origin,ctx,3000);}
  const cooldownUrl=new Request(new URL('/_cache/wl-cooldown',u.origin));
  if(cache){try{const cooldown=await cache.match(cooldownUrl);if(cooldown)return cooldown;}catch{}}
  const started=Date.now(),ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  let res;try{res=await fetch(source,{headers:{'Accept':'application/json','User-Agent':'foama-wien/0.1 (+https://foama-wien.endruuu.chatgpt.site; noncommercial transit PWA)'},signal:ctrl.signal,redirect:'follow',cf:{cacheTtl:0}});}catch{return json({error:ctrl.signal.aborted?'Wiener-Linien-API: Zeitüberschreitung':'Wiener-Linien-API nicht erreichbar',category:ctrl.signal.aborted?'upstream-timeout':'upstream-network'},502);}finally{clearTimeout(timer);}
  if(!res.ok){
    const blocked=res.status===403||res.status===429,seconds=blocked?Math.max(60,Math.min(300,Number(res.headers.get('retry-after'))||60)):30;
    const answer=json({error:`Wiener-Linien-API antwortete mit HTTP ${res.status}`,category:'upstream-http',upstreamHttpStatus:res.status},502,{'retry-after':String(seconds),'cache-control':`public,max-age=${seconds}`});
    // An upstream block also applies when movement changes the requested station IDs.
    if(blocked&&cache)ctx.waitUntil(cache.put(cooldownUrl,answer.clone()).catch(()=>{}));
    return answer;
  }
  let payload;try{payload=await res.json();}catch{return fail('API lieferte keine gültigen JSON-Abfahrten (möglicherweise Zugriffsschutz)',502);}
  if(!Array.isArray(payload?.data?.monitors))return fail('Ungültige Antwort der Wiener Linien',502);
  payload.foamaMonitorAt=new Date().toISOString();
  const answer=json(payload,200,{'cache-control':'public,max-age=30','x-foama-upstream':'wienerlinien'});
  if(cache)ctx.waitUntil(cache.put(cacheUrl,answer.clone()).catch(()=>{}));
  payload.foamaLines=await stationLineRegistry(payload,uniq,env.LINE_STOPS,env.DB,{fresh:true});
  return withLineNotices(payload,cache,u.origin,ctx,Math.max(100,Math.min(3000,10000-(Date.now()-started))));
}
async function withLineNotices(payload,cache,origin,ctx,budget){
  let feed={ok:false};const key=new Request(new URL('/_cache/traffic-info-list-v1',origin));
  if(cache){
    try{const hit=await cache.match(key);if(hit)feed=await hit.json();else{
      const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),budget);
      try{const response=await fetch(`${WL}/trafficInfoList`,{headers:{'Accept':'application/json','User-Agent':'foama-wien/0.1 (+https://foama-wien.endruuu.chatgpt.site; noncommercial transit PWA)'},signal:ctrl.signal,redirect:'follow',cf:{cacheTtl:0}});
        if(!response.ok)throw Error('Notice feed unavailable');const data=await response.json();if(!Array.isArray(data?.data?.trafficInfos))throw Error('Invalid notice feed');feed={ok:true,checkedAt:new Date().toISOString(),data:data.data};
      }catch{feed={ok:false,checkedAt:new Date().toISOString()};}finally{clearTimeout(timer);}
      ctx.waitUntil(cache.put(key,json(feed,200,{'cache-control':`public,max-age=${feed.ok?120:60}`})).catch(()=>{}));
    }}catch{}
  }
  if(feed.ok){
    const monitors=payload.data.monitors,stops=new Set(monitors.map(m=>String(m.locationStop?.properties?.attributes?.rbl??''))),lines=new Set(monitors.flatMap(m=>(m.lines||[]).map(l=>String(l.name))));
    const categories=new Map((feed.data.trafficInfoCategories||[]).map(c=>[c.id,c.name]));
    const list=value=>(Array.isArray(value)?value:String(value||'').split(',')).map(String);
    const relevant=feed.data.trafficInfos.filter(notice=>{
      const details=Array.isArray(notice.relatedLinesDetails)?notice.relatedLinesDetails:[];
      const relatedStops=[...list(notice.relatedStops||notice.attributes?.relatedStops),...details.flatMap(d=>list(d.relatedStops))];
      if(relatedStops.some(id=>stops.has(id)))return true;
      if(categories.get(notice.refTrafficInfoCategoryId)==='stoerungkurz'&&relatedStops.length)return false;
      if(['aufzugsinfo','fahrtreppeninfo','information'].includes(categories.get(notice.refTrafficInfoCategoryId)))return false;
      return [...list(notice.relatedLines||notice.attributes?.relatedLines),...details.map(d=>String(d.lineName))].some(line=>lines.has(line));
    });
    payload.data.trafficInfos=[...new Map([...relevant,...(payload.data.trafficInfos||[])].map(n=>[n.name,n])).values()];
    payload.data.trafficInfoCategories=[...new Map([...(payload.data.trafficInfoCategories||[]),...(feed.data.trafficInfoCategories||[])].map(c=>[c.id,c])).values()];
  }
  payload.foamaTraffic={status:feed.ok?'available':'unavailable',checkedAt:feed.checkedAt||null};
  return json(payload,200,{'cache-control':'public,max-age=30','x-foama-upstream':'wienerlinien'});
}
function stopCsv(csv){const rows=csv.replace(/^\uFEFF/,'').split(/\r?\n/).map(r=>r.replace(/\r$/,'').split(';'));if(!rows.length)return [];
  const header=rows.shift().map(s=>s.toLowerCase().replace(/[_\s]/g,''));const col=(r,...names)=>{for(const n of names){const k=header.indexOf(n.toLowerCase().replace(/[_\s]/g,''));if(k>=0)return r[k]||'';}return '';};
  const map=new Map();for(const r of rows){const id=col(r,'StopID','RBL_NUMMER'),name=col(r,'StopText','PlatformText','Name'),diva=col(r,'DIVA');const lon=Number(col(r,'Longitude','WGS84_LON')),lat=Number(col(r,'Latitude','WGS84_LAT'));if(!/^\d+$/.test(id)||!name||lat<47||lat>49||lon<15||lon>18)continue;const key=diva?'wl:'+diva:'wl:rbl:'+id;let v=map.get(key);if(!v){v={id:key,name,lat,lon,provider:'wl',rbl:[]};map.set(key,v);}v.rbl.push(id);}return [...map.values()];
}
async function stopsIndex(request,ctx){const cacheUrl=new Request(new URL('/_cache/stops',request.url));const {cache,hit}=await apiCache(cacheUrl);if(hit)return hit;
  try{const res=await fetch(`${WL}/doku/ogd/wienerlinien-ogd-haltepunkte.csv`,{headers:{'Accept':'text/csv'},cf:{cacheTtl:0}});if(!res.ok)return fail(`Haltestellenquelle HTTP ${res.status}`,502);const csv=await res.text();const stops=stopCsv(csv);if(stops.length<100)return fail('Haltestellendatei unvollständig oder blockiert',502);const result=json({source:'Stadt Wien – Wiener Linien (CC BY 4.0)',updated:new Date().toISOString(),stops},200,{'cache-control':'public,max-age=21600'});if(cache)ctx.waitUntil(cache.put(cacheUrl,result.clone()).catch(()=>{}));return result;
  }catch{return fail('Haltestellenquelle nicht erreichbar',502);}
}
export class TransferRoom {
  constructor(state,env){this.state=state;this.env=env;}
  async fetch(request){const path=new URL(request.url).pathname;
    if(path==='/create'&&request.method==='POST'){
      const existing=await this.state.storage.get('value');if(existing&&existing.expires>Date.now())return fail('Transfercode bereits in Verwendung',409);
      const expires=Date.now()+10*60*1000;await this.state.storage.put('value',{status:'waiting',expires});await this.state.storage.setAlarm(expires);return json({created:true,expiresAt:new Date(expires).toISOString()},201);
    }
    const value=await this.state.storage.get('value');if(!value||Date.now()>=value.expires)return fail('Transfersitzung abgelaufen',410);
    if(path!=='/payload')return fail('Nicht gefunden',404);
    if(request.method==='PUT'){
      if(value.status!=='waiting')return fail('Transfer bereits gesendet',409);
      const content=await request.text();if(content.length>50000)return fail('Nutzlast zu groß',413);let data;try{data=JSON.parse(content);}catch{return fail('Ungültige Nutzlast');}
      if(!/^[A-Za-z0-9_-]{16}$/.test(data.iv||'')||!/^[A-Za-z0-9_-]{20,50000}$/.test(data.ciphertext||''))return fail('Ungültiger verschlüsselter Datensatz');
      await this.state.storage.put('value',{...value,status:'ready',payload:{iv:data.iv,ciphertext:data.ciphertext}});return json({uploaded:true});
    }
    if(request.method==='GET')return value.status==='ready'?json({status:'ready',...value.payload}):json({status:value.status});
    if(request.method==='DELETE'){
      await this.state.storage.deleteAll();return json({deleted:true});
    }
    return fail('Methode nicht erlaubt',405);
  }
  async alarm(){await this.state.storage.deleteAll();}
}
