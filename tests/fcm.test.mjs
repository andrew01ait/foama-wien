import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify} from 'node:crypto';
import {localD1} from '../site/local-d1.mjs';
import {nativeFirebaseOptions,nativeFcmConfigured,fcmAssertion,sendFcmPush,validateFcmToken} from '../cloudflare/src/fcm.mjs';
import {pushApi,openPush,dispatchDisruptions} from '../cloudflare/src/push-service.mjs';

const now=Date.parse('2026-11-08T12:00Z');
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const account={type:'service_account',project_id:'foama-test-123',client_email:'sender@foama-test-123.iam.gserviceaccount.com',private_key:privateKey.export({type:'pkcs8',format:'pem'})};
const config={FIREBASE_PROJECT_ID:'foama-test-123',FIREBASE_ANDROID_APP_ID:'1:123456789:android:1234567890abcdef',FIREBASE_API_KEY:'AIza'+'a'.repeat(35),FIREBASE_SENDER_ID:'123456789',FCM_SERVICE_ACCOUNT_JSON:JSON.stringify(account)};
const token='TEST_ONLY_NATIVE_'+ 'a'.repeat(100),id='n'.repeat(32),secret='s'.repeat(32);
const catalog=[{id:'wl:1',provider:'wl',rbl:['101','102'],lines:[{route:'U6',mode:'metro'}]}];
const data={id,secret,transport:'fcm',registrationToken:token,preferences:{scope:'favorites',quiet:false},targets:[{stopId:'wl:1',routes:['U6']}]};
const request=(path,method='GET',body,auth=secret)=>new Request('https://foama.example'+path,{method,headers:{'Content-Type':'application/json','X-Push-Secret':auth},body:body?JSON.stringify(body):undefined});
const env=()=>({...config,DB:localD1(),PUSH_STORAGE_KEY:Buffer.alloc(32,8).toString('base64url'),PUSH_STOPS:catalog,PUSH_SCHEDULER_ENABLED:'true',PUSH_VAPID_SUBJECT:'https://foama.example/'});

test('FCM configuration binds Android sender, project and private service identity; public config excludes secrets',async()=>{
 assert.equal(nativeFcmConfigured(config),true);assert.equal(nativeFcmConfigured({...config,FIREBASE_PROJECT_ID:'another-project'}),false);
 assert.equal(nativeFirebaseOptions({...config,FIREBASE_SENDER_ID:'different'}),null);
 for(const bad of ['https://example.org', 'short', 'a'.repeat(4100),token+'\n'])assert.throws(()=>validateFcmToken(bad));
 const e=env();try{const c=await (await pushApi(request('/api/push/config'),e,now)).json();assert.equal(c.nativeAvailable,true);assert.equal(c.available,false);assert.equal(c.firebase.projectId,config.FIREBASE_PROJECT_ID);assert.ok(!JSON.stringify(c).includes('PRIVATE KEY'));assert.ok(!JSON.stringify(c).includes('client_email'));}finally{e.DB.close();}
});
test('FCM OAuth assertion verifies independently and fixes audience, sender scope and expiry',async()=>{
 const jwt=await fcmAssertion(config,now),parts=jwt.split('.');assert.equal(verify('sha256',Buffer.from(parts.slice(0,2).join('.')),publicKey,Buffer.from(parts[2],'base64url')),true);
 const claims=JSON.parse(Buffer.from(parts[1],'base64url'));assert.equal(claims.aud,'https://oauth2.googleapis.com/token');assert.equal(claims.scope,'https://www.googleapis.com/auth/firebase.messaging');assert.equal(claims.iss,account.client_email);assert.equal(claims.exp,now/1000+3540);assert.ok(claims.exp-claims.iat<=3600);
});
test('FCM uses only fixed Google endpoints, data-only visible delivery and a five-minute TTL; no redirect following',async()=>{
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return url.includes('/token')?Response.json({access_token:'test-access-token',expires_in:3600}):Response.json({name:'test-message'});};
 assert.equal((await sendFcmPush(token,{title:'U6',body:'Verzögerungen',url:'https://untrusted.example'},config,{now,fetcher})).ok,true);
 assert.equal(calls[0].url,'https://oauth2.googleapis.com/token');assert.equal(calls[1].url,'https://fcm.googleapis.com/v1/projects/foama-test-123/messages:send');
 const message=JSON.parse(calls[1].options.body).message;assert.equal(message.token,token);assert.equal(message.notification,undefined);assert.equal(message.data.url,undefined);assert.equal(message.android.priority,'high');assert.equal(message.android.ttl,'300s');assert.equal(calls[1].options.redirect,'manual');
 const redirected=await sendFcmPush(token,{title:'test'},config,{now,fetcher:async()=>new Response(null,{status:307,headers:{Location:'https://untrusted.example'}})});assert.equal(redirected.ok,false);assert.equal(redirected.gone,false);
 const gone=await sendFcmPush(token,{title:'test'},config,{now,fetcher:async()=>Response.json({error:{details:[{errorCode:'UNREGISTERED'}]}},{status:404})});assert.equal(gone.gone,true);
});
test('native device enrollment is encrypted and independently authenticated; token rotation and disabling preserve cleanup',async()=>{
 const e=env();try{
  assert.equal((await pushApi(request('/api/push/subscriptions','POST',data),e,now)).status,201);
  let row=await e.DB.prepare('SELECT * FROM foama_push_subscriptions WHERE id=?').bind(id).first();assert.ok(!JSON.stringify(row).includes(token));assert.equal((await openPush(row.sealed,id,e.PUSH_STORAGE_KEY)).transport,'fcm');
  assert.equal((await pushApi(request('/api/push/subscriptions/'+id,'GET',null,'z'.repeat(32)),e,now)).status,410);
  const changed={...data,registrationToken:token+'B'};assert.equal((await pushApi(request('/api/push/subscriptions/'+id,'PUT',changed),e,now+1)).status,200);
  row=await e.DB.prepare('SELECT * FROM foama_push_subscriptions WHERE id=?').bind(id).first();assert.equal((await openPush(row.sealed,id,e.PUSH_STORAGE_KEY)).registrationToken,changed.registrationToken);
  const expiry=row.expires;assert.equal((await pushApi(request('/api/push/subscriptions/'+id,'PUT',{...changed,renew:false}),e,now+86400000)).status,200);assert.equal((await e.DB.prepare('SELECT * FROM foama_push_subscriptions WHERE id=?').bind(id).first()).expires,expiry);
  let delivered;const tested=await pushApi(request('/api/push/subscriptions/'+id+'/test','POST',{}),e,now+2,{nativeSender:async(t,p)=>{delivered={t,p};return {ok:true};}});assert.equal(tested.status,200);assert.equal(delivered.t,changed.registrationToken);assert.equal(delivered.p.tag,'foama-wien-test');
  e.PUSH_SCHEDULER_ENABLED='false';assert.equal((await pushApi(request('/api/push/subscriptions/'+id,'DELETE'),e,now+3)).status,200);assert.equal((await pushApi(request('/api/push/subscriptions/'+id,'GET'),e,now+4)).status,410);
 }finally{e.DB.close();}
});
test('official disruption dispatch applies the same relevance, deduplication and limits to native devices',async()=>{
 const e=env();let delivered=0;try{
  await pushApi(request('/api/push/subscriptions','POST',data),e,now);
  const feed={data:{trafficInfoCategories:[{id:2,name:'stoerunglang'}],trafficInfos:[{name:'u6-test',refTrafficInfoCategoryId:2,title:'U6: Verzögerungen',relatedLines:['U6']},{name:'other',refTrafficInfoCategoryId:2,title:'U1: Verzögerungen',relatedLines:['U1']}]}};
  const options={now,fetcher:async()=>Response.json(feed),nativeSender:async(t,p)=>{assert.equal(t,token);assert.ok(p.body.includes('U6'));assert.ok(!p.body.includes('U1'));delivered++;return {ok:true};}};
  await dispatchDisruptions(e,options);await dispatchDisruptions(e,{...options,now:now+31*60000});assert.equal(delivered,1);
 }finally{e.DB.close();}
});
