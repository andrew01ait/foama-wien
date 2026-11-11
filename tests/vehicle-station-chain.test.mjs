import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {decodeVehiclePilot,normalizePilotSnapshot,createVehicleTracker} from '../pwa/src/vehicle-tracker.mjs';
import {serviceDayStart} from '../pwa/src/timetable.mjs';
const json=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const [recording,manifest]=await Promise.all([json('./fixtures/vehicle-station-live.json'),json('../pwa/data/timetables/wien/manifest.json')]);
test('real U3, tram 49 and bus 48A captures keep temporary IDs while progressing through the station neighbourhood',async()=>{
 for(const c of recording.contexts){const data=await decodeVehiclePilot(await json('../pwa/data/vehicle-pilot/'+c.file)),direction=data.directions.find(d=>d.id===c.direction),tracker=createVehicleTracker(direction,manifest),views=[];
  for(const raw of recording.snapshots){const now=Math.max(Date.parse(raw.foamaMonitorAt),Date.parse(raw.message.serverTime)),snapshot=normalizePilotSnapshot(raw,direction,now,c.ids);assert.equal(snapshot.coverage.length,8);tracker.ingest(snapshot);views.push(tracker.view(now));}
  assert.equal(views[0].tracks.filter(t=>t.position).length,0);const initial=views[1].tracks.find(t=>t.position);assert.ok(initial,c.route+' has a live estimate after two sources');const end=views.at(-1).tracks.find(t=>t.id===initial.id);assert.ok(end?.position,c.route+' retains its ID');assert.ok(end.position.progress>initial.position.progress);
  if(c.mode==='metro')assert.ok(views.at(-1).events.filter(e=>e.kind==='handover').length>=4);else{assert.equal(initial.schedule.inferred,true);assert.match(initial.schedule.key,/^live\|/);}
 }
});
function surface(){
 const day='2026-11-11',seconds=9*3600,start=serviceDayStart(day)+seconds*1000,trip={ref:'a'.repeat(16),service:0,towards:'Ziel',times:[0,1,2,3,4].map(i=>[seconds+i*60,seconds+i*60])};
 const d={id:'surface',route:'48A',mode:'bus',towards:'Ziel',monitorDirection:'H',stops:[0,1,2,3,4].map(i=>({id:String(i),name:'Stop '+i,rbl:String(i+1)})),trips:[trip,{...structuredClone(trip),ref:'b'.repeat(16),times:trip.times.map(p=>p.map(v=>v+600))}]};
 const m={validFrom:day,validThrough:day,services:[[day]]};return {d,m,start,snapshot(delta,{onStop,following=false}={}){const at=start+delta;const rows=[0,1,2,3,4].map(i=>({index:i,rbl:String(i+1),scheduled:start+120000+i*60000,actual:start+120000+i*60000,towards:'ziel',at,onStop:onStop===i,key:String(i+1)+'|'+(start+120000+i*60000)}));if(following)rows.push(...rows.map(r=>({...r,scheduled:r.scheduled+60000,actual:r.actual+60000,key:r.rbl+'|'+(r.scheduled+60000),onStop:false})));return {at,rows,coverage:[0,1,2,3,4],expected:5,complete:true};}};
}
test('surface IDs follow shared live planned anchors rather than selecting the nearest GTFS departure',()=>{
 const s=surface(),tracker=createVehicleTracker(s.d,s.m);tracker.ingest(s.snapshot(120000,{onStop:0}));tracker.ingest(s.snapshot(150000));const first=tracker.view(s.start+150000).tracks.find(t=>t.position);assert.ok(first);assert.equal(first.schedule.inferred,true);assert.match(first.schedule.key,/^live\|/);
 const next=s.snapshot(180000,{onStop:1});next.rows=next.rows.filter(r=>r.index>0);tracker.ingest(next);const after=tracker.view(next.at).tracks.find(t=>t.id===first.id);assert.equal(after.position.station,1);assert.ok(tracker.view(next.at).events.some(e=>e.id===first.id&&e.kind==='handover'));
 tracker.ingest({...s.snapshot(210000),rows:[]});assert.equal(tracker.view(s.start+210000).tracks.find(t=>t.id===first.id).position.basis,'held');tracker.ingest(s.snapshot(240000,{onStop:2}));assert.ok(tracker.view(s.start+240000).tracks.find(t=>t.id===first.id).position);
});
test('ambiguous one-minute surface headways never create ranked vehicle identities',()=>{
 const s=surface(),tracker=createVehicleTracker(s.d,s.m);tracker.ingest(s.snapshot(120000,{following:true}));tracker.ingest(s.snapshot(150000,{following:true}));assert.equal(tracker.view(s.start+150000).tracks.filter(t=>t.position).length,0);
});
test('a surface chain needs three independent station anchors, not just two agreeing boards',()=>{
 const s=surface(),tracker=createVehicleTracker(s.d,s.m);for(const at of [120000,150000]){const snapshot=s.snapshot(at);snapshot.rows=snapshot.rows.slice(0,2);tracker.ingest(snapshot);}assert.equal(tracker.view(s.start+150000).tracks.length,0);
});
test('a shared stop cannot turn another line or transport type into this vehicle',async()=>{
 const c=recording.contexts.find(c=>c.route==='48A'),data=await decodeVehiclePilot(await json('../pwa/data/vehicle-pilot/'+c.file)),d=data.directions.find(d=>d.id===c.direction),raw=structuredClone(recording.snapshots[0]),now=Math.max(Date.parse(raw.foamaMonitorAt),Date.parse(raw.message.serverTime));for(const m of raw.data.monitors)for(const l of m.lines){l.name='49';if(l.departures)for(const dep of l.departures.departure)if(dep.vehicle)dep.vehicle.name='49';}assert.equal(normalizePilotSnapshot(raw,d,now,c.ids).rows.length,0);
 for(const m of raw.data.monitors)for(const l of m.lines){l.name='48A';l.type='ptTram';if(l.departures)for(const dep of l.departures.departure)if(dep.vehicle){dep.vehicle.name='48A';dep.vehicle.type='ptTram';}}assert.equal(normalizePilotSnapshot(raw,d,now,c.ids).rows.length,0);
});

test('real tram 46 boards form live identities when its matching GTFS variant has only off-peak departure slots',async()=>{
 const c=await json('./fixtures/vehicle-tram-46-live.json'),data=await decodeVehiclePilot(await json('../pwa/data/vehicle-pilot/'+c.file)),direction=data.directions.find(d=>d.id===c.direction),tracker=createVehicleTracker(direction,manifest);
 const {pilotSchedules}=await import('../pwa/src/vehicle-tracker.mjs');let view;
 for(let i=0;i<c.snapshots.length;i++){const raw=c.snapshots[i],at=Math.min(Date.parse(raw.foamaMonitorAt),Date.parse(raw.message.serverTime));assert.equal(pilotSchedules(direction,manifest,at).length,0);assert.ok(pilotSchedules(direction,manifest,at,{profiles:true}).length);tracker.ingest(normalizePilotSnapshot(raw,direction,at,c.ids));view=tracker.view(at);if(!i)assert.equal(view.tracks.filter(t=>t.position).length,0);}
 const positioned=view.tracks.filter(t=>t.position);assert.ok(positioned.length);assert.ok(positioned.every(t=>t.schedule.inferred&&t.hits>=2&&t.anchors.size>=3));assert.ok(positioned.some(t=>t.position.progress>0&&t.position.progress<6));
 const at=Math.min(Date.parse(c.snapshots[0].foamaMonitorAt),Date.parse(c.snapshots[0].message.serverTime));assert.equal(pilotSchedules(direction,{...manifest,validThrough:'2026-11-10'},at,{profiles:true}).length,0);
});
test('real tram 46 return-direction boards confirm live estimates on the separate inbound platform sequence',async()=>{
 const c=await json('./fixtures/vehicle-tram-46-return-live.json'),data=await decodeVehiclePilot(await json('../pwa/data/vehicle-pilot/'+c.file)),direction=data.directions.find(d=>d.id===c.direction),tracker=createVehicleTracker(direction,manifest);assert.equal(direction.monitorDirectionId,'2');assert.equal(direction.towards,'Parlament/Volkstheater');let view;
 for(let i=0;i<c.snapshots.length;i++){const raw=c.snapshots[i],at=Math.max(Date.parse(raw.foamaMonitorAt),Date.parse(raw.message.serverTime)),snapshot=normalizePilotSnapshot(raw,direction,at,c.ids);assert.equal(snapshot.coverage.length,8);assert.ok(snapshot.rows.length>20);tracker.ingest(snapshot);view=tracker.view(at);if(!i)assert.equal(view.tracks.filter(t=>t.position).length,0);}
 const positioned=view.tracks.filter(t=>t.position);assert.ok(positioned.length>=2);assert.ok(positioned.every(t=>t.hits>=2&&t.schedule.inferred&&t.anchors.size>=3));assert.ok(positioned.some(t=>t.position.progress>7&&t.position.progress<8));
});
