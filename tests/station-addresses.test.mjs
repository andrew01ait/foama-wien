import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {stationAddressMarkup} from '../pwa/src/station-addresses.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
test('official nearby addresses include house number, distance and provenance without claiming a station postal address',()=>{
 const data=JSON.parse(readFileSync(new URL('../pwa/data/station-addresses.json',import.meta.url))),stops=JSON.parse(readFileSync(new URL('../pwa/data/stops.json',import.meta.url))).stops;
 assert.equal(data.sourceRecords,151577);assert.ok(Object.keys(data.stations).length>1700);for(const [id,row] of Object.entries(data.stations)){assert.ok(stops.some(stop=>stop.id===id));assert.match(row.address,/\d/);assert.ok(row.meters>=0&&row.meters<=100);assert.equal(row.kind,'nearby-access');}
 const stop=stops.find(stop=>data.stations[stop.id]),before=JSON.stringify(stop),markup=stationAddressMarkup(stop,data,null,{escape});assert.match(markup,/Adresse bei der Haltestelle/);assert.match(markup,/ca\. \d+ m vom Haltepunkt/);assert.match(markup,/Keine bestätigte Stations-Postadresse/);assert.match(markup,/Datenquelle: Stadt Wien/);assert.equal(JSON.stringify(stop),before,'postal point cannot replace the routing destination');
});
test('a missing, invalid or distant address falls back to street surroundings without inventing a house number',()=>{
 const stop={id:'test'},approx={street:'Thaliastraße',postcode:'1160'},data={stations:{test:{kind:'nearby-access',address:'<b>1',postcode:'1160',meters:200}}};
 const markup=stationAddressMarkup(stop,data,approx,{escape});assert.match(markup,/Straßenumgebung/);assert.doesNotMatch(markup,/<b>|Ungefähre Adresse/);assert.match(stationAddressMarkup(stop,{stations:{test:{...data.stations.test,meters:5}}},null,{escape}),/&lt;b>/);
});
