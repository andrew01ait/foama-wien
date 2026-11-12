import test from 'node:test';import assert from 'node:assert/strict';
import {createVehiclePoller} from '../pwa/src/vehicle-poller.mjs';
import {createVehiclePositionOwner} from '../pwa/src/vehicle-position-owner.mjs?v=0.11.25';
const tick=()=>new Promise(setImmediate);
test('a new position line aborts the old in-flight poll before sending its own; late old replies are ignored',async()=>{
 const active=new Set(),calls=[],replies=new Map(),data=[];let peak=0;
 const fetch=(url,{signal})=>{const line=new URL(url,'https://test/').searchParams.get('stopId');active.add(line);peak=Math.max(peak,active.size);calls.push({line,signal});signal.addEventListener('abort',()=>active.delete(line));return new Promise(resolve=>replies.set(line,()=>{active.delete(line);resolve(Response.json({}));}));};
 const options={storage:null,locks:null,now:()=>100000,visible:()=>true,fetch,onError:assert.fail},a=createVehiclePoller({...options,ids:()=>['1'],onData:()=>data.push('A')}),b=createVehiclePoller({...options,ids:()=>['2'],onData:()=>data.push('B')});
 try{a.start();await tick();assert.equal(calls.length,1);b.start();await tick();assert.equal(a.running(),false);assert.equal(calls[0].signal.aborted,true);assert.deepEqual([...active],['2']);assert.equal(peak,1);replies.get('1')();await tick();assert.deepEqual(data,[]);replies.get('2')();await tick();assert.deepEqual(data,['B']);}finally{a.stop();b.stop();}
});
test('a hidden position view cannot replace the active line or create another request',async()=>{
 let calls=0;const options={storage:null,locks:null,now:()=>100000,onData(){},onError:assert.fail,fetch:async()=>{calls++;return Response.json({});}},a=createVehiclePoller({...options,ids:()=>['1'],visible:()=>true}),b=createVehiclePoller({...options,ids:()=>['2'],visible:()=>false});
 try{a.start();await tick();b.start();await tick();assert.equal(calls,1);assert.equal(a.running(),true);assert.equal(b.running(),false);}finally{a.stop();b.stop();}
});
test('a station panel ownership cancels a full-line poller, and releasing an old owner cannot stop its replacement',async()=>{
 let abort,stopped=0;const p=createVehiclePoller({ids:()=>['1'],storage:null,locks:null,now:()=>100000,visible:()=>true,onData:assert.fail,onError:assert.fail,fetch:(_url,{signal})=>{abort=signal;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted'))));}});
 const panel=createVehiclePositionOwner(()=>stopped++),other=createVehiclePositionOwner(()=>stopped++);
 try{p.start();await tick();panel.claim();assert.equal(abort.aborted,true);assert.equal(p.running(),false);other.claim();assert.equal(stopped,1);panel.release();assert.equal(other.active(),true);assert.equal(panel.active(),false);}finally{p.stop();panel.release();other.release();await tick();}
});
