import test from 'node:test';import assert from 'node:assert/strict';
import {createVehicleTracker} from '../pwa/src/vehicle-tracker.mjs';
import {serviceDayStart} from '../pwa/src/timetable.mjs';
function scenario(){
 const day='2026-11-11',seconds=9*3600,start=serviceDayStart(day)+seconds*1000;
 const d={id:'test',route:'U6',mode:'metro',towards:'Ziel',monitorDirection:'H',stops:Array.from({length:6},(_,i)=>({id:String(i),name:'Stop '+i,rbl:String(i+1)})),trips:[0,120].map((offset,k)=>({ref:String(k+1).repeat(16),service:0,towards:'Ziel',times:Array.from({length:6},(_,i)=>[seconds+offset+i*60,seconds+offset+i*60])}))};
 const tracker=createVehicleTracker(d,{validFrom:day,validThrough:day,services:[[day]]});
 function snapshot(delta,{old=true,newer=true,onlyIndex=null}={}){const at=start+delta,rows=[];for(const offset of [0,120]){if(offset===0&&!old||offset===120&&!newer)continue;for(let i=0;i<6;i++){const actual=start+120000+i*60000,scheduled=start+offset*1000+i*60000;if(actual<at-30000||onlyIndex!==null&&i!==onlyIndex)continue;rows.push({index:i,rbl:String(i+1),scheduled,actual,towards:'ziel',at,onStop:false,key:String(i+1)+'|'+scheduled});}}return {at,rows,coverage:[0,1,2,3,4,5],expected:6,complete:true};}
 tracker.ingest(snapshot(150000));tracker.ingest(snapshot(180000));const initial=tracker.view(start+180000),older=initial.tracks.find(t=>t.schedule.ref==='1'.repeat(16)),newer=initial.tracks.find(t=>t.schedule.ref==='2'.repeat(16));assert.ok(older.position);assert.ok(newer.position);
 return {tracker,start,snapshot,older,newer};
}
test('a held position disappears when a confirmed later vehicle passes it on the same station sequence',()=>{
 const s=scenario();s.tracker.ingest(s.snapshot(210000,{old:false}));const v=s.tracker.view(s.start+210000),lost=v.tracks.find(t=>t.id===s.older.id);assert.equal(lost.position,null);assert.equal(lost.retired,true);assert.match(lost.status,/Folgefahrt/);assert.ok(v.tracks.find(t=>t.id===s.newer.id).position);assert.equal(v.events.filter(e=>e.kind==='superseded').length,1);assert.equal(s.tracker.view(s.start+211000).events.filter(e=>e.kind==='superseded').length,1);
});
test('two currently confirmed vehicles remain visible even when their estimates overlap',()=>{
 const s=scenario();s.tracker.ingest(s.snapshot(210000));assert.equal(s.tracker.view(s.start+210000).tracks.filter(t=>t.position).length,2);assert.equal(s.tracker.view(s.start+210000).events.some(e=>e.kind==='superseded'),false);
});
test('a fresh earlier vehicle cannot remove a missing later vehicle merely by appearing ahead of it',()=>{
 const s=scenario();s.tracker.ingest(s.snapshot(210000,{newer:false}));const v=s.tracker.view(s.start+210000);assert.equal(v.tracks.find(t=>t.id===s.newer.id).position.basis,'held');assert.equal(v.events.some(e=>e.kind==='superseded'),false);
});
test('one shared fresh station is insufficient to retire another vehicle',()=>{
 const s=scenario();s.tracker.ingest(s.snapshot(210000,{old:false,onlyIndex:1}));const v=s.tracker.view(s.start+210000);assert.equal(v.tracks.find(t=>t.id===s.older.id).position.basis,'held');assert.equal(v.events.some(e=>e.kind==='superseded'),false);
});
test('a source outage cannot supply evidence of one vehicle passing another',()=>{
 const s=scenario();s.tracker.fail('offline');const v=s.tracker.view(s.start+210000);assert.equal(v.tracks.filter(t=>t.position?.basis==='held').length,2);assert.equal(v.events.some(e=>e.kind==='superseded'),false);
});
test('a retired identity needs renewed independent sources before a position is shown again',()=>{
 const s=scenario();s.tracker.ingest(s.snapshot(210000,{old:false}));assert.equal(s.tracker.view(s.start+210000).tracks.find(t=>t.id===s.older.id).position,null);
 s.tracker.ingest(s.snapshot(240000));assert.equal(s.tracker.view(s.start+240000).tracks.find(t=>t.id===s.older.id).position,null);
 s.tracker.ingest(s.snapshot(270000));const resumed=s.tracker.view(s.start+270000).tracks.find(t=>t.id===s.older.id);assert.ok(resumed.position);assert.equal(resumed.retired,false);
});
