import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {rankedJourneyIndices,compareJourneyOptions,reverseJourneyEndpoints,mergeJourneyResults} from '../pwa/src/journey-options.mjs';
import {createJourneyComparisonClient} from '../pwa/src/journey-client.mjs';
import {motisPlanUrl} from '../pwa/src/journey-planning.mjs';
import {sanitizeJourneyPlaces,saveJourneyPlace,journeyPlacePoint,matchingJourneyPlace} from '../pwa/src/journey-places.mjs';
const from={kind:'point',name:'Westbahnhof',lat:48.1966,lon:16.3375},to={kind:'point',name:'Karlsplatz',lat:48.2,lon:16.3695};
const trip=(start,end,transfers=1,route='U3')=>({startTime:`2026-11-09T${start}:00Z`,endTime:`2026-11-09T${end}:00Z`,transfers,durationSeconds:(Date.parse(`2026-11-09T${end}Z`)-Date.parse(`2026-11-09T${start}Z`))/1000,walkSeconds:120,legs:[{mode:'metro',route,towards:'Ziel',from,to}]});
test('fastest means earliest arrival, while fewer transfers shows the actual arrival penalty',()=>{
 const journeys=[trip('10:00','10:20',1),trip('10:00','10:35',0),trip('10:30','10:40',1)];
 assert.deepEqual(rankedJourneyIndices(journeys),[0,1,2]);assert.deepEqual(rankedJourneyIndices(journeys,{preference:'transfers'}),[1,0,2]);
 assert.deepEqual(compareJourneyOptions(journeys),{fastest:0,fewest:1,minutes:15,fewerTransfers:1,arriveBy:false,same:false});
 assert.equal(compareJourneyOptions([trip('10:00','10:20',0)]).same,true);
});
test('arrive-by comparison uses latest possible departure and shows how much earlier to leave',()=>{
 const journeys=[trip('10:40','11:00',2),trip('10:20','10:55',0),trip('10:30','10:45',1)];
 assert.deepEqual(rankedJourneyIndices(journeys,{arriveBy:true}),[0,2,1]);assert.equal(compareJourneyOptions(journeys,{arriveBy:true}).minutes,20);
 assert.equal(compareJourneyOptions([{savedPath:true,legs:[]}]),null);
});
test('one timetable and one transfer-optimized request preserve distinct complete itineraries without duplicating the same trip',async()=>{
 const a=trip('10:00','10:20',1),b=trip('10:00','10:35',0,'1'),calls=[];
 const client=createJourneyComparisonClient({fetch:async(url,options)=>{const body=JSON.parse(options.body);calls.push({url,body});return Response.json({journeys:body.profile==='timetable'?[a]:[a,b],plannedAt:'2026-11-09T09:00:00Z'});}});
 assert.equal(calls.length,0);const result=await client.plan({from,to});assert.deepEqual(result.journeys,[a,b]);assert.equal(result.comparisonComplete,true);assert.equal(calls.length,2);assert.deepEqual(calls.map(c=>c.body.profile),['timetable','transfers']);
 await client.plan({from,to});assert.equal(calls.length,2,'switching/reopening within the memory-cache window needs no upstream calls');
 const body={from,to,time:'2026-11-09T10:00:00Z',modes:{metro:true}};
 assert.equal(motisPlanUrl(body,'https://api.transitous.org').searchParams.get('timetableView'),'true');assert.equal(motisPlanUrl({...body,profile:'transfers'},'https://api.transitous.org').searchParams.get('timetableView'),'false');
 assert.throws(()=>motisPlanUrl({...body,profile:'https://elsewhere.test'},'https://api.transitous.org'),/Routenpräferenz/);
 assert.equal(mergeJourneyResults([{journeys:Array.from({length:30},(_,i)=>trip('10:00','10:20',1,String(i)))}]).length,16);
});
test('comparison honestly reports partial service results and cancels both profiles without accepting late answers',async()=>{
 const client=createJourneyComparisonClient({fetch:async(url,options)=>JSON.parse(options.body).profile==='transfers'?Response.json({error:'offline'},{status:503}):Response.json({journeys:[trip('10:00','10:20')],plannedAt:'now'})});
 assert.equal((await client.plan({from,to})).comparisonComplete,false);
 const calls=[],pendingClient=createJourneyComparisonClient({fetch:(url,options)=>new Promise(resolve=>calls.push({options,resolve}))});const pending=pendingClient.plan({from,to});pendingClient.abort();assert.ok(calls.every(c=>c.options.signal.aborted));for(const call of calls)call.resolve(Response.json({journeys:[]}));await assert.rejects(pending,{name:'AbortError'});
});
test('return route swaps fixed endpoints without changing the outward favorite and never invents an old GPS target',()=>{
 const original=JSON.stringify({from,to}),reversed=reverseJourneyEndpoints(from,to);assert.deepEqual(reversed,{from:to,to:from,requiresDestination:false});assert.equal(JSON.stringify({from,to}),original);
 const gps=reverseJourneyEndpoints({kind:'current',name:'Dein Standort',lat:48.123456,lon:16.123456,fixedAt:123},to);assert.equal(gps.to,null);assert.equal(gps.requiresDestination,true);assert.ok(!JSON.stringify(gps).includes('48.123456'));
 assert.deepEqual(reverseJourneyEndpoints(from,{kind:'current',name:'Dein Standort'}).from,{kind:'current',name:'Dein Standort'});
});
test('labeled places keep physical addresses for route identity, reject dynamic GPS and duplicate labels, and persist bounded known fields',()=>{
 const result=saveJourneyPlace([],{label:'Arbeit',address:'Giefinggasse 4',detail:'1210 Wien',lat:48.267,lon:16.427,private:'discard'},{id:'work'});
 assert.equal(result.place.label,'Arbeit');assert.ok(!JSON.stringify(result).includes('discard'));const point=journeyPlacePoint(result.place);assert.equal(point.name,'Giefinggasse 4');assert.equal(matchingJourneyPlace(result.places,point)?.label,'Arbeit');assert.equal(matchingJourneyPlace(result.places,{...point,lat:48.2}),null);
 assert.throws(()=>saveJourneyPlace(result.places,{...result.place,id:null,label:'ARBEIT'},{id:'duplicate'}),/bereits/);
 const edited=saveJourneyPlace(result.places,{...result.place,label:'AIT'}).places;assert.equal(edited[0].id,'work');assert.equal(edited[0].label,'AIT');assert.deepEqual(sanitizeJourneyPlaces([{...result.place,kind:'current',fixedAt:1}]),[]);
 const full=Array.from({length:30},(_,i)=>({...result.place,id:'p'+i,label:'Ort '+i}));assert.throws(()=>saveJourneyPlace(full,{...result.place,id:null,label:'Neuer Ort'},{id:'new'}),/30/);assert.equal(full.length,30);
});
test('renamed favorites and the top route summary always show boarding and final alighting stations',()=>{
 const source=readFileSync(new URL('../pwa/src/journey-page.mjs',import.meta.url),'utf8'),elements=new Map(),$=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);};
 const route={name:'AIT nach Hause',from,to,legs:[{mode:'metro',from:{name:'Thaliastraße U'},to:{name:'Floridsdorf S U'}}]},state={stops:[],selected:route,from,to,favorites:[{...route,id:'saved',alternatives:[]}]};
 const ctx=vm.createContext({state,$,placesUI:{describe:p=>p.name},escape:s=>s,routeMenus:{close(){}},rides:j=>j.legs.filter(l=>l.mode!=='walk'),boardingPreview:()=>''});
 vm.runInContext(source.slice(source.indexOf('function stationName('),source.indexOf('function comparisonMarkup('))+source.slice(source.indexOf('function renderFavorites('),source.indexOf('function refreshSavedJourneys(')),ctx);ctx.renderRouteOverview();ctx.renderFavorites();
 assert.equal($('journeyRouteFrom').textContent,'Westbahnhof');assert.equal($('journeyRouteTo').textContent,'Karlsplatz');assert.equal($('journeyRouteStations').textContent,'Thaliastraße U → Floridsdorf S U');
 assert.match($('journeyFavoriteList').innerHTML,/AIT nach Hause/);assert.match($('journeyFavoriteList').innerHTML,/Thaliastraße U → Floridsdorf S U/);assert.match($('journeyFavoriteList').innerHTML,/Rückfahrt planen/);
});
