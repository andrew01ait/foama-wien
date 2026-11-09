import {pushB64} from './web-push.mjs';
import {pushHash,sealPush,openPush} from './push-crypto.mjs';
import {pushPreferences,pushNoticeMatches,pushFingerprint,pushCanSend,pushIsQuiet,pushDay,disruptionPushPayload} from '../../pwa/src/push-policy.mjs';

export const OUTBOX={attempts:4,perDevice:64,batch:32,lifetime:86400000,ttl:300000,testTtl:60000,lease:60000};
const random=()=>pushB64(crypto.getRandomValues(new Uint8Array(24)));
export async function purgeOutbox(db,now){
 await db.prepare('DELETE FROM foama_push_outbox WHERE expires <= ? OR subscription_id NOT IN (SELECT id FROM foama_push_subscriptions)').bind(now).run();
}
export async function enqueuePush(env,record,{hashes=[],test=false}={},now=Date.now()){
 const eventKey=test?'test:'+random():await pushHash([...hashes].sort().join('|'));
 const id=random(),sealed=await sealPush({hashes:[...new Set(hashes)],test},id,env.PUSH_STORAGE_KEY);
 await env.DB.prepare('INSERT OR IGNORE INTO foama_push_outbox (id,subscription_id,event_key,sealed,created,expires,next_attempt,kind) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT count(*) FROM foama_push_outbox WHERE subscription_id=?) < ?')
  .bind(id,record.id,eventKey,sealed,now,Math.min(record.expires,now+OUTBOX.lifetime),now,test?'test':'disruption',record.id,test?OUTBOX.perDevice-8:OUTBOX.perDevice).run();
 return env.DB.prepare('SELECT * FROM foama_push_outbox WHERE subscription_id=? AND event_key=?').bind(record.id,eventKey).first();
}
export async function currentEventNotices(env,job,value,feed,now){
 const queued=await openPush(job.sealed,job.id,env.PUSH_STORAGE_KEY),hashes=new Set(queued.hashes);
 const preferences=pushPreferences(value.preferences),out=[];
 if(!feed||now-feed.checkedAt>120000||feed.checkedAt>now+60000)return out;
 for(const notice of feed.notices){const hash=await pushHash(pushFingerprint(notice));if(hashes.has(hash)&&pushNoticeMatches(notice,value.targets,preferences,now))out.push({notice,hash});}
 return out;
}
export function eventPayload(job,value,notices,now){
 const base=job.kind==='test'?{title:'foama-wien: Testnachricht',body:'Push ist verbunden. Künftig erhältst du passende Betriebsstörungen der Wiener Linien.',tag:'foama-wien-test',url:'/alerts.html'}:disruptionPushPayload(notices.map(n=>n.notice),value.preferences.scope);
 return {...base,format:value.protocol===2?'foama-push-v2':'foama-push-v1',eventId:job.id,deviceId:job.subscription_id,sentAt:now,expiresAt:Math.min(job.expires,job.kind==='test'?job.created+OUTBOX.testTtl:now+OUTBOX.ttl)};
}
// A provider acceptance is terminal, regardless of whether a browser receipt arrives.
export async function drainPushOutbox(env,{now=Date.now(),feed,deliver,ready=()=>true,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),onlyId}={}){
 const jobs=(await env.DB.prepare("SELECT * FROM foama_push_outbox WHERE expires>? AND attempts<? AND next_attempt<=? AND (status='pending' OR (status='sending' AND lease_until<=?)) AND (?='' OR id=?) ORDER BY next_attempt,created,id LIMIT ?")
  .bind(now,OUTBOX.attempts,now,now,onlyId||'',onlyId||'',256).all()).results;
 let sent=0,failed=0,claimed=0;const started=Date.now();
 for(const initial of jobs){let job=initial,at=now;
  for(let immediate=0;immediate<3;immediate++){
   if(Date.now()-started>20000||claimed>=OUTBOX.batch)return {sent,failed};
   if(job.kind==='test'&&job.created+OUTBOX.testTtl<=at){await env.DB.prepare("UPDATE foama_push_outbox SET status='failed',reason='test-expired' WHERE id=? AND status='pending'").bind(job.id).run();break;}
   const record=await env.DB.prepare('SELECT * FROM foama_push_subscriptions WHERE id=? AND expires>?').bind(job.subscription_id,at).first();if(!record)break;
   const value=await openPush(record.sealed,record.id,env.PUSH_STORAGE_KEY);value.preferences=pushPreferences(value.preferences);
   if(!ready(value))break;
   if(job.kind!=='test'&&!pushCanSend(record,value.preferences,at)){
    let next=Math.max(at+60000,record.last_sent+1800000);for(let i=0;i<25&&!pushCanSend(record,value.preferences,next);i++)next+=3600000;
    await env.DB.prepare("UPDATE foama_push_outbox SET next_attempt=? WHERE id=? AND status='pending'").bind(next,job.id).run();break;
   }
   let notices=job.kind==='test'?[]:await currentEventNotices(env,job,value,feed,at);
   if(job.kind!=='test'){
    const history=new Set((await env.DB.prepare('SELECT id FROM foama_push_deliveries WHERE subscription_id=?').bind(record.id).all()).results.map(r=>r.id));
    notices=notices.filter(n=>!history.has(record.id+':'+n.hash));
    if(!notices.length){await env.DB.prepare("UPDATE foama_push_outbox SET status='suppressed',reason='no-longer-relevant' WHERE id=? AND status='pending'").bind(job.id).run();break;}
   }
   const lease=random(),payload=eventPayload(job,value,notices,at);
   const claim=await env.DB.prepare("UPDATE foama_push_outbox SET status='sending',attempts=attempts+1,lease_until=?,lease_token=?,valid_until=?,sent_at=? WHERE id=? AND expires>? AND attempts<? AND next_attempt<=? AND (status='pending' OR (status='sending' AND lease_until<=?))")
    .bind(at+OUTBOX.lease,lease,payload.expiresAt,at,job.id,at,OUTBOX.attempts,at,at).run();if(!claim.meta.changes)break;claimed++;
   let result;try{result=await deliver(value,payload,{now:at,ttl:Math.ceil((payload.expiresAt-at)/1000)});}catch{result={ok:false,status:0};}
   at=Math.max(at,Number(result.responseAt)||at);
   if(result.gone){await env.DB.prepare('DELETE FROM foama_push_deliveries WHERE subscription_id=?').bind(record.id).run();await env.DB.prepare('DELETE FROM foama_push_outbox WHERE subscription_id=?').bind(record.id).run();await env.DB.prepare('DELETE FROM foama_push_subscriptions WHERE id=?').bind(record.id).run();break;}
   if(result.ok){
    await env.DB.prepare("UPDATE foama_push_outbox SET status='accepted',accepted_at=?,lease_until=0,reason='' WHERE id=? AND lease_token=?").bind(at,job.id,lease).run();sent++;
    if(job.kind!=='test'){
     for(const item of notices)await env.DB.prepare('INSERT OR IGNORE INTO foama_push_deliveries (id,subscription_id,created) VALUES (?,?,?)').bind(record.id+':'+item.hash,record.id,at).run();
     const day=pushDay(at);await env.DB.prepare('UPDATE foama_push_subscriptions SET last_sent=?,day_count=CASE WHEN day=? THEN day_count+1 ELSE 1 END,day=?,retry_after=0 WHERE id=?').bind(at,day,day,record.id).run();
     await env.DB.prepare('DELETE FROM foama_push_deliveries WHERE subscription_id=? AND id NOT IN (SELECT id FROM foama_push_deliveries WHERE subscription_id=? ORDER BY created DESC LIMIT 256)').bind(record.id,record.id).run();
    }
    break;
   }
   failed++;const attempts=job.attempts+1,retryable=!result.status||result.status===429||result.status>=500;
   const delay=Math.max(1000,Number(result.retryAfterMs)||0),next=at+delay;
   const retry=retryable&&attempts<OUTBOX.attempts&&next<job.expires;
   await env.DB.prepare('UPDATE foama_push_outbox SET status=?,next_attempt=?,lease_until=0,reason=? WHERE id=? AND lease_token=?').bind(retry?'pending':'failed',next,retryable?'transport-error':'provider-rejected',job.id,lease).run();
   if(!retry||delay>1500||immediate===2)break;
   await wait(delay);at=next;job={...job,attempts,next_attempt:next};
  }
 }
 return {sent,failed};
}

export async function verifyPushEvent(env,record,job,{now,feed}){
 if(record.expires<=now||job.expires<=now||job.valid_until<=now||!['sending','accepted'].includes(job.status))return {relevant:false};
 const value=await openPush(record.sealed,record.id,env.PUSH_STORAGE_KEY);value.preferences=pushPreferences(value.preferences);
 if(job.kind!=='test'&&pushIsQuiet(value.preferences,now))return {relevant:false};
 const notices=job.kind==='test'?[]:await currentEventNotices(env,job,value,feed,now);
 if(job.kind!=='test'&&!notices.length)return {relevant:false};
 return {relevant:true,notification:{...eventPayload(job,value,notices,job.sent_at),expiresAt:job.valid_until}};
}
