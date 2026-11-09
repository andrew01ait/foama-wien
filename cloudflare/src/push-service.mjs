import {pushB64,pushBytes,validatePushSubscription,sendWebPush} from './web-push.mjs';
import {nativeFirebaseOptions,nativeFcmConfigured,validateFcmToken,sendFcmPush} from './fcm.mjs';
import {parseTrafficInfos,dedupeTrafficInfos} from '../../pwa/src/traffic-info.mjs';
import {PUSH_LIMITS,pushPreferences,favoritePushTargets,pushNoticeMatches,pushCanSend,pushDay,pushFingerprint,disruptionPushPayload} from '../../pwa/src/push-policy.mjs';

const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(message,status=400)=>json({error:message},status);
const validSecret=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{32}$/.test(value);
const bytes=new TextEncoder();
export const pushHash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export async function sealPush(value,id,secret){
 const key=await crypto.subtle.importKey('raw',pushBytes(secret),'AES-GCM',false,['encrypt']),iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:bytes.encode(id)},key,bytes.encode(JSON.stringify(value)));
 return pushB64(iv)+'.'+pushB64(cipher);
}
export async function openPush(value,id,secret){
 const [iv,cipher]=value.split('.'),key=await crypto.subtle.importKey('raw',pushBytes(secret),'AES-GCM',false,['decrypt']);
 return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:pushBytes(iv),additionalData:bytes.encode(id)},key,pushBytes(cipher))));
}
function configured(env){return !!(env.DB&&env.PUSH_VAPID_PRIVATE_JWK&&env.PUSH_VAPID_PUBLIC_KEY&&env.PUSH_STORAGE_KEY&&env.PUSH_SCHEDULER_ENABLED==='true');}
const nativeConfigured=env=>!!(env.DB&&env.PUSH_STORAGE_KEY&&env.PUSH_SCHEDULER_ENABLED==='true'&&nativeFcmConfigured(env));
const dispatcherConfigured=env=>configured(env)||nativeConfigured(env);
function deliveryInput(data){
 if(data.transport==='fcm')return {transport:'fcm',registrationToken:validateFcmToken(data.registrationToken)};
 if(data.transport&&data.transport!=='web')throw Error('transport');return {transport:'web',subscription:validatePushSubscription(data.subscription)};
}
const deliveryReady=(value,env)=>value.transport==='fcm'?nativeConfigured(env):configured(env);
const deliveryHash=value=>pushHash(value.transport==='fcm'?'fcm:'+value.registrationToken:value.subscription.endpoint);
const deliveryExpiry=(value,now)=>Math.min(now+PUSH_LIMITS.expiry,value.subscription?.expirationTime||Infinity);
const deliver=(value,payload,env,options)=>value.transport==='fcm'?options.nativeSender(value.registrationToken,payload,env,{now:options.now}):options.sender(value.subscription,payload,env,{now:options.now});
export async function readBounded(request,limit=25000){
 const reader=request.body?.getReader();if(!reader)throw Error('body');const chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('size');}chunks.push(value);}}finally{reader.releaseLock();}
 const out=new Uint8Array(size);let at=0;for(const chunk of chunks){out.set(chunk,at);at+=chunk.length;}return JSON.parse(new TextDecoder().decode(out));
}
async function inputJson(request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw Error('json');return readBounded(request);}
export async function purgePush(db,now=Date.now()){
 if(!db)return;
 // Explicit cleanup also works with preview adapters without SQLite FK enforcement.
 await db.prepare('DELETE FROM foama_push_deliveries WHERE created <= ? OR subscription_id IN (SELECT id FROM foama_push_subscriptions WHERE expires <= ?)').bind(now-PUSH_LIMITS.history,now).run();
 await db.prepare('DELETE FROM foama_push_subscriptions WHERE expires <= ?').bind(now).run();
}
async function removePush(db,id){await db.prepare('DELETE FROM foama_push_deliveries WHERE subscription_id = ?').bind(id).run();await db.prepare('DELETE FROM foama_push_subscriptions WHERE id = ?').bind(id).run();}
async function runtime(db){return db?await db.prepare("SELECT * FROM foama_push_runtime WHERE id='main'").first():null;}
export async function pushStatus(env){
 const state=await runtime(env.DB);return {available:configured(env),nativeAvailable:nativeConfigured(env),lastCheck:state?.last_check||null,lastSuccess:state?.last_success||null,state:state?.status||'starting',intervalMinutes:Math.min(60,Math.max(5,Number(env.PUSH_INTERVAL_MINUTES)||5))};
}
function selections(input,catalog){
 if(!Array.isArray(input.targets)||input.targets.length>100)throw Error('targets');
 const preferences=pushPreferences(input.preferences);
 if(preferences.scope==='all')return {preferences,targets:[]};
 const favorites=input.targets.map(t=>({stopId:String(t.stopId||''),route:Array.isArray(t.routes)&&t.routes.length===1?t.routes[0]:''}));
 const targets=[];
 for(let i=0;i< favorites.length;i++){
  const item=input.targets[i],stop=catalog.find(s=>s.provider==='wl'&&s.id===favorites[i].stopId);if(!stop)continue;
  if(!Array.isArray(item.routes)||item.routes.length>80)throw Error('routes');
  const known=new Set((stop.lines||[]).map(l=>l.route));
  const routes=[...new Set(item.routes.filter(r=>typeof r==='string'&&known.has(r)))];
  if(routes.length)targets.push(...favoritePushTargets(routes.map(route=>({stopId:stop.id,route})),[stop]));
 }
 const merged=new Map();for(const target of targets){const old=merged.get(target.stopId);if(old)old.routes=[...new Set([...old.routes,...target.routes])];else merged.set(target.stopId,target);}
 if(preferences.scope==='favorites'&&!merged.size)throw Error('favorites');
 return {preferences,targets:[...merged.values()]};
}
export async function getDisruptions(origin,{now=Date.now(),fetcher=fetch,cache=null}={}){
 let store=cache;
 if(!store)try{store=await caches.open('foama-wien-api-v1');}catch{}
 const key=new Request(new URL('/_cache/traffic-info-list-v1',origin));
 if(store){const hit=await store.match(key);if(hit){const value=await hit.json();if(value.ok&&now-Date.parse(value.checkedAt)<120000)return {checkedAt:Date.parse(value.checkedAt),notices:dedupeTrafficInfos(parseTrafficInfos({data:value.data},now))};}}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetcher('https://www.wienerlinien.at/ogd_realtime/trafficInfoList',{headers:{Accept:'application/json','User-Agent':'foama-wien/0.1 (+https://foama-wien.endruuu.chatgpt.site; noncommercial transit PWA)'},redirect:'follow',cf:{cacheTtl:0},signal:controller.signal});
  if(!response.ok){await response.body?.cancel();throw Error('source-http-'+response.status);}
  const payload=await readBounded(response,1024*1024);if(!Array.isArray(payload?.data?.trafficInfos)||!Array.isArray(payload?.data?.trafficInfoCategories))throw Error('source-format');
  if(store)await store.put(key,new Response(JSON.stringify({ok:true,checkedAt:new Date(now).toISOString(),data:payload.data}),{headers:{'content-type':'application/json','cache-control':'public,max-age=120'}})).catch(()=>{});
  return {checkedAt:now,notices:dedupeTrafficInfos(parseTrafficInfos(payload,now))};
 }finally{clearTimeout(timer);}
}
export async function pushApi(request,env,now=Date.now(),{fetcher=fetch,sender=sendWebPush,nativeSender=sendFcmPush}={}){
 const url=new URL(request.url),path=url.pathname;
 try{
  if(path==='/api/push/config'&&request.method==='GET')return json({...await pushStatus(env),publicKey:env.PUSH_VAPID_PUBLIC_KEY||null,firebase:nativeFirebaseOptions(env),limits:{daily:PUSH_LIMITS.daily,gapMinutes:30,retentionDays:90}});
  if(path==='/api/disruptions'&&request.method==='GET'){
   try{const feed=await getDisruptions(url.origin,{now,fetcher});return json({checkedAt:feed.checkedAt,source:'Wiener Linien',notices:feed.notices.filter(n=>!n.expired&&!n.resolved).map(n=>({...n,scope:n.stops.length?'stop':'line'}))});}catch(error){return json({error:'Störungsmeldungen konnten gerade nicht geladen werden. Das ist keine Entwarnung.',sourceCode:/^source-http-\d{3}$|^source-format$/.test(error.message)?error.message:'source-network'},503);}
  }
  if(path==='/api/push/check'){
   if(request.method!=='POST')return fail('Methode nicht erlaubt.',405);
   const data=await inputJson(request);if(Object.keys(data).length)return fail('Dieser Aufruf akzeptiert keine Empfänger, Nachrichten oder Auswahl.');
   if(!dispatcherConfigured(env))return fail('Benachrichtigungen werden noch eingerichtet.',503);
   // A bounded public tick, not an arbitrary sender: only the fixed official source,
   // explicit device opt-ins, atomic global lease and per-device delivery limits.
   // Never return device data or recipient counts to an unauthenticated caller.
   try{const result=await dispatchDisruptions(env,{now,origin:url.origin,fetcher,sender,nativeSender});const state=await pushStatus(env);return json({checked:!result.skipped,skipped:!!result.skipped,lastCheck:state.lastCheck,lastSuccess:state.lastSuccess,state:state.state});}
   catch{return fail('Störungsquelle derzeit nicht erreichbar. Es wurde keine Entwarnung versendet.',503);}
  }
  if(!env.DB)return fail('Benachrichtigungsdienst nicht erreichbar.',503);
  await purgePush(env.DB,now);
  if(path==='/api/push/subscriptions'&&request.method==='POST'){
   const data=await inputJson(request);if(!validSecret(data.id)||!validSecret(data.secret))return fail('Ungültige Gerätefreigabe.');
   const destination=deliveryInput(data);if(!deliveryReady(destination,env))return fail('Benachrichtigungen werden noch eingerichtet.',503);
   const selection=selections(data,env.PUSH_STOPS||[]);
   const authHash=await pushHash(data.secret),endpointHash=await deliveryHash(destination),sealed=await sealPush({...destination,...selection},data.id,env.PUSH_STORAGE_KEY);
   const expires=deliveryExpiry(destination,now);if(expires<=now)return fail('Push-Adresse ist abgelaufen.');
   const result=await env.DB.prepare('INSERT OR IGNORE INTO foama_push_subscriptions (id,auth_hash,endpoint_hash,sealed,expires) SELECT ?,?,?,?,? WHERE (SELECT count(*) FROM foama_push_subscriptions) < ?').bind(data.id,authHash,endpointHash,sealed,expires,PUSH_LIMITS.subscriptions).run();
   return result.meta.changes?json({enabled:true,expiresAt:expires},201):fail('Gerätefreigabe bereits vorhanden oder Dienst ausgelastet. Bitte erneut aktivieren.',409);
  }
  const match=path.match(/^\/api\/push\/subscriptions\/([A-Za-z0-9_-]{32})(\/test)?$/);
  if(!match)return fail('Nicht gefunden.',404);
  const secret=request.headers.get('X-Push-Secret');if(!validSecret(secret))return fail('Keine Gerätefreigabe.',403);
  const record=await env.DB.prepare('SELECT * FROM foama_push_subscriptions WHERE id = ? AND auth_hash = ?').bind(match[1],await pushHash(secret)).first();
  if(!record)return fail('Gerätefreigabe nicht mehr vorhanden. Bitte erneut aktivieren.',410);
  if(request.method==='DELETE'&&!match[2]){await removePush(env.DB,record.id);return json({deleted:true});}
  const value=await openPush(record.sealed,record.id,env.PUSH_STORAGE_KEY);
  if(!deliveryReady(value,env))return fail('Benachrichtigungsdienst ist vorübergehend nicht bereit.',503);
  if(request.method==='GET'&&!match[2])return json({enabled:true,expiresAt:record.expires,preferences:value.preferences,lastSent:record.last_sent||null});
  if(request.method==='PUT'&&!match[2]){
   const data=await inputJson(request),destination=deliveryInput(data),selection=selections(data,env.PUSH_STOPS||[]);
   if(destination.transport!==(value.transport||'web'))return fail('Geräteart kann nicht geändert werden.');
   const expires=destination.transport==='fcm'&&data.renew===false?Math.min(record.expires,deliveryExpiry(destination,now)):deliveryExpiry(destination,now);if(expires<=now)return fail('Push-Adresse ist abgelaufen.');
   const sealed=await sealPush({...destination,...selection},record.id,env.PUSH_STORAGE_KEY);
   const result=await env.DB.prepare('UPDATE foama_push_subscriptions SET endpoint_hash=?,sealed=?,expires=? WHERE id=? AND auth_hash=?').bind(await deliveryHash(destination),sealed,expires,record.id,record.auth_hash).run();
   return result.meta.changes?json({enabled:true,expiresAt:expires}):fail('Gerätefreigabe beendet.',410);
  }
  if(request.method==='POST'&&match[2]){
   const result=await env.DB.prepare('UPDATE foama_push_subscriptions SET last_test=? WHERE id=? AND last_test<=?').bind(now,record.id,now-60000).run();
   if(!result.meta.changes)return fail('Bitte eine Minute bis zur nächsten Testnachricht warten.',429);
   try{const delivery=await deliver(value,{format:'foama-push-v1',title:'foama-wien: Testnachricht',body:'Push ist verbunden. Künftig erhältst du passende Störungsmeldungen der Wiener Linien.',url:'/alerts.html',tag:'foama-wien-test'},env,{now,sender,nativeSender});
    if(delivery.gone)await removePush(env.DB,record.id);
    return delivery.ok?json({accepted:true}):fail(delivery.gone?'Push-Adresse abgelaufen. Bitte erneut aktivieren.':'Der Push-Anbieter hat die Testnachricht nicht angenommen.',delivery.gone?410:502);
   }catch{return fail('Die Testnachricht konnte gerade nicht gesendet werden.',502);}
  }
  return fail('Methode nicht erlaubt.',405);
 }catch{return fail('Benachrichtigungsauswahl oder Gerätefreigabe ungültig.');}
}
export async function dispatchDisruptions(env,{now=Date.now(),origin=env.PUSH_VAPID_SUBJECT,fetcher=fetch,sender=sendWebPush,nativeSender=sendFcmPush}={}){
 if(!dispatcherConfigured(env))throw Error('Push service is not configured');
 await purgePush(env.DB,now);
 await env.DB.prepare("INSERT OR IGNORE INTO foama_push_runtime (id) VALUES ('main')").run();
 const token=pushB64(crypto.getRandomValues(new Uint8Array(24)));
 const lock=await env.DB.prepare("UPDATE foama_push_runtime SET lease_until=?,lease_token=?,last_check=?,status='checking' WHERE id='main' AND lease_until<=? AND next_allowed<=?").bind(now+240000,token,now,now,now).run();
 if(!lock.meta.changes)return {skipped:true,reason:'not-due'};
 let cursor='',sent=0,failed=0,checked=0;
 try{
  const state=await runtime(env.DB);cursor=state.cursor;
  const feed=await getDisruptions(origin,{now,fetcher});
  const all=(await env.DB.prepare('SELECT * FROM foama_push_subscriptions WHERE expires > ? ORDER BY id').bind(now).all()).results;
  const ordered=[...all.filter(r=>r.id>cursor),...all.filter(r=>r.id<=cursor)];
  const fingerprinted=await Promise.all(feed.notices.map(async notice=>({notice,hash:await pushHash(pushFingerprint(notice))})));
  const wallStart=Date.now();
  for(const record of ordered){
   if(checked>=PUSH_LIMITS.batch||Date.now()-wallStart>90000)break;checked++;cursor=record.id;
   try{
    const value=await openPush(record.sealed,record.id,env.PUSH_STORAGE_KEY);
    if(!deliveryReady(value,env))continue;
    if(record.retry_after>now||!pushCanSend(record,value.preferences,now))continue;
    const history=new Set((await env.DB.prepare('SELECT id FROM foama_push_deliveries WHERE subscription_id=?').bind(record.id).all()).results.map(r=>r.id));
    const relevant=[];for(const {notice,hash} of fingerprinted){const id=record.id+':'+hash;if(!history.has(id)&&pushNoticeMatches(notice,value.targets,value.preferences,now))relevant.push({notice,id});}
    if(!relevant.length)continue;
    const delivery=await deliver(value,disruptionPushPayload(relevant.map(r=>r.notice),value.preferences.scope),env,{now,sender,nativeSender});
    if(delivery.gone){await removePush(env.DB,record.id);continue;}
    if(!delivery.ok){failed++;await env.DB.prepare('UPDATE foama_push_subscriptions SET retry_after=? WHERE id=?').bind(now+(delivery.status===429?30:5)*60000,record.id).run();continue;}
    sent++;
    for(const item of relevant)await env.DB.prepare('INSERT OR IGNORE INTO foama_push_deliveries (id,subscription_id,created) VALUES (?,?,?)').bind(item.id,record.id,now).run();
    await env.DB.prepare('UPDATE foama_push_subscriptions SET last_sent=?,day=?,day_count=?,retry_after=0 WHERE id=?').bind(now,pushDay(now),record.day===pushDay(now)?record.day_count+1:1,record.id).run();
    await env.DB.prepare('DELETE FROM foama_push_deliveries WHERE subscription_id=? AND id NOT IN (SELECT id FROM foama_push_deliveries WHERE subscription_id=? ORDER BY created DESC LIMIT 256)').bind(record.id,record.id).run();
   }catch{failed++;}
  }
  const result={checked,sent,failed,notices:feed.notices.length,sourceCheckedAt:feed.checkedAt};
  await env.DB.prepare("UPDATE foama_push_runtime SET last_success=?,next_allowed=?,lease_until=0,status=?,cursor=?,result=? WHERE id='main' AND lease_token=?").bind(now,now+240000,failed?'partial':'ok',cursor,JSON.stringify(result),token).run();
  return result;
 }catch{
  await env.DB.prepare("UPDATE foama_push_runtime SET next_allowed=?,lease_until=0,status='source-error',result=? WHERE id='main' AND lease_token=?").bind(now+300000,JSON.stringify({checked,sent,failed}),token).run();
  throw Error('Disruption source unavailable; no all-clear or stale notification sent');
 }
}
let nextActiveCheck=0;
export function activeDisruptionCheck(env,ctx,now=Date.now()){
 // Piggyback only on an already requested, visible-app monitor call. No client timer.
 // This is an optimization; D1's global lease still authoritatively bounds checks.
 if(!dispatcherConfigured(env)||now<nextActiveCheck)return;
 nextActiveCheck=now+300000;
 ctx.waitUntil(dispatchDisruptions(env,{now}).catch(()=>{}));
}
