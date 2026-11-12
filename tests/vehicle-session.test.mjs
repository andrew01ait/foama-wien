import {createVehiclePoller} from '../pwa/src/vehicle-poller.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {createVehicleSession} from '../pwa/src/vehicle-session.mjs';
import {decodeVehiclePilot,normalizePilotSnapshot} from '../pwa/src/vehicle-tracker.mjs';
import {stationVehicleRange,stationVehicleTracks} from '../pwa/src/vehicle-data.mjs';
const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const manifest=await json('../pwa/data/timetables/wien/manifest.json'),recording=await json('./fixtures/vehicle-station-live.json'),context=recording.contexts.find(c=>c.route==='48A'),data=await decodeVehiclePilot(await json('../pwa/data/vehicle-pilot/'+context.file)),direction=data.directions.find(d=>d.id===context.direction),range=stationVehicleRange(direction,context.stopId);
const sourceAt=raw=>Math.min(Date.parse(raw.foamaMonitorAt),Date.parse(raw.message.serverTime));
function harness(){let now=sourceAt(recording.snapshots[0]);const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},options={storage,now:()=>now};return {values,options,setTime:at=>now=at,open:(d=direction,m=manifest)=>createVehicleSession(d,m,options),ingest(session,raw,ids=context.ids){now=sourceAt(raw);return session.tracker.ingest(normalizePilotSnapshot(raw,direction,now,ids));}};}
function confirmed(h){const session=h.open();for(const raw of recording.snapshots)h.ingest(session,raw);return session;}
test('station and whole-line documents restore the same real bus identities and confirmed positions without another source',()=>{
 const h=harness(),station=confirmed(h),before=station.tracker.view(sourceAt(recording.snapshots.at(-1))),ids=stationVehicleTracks(before,range).map(t=>t.id);assert.ok(ids.length);
 station.waiting(27000);const deadline=station.waitingUntil,wholeLine=h.open();assert.equal(wholeLine.waitingUntil,deadline);assert.deepEqual(stationVehicleTracks(wholeLine.tracker.view(sourceAt(recording.snapshots.at(-1))),range).map(t=>t.id),ids);assert.deepEqual(wholeLine.tracker.checkpoint().samples,station.tracker.checkpoint().samples);
 const restored=wholeLine.tracker.view(sourceAt(recording.snapshots.at(-1)));assert.deepEqual(restored.tracks.map(t=>[t.id,t.hits]),before.tracks.map(t=>[t.id,t.hits]));assert.deepEqual(restored.events,before.events);
 assert.equal(h.ingest(wholeLine,recording.snapshots.at(-1)).ignored,true);assert.deepEqual(wholeLine.tracker.view(sourceAt(recording.snapshots.at(-1))).tracks.map(t=>[t.id,t.hits]),before.tracks.map(t=>[t.id,t.hits]));
 const returned=h.open();assert.deepEqual(stationVehicleTracks(returned.tracker.view(sourceAt(recording.snapshots.at(-1))),range).map(t=>t.id),ids);assert.equal(returned.waitingUntil,deadline);
});
test('navigation after the first observation retains it but cannot turn a cached repeat into confirmation',()=>{
 const h=harness(),first=h.open();h.ingest(first,recording.snapshots[0]);const original=first.tracker.view(sourceAt(recording.snapshots[0]));assert.ok(original.tracks.length);assert.ok(original.tracks.every(t=>t.hits===1&&!t.position));
 const second=h.open();assert.equal(h.ingest(second,recording.snapshots[0]).ignored,true);const repeated=second.tracker.view(sourceAt(recording.snapshots[0]));assert.deepEqual(repeated.tracks.map(t=>[t.id,t.hits]),original.tracks.map(t=>[t.id,t.hits]));assert.ok(repeated.tracks.every(t=>!t.position));
});
test('a page resumed from back-forward cache adopts newer evidence and deadlines from the intervening page',()=>{
 const h=harness(),oldPage=h.open();h.ingest(oldPage,recording.snapshots[0]);const other=h.open();for(const raw of recording.snapshots.slice(1))h.ingest(other,raw);other.waiting(29000);
 assert.equal(oldPage.refresh(),true);const now=sourceAt(recording.snapshots.at(-1));assert.deepEqual(oldPage.tracker.view(now).tracks.map(t=>[t.id,t.hits]),other.tracker.view(now).tracks.map(t=>[t.id,t.hits]));assert.equal(oldPage.waitingUntil,other.waitingUntil);assert.equal(oldPage.refresh(),false);
});
test('restoration preserves source age, gray grace and expiry instead of refreshing evidence',()=>{
 const h=harness(),initial=confirmed(h),last=sourceAt(recording.snapshots.at(-1));initial.tracker.view(last);initial.checkpoint();h.setTime(last+61000);const gray=h.open(),state=gray.tracker.view(last+61000);assert.equal(state.at,last);assert.equal(state.stale,true);assert.ok(state.tracks.some(t=>t.position));assert.ok(state.tracks.filter(t=>t.position).every(t=>t.position.stale));
 gray.waiting(120000);const deadline=gray.waitingUntil;h.setTime(last+91000);const expired=h.open();assert.equal(expired.waitingUntil,deadline,'an error retry survives even after vehicle evidence expires');assert.equal(expired.tracker.view(last+91000).tracks.filter(t=>t.position).length,0);
});
test('different sources, directions, variants and tabs cannot borrow vehicle evidence',()=>{
 const h=harness();confirmed(h);for(const d of [{...direction,id:'another-variant'},{...direction,monitorDirection:'R'},data.directions.find(d=>d.id!==direction.id)])assert.equal(h.open(d).tracker.view().tracks.length,0);
 assert.equal(h.open(direction,{...manifest,sourceSha256:'other-source'}).tracker.view().tracks.length,0);assert.equal(createVehicleSession(direction,manifest,{storage:null}).tracker.view().tracks.length,0);
});
test('corrupt, incompatible and inaccessible tab storage never blocks the vehicle display',()=>{
 const h=harness(),full=confirmed(h),valid=[...h.values.values()][0];for(const text of ['broken',JSON.stringify({}),valid.replace('"format":1','"format":99')]){h.values.set('foama.vehicle.sessions.v1',text);assert.doesNotThrow(()=>h.open().tracker.view());assert.equal(h.open().tracker.view().tracks.length,0);}
 const unavailable=createVehicleSession(direction,manifest,{storage:{getItem(){throw Error('blocked');},setItem(){throw Error('quota');}},now:h.options.now});assert.doesNotThrow(()=>unavailable.waiting(30000));h.ingest(unavailable,recording.snapshots[0]);assert.ok(unavailable.tracker.view(h.options.now()).tracks.length);
 assert.ok(valid.length<1_500_000);assert.ok(full.tracker.checkpoint().lastAt);
});
test('retired identities, correction holds, empty boards and duplicate guards survive a checkpoint exactly',()=>{
 const h=harness(),session=confirmed(h),at=sourceAt(recording.snapshots.at(-1));session.tracker.fail('Live-Daten vorübergehend nicht erreichbar.');session.waiting(60000);const saved=session.tracker.checkpoint(),restored=h.open();assert.deepEqual(restored.tracker.checkpoint(),saved);assert.ok(restored.tracker.view(at).tracks.filter(t=>t.position).every(t=>t.position.basis==='held'));
});

test('a new page poller respects the carried retry deadline before making any request',async()=>{
 const h=harness(),session=confirmed(h);session.waiting(120000);const restored=h.open();let calls=0,wait=0;const timers=new Map();let serial=0;
 const poller=createVehiclePoller({ids:()=>context.ids,now:h.options.now,storage:h.options.storage,locks:null,visible:()=>true,notBefore:()=>restored.waitingUntil,onWaiting:ms=>wait=ms,onData:assert.fail,onError:assert.fail,fetch:async()=>{calls++;throw Error('must wait');},schedule:(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;},cancel:id=>timers.delete(id)});
 poller.start();await new Promise(setImmediate);assert.equal(calls,0);assert.equal(wait,120000);poller.stop();assert.equal(timers.size,0);
});
