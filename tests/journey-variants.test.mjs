import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {journeyFamily,journeyBranch,journeyPathKey} from '../pwa/src/journey-variants.mjs';
import {saveJourneyFavorite,sanitizeJourneyFavorites,mergeJourneyFavorites,transferableJourneys,savedJourney} from '../pwa/src/journey-favorites.mjs';
import {transferBundle,mergeTransferBundle,decryptTransfer} from '../pwa/src/transfer.mjs';
const leg=(route,from,to)=>({mode:'metro',route,towards:to,from:{stopId:from,name:from},to:{stopId:to,name:to},durationSeconds:300,startTime:'2026-11-09T07:00:00Z',endTime:'2026-11-09T07:05:00Z',quality:'live'});
const base={legs:[leg('U6','wl:a','wl:b'),leg('U1','wl:b','wl:c')]},alt={legs:[leg('U6','wl:a','wl:b'),leg('U2','wl:b','wl:c')]},different={legs:[leg('U3','wl:d','wl:c')]},from={kind:'current',lat:48.123456,lon:16.123456,name:'GPS'},to={lat:48.25,lon:16.45,name:'Destination'};
const save=(journey=base,alternatives=[base,alt,different])=>saveJourneyFavorite([],{from,to,journey,alternatives,id:'route-bundle',now:123}).favorite;
test('all distinct paths from initial planning form a family, while later departures of the same path do not become duplicate routes',()=>{
 const later=structuredClone(base);later.legs[0].startTime='2026-11-09T08:00:00Z';assert.equal(journeyFamily([base,later,alt,different],base).length,3);assert.equal(journeyPathKey(base),journeyPathKey(later));const branch=journeyBranch(base,alt);assert.equal(branch.common,1);assert.equal(branch.baseLegIndex,1);assert.equal(branch.candidateLegIndex,1);assert.equal(branch.anchor.stopId,'wl:b');assert.equal(journeyBranch(base,different).common,0);
});
test('a saved route remembers alternative full paths without old times, live labels, trip IDs or a GPS fix in any variant',()=>{
 const favorite=save();assert.equal(favorite.alternatives.length,2);const text=JSON.stringify(favorite);for(const forbidden of ['2026-11','48.123456','quality','startTime','endTime'])assert.ok(!text.includes(forbidden),forbidden);assert.equal(savedJourney(favorite).savedPath,true);
 const wire=transferableJourneys([favorite]);assert.equal(wire[0].alternatives.length,2);assert.equal(transferBundle({format:'foama-favorites-v2',favorites:[],journeys:wire}).journeys[0].alternatives.length,2);
});
test('receiving new alternatives merges into the same route, preserves its name and order, and never creates a second favorite for an alternate path',()=>{
 const old=save(base,[]);old.name='My commute';const incoming=save();const merged=mergeJourneyFavorites([old],[incoming]);assert.equal(merged.added,0);assert.equal(merged.updated,1);assert.equal(merged.favorites[0].id,old.id);assert.equal(merged.favorites[0].name,'My commute');assert.equal(merged.favorites[0].alternatives.length,2);
 const resaved=saveJourneyFavorite(merged.favorites,{from,to,journey:alt,alternatives:[base,alt,different],id:'other',now:456});assert.equal(resaved.favorites.length,1);assert.equal(resaved.favorite.name,'My commute');assert.equal(resaved.favorite.alternatives.length,2);
 const again=mergeTransferBundle({favorites:[],journeys:[old]},{format:'foama-favorites-v2',favorites:[],journeys:[incoming]});assert.equal(again.updatedJourneys,1);
});
test('malformed alternatives reject the whole incoming route and variant limits cannot discard stored choices silently',()=>{
 const good=save();assert.deepEqual(sanitizeJourneyFavorites([{...good,alternatives:[{legs:[]}]}]),[]);assert.throws(()=>mergeJourneyFavorites([],[{...good,alternatives:Array(16).fill({legs:base.legs})}]),/ungültig/);
 const old=save(base,Array.from({length:15},(_,i)=>({legs:[leg('TEST'+i,'wl:a','wl:c')]}))),incoming=save(base,[{legs:[leg('NEW','wl:a','wl:c')]}]);assert.throws(()=>mergeJourneyFavorites([old],[incoming]),/16/);assert.equal(old.alternatives.length,15);
});
test('alternative-route encryption fixture contains a single route bundle with no personal GPS fix',async()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/transfer-alternatives-webcrypto.json',import.meta.url)));assert.deepEqual(await decryptTransfer(fixture.packet,fixture.key),fixture.value);assert.equal(fixture.value.journeys[0].alternatives.length,1);assert.ok(!JSON.stringify(fixture.value).includes('48.123456'));
});
