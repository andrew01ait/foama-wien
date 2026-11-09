import test from 'node:test';import assert from 'node:assert/strict';
import {transferRelay,transferHash} from '../cloudflare/src/transfer-relay.mjs';
import {localD1} from '../site/local-d1.mjs';
import {b64urlEncode,encryptTransfer,decryptTransfer,transferFavorites,mergeTransferFavorites,transferLink} from '../pwa/src/transfer.mjs';
const token=()=>b64urlEncode(crypto.getRandomValues(new Uint8Array(24)));
async function setup(direction='to-watch'){
 const db=localD1(),id=token(),read=token(),write=token(),now=Date.now();
 const call=(method,secret,body,time=now,path=id)=>transferRelay(new Request('https://example.test/api/transfer/'+path,{method,headers:{...(secret?{'X-Transfer-Secret':secret}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}),{DB:db},time);
 const create={token:id,readHash:await transferHash(read),writeHash:await transferHash(write),direction};assert.equal((await call('POST',null,create,now,'session')).status,201);
 return {db,id,read,write,call,now,create};
}
test('encrypted relay has isolated read/write capabilities, one upload and immediate ciphertext deletion on receipt',async()=>{
 const s=await setup();try{
 const key=b64urlEncode(crypto.getRandomValues(new Uint8Array(32))),clear={format:'foama-favorites-v1',favorites:[{stopId:'wl:42',route:'46',towards:'Test'}]},encrypted=await encryptTransfer(clear,key);
 assert.equal((await s.call('GET',token())).status,403);assert.equal((await s.call('PUT',s.read,encrypted)).status,403);
 assert.equal((await s.call('PUT',s.write,encrypted)).status,200);assert.equal((await s.call('PUT',s.write,encrypted)).status,409);
 const rows=await s.db.prepare('SELECT * FROM foama_transfers').all();assert.ok(!JSON.stringify(rows).includes('wl:42'));assert.ok(!JSON.stringify(rows).includes(key));
 assert.equal((await (await s.call('GET',s.write)).json()).ciphertext,undefined);
 assert.deepEqual(await decryptTransfer(await (await s.call('GET',s.read)).json(),key),clear);
 await s.call('DELETE',s.read);const done=await (await s.call('GET',s.read)).json();assert.equal(done.status,'done');assert.equal(done.ciphertext,undefined);assert.equal((await s.db.prepare('SELECT payload FROM foama_transfers').first()).payload,null);
 assert.equal((await s.call('PUT',s.write,encrypted)).status,409);
 }finally{s.db.close();}
});
test('ten-minute expiry is fixed at creation, rejects all late access and purges the stored row',async()=>{
 const s=await setup('to-phone');try{const data={iv:'a'.repeat(16),ciphertext:'b'.repeat(24)};assert.equal((await s.call('PUT',s.write,data,s.now+599000)).status,200);assert.equal((await s.call('GET',s.read,null,s.now+600001)).status,410);assert.equal((await s.db.prepare('SELECT count(*) AS n FROM foama_transfers').first()).n,0);}finally{s.db.close();}
});
test('invalid envelopes and parallel uploads never overwrite an accepted payload',async()=>{
 const s=await setup();try{
 assert.equal((await s.call('PUT',s.write,{iv:'a',ciphertext:'b'})).status,400);
 assert.equal((await s.call('PUT',s.write,{iv:'a'.repeat(16),ciphertext:'b'.repeat(24),key:'secret'})).status,400);
 const results=await Promise.all([s.call('PUT',s.write,{iv:'a'.repeat(16),ciphertext:'c'.repeat(24)}),s.call('PUT',s.write,{iv:'a'.repeat(16),ciphertext:'d'.repeat(24)})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 assert.equal((await s.call('POST',null,s.create,s.now,'session')).status,409);
 }finally{s.db.close();}
});
test('favorites transfer strips unrelated data, preserves existing favorites and validates QR capabilities',()=>{
 const f={stopId:'wl:42',stopName:'Test',route:'46',towards:'A',latitude:48,secret:'unrelated'};
 const safe=transferFavorites({format:'foama-favorites-v1',favorites:[f,f]});assert.equal(safe.length,1);assert.equal(safe[0].latitude,undefined);assert.equal(safe[0].secret,undefined);
 const merged=mergeTransferFavorites([{stopId:'wl:99',route:'U1',towards:'B'}],[f,f]);assert.equal(merged.favorites.length,2);assert.equal(merged.favorites[0].stopId,'wl:99');assert.equal(merged.added,1);
 assert.throws(()=>transferFavorites({format:'other-app',favorites:[f]}));assert.throws(()=>transferFavorites({favorites:[{stopId:42}]}));
 const session=token(),auth=token(),key=b64urlEncode(new Uint8Array(32));assert.equal(transferLink('#session='+session+'&key='+key+'&auth='+auth+'&action=upload').action,'upload');assert.throws(()=>transferLink('#session='+session+'&key='+key));
});
test('route capability is explicit for a new watch while legacy sessions continue returning no route support',async()=>{
 const old=await setup();try{assert.deepEqual((await (await old.call('GET',old.write)).json()).capabilities,[]);}finally{old.db.close();}
 const db=localD1(),id=token(),read=token(),write=token(),now=Date.now();try{
 const value={token:id,readHash:await transferHash(read),writeHash:await transferHash(write),direction:'to-watch',capabilities:['journey-favorites-v1','journey-alternatives-v1','unknown']};
 const create=await transferRelay(new Request('https://example.test/api/transfer/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)}),{DB:db},now);assert.equal(create.status,201);
 const response=await transferRelay(new Request('https://example.test/api/transfer/'+id,{headers:{'X-Transfer-Secret':write}}),{DB:db},now);assert.deepEqual((await response.json()).capabilities,['journey-favorites-v1','journey-alternatives-v1']);
 await db.prepare('UPDATE foama_transfers SET capabilities=?').bind('journey-favorites-v1').run();const legacy=await transferRelay(new Request('https://example.test/api/transfer/'+id,{headers:{'X-Transfer-Secret':write}}),{DB:db},now);assert.deepEqual((await legacy.json()).capabilities,['journey-favorites-v1']);
 }finally{db.close();}
});
