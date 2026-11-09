import test from 'node:test';
import assert from 'node:assert/strict';
import {createJourneyClient,viennaInput,viennaTime,journeyMonitorIds,upcomingBoardings} from '../pwa/src/journey-client.mjs';
import {normalizeJourneys} from '../pwa/src/journey-planning.mjs';
import {saveJourneyFavorite,sanitizeJourneyFavorites,savedJourney} from '../pwa/src/journey-favorites.mjs';
import {readFileSync} from 'node:fs';
const stops=JSON.parse(readFileSync(new URL('../pwa/data/stops.json',import.meta.url))).stops;
const journey=normalizeJourneys(JSON.parse(readFileSync(new URL('./fixtures/journey-westbahnhof-karlsplatz.json',import.meta.url))),{stops})[0];
test('Vienna dates are independent of device timezone and handle both daylight saving transitions',()=>{
 assert.equal(viennaTime('2026-11-08T23:00'),'2026-11-08T22:00:00.000Z');assert.equal(viennaTime('2027-07-10T12:00'),'2027-07-10T10:00:00.000Z');
 assert.throws(()=>viennaTime('2027-03-28T02:30'),/gibt es/);assert.equal(viennaTime('2027-10-31T02:30'),'2027-10-31T00:30:00.000Z');assert.equal(viennaInput(new Date('2026-11-08T22:00Z')),'2026-11-08T23:00');
});
test('search is explicit, uses POST, reuses only a short memory cache and cancels replaced or paused searches',async()=>{
 const calls=[],client=createJourneyClient({fetch:(url,options)=>new Promise(resolve=>calls.push({url,options,resolve}))});assert.equal(calls.length,0);
 const first=client.plan({from:{lat:48.1,lon:16.2}});const second=client.places('Wien Westbahnhof');assert.equal(calls[0].options.signal.aborted,true);assert.equal(calls[0].options.method,'POST');assert.equal(calls[0].url,'./api/journeys/plan');
 calls[0].resolve(Response.json({journeys:[]}));await assert.rejects(first,{name:'AbortError'});calls[1].resolve(Response.json({places:[]}));await second;await client.places('Wien Westbahnhof');assert.equal(calls.length,2);
 const third=client.plan({other:true});client.abort();calls[2].resolve(Response.json({journeys:[]}));await assert.rejects(third,{name:'AbortError'});
});
test('route favorites retain route structure, remove absolute old times and trip identifiers, and keep GPS origin dynamic',()=>{
 const from={name:'Your GPS',lat:48.123456,lon:16.123456,fixedAt:1},to={name:'Karlsplatz',lat:48.2,lon:16.3695};
 const {favorites,favorite}=saveJourneyFavorite([],{from,to,journey,now:123,id:'test'}),serialized=JSON.stringify(favorites);
 assert.equal(favorite.from.kind,'current');assert.ok(!serialized.includes('48.123456'));assert.ok(!serialized.includes('2026-11-08T'));assert.ok(!serialized.includes('tripId'));assert.ok(!serialized.includes('"live"'));
 const view=savedJourney(favorite);assert.equal(view.savedPath,true);assert.equal(view.startTime,undefined);assert.equal(view.durationSeconds,undefined);assert.equal(upcomingBoardings(view,Date.now()).length,2);
 assert.deepEqual(sanitizeJourneyFavorites(JSON.parse(serialized)),favorites);
 assert.equal(saveJourneyFavorite(favorites,{from,to,journey,now:456,id:'second'}).favorites.length,1);
 assert.equal(saveJourneyFavorite(favorites,{from,to,journey,now:456,id:'second'}).favorite.id,'test');
 favorites[0].name='Mein eigener Name';assert.equal(saveJourneyFavorite(favorites,{from,to,journey,now:789,id:'third'}).favorite.name,'Mein eigener Name');
});
test('corrupt or oversized local route favorites cannot restore stale forecasts or arbitrary fields',()=>{
 assert.deepEqual(sanitizeJourneyFavorites([{id:'bad',savedAt:1,from:{},to:{},legs:[]}]),[]);
 const original=saveJourneyFavorite([],{from:{name:'A',lat:48.1,lon:16.1},to:{name:'B',lat:48.2,lon:16.2},journey,id:'test'}).favorite;original.legs[0].quality='live';original.private='PRIVATE';const safe=sanitizeJourneyFavorites([original]);assert.ok(!JSON.stringify(safe).includes('PRIVATE'));assert.equal(safe[0].legs[0].quality,undefined);
});
test('monitor targets next two boarding stations with at most 24 platforms and never calls unknown station IDs',()=>{
 const targets=upcomingBoardings(journey,Date.parse(journey.startTime));const ids=journeyMonitorIds(targets,stops);assert.ok(ids.length<=24);for(const target of targets)assert.ok(stops.find(stop=>stop.id===target.stopId).rbl.some(id=>ids.includes(id)));
 assert.deepEqual(journeyMonitorIds([{stopId:'unknown'}],stops),[]);assert.equal(upcomingBoardings(journey,Date.parse(journey.endTime)+1).length,0);
});
