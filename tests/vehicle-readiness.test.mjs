import test from 'node:test';import assert from 'node:assert/strict';
import {vehicleReadiness} from '../pwa/src/vehicle-readiness.mjs';
const now=100000,base={at:now,stale:false,partial:false,coverage:[0,1,2],expected:3,rows:[{},{},{}],tracks:[]};
const track=(hits=1,extra={})=>({hits,blocked:'',anchors:new Map([[0,{}],[1,{}],[2,{}]]),...extra});
test('loading, ready and first-query stages distinguish real data from work still needed',()=>{
 const loading=vehicleReadiness({stage:'catalogue',now});assert.equal(loading.complete,0);assert.match(loading.steps[0].detail,/übersicht/);assert.equal(loading.estimate,'');
 const ready=vehicleReadiness({running:false,now});assert.equal(ready.complete,1);assert.match(ready.title,/Bereit/);
 const waiting=vehicleReadiness({waitingUntil:now+20000,now});assert.match(waiting.estimate,/50 s/);assert.match(waiting.next,/20 s/);assert.equal(waiting.steps[1].status,'active');
 const requesting=vehicleReadiness({requesting:true,now});assert.match(requesting.next,/läuft/);assert.match(requesting.estimate,/weiterer Quellenstand/);
});
test('live data, matching journeys and independent confirmation are separate graphical stages',()=>{
 const data=vehicleReadiness({state:base,now});assert.equal(data.complete,2);assert.match(data.title,/noch nicht eindeutig/);assert.match(data.estimate,/noch nicht/);
 const first=vehicleReadiness({state:{...base,tracks:[track()]},waitingUntil:now+23000,now});assert.equal(first.complete,3);assert.match(first.steps[3].detail,/1 \/ 2/);assert.match(first.estimate,/23 s.*Antwortzeit/);
 const second=vehicleReadiness({state:{...base,tracks:[track(2,{position:{progress:2}})]},now});assert.equal(second.complete,4);assert.match(second.title,/1 geschätztes Fahrzeug sichtbar/);assert.equal(second.estimate,'');
});
test('repeated, ambiguous or stale sources cannot produce false confirmation or a promised completion time',()=>{
 const repeated=vehicleReadiness({state:{...base,tracks:[track()]},repeated:true,now});assert.match(repeated.detail,/keinen neueren/);assert.equal(repeated.complete,3);
 const ambiguous=vehicleReadiness({state:{...base,tracks:[track(1,{blocked:'Widerspruch'})]},now});assert.equal(ambiguous.complete,2);assert.match(ambiguous.estimate,/noch nicht/);
 const stale=vehicleReadiness({state:{...base,stale:true,tracks:[track(2,{position:{progress:2}})]},now});assert.equal(stale.complete,1);assert.match(stale.steps[1].detail,/Frischer/);
 const held=vehicleReadiness({state:{...base,tracks:[track(2,{awaiting:true,lastSeen:now-30000,position:{progress:2,basis:'held'}})]},now});assert.equal(held.complete,2);assert.doesNotMatch(held.title,/sichtbar/);
});
test('partial station coverage, absent live forecasts and vehicles outside the selected range are explained',()=>{
 const partial=vehicleReadiness({state:{...base,partial:true,coverage:[0]},now});assert.match(partial.steps[1].detail,/1 \/ 3.*fehlen/);assert.equal(partial.steps[1].status,'active');
 const empty=vehicleReadiness({state:{...base,rows:[]},now});assert.match(empty.detail,/keine nutzbaren/);
 const outside=vehicleReadiness({state:{...base,tracks:[track(2,{position:{progress:10}})]},range:{start:0,end:5},now});assert.match(outside.title,/kein Fahrzeug im Ausschnitt/);assert.match(outside.detail,/außerhalb/);assert.equal(outside.estimate,'');
});
test('pause, source errors and request backoff replace the first-vehicle estimate with the actual next action',()=>{
 const paused=vehicleReadiness({paused:true,waitingUntil:now+20000,now});assert.match(paused.title,/pausiert/);assert.equal(paused.estimate,'');assert.equal(paused.next,'');
 const failure=vehicleReadiness({error:'Quelle nicht erreichbar',waitingUntil:now+60000,now});assert.equal(failure.problem,true);assert.match(failure.estimate,/60 s/);
 const pending=vehicleReadiness({state:{...base,tracks:[track()]},requesting:true,now});assert.match(pending.estimate,/gerade abgefragt/);
});
