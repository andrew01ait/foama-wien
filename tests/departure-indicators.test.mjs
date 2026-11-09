import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWlMonitors} from '../pwa/src/core.mjs';
import {retainDepartures,departureCorrection} from '../pwa/src/departure-cache.mjs?v=0.6.5';
import {vehicleAccessibilityMarkup,departureCorrectionMarkup} from '../pwa/src/departure-indicators.mjs';
import {journeyStationMarkup} from '../pwa/src/journey-station.mjs';

const start=Date.parse('2026-11-09T12:00:00Z');
const iso=offset=>new Date(start+offset).toISOString();
const departure=(changes={})=>({id:'wl:test:U6:planned',provider:'wl',rbl:'4116',station:'Testplatz',mode:'metro',route:'U6',towards:'Floridsdorf',scheduled:iso(300_000),realtime:iso(300_000),actual:iso(300_000),quality:'live',fetchedAt:iso(0),...changes});
function observe(old=departure(),next=departure({actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(30_000)}),at=start+30_000){
 const previous=retainDepartures([],[old],['4116'],start);
 return retainDepartures(previous,[next],['4116'],at)[0];
}

test('a later absolute live prediction for the same planned departure gets a quiet, short-lived correction',()=>{
 const d=observe();
 assert.equal(departureCorrection(d,start+30_000).deltaMilliseconds,120_000);
 const html=departureCorrectionMarkup(d,{now:start+30_000});
 assert.match(html,/Zeit korrigiert · ca\. \+2 Min\./);
 assert.match(html,/Für dieselbe geplante Abfahrt später gemeldet/);
 assert.doesNotMatch(html,/warning|alert|status|⚠|Störung/);
 assert.match(departureCorrectionMarkup(d,{now:start+30_000,compact:true}),/ca\. \+2′ neu/);
 assert.equal(departureCorrectionMarkup(d,{now:start+30_000,hasError:true}),'');
 assert.equal(departureCorrection(d,start+121_000),null,'old live data stops displaying the note');
});

test('the normal countdown and advancing to the next train do not create a correction',()=>{
 const a=departure();
 assert.equal(departureCorrection(observe(a,departure({fetchedAt:iso(30_000)})),start+30_000),null);
 assert.equal(departureCorrection(observe(departure(),departure({id:'next',scheduled:iso(600_000),actual:iso(600_000),realtime:iso(600_000),fetchedAt:iso(30_000)})),start+30_000),null);
});

test('the correction identity includes platform, route, direction and mode',()=>{
 for(const change of [{rbl:'4117'},{route:'U4'},{towards:'Siebenhirten'},{mode:'tram'}]){
  const next=departure({actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(30_000),...change});
  assert.equal(departureCorrection(observe(departure(),next),start+30_000),null,JSON.stringify(change));
 }
});

test('uncertain identities, a first live estimate and sub-threshold changes remain unmarked',()=>{
 for(const changes of [{scheduled:null},{rbl:''},{rbl:'not-a-platform'}]){
  const old=departure(changes),next=departure({...changes,actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(30_000)});
  assert.equal(departureCorrection(observe(old,next),start+30_000),null);
 }
 assert.equal(departureCorrection(observe(departure({quality:'schedule',realtime:null})),start+30_000),null);
 assert.equal(departureCorrection(observe(departure(),departure({actual:iso(320_000),realtime:iso(320_000),fetchedAt:iso(30_000)})),start+30_000),null);
});

test('cached JSON is never compared on a cold start, and local metadata is not persisted',()=>{
 const cached=JSON.parse(JSON.stringify(departure()));
 const first=retainDepartures([cached],[departure({actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(30_000)})],['4116'],start+30_000);
 assert.equal(departureCorrection(first[0],start+30_000),null);
 const second=retainDepartures(first,[departure({actual:iso(480_000),realtime:iso(480_000),fetchedAt:iso(60_000)})],['4116'],start+60_000);
 assert.equal(departureCorrection(second[0],start+60_000).deltaMilliseconds,60_000);
 assert.doesNotMatch(JSON.stringify(second),/correction|changedAt|previousActual/);
 const restored=JSON.parse(JSON.stringify(second));
 assert.equal(departureCorrection(restored[0],start+60_000),null);
});

test('only newer, fresh live snapshots can establish a correction',()=>{
 for(const [old,next,at] of [
  [departure(),departure({actual:iso(420_000),realtime:iso(420_000)}),start+30_000],
  [departure(),departure({actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(-1000)}),start+30_000],
  [departure({fetchedAt:iso(-100_000)}),departure({actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(30_000)}),start+30_000],
  [departure(),departure({actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(61_000)}),start+30_000],
  [departure(),departure({actual:iso(420_000),realtime:iso(420_000),quality:'schedule',fetchedAt:iso(30_000)}),start+30_000]
 ])assert.equal(departureCorrection(observe(old,next,at),at),null);
});

test('a duplicated planned slot cannot accidentally match the wrong vehicle',()=>{
 const a=departure(),b=departure({id:'ambiguous'}),next=departure({actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(30_000)});
 const old=retainDepartures([],[a,b],['4116'],start);
 const incoming=retainDepartures(old,[next],['4116'],start+30_000);
 assert.equal(departureCorrection(incoming[0],start+30_000),null);
 const good=retainDepartures([],[departure()],['4116'],start);
 const duplicate=retainDepartures(good,[{...next},{...next,id:'second'}],['4116'],start+30_000);
 assert.ok(duplicate.every(d=>departureCorrection(d,start+30_000)===null));
});

test('unchanged refreshes carry the note for at most two minutes without resetting its age',()=>{
 let rows=[observe()];
 for(const offset of [60_000,90_000,120_000,149_000]){
  rows=retainDepartures(rows,[departure({actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(offset)})],['4116'],start+offset);
  assert.equal(departureCorrection(rows[0],start+offset).changedAt,start+30_000);
 }
 rows=retainDepartures(rows,[departure({actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(150_000)})],['4116'],start+150_000);
 assert.equal(departureCorrection(rows[0],start+150_000),null);
});

test('an earlier revised prediction clears the previous later-correction note',()=>{
 const d=observe(),rows=retainDepartures([d],[departure({actual:iso(390_000),realtime:iso(390_000),fetchedAt:iso(60_000)})],['4116'],start+60_000);
 assert.equal(departureCorrection(rows[0],start+60_000),null);
});

function parsedAccess(lineAccess,vehicleAccess,includeVehicle=false){
 const line={name:'U6',towards:'Floridsdorf',type:'ptMetro',departures:{departure:[{departureTime:{timePlanned:iso(300_000),timeReal:iso(300_000)},...(includeVehicle?{vehicle:{barrierFree:vehicleAccess}}:{})}]}};
 if(lineAccess!==undefined)line.barrierFree=lineAccess;
 return parseWlMonitors({data:{monitors:[{locationStop:{properties:{title:'Testplatz',attributes:{rbl:4116}}},lines:[line]}]}},iso(0))[0];
}

test('the API vehicle override wins; absent overrides inherit the documented line vehicle default',()=>{
 assert.deepEqual([parsedAccess(false,true,true).barrierFree,parsedAccess(false,true,true).barrierFreeSource],[true,'vehicle']);
 assert.deepEqual([parsedAccess(true,false,true).barrierFree,parsedAccess(true,false,true).barrierFreeSource],[false,'vehicle']);
 assert.deepEqual([parsedAccess(true).barrierFree,parsedAccess(true).barrierFreeSource],[true,'line']);
 assert.equal(parsedAccess(false).barrierFree,false);
});

test('missing or malformed accessibility information stays unknown, including explicit null overrides',()=>{
 for(const d of [parsedAccess(undefined),parsedAccess('true'),parsedAccess(true,null,true),parsedAccess(true,'false',true)]){
  assert.equal(d.barrierFree,null);assert.equal(d.barrierFreeSource,null);
  assert.equal(vehicleAccessibilityMarkup(d,{now:start}),'');
 }
});

test('the wheelchair symbol is a current positive vehicle fact, never a station or route guarantee',()=>{
 const d=parsedAccess(true),html=vehicleAccessibilityMarkup(d,{now:start});
 assert.match(html,/Barrierefreies Fahrzeug laut Wiener Linien/);
 assert.match(html,/nicht die Barrierefreiheit der Station oder des gesamten Wegs/);
 assert.match(html,/role="img"/);assert.doesNotMatch(html,/warning|alert/);
 for(const options of [{now:start+91_000},{now:start,hasError:true}])assert.equal(vehicleAccessibilityMarkup(d,options),'');
 for(const changes of [{barrierFree:false},{barrierFree:null},{barrierFreeSource:null},{provider:'rail'},{fetchedAt:iso(31_000)}])assert.equal(vehicleAccessibilityMarkup({...d,...changes},{now:start}),'');
});

test('station details attach accessibility to individual departures and show a correction only for the matching row',()=>{
 const d=observe(parsedAccess(true),{...parsedAccess(true),actual:iso(420_000),realtime:iso(420_000),fetchedAt:iso(30_000)});
 const second=departure({id:'next',actual:iso(600_000),realtime:iso(600_000),scheduled:iso(600_000),fetchedAt:iso(30_000),barrierFree:false,barrierFreeSource:'vehicle'});
 const options={now:start+30_000,escape:String,badge:g=>g.route},stop={id:'wl:test',name:'Testplatz',provider:'wl',rbl:['4116']};
 const html=journeyStationMarkup(stop,[d,second],options);
 assert.equal((html.match(/class="vehicle-access"/g)||[]).length,1);
 assert.match(html,/Zeit korrigiert/);assert.match(html,/danach 10′/);
 const failed=journeyStationMarkup(stop,[d,second],{...options,error:'Offline'});
 assert.doesNotMatch(failed,/vehicle-access|departure-correction/);
});
