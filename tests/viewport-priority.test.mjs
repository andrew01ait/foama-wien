import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleStationIds,bindStationViewport} from '../pwa/src/station-viewport.mjs';
import {selectStopIds} from '../pwa/src/station-catalog.mjs';

const card=(id,top,bottom,left=0,right=320)=>({dataset:{stationId:id},getBoundingClientRect:()=>({top,bottom,left,right,width:right-left,height:bottom-top})});
test('viewport includes actually intersecting station cards, deduplicates favorites and excludes offscreen/hidden cards',()=>{
 const root={querySelectorAll:()=>[card('above',-500,-1),card('visible',100,600),card('partial',700,1000),card('below',850,1100),card('visible',20,50),card('hidden',0,0),card('right',0,500,400,800)]};
 assert.deepEqual([...visibleStationIds(root,{width:320,height:800})],['visible','partial']);
});
test('a visible bus station takes priority over an expanded offscreen metro station without changing order or the 24-platform cap',()=>{
 const stops=Array.from({length:30},(_,i)=>({id:'metro'+i,provider:'wl',rbl:[''+(1000+i)],platforms:[{id:''+(1000+i),modes:['metro']}]}));
 const bus={id:'visible-bus',provider:'wl',rbl:['8001','8002'],platforms:[{id:'8001',modes:['bus']},{id:'8002',modes:['bus']}]};stops.push(bus);
 const ids=selectStopIds(stops,{modes:{}},24,0,new Set(['metro0']),new Set([bus.id]));assert.deepEqual(ids.slice(0,2),bus.rbl);assert.equal(ids.length,24);assert.equal(new Set(ids).size,24);assert.equal(stops[0].id,'metro0');
});
test('scroll events coalesce and unchanged visibility never triggers repeated refreshes; cleanup cancels pending work',()=>{
 const events=new Map(),timers=new Map();let next=0,calls=0,top=100;
 const window={innerWidth:320,innerHeight:800,addEventListener:(k,v)=>events.set(k,v),removeEventListener:k=>events.delete(k),setTimeout:f=>{timers.set(++next,f);return next;},clearTimeout:k=>timers.delete(k)};
 const root={querySelectorAll:()=>[card('station',top,top+100)]};const viewport=bindStationViewport(root,()=>calls++,{window});
 for(let i=0;i<100;i++)events.get('scroll')();assert.equal(timers.size,1);for(const fn of [...timers.values()])fn();timers.clear();assert.equal(calls,1);
 events.get('scroll')();for(const fn of [...timers.values()])fn();timers.clear();assert.equal(calls,1);
 top=1000;events.get('scroll')();for(const fn of [...timers.values()])fn();timers.clear();assert.equal(calls,2);
 events.get('scroll')();viewport.stop();assert.equal(timers.size,0);assert.equal(events.size,0);
});
