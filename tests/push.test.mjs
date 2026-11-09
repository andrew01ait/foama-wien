import test from 'node:test';
import assert from 'node:assert/strict';
import {createECDH,hkdfSync,createDecipheriv,verify,createPublicKey} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {localD1} from '../site/local-d1.mjs';
import {pushB64,pushBytes,validatePushSubscription,encryptPush,vapidAuthorization,sendWebPush} from '../cloudflare/src/web-push.mjs';
import {pushApi,dispatchDisruptions,pushHash,sealPush,openPush,purgePush,getDisruptions} from '../cloudflare/src/push-service.mjs';
import {pushPreferences,favoritePushTargets,pushNoticeMatches,pushCanSend,pushDay,pushFingerprint} from '../pwa/src/push-policy.mjs';
import {createNotifications} from '../pwa/src/notifications.mjs';

const now=Date.parse('2026-11-08T11:00:00Z');
const ua=createECDH('prime256v1');ua.generateKeys();
const sub={endpoint:'https://fcm.googleapis.com/fcm/send/TEST_ONLY_NOT_A_REAL_ENDPOINT',keys:{p256dh:ua.getPublicKey().toString('base64url'),auth:Buffer.alloc(16,9).toString('base64url')}};
const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const privateJwk=JSON.stringify(await crypto.subtle.exportKey('jwk',pair.privateKey)),publicKey=pushB64(await crypto.subtle.exportKey('raw',pair.publicKey));
const catalog=[{id:'wl:1',provider:'wl',rbl:['101','102'],lines:[{route:'U6',mode:'metro'},{route:'46',mode:'tram'}]}];
const notice={name:'a',refTrafficInfoCategoryId:2,title:'U6: Verzögerungen',description:'Unregelmäßige Intervalle.',relatedLines:['U6']};
const feed=(notices=[notice])=>({data:{trafficInfoCategories:[{id:1,name:'aufzugsinfo'},{id:2,name:'stoerunglang'},{id:3,name:'stoerungkurz'}],trafficInfos:notices}});
const id='a'.repeat(32),secret='b'.repeat(32);
const req=(path,method='GET',data,token=secret)=>new Request('https://foama.example'+path,{method,headers:{'Content-Type':'application/json','X-Push-Secret':token},body:data?JSON.stringify(data):undefined});
const subscriptionData=(extra={})=>({id,secret,subscription:sub,preferences:{scope:'favorites'},targets:[{stopId:'wl:1',routes:['U6']}],...extra});
function env(){return {DB:localD1(),PUSH_VAPID_PRIVATE_JWK:privateJwk,PUSH_VAPID_PUBLIC_KEY:publicKey,PUSH_VAPID_SUBJECT:'https://foama.example/',PUSH_STORAGE_KEY:Buffer.alloc(32,7).toString('base64url'),PUSH_ADMIN_USER_ID:'owner',PUSH_SCHEDULER_ENABLED:'true',PUSH_STOPS:catalog};}
const register=async(e,data=subscriptionData())=>{const r=await pushApi(req('/api/push/subscriptions','POST',data),e,now);assert.equal(r.status,201,await r.clone().text());return r.json();};

test('Web Push matches the complete independent RFC 8291 encryption vector',async()=>{
 const as='BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',raw=pushBytes(as);
 const key=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:pushB64(raw.slice(1,33)),y:pushB64(raw.slice(33)),d:'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw'},{name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
 const publicPart=await crypto.subtle.importKey('raw',raw,{name:'ECDH',namedCurve:'P-256'},true,[]);
 const rfcSub={...sub,keys:{p256dh:'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',auth:'BTBZMqHH6r4Tts7J_aSIgg'}};
 const encrypted=await encryptPush(rfcSub,'When I grow up, I want to be a watermelon',{salt:pushBytes('DGv6ra1nlYgDCS1FRnbzlw'),serverKey:{privateKey:key,publicKey:publicPart}});
 assert.equal(pushB64(encrypted.slice(86)),'8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ');
 assert.equal(new DataView(encrypted.buffer).getUint32(16),4096);
});
test('independent Node crypto receiver decrypts random WebCrypto payloads; salts and ECDH keys change',async()=>{
 const a=await encryptPush(sub,'Öffis: Störung U6'),b=await encryptPush(sub,'Öffis: Störung U6');assert.notDeepEqual(a,b);
 const shared=ua.computeSecret(a.slice(21,86));
 const ikm=Buffer.from(hkdfSync('sha256',shared,Buffer.from(sub.keys.auth,'base64url'),Buffer.concat([Buffer.from('WebPush: info\0'),ua.getPublicKey(),a.slice(21,86)]),32));
 const key=Buffer.from(hkdfSync('sha256',ikm,a.slice(0,16),Buffer.from('Content-Encoding: aes128gcm\0'),16));
 const nonce=Buffer.from(hkdfSync('sha256',ikm,a.slice(0,16),Buffer.from('Content-Encoding: nonce\0'),12));
 const decipher=createDecipheriv('aes-128-gcm',key,nonce);decipher.setAuthTag(a.slice(-16));
 const plain=Buffer.concat([decipher.update(a.slice(86,-16)),decipher.final()]);assert.equal(plain.at(-1),2);assert.equal(plain.subarray(0,-1).toString(),'Öffis: Störung U6');
});
test('VAPID signature verifies and binds the correct push-service origin for twelve hours',async()=>{
 const header=await vapidAuthorization(sub.endpoint,privateJwk,publicKey,'https://foama.example/',now),jwt=header.match(/t=([^,]+)/)[1],parts=jwt.split('.');
 const claim=JSON.parse(Buffer.from(parts[1],'base64url'));assert.equal(claim.aud,'https://fcm.googleapis.com');assert.equal(claim.exp,now/1000+43200);
 assert.equal(verify('sha256',Buffer.from(parts.slice(0,2).join('.')),{key:createPublicKey({key:JSON.parse(privateJwk),format:'jwk'}),dsaEncoding:'ieee-p1363'},Buffer.from(parts[2],'base64url')),true);
});
test('push sender allows only known HTTPS providers and refuses redirects or oversized payloads',async()=>{
 for(const endpoint of ['http://fcm.googleapis.com/fcm/send/x','https://localhost/a','https://fcm.googleapis.com.evil.example/fcm/send/x','https://user:pass@fcm.googleapis.com/fcm/send/x','https://fcm.googleapis.com/other/x'])assert.throws(()=>validatePushSubscription({...sub,endpoint}));
 assert.throws(()=>validatePushSubscription({...sub,keys:{...sub.keys,auth:'abc'}}));
 await assert.rejects(encryptPush(sub,'x'.repeat(3001)));
 let options;const delivered=await sendWebPush(sub,{hello:'test'},{PUSH_VAPID_PRIVATE_JWK:privateJwk,PUSH_VAPID_PUBLIC_KEY:publicKey,PUSH_VAPID_SUBJECT:'https://foama.example/'},{now,fetcher:async(url,o)=>{options=o;return new Response(null,{status:307,headers:{Location:'https://other.example'}});}});
 assert.equal(delivered.ok,false);assert.equal(options.redirect,'manual');assert.equal(options.headers['Content-Encoding'],'aes128gcm');assert.equal(options.headers.TTL,'300');
});
test('subscription storage is authenticated encryption bound to its own device ID',async()=>{
 const key=Buffer.alloc(32,4).toString('base64url'),value={subscription:sub,targets:catalog};const sealed=await sealPush(value,id,key);
 assert.match(sealed,/^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/);assert.ok(!sealed.includes(sub.endpoint));assert.deepEqual(await openPush(sealed,id,key),value);
 await assert.rejects(openPush(sealed,'other-device',key));await assert.rejects(openPush(sealed,id,Buffer.alloc(32,5).toString('base64url')));
});
test('transport respects relative and dated Retry-After and short test TTL in the real request shape',async()=>{
 let headers;
 const options={now,ttl:60,fetcher:async(url,request)=>{headers=request.headers;return new Response(null,{status:429,headers:{'Retry-After':'120'}});}};
 const relative=await sendWebPush(sub,{title:'test'},env(),options);assert.equal(relative.retryAfterMs,120000);assert.equal(headers.TTL,'60');
 const until=now+120000,dated=await sendWebPush(sub,{title:'test'},env(),{now,fetcher:async()=>new Response(null,{status:503,headers:{'Retry-After':new Date(until).toUTCString()}})});
 assert.equal(dated.retryAfterMs+dated.responseAt,until);
});
test('favorite scope uses known station/line IDs and excludes unrelated equipment and short stop messages',()=>{
 const targets=favoritePushTargets([{stopId:'wl:1',route:'U6'},{stopId:'missing',route:'46'},{stopId:'wl:1',route:'U6'}],catalog);assert.equal(targets.length,1);
 const base={category:'stoerungkurz',lines:['U6'],stops:['999']},prefs=pushPreferences();
 assert.equal(pushNoticeMatches(base,targets,prefs,now),false);
 assert.equal(pushNoticeMatches({...base,stops:['101']},targets,prefs,now),true);
 assert.equal(pushNoticeMatches({...base,category:'aufzugsinfo',stops:['101']},targets,prefs,now),false);
 assert.equal(pushNoticeMatches({...base,category:'aufzugsinfo',stops:['101']},targets,{...prefs,equipment:true},now),false);
 assert.equal(pushNoticeMatches({...base,category:'aufzugsinfo'},targets,{...prefs,equipment:true},now),false);
 assert.equal(pushNoticeMatches({...base,category:'stoerunglang',stops:[]},targets,prefs,now),true);
 assert.equal(pushNoticeMatches({...base,category:'stoerunglang',resolved:true},targets,{scope:'all'},now),false);
 assert.equal(pushNoticeMatches({...base,start:new Date(now+31*60000).toISOString()},targets,{scope:'all'},now),false);
});
test('notification day and optional quiet hours follow Vienna across winter/summer dates',()=>{
 assert.equal(pushDay(Date.parse('2026-11-08T23:30Z')),'2026-11-09');
 assert.equal(pushDay(Date.parse('2026-07-08T22:30Z')),'2026-07-09');
 assert.equal(pushCanSend({last_sent:now-29*60000,day:'',day_count:0},pushPreferences(),now),false);
 assert.equal(pushCanSend({last_sent:0,day:pushDay(now),day_count:6},pushPreferences(),now),false);
 assert.equal(pushCanSend({last_sent:0,day:'',day_count:0},{quiet:true},Date.parse('2026-11-08T21:30Z')),false);
 assert.equal(pushCanSend({last_sent:0,day:'',day_count:0},{quiet:true},Date.parse('2026-07-08T05:00Z')),true);
 assert.equal(pushFingerprint({title:'Störung',checkedAt:123,id:'a'}),pushFingerprint({title:'Störung',checkedAt:456,id:'b'}));
});
test('equipment exclusion is unconditional for old preferences and all/favorite scopes; mixed service events remain relevant',()=>{
 assert.equal(pushPreferences({equipment:true}).equipment,false);
 const targets=favoritePushTargets([{stopId:'wl:1',route:'U6'}],catalog);
 for(const scope of ['all','favorites'])for(const category of ['aufzugsinfo','fahrtreppeninfo']){
  assert.equal(pushNoticeMatches({category,lines:['U6'],stops:['101']},targets,{scope,equipment:true},now),false);
 }
 assert.equal(pushNoticeMatches({category:'stoerunglang',title:'U6 Betrieb unterbrochen; Aufzug betroffen',lines:['U6'],stops:[]},targets,pushPreferences(),now),true);
});
test('dispatcher ignores legacy encrypted lift opt-ins without device re-registration',async()=>{
 const e=env(),sent=[];try{
  await register(e);
  const row=await e.DB.prepare('SELECT * FROM foama_push_subscriptions WHERE id=?').bind(id).first();
  const value=await openPush(row.sealed,id,e.PUSH_STORAGE_KEY);value.preferences.equipment=true;
  await e.DB.prepare('UPDATE foama_push_subscriptions SET sealed=? WHERE id=?').bind(await sealPush(value,id,e.PUSH_STORAGE_KEY),id).run();
  const lift={...notice,refTrafficInfoCategoryId:1,title:'Aufzug außer Betrieb',relatedStops:['101']};
  const options={now,fetcher:async()=>Response.json(feed([lift])),sender:async(s,p)=>{sent.push(p);return {ok:true};}};
  assert.equal((await dispatchDisruptions(e,options)).sent,0);assert.equal(sent.length,0);
  assert.equal((await dispatchDisruptions(e,{...options,now:now+5*60000,fetcher:async()=>Response.json(feed([lift,notice]))})).sent,1);
  assert.match(sent[0].body,/U6/);assert.doesNotMatch(sent[0].body,/Aufzug/);
 }finally{e.DB.close();}
});
test('scheduled service notices start on time while equipment stays excluded despite legacy opt-ins',()=>{
 const prefs=pushPreferences({scope:'all',equipment:true}),future={category:'stoerunglang',lines:['U6'],start:new Date(now+1000).toISOString(),planned:true};
 assert.equal(pushNoticeMatches(future,[],prefs,now),false);
 assert.equal(pushNoticeMatches(future,[],prefs,now+999),false);
 assert.equal(pushNoticeMatches(future,[],prefs,now+1000),true);
 assert.equal(pushNoticeMatches({...future,category:'aufzugsinfo'},[],prefs,now),false);
 assert.equal(pushNoticeMatches({...future,category:'aufzugsinfo'},[],prefs,now+1000),false);
 assert.equal(pushNoticeMatches({...future,category:'aufzugsinfo'},[],pushPreferences({scope:'all'}),now+1000),false);
 assert.equal(pushNoticeMatches({...future,start:'',planned:true},[],prefs,now),false);
});
test('device API protects other devices, encrypts minimal filters, rejects unknown favorite data and deletes cleanly',async()=>{
 const e=env();try{
  await register(e,subscriptionData({position:{lat:48.999,lon:16.999}}));
  const row=await e.DB.prepare('SELECT * FROM foama_push_subscriptions WHERE id=?').bind(id).first();
  assert.equal(row.auth_hash,await pushHash(secret));assert.ok(!JSON.stringify(row).includes(sub.endpoint));
  const value=await openPush(row.sealed,id,e.PUSH_STORAGE_KEY);assert.equal(value.position,undefined);assert.deepEqual(value.targets[0].rbl,['101','102']);
  assert.equal((await pushApi(req('/api/push/subscriptions/'+id,'DELETE',null,'c'.repeat(32)),e,now)).status,410);
  assert.equal((await pushApi(req('/api/push/subscriptions/'+id,'GET'),e,now)).status,200);
  assert.equal((await pushApi(req('/api/push/subscriptions/'+id,'DELETE'),e,now)).status,200);
  assert.equal((await e.DB.prepare('SELECT count(*) AS n FROM foama_push_subscriptions').first()).n,0);
  assert.equal((await pushApi(req('/api/push/subscriptions','POST',subscriptionData({targets:[{stopId:'missing',routes:['BAD']}]})),e,now)).status,400);
 }finally{e.DB.close();}
});
test('dispatch sends relevant new content once, preserves cooldown, then sends substantive changes only',async()=>{
 const e=env();const sent=[];let current=feed();const fetcher=async()=>Response.json(current),sender=async(s,p)=>{sent.push(p);return {ok:true};};
 try{await register(e);
  assert.equal((await dispatchDisruptions(e,{now,fetcher,sender})).sent,1);assert.equal(sent[0].url,'/alerts.html');
  assert.equal((await dispatchDisruptions(e,{now:now+60000,fetcher,sender})).skipped,true);
  assert.equal((await dispatchDisruptions(e,{now:now+31*60000,fetcher,sender})).sent,0);
  current=feed([{...notice,name:'new-provider-id'}]);assert.equal((await dispatchDisruptions(e,{now:now+36*60000,fetcher,sender})).sent,0);
  current=feed([{...notice,description:'Betrieb unterbrochen.'}]);assert.equal((await dispatchDisruptions(e,{now:now+41*60000,fetcher,sender})).sent,1);
  current=feed([{...notice,title:'Weitere Störung'}]);assert.equal((await dispatchDisruptions(e,{now:now+46*60000,fetcher,sender})).sent,0);
  assert.equal(sent.length,2);
 }finally{e.DB.close();}
});
test('provider expiration removes subscription and history; failed provider delivery is retried without false success',async()=>{
 const e=env();let mode='failed';const sender=async()=>mode==='failed'?{ok:false,status:503}:{ok:false,gone:true,status:410};
 try{await register(e);assert.equal((await dispatchDisruptions(e,{now,fetcher:async()=>Response.json(feed()),sender})).sent,0);
  assert.equal((await e.DB.prepare('SELECT count(*) AS n FROM foama_push_deliveries').first()).n,0);
  mode='gone';await dispatchDisruptions(e,{now:now+6*60000,fetcher:async()=>Response.json(feed()),sender});
  assert.equal((await e.DB.prepare('SELECT count(*) AS n FROM foama_push_subscriptions').first()).n,0);
 }finally{e.DB.close();}
});
test('invalid or unavailable official feed sends nothing and keeps the earlier success timestamp',async()=>{
 const e=env();let sends=0;try{await register(e);
  await dispatchDisruptions(e,{now,fetcher:async()=>Response.json(feed([])),sender:async()=>{sends++;return {ok:true};}});
  await assert.rejects(dispatchDisruptions(e,{now:now+5*60000,fetcher:async()=>new Response('Unavailable',{status:503}),sender:async()=>{sends++;}}));
  const state=await e.DB.prepare("SELECT * FROM foama_push_runtime WHERE id='main'").first();assert.equal(state.status,'source-error');assert.equal(state.last_success,now);assert.equal(sends,0);
  await assert.rejects(getDisruptions('https://foama.example',{fetcher:async()=>Response.json({data:{}})}));
 }finally{e.DB.close();}
});
test('expired subscriptions and orphaned delivery data are purged; updating does not extend beyond 90 days',async()=>{
 const e=env();try{const registered=await register(e);assert.equal(registered.expiresAt-now,90*86400000);
  await e.DB.prepare('INSERT INTO foama_push_deliveries VALUES (?,?,?)').bind('expired-history',id,now).run();
  await purgePush(e.DB,registered.expiresAt+1);
  assert.equal((await e.DB.prepare('SELECT count(*) AS n FROM foama_push_subscriptions').first()).n,0);
  assert.equal((await e.DB.prepare('SELECT count(*) AS n FROM foama_push_deliveries').first()).n,0);
 }finally{e.DB.close();}
});
test('public scheduler tick cannot select recipients or payloads, enforces its global lease, and exposes no device data',async()=>{
 const e=env();let calls=0;const options={fetcher:async()=>{calls++;return Response.json(feed());},sender:async()=>({ok:true})};
 try{
  const path='/api/push/check';
  assert.equal((await pushApi(req(path),e,now,options)).status,405);
  assert.equal((await pushApi(req(path,'POST',{recipient:'x',message:'fake'}),e,now,options)).status,400);assert.equal(calls,0);
  const first=await (await pushApi(req(path,'POST',{}),e,now,options)).json();assert.equal(first.checked,true);assert.equal(first.lastSuccess,now);
  assert.equal(first.sent,undefined);assert.equal(first.checkedDevices,undefined);
  const second=await (await pushApi(req(path,'POST',{}),e,now+60000,options)).json();assert.equal(second.skipped,true);assert.equal(calls,1);
 }finally{e.DB.close();}
});
test('v2 event verification and bounded receipts are authenticated per device; acceptance and browser display stay distinct',async()=>{
 const e=env();let payload;try{
  await register(e,subscriptionData({protocol:2}));
  const options={sender:async(s,p)=>{payload=p;return {ok:true};}};
  assert.equal((await pushApi(req('/api/push/subscriptions/'+id+'/test','POST',{}),e,now,options)).status,200);
  assert.equal(payload.format,'foama-push-v2');assert.equal(payload.expiresAt,now+60000);
  const path='/api/push/subscriptions/'+id+'/events/'+payload.eventId;
  assert.equal((await pushApi(req(path,'GET',null,'z'.repeat(32)),e,now)).status,410);
  assert.equal((await (await pushApi(req(path),e,now)).json()).relevant,true);
  let status=await (await pushApi(req('/api/push/subscriptions/'+id),e,now)).json();assert.equal(status.lastTest.acceptedAt,now);assert.equal(status.lastTest.shownAt,0);
  assert.equal((await pushApi(req(path+'/receipt','POST',{status:'constructor'}),e,now)).status,400);
  assert.equal((await pushApi(req(path+'/receipt','POST',{status:'shown'}),e,now+1)).status,200);
  assert.equal((await pushApi(req(path+'/receipt','POST',{status:'shown'}),e,now+2)).status,200);
  status=await (await pushApi(req('/api/push/subscriptions/'+id),e,now+3)).json();assert.equal(status.lastTest.shownAt,now+1);assert.equal(status.lastTest.clickedAt,0);
  e.PUSH_SCHEDULER_ENABLED='false';assert.equal((await (await pushApi(req(path),e,now+4)).json()).relevant,false);
  await pushApi(req('/api/push/subscriptions/'+id,'DELETE'),e,now+5);assert.equal((await pushApi(req(path),e,now+6)).status,410);
 }finally{e.DB.close();}
});

function clientFixture({permission='default',supported=true,visibility='visible',stored=null,available=true,workerProtocol=2,getJourneys=()=>[]}={}){
 const elements=new Map(),events={},requests=[],order=[],db=new Map(stored? [['foama.push.v1',JSON.stringify(stored)]]:[]);let unsubscribed=0;
 const element=id=>{if(!elements.has(id))elements.set(id,{handlers:{},hidden:false,disabled:false,checked:false,textContent:'',setAttribute(){},addEventListener:(type,handler)=>elements.get(id).handlers[type]=handler});return elements.get(id);};
 const root={visibilityState:visibility,getElementById:element,addEventListener:(name,fn)=>events[name]=fn};
 let current=null;
 const subscription={toJSON:()=>sub,unsubscribe:async()=>{unsubscribed++;current=null;return true;}};
 const environment={isSecureContext:supported,crypto,MessageChannel,PushManager:class{},Notification:{permission,requestPermission(){order.push('permission');this.permission=permission==='denied'?'denied':'granted';return Promise.resolve(this.permission);}},navigator:{serviceWorker:{ready:Promise.resolve({active:{postMessage(data,ports){ports[0].postMessage({protocol:workerProtocol});}},pushManager:{getSubscription:async()=>current,subscribe:async()=>{order.push('subscribe');current=subscription;return subscription;}}})}}};
 const fetcher=async(path,options)=>{requests.push({path,options});order.push(path);return Response.json(path.endsWith('/config')?{available,publicKey,lastSuccess:now}:{enabled:true,accepted:true,expiresAt:Date.now()+86400000},{status:options.method==='POST'&&!path.endsWith('/test')?201:200});};
 const controller=createNotifications({root,getFavorites:()=>[{stopId:'wl:1',route:'U6'}],getStops:()=>catalog,getJourneys,storage:{getItem:key=>db.get(key),setItem:(key,value)=>db.set(key,value)},environment,fetcher,pushStore:{setDevice:async()=>{}}});
 return {controller,root,elements,element,events,requests,order,db,environment,get unsubscribed(){return unsubscribed;}};
}
async function settle(fixture){for(let i=0;i<50&&fixture.element('pushDisable').disabled;i++)await new Promise(setImmediate);}
test('notifications never prompt on startup; user permission is requested synchronously on enable before network',async()=>{
 const f=clientFixture();await f.controller.init();assert.deepEqual(f.order,['/api/push/config']);
 f.element('pushEnable').handlers.click();assert.equal(f.order[1],'permission');await settle(f);
 assert.equal(f.requests.filter(r=>r.path==='/api/push/subscriptions').length,1);
 const payload=JSON.parse(f.requests.at(-1).options.body);assert.equal(payload.preferences.scope,'favorites');assert.equal(payload.position,undefined);assert.deepEqual(payload.targets[0].routes,['U6']);
 assert.equal(JSON.parse(f.db.get('foama.push.v1')).enabled,true);
 f.element('pushDisable').handlers.click();await settle(f);assert.equal(f.unsubscribed,1);assert.ok(f.requests.at(-1).options.method==='DELETE');assert.equal(JSON.parse(f.db.get('foama.push.v1')).enabled,undefined);
});
test('blocked, unsupported and hidden clients do not subscribe or start background requests',async()=>{
 const blocked=clientFixture({permission:'denied'});await blocked.controller.init();assert.equal(blocked.element('pushEnable').disabled,true);assert.ok(blocked.element('pushStatus').textContent.includes('blockiert'));
 const unsupported=clientFixture({supported:false});await unsupported.controller.init();assert.equal(unsupported.requests.length,0);assert.equal(unsupported.element('pushEnable').disabled,true);
 const hidden=clientFixture({visibility:'hidden'});await hidden.controller.init();assert.equal(hidden.requests.length,0);assert.equal(hidden.order.length,0);
});
test('PWA drops a legacy equipment preference before registering and keeps the other choices',async()=>{
 const f=clientFixture({stored:{preferences:{scope:'all',equipment:true,quiet:true}}});await f.controller.init();
 f.element('pushEnable').handlers.click();await settle(f);
 const input=JSON.parse(f.requests.find(r=>r.path==='/api/push/subscriptions').options.body);
 assert.deepEqual(input.preferences,{scope:'all',equipment:false,quiet:true});
 assert.deepEqual(JSON.parse(f.db.get('foama.push.v1')).preferences,input.preferences);
 assert.equal(f.elements.has('pushEquipment'),false);
});
test('unconfigured scheduler blocks activation, reports no active delivery and does not renew an old opt-in',async()=>{
 const f=clientFixture({permission:'granted',available:false,stored:{id,secret,enabled:true}});await f.controller.init();
 assert.equal(f.element('pushEnable').disabled,true);assert.ok(f.element('pushStatus').textContent.includes('noch nicht verfügbar'));
 assert.equal(f.requests.length,1);assert.equal(f.requests[0].path,'/api/push/config');assert.ok(!f.order.includes('subscribe'));
});
test('v2 enrollment waits for an explicitly activated compatible worker',async()=>{
 const f=clientFixture({workerProtocol:1});await f.controller.init();f.element('pushEnable').handlers.click();await settle(f);
 assert.equal(f.requests.filter(r=>r.path==='/api/push/subscriptions').length,0);assert.match(f.element('pushStatus').textContent,/Jetzt aktualisieren/);assert.ok(!f.order.includes('subscribe'));
});
test('route favorites include boarding, transfer and alighting stations and alternatives without leaking names or addresses',()=>{
 const stops=[...catalog,{id:'wl:2',provider:'wl',rbl:['201'],lines:[{route:'U6'},{route:'46'}]},{id:'rail:1',provider:'rail',rbl:[],lines:[{route:'S1'}]}];
 const leg={mode:'metro',route:'U6',from:{stopId:'wl:1',name:'Private name',lat:48.123456},to:{stopId:'wl:2'}},route={name:'My private commute',from:{name:'Home',lat:48.123456},legs:[{mode:'walk',from:{lat:48.123456}},leg],alternatives:[{legs:[{...leg,mode:'tram',route:'46'}]}]};
 const targets=favoritePushTargets([{stopId:'wl:1',route:'U6'}],stops,[route]);assert.equal(targets.length,2);assert.deepEqual(targets[0].routes,['46','U6']);assert.deepEqual(targets[1].routes,['46','U6']);assert.deepEqual(targets[1].rbl,['201']);assert.doesNotMatch(JSON.stringify(targets),/Private|private|Home|48\.123456|name|lat/);
 assert.equal(pushNoticeMatches({category:'stoerungkurz',lines:['U6'],stops:['201']},targets,pushPreferences({}),now),true);assert.equal(pushNoticeMatches({category:'aufzugsinfo',lines:['U6'],stops:['201']},targets,pushPreferences({}),now),false);
 assert.deepEqual(favoritePushTargets([],stops,[null,{legs:[null],alternatives:{}},{legs:[{...leg,route:'unknown'}]}]),[]);assert.deepEqual(favoritePushTargets([],stops,{}),[]);
});
test('returning to the visible PWA synchronizes a changed route selection immediately, within the five-minute renewal window',async()=>{
 let journeys=[];const f=clientFixture({getJourneys:()=>journeys});await f.controller.init();f.element('pushEnable').handlers.click();await settle(f);const before=f.requests.filter(r=>r.options.method==='PUT').length;
 journeys=[{legs:[{mode:'tram',route:'46',from:{stopId:'wl:1'},to:{stopId:'wl:1'}}]}];await f.controller.refresh();await settle(f);const updates=f.requests.filter(r=>r.options.method==='PUT');assert.equal(updates.length,before+1);assert.deepEqual(JSON.parse(updates.at(-1).options.body).targets[0].routes,['46','U6']);assert.match(f.element('pushSelection').textContent,/2 Linien an 1 Haltestellen/);
 journeys=[];f.root.visibilityState='hidden';const count=f.requests.length;await f.controller.refresh();await settle(f);assert.equal(f.requests.length,count,'hidden document does not synchronize changed routes');
});
