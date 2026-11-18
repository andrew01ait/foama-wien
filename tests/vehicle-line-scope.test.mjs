import test from 'node:test';import assert from 'node:assert/strict';
import {createVehicleLineScope} from '../pwa/src/vehicle-line-scope.mjs';
import {createVehicleTracker} from '../pwa/src/vehicle-tracker.mjs';
import {nextVehicleArrival} from '../pwa/src/vehicle-arrival.mjs';
import {serviceDayStart} from '../pwa/src/timetable.mjs';

const route=count=>({stops:Array.from({length:count},(_,i)=>({id:'s'+i,name:'Halt '+i,rbl:String(i+1)}))});
test('a short line keeps every board in every request regardless of the chosen station',()=>{
 const d=route(22),scope=createVehicleLineScope(d,{focusStop:'s18'}),all=d.stops.map(s=>s.rbl);
 for(const stop of ['s1','s20',null]){scope.prioritize(stop);for(let n=0;n<3;n++){assert.deepEqual(scope.ids(),all);scope.started(scope.ids());}}
});
test('a selected area gets initial confirmation priority without starving the rest of a long line',()=>{
 const d=route(35),scope=createVehicleLineScope(d,{focusStop:'s30',now:()=>100000}),preferred=[...scope.ids()];assert.ok(preferred.includes('31'));assert.ok(preferred.length<=24);
 scope.started(preferred);scope.received(preferred,10000);assert.deepEqual(scope.ids(),preferred);scope.started(preferred);scope.received(preferred,41000);
 const other=[...scope.ids()];assert.notDeepEqual(other,preferred);scope.started(other);assert.deepEqual(scope.ids(),preferred);scope.started(preferred);assert.deepEqual(scope.ids(),other);
 assert.deepEqual(new Set([...other,...preferred]),new Set(d.stops.map(s=>s.rbl)));
 scope.prioritize('s2');assert.ok(scope.ids().includes('3'));assert.ok(scope.ids().length<=24);
});
function fixture(){
 const day='2026-11-11',seconds=9*3600,start=serviceDayStart(day)+seconds*1000,d={...route(6),id:'line',route:'U6',mode:'metro',monitorDirection:'H',trips:[{ref:'a'.repeat(16),service:0,times:[[seconds,seconds],[seconds+90,seconds+90],[seconds+180,seconds+180],null,null,null]},{ref:'b'.repeat(16),service:0,times:[null,null,null,[seconds,seconds],[seconds+90,seconds+90],[seconds+180,seconds+180]]}]},m={validFrom:day,validThrough:day,services:[[day]]};
 const snapshot=(offset,indices)=>({at:start+offset,requested:indices,complete:true,expected:indices.length,coverage:indices,rows:indices.map(index=>({index,rbl:String(index+1),scheduled:start+(index%3)*90000,actual:start+(index%3)*90000,at:start+offset,onStop:false,key:(index+1)+'|'+(start+(index%3)*90000)}))});
 const tracker=createVehicleTracker(d,m,{fullLine:true});return {start,d,m,snapshot,tracker};
}
test('querying another section preserves earlier vehicles, board forecasts and their actual timestamps',()=>{
 const f=fixture(),a=[0,1,2],b=[3,4,5];f.tracker.ingest(f.snapshot(0,a));f.tracker.ingest(f.snapshot(31000,a));const original=f.tracker.view(f.start+31000).tracks.find(t=>t.position);
 f.tracker.ingest(f.snapshot(40000,b));const first=f.tracker.view(f.start+40000),kept=first.tracks.find(t=>t.id===original.id);assert.ok(kept.position.progress>original.position.progress);assert.equal(kept.position.stale,false);assert.notEqual(kept.position.basis,'held');assert.equal(kept.lastSeen,f.start+31000);assert.equal(first.rows.find(r=>r.index===0).at,f.start+31000);assert.equal(first.coverage.length,6);assert.equal(first.expected,6);
 const future=first.tracks.find(t=>t.id!==original.id);assert.equal(future.hits,1);assert.equal(future.position,null,'another section is not a second sample for its new vehicle');
 f.tracker.ingest(f.snapshot(50000,b));const confirmed=f.tracker.view(f.start+50000);assert.equal(confirmed.tracks.filter(t=>t.position).length,2);assert.ok(nextVehicleArrival(confirmed,f.d,'s4',f.start+50000));
});
test('cached or overlapping section replies cannot count old evidence twice or reset newer observations',()=>{
 const f=fixture(),a=[0,1,2];f.tracker.ingest(f.snapshot(0,a));f.tracker.ingest(f.snapshot(31000,a));const before=f.tracker.view(f.start+31000).tracks[0];
 f.tracker.ingest(f.snapshot(31000,[1,2]));assert.equal(f.tracker.view(f.start+31000).tracks[0].hits,before.hits);
 f.tracker.ingest(f.snapshot(50000,[3,4,5]));assert.equal(f.tracker.ingest(f.snapshot(31000,a)).ignored,true);assert.equal(f.tracker.view(f.start+50000).tracks.find(t=>t.id===before.id).lastSeen,f.start+31000);
});
test('a valid earlier source from a new section is retained without rolling the global clock backwards',()=>{
 const f=fixture();f.tracker.ingest(f.snapshot(31000,[0,1,2]));f.tracker.ingest(f.snapshot(20000,[3,4,5]));const view=f.tracker.view(f.start+31000);assert.equal(view.at,f.start+31000);assert.equal(view.rows.find(r=>r.index===3).at,f.start+20000);assert.equal(view.tracks.find(t=>t.anchors.has(3)).hits,1);
});
test('section data ages independently and an actually missing queried board still stops its vehicles',()=>{
 const f=fixture(),a=[0,1,2],b=[3,4,5];for(const offset of [0,31000])f.tracker.ingest(f.snapshot(offset,a));for(const offset of [40000,50000])f.tracker.ingest(f.snapshot(offset,b));
 const missing={...f.snapshot(61000,a),rows:[],coverage:[],complete:false};f.tracker.ingest(missing);const view=f.tracker.view(f.start+61000),lost=view.tracks.find(t=>t.anchors.has(0)),kept=view.tracks.find(t=>t.anchors.has(3));assert.equal(lost.position.basis,'held');assert.notEqual(kept.position.basis,'held');assert.equal(view.rows.some(r=>r.index===0),false);assert.equal(view.rows.find(r=>r.index===3).at,f.start+50000);
 const stale=f.tracker.view(f.start+112000);assert.equal(stale.rows.length,0);assert.equal(stale.coverage.length,0);assert.equal(stale.tracks.find(t=>t.id===kept.id).position.basis,'held');assert.equal(f.tracker.view(f.start+140001).tracks.find(t=>t.id===kept.id).position,null);
});
