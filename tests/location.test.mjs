import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocationController,locationMessage} from '../pwa/src/location.mjs';

function fixture(permission='prompt',policy=true){
 const calls=[],states=[],positions=[],cleared=[];
 const doc={hidden:false,permissionsPolicy:{allowsFeature:()=>policy}};
 const win={isSecureContext:true};win.top=win.self=win;
 const nav={permissions:{query:async()=>({state:permission})},geolocation:{
  watchPosition(success,error,options){calls.push({success,error,options});return calls.length;},
  clearWatch:id=>cleared.push(id)
 }};
 const control=createLocationController({nav,doc,win,onState:value=>states.push(value),onPosition:value=>positions.push(value)});
 return {calls,states,positions,cleared,doc,control};
}
test('first visit waits for an explicit location action; that action calls the API synchronously',async()=>{
 const f=fixture();await f.control.init();assert.equal(f.calls.length,0);assert.equal(f.states.at(-1).phase,'ready');
 f.control.request();assert.equal(f.calls.length,1);assert.equal(f.states.at(-1).phase,'requesting');
 assert.equal(f.calls[0].options.enableHighAccuracy,false);
});
test('location callbacks stop in background and resume with one foreground watch',async()=>{
 const f=fixture('granted');await f.control.init();assert.equal(f.calls.length,1);
 const position={coords:{latitude:48.2,longitude:16.3,accuracy:15}};
 f.calls[0].success(position);assert.equal(f.positions.length,1);
 f.doc.hidden=true;f.control.pause();f.calls[0].success(position);assert.equal(f.positions.length,1);
 f.control.resume();assert.equal(f.calls.length,1);
 f.doc.hidden=false;f.control.resume();assert.equal(f.calls.length,2);f.control.resume();assert.equal(f.calls.length,2);
 f.control.stop();f.control.resume();assert.equal(f.calls.length,2);
});
test('denial explains missing permission prompt and never retries on foregrounding',async()=>{
 const f=fixture();await f.control.init();f.control.request();f.calls[0].error({code:1});
 assert.equal(f.states.at(-1).phase,'denied');assert.equal(f.control.enabled,false);
 assert.match(locationMessage(f.states.at(-1)).detail,/Wenn keine Frage erscheint/);
 f.control.resume();assert.equal(f.calls.length,1);assert.deepEqual(f.cleared,[1]);
});
test('a blocked permissions policy is shown without an impossible location request',async()=>{
 const f=fixture('prompt',false);await f.control.init();f.control.request();
 assert.equal(f.calls.length,0);assert.equal(f.states.at(-1).phase,'policy');
 assert.match(locationMessage(f.states.at(-1)).detail,/direkt in Chrome/);
});
test('imprecise positions and timeouts are distinguished from denied permission',async()=>{
 const f=fixture();await f.control.init();f.control.request();
 f.calls[0].success({timestamp:1234,coords:{latitude:48.2,longitude:16.3,accuracy:300,speed:null}});
 assert.equal(f.positions.length,1);assert.equal(f.states.at(-1).phase,'inaccurate');
 assert.equal(f.positions[0].accuracy,300);assert.equal(f.positions[0].timestamp,1234);
 f.calls[0].error({code:3});assert.equal(f.states.at(-1).phase,'timeout');
});
