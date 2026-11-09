import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocationController} from '../pwa/src/location.mjs';
import {motionSample,motionQuiet,stillPosition,mayRest} from '../pwa/src/motion-state.mjs';
import {mergeSettings} from '../pwa/src/core.mjs';

const epoch=1794050000000;
const vector={x:0,y:0,z:9.81};
const fix=(timestamp,extra={})=>({lat:48.2081,lon:16.3717,accuracy:12,timestamp,speed:0,...extra});
function quietFor(duration){let motion={};for(let ms=0;ms<=duration;ms+=500)motion=motionSample(motion,vector,epoch+ms);return motion;}

test('quiet sensors alone never prove stillness; cached, coarse or moving fixes cannot enable a pause',()=>{
 const motion=quietFor(60_000),end=epoch+60_000;
 assert.equal(motionQuiet(motion,end),true);assert.equal(mayRest(motion,{},end),false);
 const first=stillPosition({},fix(epoch),epoch);
 const stable=stillPosition(first,fix(end),end);
 assert.equal(mayRest(motion,stable,end),true);
 for(const bad of [fix(epoch),fix(end,{accuracy:600}),fix(end,{speed:8}),fix(end,{lat:48.212})]){
  assert.equal(mayRest(motion,stillPosition(first,bad,end),end),false);
 }
 assert.equal(motionQuiet(motion,end+3001),false);
 assert.equal(motionQuiet(motionSample(motion,{x:null,y:0,z:9.81},end),end),false);
});
test('acceleration, rotating the phone, sensor gaps and recent vehicle speed prevent false stillness',()=>{
 const motion=quietFor(60_000),end=epoch+60_000;
 assert.equal(motionQuiet(motionSample(motion,{x:9.81,y:0,z:0},end),end),false);
 assert.equal(motionQuiet(motionSample(motion,vector,end+4000),end+4000),false);
 let position=stillPosition({},fix(epoch,{speed:10}),epoch);
 position=stillPosition(position,fix(epoch+10_000),epoch+10_000);
 position=stillPosition(position,fix(epoch+70_000),epoch+70_000);
 assert.equal(mayRest(quietFor(70_000),position,epoch+70_000),false);
 assert.equal(mergeSettings({}).motionBatterySaving,false);
});

function fixture({optIn=true,supported=true,sensorError='',permission='granted'}={}){
 let time=epoch,nextTimer=0;const timers=new Map(),calls=[],cleared=[],sensors=[],battery=[],positions=[];
 const doc={hidden:false,permissionsPolicy:{allowsFeature:()=>true}};
 const win={isSecureContext:true};win.top=win.self=win;
 if(supported)win.Accelerometer=class{
  constructor(options){if(sensorError){const error=Error();error.name=sensorError;throw error;}this.options=options;sensors.push(this);}
  start(){this.started=true;}stop(){this.stopped=true;}
 };
 const nav={permissions:{query:async()=>({state:permission})},geolocation:{
  watchPosition(success,error,options){calls.push({success,error,options});return calls.length;},clearWatch:id=>cleared.push(id)
 }};
 const control=createLocationController({nav,doc,win,batterySaving:optIn,now:()=>time,
  setTimer:(fn,delay)=>{timers.set(++nextTimer,{fn,at:time+delay});return nextTimer;},clearTimer:id=>timers.delete(id),
  onBatteryState:value=>battery.push(value),onPosition:value=>positions.push(value)});
 function advance(ms){const target=time+ms;for(;;){const entry=[...timers].filter(([,timer])=>timer.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;const [id,timer]=entry;time=timer.at;timers.delete(id);timer.fn();}time=target;}
 function reading(sample=vector){const sensor=sensors.at(-1);if(sensor&&!sensor.stopped){Object.assign(sensor,sample);sensor.onreading();}}
 function gps(extra={}){const point=fix(time,extra);calls.at(-1).success({timestamp:point.timestamp,coords:{latitude:point.lat,longitude:point.lon,accuracy:point.accuracy,speed:point.speed}});}
 function feed(ms,{gpsEvery=0,extra=()=>({})}={}){for(let elapsed=500;elapsed<=ms;elapsed+=500){advance(500);reading();if(gpsEvery&&elapsed%gpsEvery===0)gps(extra(elapsed));}}
 async function reachRest(){await control.init();reading();gps();feed(60_000,{gpsEvery:10_000});assert.equal(battery.at(-1),'resting');}
 return {control,calls,cleared,sensors,battery,positions,timers,doc,advance,reading,gps,feed,reachRest};
}
test('opt-in is required and a new visit never starts sensors or GPS before the location action',async()=>{
 const off=fixture({optIn:false});await off.control.init();assert.equal(off.sensors.length,0);assert.equal(off.timers.size,0);assert.equal(off.calls.length,1);
 const fresh=fixture({permission:'prompt'});await fresh.control.init();assert.equal(fresh.calls.length,0);assert.equal(fresh.sensors.length,0);
 fresh.control.request();assert.equal(fresh.calls.length,1);assert.equal(fresh.sensors.length,1);
 assert.equal(fresh.calls[0].options.enableHighAccuracy,false);assert.equal(fresh.sensors[0].options.frequency,2);
});
test('stable fixes plus quiet sensors suspend the watch and real motion immediately starts a fresh check',async()=>{
 const f=fixture();await f.reachRest();assert.deepEqual(f.cleared,[1]);assert.equal(f.calls.length,1);
 f.reading({x:2,y:0,z:9.81});assert.equal(f.calls.length,2);assert.equal(f.calls[1].options.maximumAge,0);assert.equal(f.battery.at(-1),'checking');
 f.calls[0].success({timestamp:epoch,coords:{latitude:1,longitude:1,accuracy:1}});
 assert.ok(f.positions.every(p=>p.lat!==1));
});
test('smooth vehicle travel and inaccurate tunnel fixes keep normal monitoring despite quiet sensors',async()=>{
 for(const coarse of [false,true]){
  const f=fixture();await f.control.init();f.reading();f.gps();
  f.feed(180_000,{gpsEvery:10_000,extra:elapsed=>coarse?{accuracy:650,speed:null}:{lat:48.2081+elapsed/1_000_000,speed:null}});
  assert.equal(f.battery.includes('resting'),false);assert.equal(f.cleared.length,0);
 }
});
test('a quiet phone is still rechecked within a minute; stale cached fixes cannot return it to sleep',async()=>{
 const f=fixture();await f.reachRest();f.feed(59_500);assert.equal(f.calls.length,1);
 f.feed(500);assert.equal(f.calls.length,2);assert.equal(f.calls[1].options.maximumAge,0);
 f.gps({timestamp:epoch+60_000});assert.equal(f.battery.at(-1),'checking');assert.equal(f.cleared.length,1);
});
test('fresh safety fixes can retain a quiet session without exceeding the check deadline',async()=>{
 const f=fixture();await f.reachRest();f.feed(60_000);f.gps();assert.equal(f.battery.at(-1),'resting');
 f.feed(60_000);assert.equal(f.calls.length,3);
});
test('a watch that emits no stationary callbacks gets one fresh confirming fix, without repeated polling',async()=>{
 const f=fixture();await f.control.init();f.reading();f.gps();f.feed(60_000);
 assert.equal(f.calls.length,2);assert.equal(f.calls[1].options.maximumAge,0);assert.equal(f.battery.includes('resting'),false);
 f.feed(60_000);assert.equal(f.calls.length,2);
 f.gps();assert.equal(f.battery.at(-1),'checking'); // Two-minute-old evidence is discarded.
 const confirmed=fixture();await confirmed.control.init();confirmed.reading();confirmed.gps();confirmed.feed(60_000);confirmed.gps();
 assert.equal(confirmed.battery.at(-1),'resting');
});
test('missing, denied, failed and silently stopped sensors fall back to normal location updates',async()=>{
 for(const options of [{supported:false},{sensorError:'SecurityError'},{sensorError:'NotAllowedError'}]){
  const f=fixture(options);await f.control.init();assert.equal(f.calls.length,1);assert.equal(f.timers.size,0);
  assert.ok(['unsupported','blocked'].includes(f.battery.at(-1)));
 }
 const failed=fixture();await failed.reachRest();failed.sensors[0].onerror({error:{name:'NotReadableError'}});
 assert.equal(failed.calls.length,2);assert.equal(failed.battery.at(-1),'unavailable');assert.equal(failed.timers.size,0);
 const stalled=fixture();await stalled.reachRest();stalled.advance(4000);
 assert.equal(stalled.calls.length,2);assert.equal(stalled.battery.at(-1),'unavailable');assert.equal(stalled.timers.size,0);
});
test('background, opt-out, manual location and permission denial cancel sensors, watches and all timers',async()=>{
 const f=fixture();await f.reachRest();const oldReading=f.sensors[0].onreading;
 f.doc.hidden=true;f.control.pause();assert.equal(f.timers.size,0);assert.equal(f.sensors[0].stopped,true);
 oldReading();f.advance(120_000);assert.equal(f.calls.length,1);
 f.doc.hidden=false;f.control.resume();assert.equal(f.calls.length,2);assert.equal(f.sensors.length,2);
 f.control.setBatterySaving(false);assert.equal(f.battery.at(-1),'off');assert.equal(f.timers.size,0);assert.equal(f.sensors[1].stopped,true);
 f.control.stop();assert.equal(f.timers.size,0);f.control.resume();assert.equal(f.calls.length,2);
 const denied=fixture();await denied.control.init();denied.calls[0].error({code:1});
 assert.equal(denied.control.enabled,false);assert.equal(denied.sensors[0].stopped,true);assert.equal(denied.timers.size,0);
});
