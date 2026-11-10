import test from 'node:test';
import assert from 'node:assert/strict';
import {localD1} from '../site/local-d1.mjs';
import {sealPush,openPush,pushHash} from '../cloudflare/src/push-crypto.mjs';
import {enqueuePush,drainPushOutbox,verifyPushEvent,purgeOutbox} from '../cloudflare/src/push-outbox.mjs';
import {pushFingerprint} from '../pwa/src/push-policy.mjs';
const now=Date.parse('2026-11-09T12:00Z');
const notice={category:'stoerunglang',lines:['U6'],stops:[],title:'U6: Unterbrechung',description:'Betrieb unterbrochen'};
async function fixture(){
 const env={DB:localD1(),PUSH_STORAGE_KEY:Buffer.alloc(32,7).toString('base64url')},record={id:'a'.repeat(32),expires:now+86400000};
 const value={transport:'web',protocol:2,preferences:{scope:'all',quiet:false},targets:[],subscription:{endpoint:'https://fcm.googleapis.com/fcm/send/TEST_ONLY'}};
 const sealed=await sealPush(value,record.id,env.PUSH_STORAGE_KEY);
 await env.DB.prepare('INSERT INTO foama_push_subscriptions (id,auth_hash,endpoint_hash,sealed,expires) VALUES (?,?,?,?,?)').bind(record.id,'secret-hash','endpoint-hash',sealed,record.expires).run();
 const hashes=[await pushHash(pushFingerprint(notice))],job=await enqueuePush(env,record,{hashes},now),feed={checkedAt:now,notices:[notice]};
 return {env,record,value,job,feed,hashes,read:()=>env.DB.prepare('SELECT * FROM foama_push_outbox WHERE id=?').bind(job.id).first(),close:()=>env.DB.close()};
}
test('outbox persists a unique encrypted device/event and never resends provider-accepted work without a receipt',async()=>{
 const f=await fixture();try{
  const again=await enqueuePush(f.env,f.record,{hashes:f.hashes},now+1);assert.equal(again.id,f.job.id);
  // Random encoded ciphertext can contain short line names by chance. Verify
  // the authenticated encrypted record itself, rather than searching its text.
  assert.deepEqual(await openPush(f.job.sealed,f.job.id,f.env.PUSH_STORAGE_KEY),{hashes:f.hashes,test:false});
  await assert.rejects(openPush(f.job.sealed,'different-event',f.env.PUSH_STORAGE_KEY));
  let calls=0;const deliver=async(v,p)=>{calls++;assert.equal(p.format,'foama-push-v2');assert.equal(p.deviceId,f.record.id);assert.equal(p.eventId,f.job.id);return {ok:true};};
  assert.equal((await drainPushOutbox(f.env,{now,feed:f.feed,deliver})).sent,1);
  assert.equal((await f.read()).status,'accepted');assert.equal((await f.read()).shown_at,0);
  await drainPushOutbox(f.env,{now:now+3600000,feed:{...f.feed,checkedAt:now+3600000},deliver});assert.equal(calls,1);
 }finally{f.close();}
});
test('transient failures have at most four attempts and Retry-After is retained across maintenance runs',async()=>{
 const f=await fixture();try{
  let calls=0,waits=0;const deliver=async()=>{calls++;return {ok:false,status:429,retryAfterMs:600000};};
  await drainPushOutbox(f.env,{now,feed:f.feed,deliver,wait:async()=>waits++});assert.equal(calls,1);assert.equal(waits,0);assert.equal((await f.read()).next_attempt,now+600000);
  await drainPushOutbox(f.env,{now:now+500000,feed:{...f.feed,checkedAt:now+500000},deliver});assert.equal(calls,1);
  for(let i=1;i<=4;i++)await drainPushOutbox(f.env,{now:now+i*600000,feed:{...f.feed,checkedAt:now+i*600000},deliver});
  assert.equal(calls,4);assert.equal((await f.read()).status,'failed');
 }finally{f.close();}
});
test('concurrent recovery runs atomically claim a queued event once',async()=>{
 const f=await fixture();try{let calls=0;const options={now,feed:f.feed,deliver:async()=>{calls++;await new Promise(setImmediate);return {ok:true};}};
  await Promise.all([drainPushOutbox(f.env,options),drainPushOutbox(f.env,options)]);assert.equal(calls,1);assert.equal((await f.read()).attempts,1);
 }finally{f.close();}
});
test('short retries can recover within one bounded run; no longer relevant events are suppressed before send/display',async()=>{
 const f=await fixture();try{
  let calls=0;await drainPushOutbox(f.env,{now,feed:f.feed,wait:async()=>{},deliver:async()=>({ok:++calls===3,status:calls===3?201:503})});assert.equal(calls,3);const job=await f.read();assert.equal(job.attempts,3);
  const record=await f.env.DB.prepare('SELECT * FROM foama_push_subscriptions WHERE id=?').bind(f.record.id).first();
  assert.equal((await verifyPushEvent(f.env,record,job,{now:now+3000,feed:{checkedAt:now+3000,notices:[]}})).relevant,false);
  assert.equal((await verifyPushEvent(f.env,record,job,{now:now+3000,feed:{...f.feed,checkedAt:now+3000}})).relevant,true);
  assert.equal((await verifyPushEvent(f.env,record,job,{now:job.valid_until,feed:{...f.feed,checkedAt:job.valid_until}})).relevant,false);
 }finally{f.close();}
});
test('expired, revoked and changed-scope events do not deliver and bounded cleanup removes old queue data',async()=>{
 const f=await fixture();try{
  await f.env.DB.prepare('UPDATE foama_push_subscriptions SET sealed=? WHERE id=?').bind(await sealPush({...f.value,preferences:{scope:'favorites'},targets:[{routes:['U1'],rbl:[]}]},f.record.id,f.env.PUSH_STORAGE_KEY),f.record.id).run();
  let calls=0;await drainPushOutbox(f.env,{now,feed:f.feed,deliver:async()=>{calls++;return {ok:true};}});assert.equal(calls,0);assert.equal((await f.read()).status,'suppressed');
  await purgeOutbox(f.env.DB,now+86400001);assert.equal(await f.read(),null);
 }finally{f.close();}
});
test('test diagnostics remain available for a day while a delayed test is never delivered after a minute',async()=>{
 const f=await fixture();try{
  const job=await enqueuePush(f.env,f.record,{test:true},now);let calls=0;
  await drainPushOutbox(f.env,{now:now+61000,onlyId:job.id,deliver:async()=>{calls++;return {ok:true};}});assert.equal(calls,0);
  await purgeOutbox(f.env.DB,now+61000);const saved=await f.env.DB.prepare('SELECT * FROM foama_push_outbox WHERE id=?').bind(job.id).first();assert.equal(saved.status,'failed');assert.equal(saved.reason,'test-expired');
 }finally{f.close();}
});
