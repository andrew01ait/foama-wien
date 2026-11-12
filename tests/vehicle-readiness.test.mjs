import test from 'node:test';import assert from 'node:assert/strict';
import {vehicleReadiness,createVehicleReadiness} from '../pwa/src/vehicle-readiness.mjs';
const now=100000,base={at:now,stale:false,partial:false,coverage:[0,1,2],expected:3,rows:[{},{},{}],tracks:[]};
const track=(hits=1,extra={})=>({hits,blocked:'',anchors:new Map([[0,{}],[1,{}],[2,{}]]),...extra});
test('startup explains the current action and actual next update without promising when a vehicle will appear',()=>{
 const loading=vehicleReadiness({stage:'catalogue',now});assert.equal(loading.complete,0);assert.match(loading.title,/Strecke wird geladen/);
 const waiting=vehicleReadiness({waitingUntil:now+20000,now});assert.equal(waiting.complete,1);assert.match(waiting.title,/Abfahrten werden geladen/);assert.match(waiting.next,/20 s/);assert.doesNotMatch(waiting.detail,/50 s|frühestens|Quellen/);
 const requesting=vehicleReadiness({requesting:true,now});assert.match(requesting.next,/abgerufen/);
});
test('the bar distinguishes forecasts, matching journeys and independently confirmed positions',()=>{
 const data=vehicleReadiness({state:base,now});assert.equal(data.complete,2);assert.match(data.title,/Fahrzeuge werden gesucht/);
 const first=vehicleReadiness({state:{...base,tracks:[track()]},waitingUntil:now+23000,now});assert.equal(first.complete,3);assert.match(first.title,/positionen werden geprüft/);assert.match(first.next,/23 s/);
 const second=vehicleReadiness({state:{...base,tracks:[track(2,{position:{progress:2}})]},now});assert.equal(second.complete,4);assert.match(second.title,/1 Fahrzeug sichtbar/);
});
test('repeated, ambiguous, stale and held evidence never creates false readiness',()=>{
 const repeated=vehicleReadiness({state:{...base,tracks:[track()]},repeated:true,now});assert.equal(repeated.complete,3);assert.match(repeated.detail,/warten auf neue Live/);
 const ambiguous=vehicleReadiness({state:{...base,tracks:[track(1,{blocked:'Widerspruch'})]},now});assert.equal(ambiguous.complete,2);
 const stale=vehicleReadiness({state:{...base,stale:true,tracks:[track(2,{position:{progress:2}})]},now});assert.equal(stale.complete,1);assert.match(stale.title,/werden aktualisiert/);
 const held=vehicleReadiness({state:{...base,tracks:[track(2,{awaiting:true,lastSeen:now-30000,position:{progress:2,basis:'held'}})]},now});assert.equal(held.complete,2);assert.doesNotMatch(held.title,/sichtbar/);
});
test('missing forecasts, future departures and positions elsewhere use understandable separate messages',()=>{
 const empty=vehicleReadiness({state:{...base,rows:[]},now});assert.match(empty.detail,/keine Live-Abfahrten/);
 const outside=vehicleReadiness({state:{...base,tracks:[track(2,{position:{progress:10}})]},range:{start:0,end:5},now});assert.match(outside.title,/deinem Ausschnitt/);assert.match(outside.detail,/anderen Abschnitten/);
 const pending=vehicleReadiness({state:{...base,tracks:[track(2)]},now});assert.match(pending.title,/positionen noch offen/);
 const future=vehicleReadiness({state:{...base,tracks:[track(2,{schedule:{start:0,times:[[now+600000,now+600000]]}})]},now});assert.match(future.title,/starten später/);
 const partial=vehicleReadiness({state:{...base,partial:true,coverage:[0],budgetLimited:6},now});assert.equal(partial.complete,2,'some missing boards do not hide the fact that live data already arrived');
});
test('pause and error backoff show the next user-relevant action',()=>{
 const paused=vehicleReadiness({paused:true,waitingUntil:now+20000,now});assert.match(paused.title,/pausiert/);assert.equal(paused.next,'');
 const failure=vehicleReadiness({error:'HTTP 503 internal technical message',waitingUntil:now+60000,now});assert.equal(failure.problem,true);assert.match(failure.next,/60 s/);assert.match(failure.detail,/automatisch erneut/);assert.doesNotMatch(failure.detail,/503/);
});
test('the compact accessible widget shows only status, a small bar, one explanation and the next update',()=>{
 const nodes=new Map(),node=()=>({dataset:{},attributes:{},textContent:'',innerHTML:'',setAttribute(key,value){this.attributes[key]=value;},querySelector(key){if(!nodes.has(key))nodes.set(key,node());return nodes.get(key);}}),widget=createVehicleReadiness({doc:{createElement:node}}),bar=nodes.get('.vehicle-readiness-progress');
 assert.equal(bar.attributes['aria-valuenow'],'0');assert.doesNotMatch(widget.element.innerHTML,/vehicle-readiness-(steps|count|phase|estimate)/);
 widget.render({state:{...base,tracks:[track()]},waitingUntil:now+23000,now});assert.equal(bar.attributes['aria-valuenow'],'3');assert.match(bar.attributes['aria-valuetext'],/Positionen prüfen/);assert.equal((bar.innerHTML.match(/data-state="done"/g)||[]).length,3);
 const copy=[...nodes.values()].map(n=>n.textContent).join(' ');assert.doesNotMatch(copy,/Quellenstand|Fahrtkandidat|RBL|Prognosen|1 \/ 2|2 \/ 2|Schritt/);
 widget.render({state:{...base,stale:true,tracks:[track(2,{position:{progress:2}})]},now});assert.equal(bar.attributes['aria-valuenow'],'1');
});
