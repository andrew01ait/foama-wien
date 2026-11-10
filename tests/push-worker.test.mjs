import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {IDBFactory} from 'fake-indexeddb';
import '../pwa/src/push-storage.js';
const worker=await readFile(new URL('../pwa/src/push-worker.js',import.meta.url),'utf8');
async function fixture({visible=false,quiet=false,verification=true,onVerify,now=Date.parse('2026-11-09T12:00Z')}={}){
 const db=new IDBFactory(),store=globalThis.createFoamaPushStore(db),id='a'.repeat(32),secret='b'.repeat(32),eventId='c'.repeat(32);
 let device={id,secret,enabled:true,expiresAt:now+86400000,preferences:{quiet}},time=now;
 await store.setDevice(device);
 const value={format:'foama-push-v2',deviceId:id,eventId,sentAt:now,expiresAt:now+300000,tag:'foama-wien-disruptions',title:'U6',body:'Verzögerungen'};
 const handlers={},shown=[],calls=[],navigations=[],window={url:'https://foama.example/',visibilityState:visible?'visible':'hidden',navigate:async url=>navigations.push(url),focus:async()=>{}};
 const scope={Notification:{permission:'granted'},foamaPushStore:store,location:{origin:'https://foama.example'},clients:{matchAll:async()=>[window],openWindow:async url=>navigations.push(url)},registration:{showNotification:async(...args)=>shown.push(args)},addEventListener:(name,handler)=>handlers[name]=handler,fetch:async(url,options)=>{
  calls.push({url,options});assert.equal(options.headers['X-Push-Secret'],secret);assert.equal(new URL(url).origin,'https://foama.example');
  if(options.method==='POST')return Response.json({recorded:true});
  if(onVerify)await onVerify({store,device,window});
  if(verification==='error')return new Response(null,{status:503});
  return Response.json({relevant:verification,notification:{...value,title:'Geprüfte Störung',body:'Aktueller Betreibertext'}});
 }};
 class Clock extends Date{static now(){return time;}}
 new vm.Script(worker).runInNewContext({self:scope,URL,AbortController,setTimeout,clearTimeout,Date:Clock,Intl});
 async function push(data=value){let pending;handlers.push({data:{json:()=>data},waitUntil:value=>pending=value});await pending;}
 return {store,db,scope,handlers,shown,calls,value,window,navigations,push,setTime:at=>time=at};
}
test('IndexedDB survives a new page/worker store and atomically excludes concurrent display claims',async()=>{
 const db=new IDBFactory(),first=globalThis.createFoamaPushStore(db);await first.setDevice({enabled:true,id:'device'});
 const next=globalThis.createFoamaPushStore(db);assert.deepEqual(await next.getDevice(),{enabled:true,id:'device'});
 const claims=await Promise.all([first.claim('event',1000,100000),next.claim('event',1000,100000)]);assert.equal(claims.filter(Boolean).length,1);
 await first.finish('event',true,1000);assert.equal(await next.claim('other',2000,100000),false);assert.equal(await next.claim('later',62000,100000),true);
});
test('hidden window does not suppress push; verified content is silent, bounded and displayed only once across concurrent arrivals',async()=>{
 const f=await fixture();await Promise.all([f.push(),f.push()]);assert.equal(f.shown.length,1);assert.equal(f.shown[0][0],'Geprüfte Störung');
 const options=f.shown[0][1];assert.equal(options.silent,true);assert.equal(options.renotify,false);assert.equal(options.data.url,'/alerts.html');assert.equal(options.body,'Aktueller Betreibertext');
 assert.equal(f.calls.filter(c=>c.options.body?.includes('shown')).length,1);
 let pending;f.handlers.notificationclick({notification:{data:options.data,close(){}},waitUntil:value=>pending=value});await pending;
 assert.deepEqual(f.navigations,['https://foama.example/alerts.html']);assert.ok(f.calls.some(c=>c.options.body?.includes('clicked')));
});
test('visible app, resolved event, unavailable verification and wrong device never display a stale or generic alert',async()=>{
 for(const options of [{visible:true},{verification:false},{verification:'error'}]){const f=await fixture(options);await f.push();assert.equal(f.shown.length,0);}
 const f=await fixture();for(const data of [{format:'foama-push-v1'},null,{...f.value,deviceId:'other'},{...f.value,eventId:'../../escape'},{...f.value,expiresAt:f.value.sentAt-1}])await f.push(data);
 assert.equal(f.shown.length,0);assert.equal(f.calls.length,0);
});
test('opt-out and visible navigation during verification are rechecked before notification display',async()=>{
 for(const onVerify of [async({store,device})=>store.setDevice({...device,enabled:false}),async({window})=>{window.visibilityState='visible';}]){
  const f=await fixture({onVerify});await f.push();assert.equal(f.shown.length,0);
 }
});
test('Vienna quiet time suppresses automatic messages while an explicitly requested test remains available',async()=>{
 const f=await fixture({quiet:true,now:Date.parse('2026-11-09T22:30Z')});await f.push();assert.equal(f.shown.length,0);
 f.value.tag='foama-wien-test';await f.push();assert.equal(f.shown.length,1);
});
async function localMessage(f,source=f.window){const replies=[];let pending;f.handlers.message({data:{type:'FOAMA_LOCAL_NOTIFICATION_TEST'},source,ports:[{postMessage:value=>replies.push(value)}],waitUntil:value=>pending=value});await pending;return replies[0];}
test('local display test runs within the worker event lifetime, replaces only an earlier local test and confirms browser listing without any transport',async()=>{
 const f=await fixture({visible:true,quiet:true});let closed=0,listed=0;
 f.scope.registration.getNotifications=async({tag})=>{assert.equal(tag,'foama-wien-local-test');listed++;return listed===1?[{close(){closed++;}}]:[{tag}];};
 const result=await localMessage(f);assert.equal(result.ok,true);assert.equal(result.listed,true);assert.equal(closed,1);assert.equal(f.shown.length,1);assert.equal(f.calls.length,0);assert.equal(f.shown[0][1].silent,true);assert.equal(f.shown[0][1].data.kind,'local-test');
 let pending;f.handlers.notificationclick({notification:{data:f.shown[0][1].data,close(){}},waitUntil:value=>pending=value});await pending;
 assert.deepEqual(f.navigations,['https://foama.example/?settings=1']);assert.equal(f.calls.length,0);
});
test('local worker test distinguishes missing permission, a foreign client, rejected display and missing browser listing',async()=>{
 const denied=await fixture();denied.scope.Notification.permission='denied';assert.equal((await localMessage(denied)).code,'permission');assert.equal(denied.shown.length,0);
 const foreign=await fixture();assert.equal((await localMessage(foreign,{url:'https://other.example/'})).code,'client');assert.equal(foreign.shown.length,0);
 const rejected=await fixture();rejected.scope.registration.showNotification=async()=>{throw Error('OS denied');};assert.equal((await localMessage(rejected)).code,'display-failed');
 const missing=await fixture();missing.scope.registration.getNotifications=async()=>[];assert.equal((await localMessage(missing)).code,'not-listed');assert.equal(missing.shown.length,1);
 for(const f of [denied,foreign,rejected,missing])assert.equal(f.calls.length,0);
});
