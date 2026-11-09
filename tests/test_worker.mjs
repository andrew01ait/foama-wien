import test from 'node:test';import assert from 'node:assert/strict';
import worker,{TransferRoom} from '../cloudflare/src/index.js';
class FakeStorage{constructor(){this.values=new Map();}async put(k,v){this.values.set(k,v);}async get(k){return this.values.get(k);}async setAlarm(v){this.alarm=v;}async deleteAll(){this.values.clear();}}
test('QR transfer: create, ciphertext upload, poll, consume once',async()=>{
 const room=new TransferRoom({storage:new FakeStorage()},{});
 let r=await room.fetch(new Request('https://room.local/create',{method:'POST'}));assert.equal(r.status,201);
 r=await room.fetch(new Request('https://room.local/create',{method:'POST'}));assert.equal(r.status,409);
 r=await room.fetch(new Request('https://room.local/payload'));assert.deepEqual(await r.json(),{status:'waiting'});
 const payload={iv:'a'.repeat(16),ciphertext:'b'.repeat(25)};
 r=await room.fetch(new Request('https://room.local/payload',{method:'PUT',body:JSON.stringify(payload)}));assert.equal(r.status,200);
 r=await room.fetch(new Request('https://room.local/payload'));assert.deepEqual(await r.json(),{status:'ready',...payload});
 r=await room.fetch(new Request('https://room.local/payload',{method:'PUT',body:JSON.stringify(payload)}));assert.equal(r.status,409);
 r=await room.fetch(new Request('https://room.local/payload',{method:'DELETE'}));assert.equal(r.status,200);
 r=await room.fetch(new Request('https://room.local/payload'));assert.equal(r.status,410);
});
test('proxy rejects outside origins and bad stop IDs without contacting provider',async()=>{
 const env={ASSETS:{fetch:()=>new Response('static')}};const ctx={waitUntil() {}};
 const origin='https://foama.example';
 let r=await worker.fetch(new Request(origin+'/api/monitor?stopId=javascript'),env,ctx);assert.equal(r.status,400);
 r=await worker.fetch(new Request(origin+'/api/monitor?stopId=4116',{headers:{Origin:'https://attacker.example'}}),env,ctx);assert.equal(r.status,403);
 r=await worker.fetch(new Request(origin+'/unknown'),env,ctx);assert.equal(await r.text(),'static');
});
test('expired room is not readable and can be reused',async()=>{
 const storage=new FakeStorage();const room=new TransferRoom({storage},{});await room.fetch(new Request('https://room.local/create',{method:'POST'}));const value=await storage.get('value');await storage.put('value',{...value,expires:Date.now()-1});
 let r=await room.fetch(new Request('https://room.local/payload'));assert.equal(r.status,410);r=await room.fetch(new Request('https://room.local/create',{method:'POST'}));assert.equal(r.status,201);
});
