import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {journeyStation,motisPlanUrl,normalizeJourneys,journeyBoardingTargets,journeyLineDepartures,journeyDirectionMatches,createMotisPlanner} from '../pwa/src/journey-planning.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/journey-westbahnhof-karlsplatz.json',import.meta.url)));
const stops=JSON.parse(readFileSync(new URL('../pwa/data/stops.json',import.meta.url))).stops;
const request={from:{lat:48.1966,lon:16.3375},to:{lat:48.2,lon:16.3695},time:'2026-11-08T23:00:00+01:00',speed:4.5,buffer:1,modes:{metro:true,tram:true,bus:true,sbahn:false,regional:false,long:false}};
const baseUrl='https://api.transitous.org/';
const response=(data=fixture)=>({ok:true,text:async()=>JSON.stringify(data)});

test('actual dated MOTIS result preserves riding, walking, transfers, departure times and exact station identities',()=>{
 const [journey]=normalizeJourneys(fixture,{stops});
 assert.equal(journey.durationSeconds,1080);assert.equal(journey.transfers,1);
 assert.equal(journey.walkSeconds,480);assert.deepEqual(journey.legs.filter(l=>l.mode!=='walk').map(l=>l.route),['18','U4']);
 const targets=journeyBoardingTargets(journey);assert.deepEqual(targets.map(t=>t.stopId),['wl:60201468','wl:60200827']);
 assert.equal(journey.legs.at(-1).from.stopId,'wl:60200657');
 assert.equal(targets[0].plannedDeparture,'2026-11-08T22:02:00.000Z');
 assert.ok(journey.legs.filter(l=>l.mode!=='walk').every(l=>l.quality==='schedule'),'these real provider results are timetable, not live');
});

test('provider station IDs never join nearby or identically named foreign stations',()=>{
 assert.equal(journeyStation('foreign_at:13:1468:0:3',stops),null);
 assert.equal(journeyStation('Wien Westbahnhof',stops),null);
 assert.equal(journeyStation('some_at:49:1468:0:3',stops)?.id,'wl:60201468');
 assert.notEqual(journeyStation('some_at:49:1566:0:3',stops)?.id,'wl:60201468');
});

test('planner terminal names match real monitor service suffixes and extra via text without joining opposite or explicit different branches',()=>{
 assert.ok(journeyDirectionMatches('Wien Großfeldsiedlung','Großfeldsiedlung U (über Leopoldau S U)'));
 assert.ok(journeyDirectionMatches('Wien Floridsdorf','Floridsdorf S U'));
 for(const other of ['Floridsdorf S U','Großfeldsiedlung Ost','Klein-Großfeldsiedlung'])assert.ok(!journeyDirectionMatches('Wien Großfeldsiedlung',other));
 assert.ok(!journeyDirectionMatches('Großfeldsiedlung (über Leopoldau S U)','Großfeldsiedlung U (über Leopoldauer Platz)'));
 assert.ok(!journeyDirectionMatches('Großfeldsiedlung (über Leopoldau S U)','Großfeldsiedlung U'));
 assert.ok(!journeyDirectionMatches('',''));assert.ok(!journeyDirectionMatches('A (Schleife)','A'));
});

test('search sends explicit timezone, chosen modes, walking speed and transfer reserve without extra private fields',()=>{
 const url=motisPlanUrl({...request,privateFavorites:'PRIVATE_FAVORITES'},baseUrl);
 assert.equal(url.pathname,'/api/v6/plan');assert.equal(url.searchParams.get('transitModes'),'SUBWAY,TRAM,BUS');
 assert.equal(url.searchParams.get('numItineraries'),'8');assert.equal(url.searchParams.get('maxItineraries'),'8','the provider rejects a maximum below the requested minimum');
 assert.equal(url.searchParams.get('pedestrianSpeed'),'1.25');assert.equal(url.searchParams.get('additionalTransferTime'),'1');
 assert.equal(url.searchParams.get('time'),'2026-11-08T22:00:00.000Z');assert.ok(!url.href.includes('PRIVATE'));
 assert.throws(()=>motisPlanUrl({...request,time:'2026-11-08T23:00'},baseUrl),/Zeitzone/);
 assert.throws(()=>motisPlanUrl({...request,from:{lat:NaN,lon:0}},baseUrl),/auswählen/);
 assert.throws(()=>motisPlanUrl({...request,modes:{}},baseUrl),/Verkehrsmittel/);
 assert.throws(()=>motisPlanUrl(request,'https://user:secret@example.org/'),/Planungsdienst/);
});

test('cancelled or impossible legs cannot be presented as a usable connection, while valid alternatives survive',()=>{
 const cancelled=structuredClone(fixture.itineraries[0]);cancelled.legs[1].cancelled=true;
 assert.equal(normalizeJourneys({itineraries:[cancelled,...fixture.itineraries]},{stops}).length,1);
 assert.throws(()=>normalizeJourneys({itineraries:[cancelled]},{stops}),/nutzbare/);
 const backwards=structuredClone(fixture);backwards.itineraries[0].legs[1].endTime='2026-11-08T21:00:00Z';assert.throws(()=>normalizeJourneys(backwards,{stops}));
 assert.deepEqual(normalizeJourneys({itineraries:[]},{stops}),[]);
});

test('only provider-declared real time is marked live and explicit metadata supports canonical Rufbus/Badner labels',()=>{
 const input=structuredClone(fixture);input.itineraries[0].legs[1].realTime=true;
 assert.equal(normalizeJourneys(input,{stops})[0].legs[1].quality,'live');
 input.itineraries[0].legs[1].mode='BUS';input.itineraries[0].legs[1].routeShortName='N54';
 const station=stops.find(s=>s.id==='wl:60201468'),catalog=[{...station,lines:[{route:'N54R',mode:'bus'}]}];
 assert.equal(normalizeJourneys(input,{stops:catalog})[0].legs[1].route,'N54R');
 input.itineraries[0].legs[1].mode='TRAM';input.itineraries[0].legs[1].routeShortName='BB';catalog[0].lines=[{route:'LB',mode:'tram'}];
 assert.equal(normalizeJourneys(input,{stops:catalog})[0].legs[1].route,'LB');
});

test('live alternatives require correct station, mode and direction, fresh evidence, and arrival before departure',()=>{
 const target=journeyBoardingTargets(normalizeJourneys(fixture,{stops})[0])[1],stop=stops.find(s=>s.id===target.stopId),now=Date.parse('2026-11-08T22:00:00Z');
 const departure={rbl:String(stop.rbl[0]),route:'U4',mode:'metro',towards:'Heiligenstadt',actual:'2026-11-08T22:10:00Z',fetchedAt:now,quality:'live'};
 const options={now,earliest:Date.parse('2026-11-08T22:09:00Z')};
 const rows=[departure,{...departure,actual:'2026-11-08T22:08:00Z'},{...departure,towards:'Hütteldorf'},{...departure,rbl:'999999'},{...departure,fetchedAt:now-120_000}];
 assert.deepEqual(journeyLineDepartures(target,rows,stops,options),[departure]);
 const isoDeparture={...departure,fetchedAt:new Date(now).toISOString()};assert.deepEqual(journeyLineDepartures(target,[isoDeparture],stops,options),[isoDeparture]);
 assert.deepEqual(journeyLineDepartures({...target,stopId:null},rows,stops,options),[]);
});

test('planner only queries after explicit plan and rejects responses from replaced or aborted searches',async()=>{
 const calls=[],planner=createMotisPlanner({baseUrl,stops,fetch:(url,options)=>new Promise(resolve=>calls.push({url,options,resolve}))});
 assert.equal(calls.length,0);
 const first=planner.plan(request),rejected=assert.rejects(first,{name:'AbortError'});
 const second=planner.plan(request);assert.equal(calls[0].options.signal.aborted,true);
 calls[0].resolve(response());calls[1].resolve(response());await rejected;assert.equal((await second).length,1);
 const third=planner.plan(request),aborted=assert.rejects(third,{name:'AbortError'});planner.abort();calls[2].resolve(response());await aborted;
});

test('provider failures and malformed or oversized answers remain visible errors instead of fabricated journeys',async()=>{
 for(const result of [{ok:false,status:429},{ok:false,status:503},{ok:true,text:async()=>'{bad'},{ok:true,text:async()=>'a'.repeat(2_000_001)}]){
  const planner=createMotisPlanner({baseUrl,stops,fetch:async()=>result});await assert.rejects(planner.plan(request));
 }
});

test('a slow routing request is aborted and produces a retryable timeout',async()=>{
 const planner=createMotisPlanner({baseUrl,stops,timeoutMs:5,fetch:async(url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError'))))});
 await assert.rejects(planner.plan(request),/erneut versuchen/);
});
