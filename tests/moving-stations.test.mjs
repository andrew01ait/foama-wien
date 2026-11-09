import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeSettings,parseWlMonitors} from '../pwa/src/core.mjs';
import {updateLocation,locationSnapshot} from '../pwa/src/location-state.mjs';
import {stationMatchesModes,selectStopIds,enrichStops} from '../pwa/src/station-catalog.mjs';
import {retainDepartures,departureIsFresh,retryDelay} from '../pwa/src/departure-cache.mjs';
import {createAddressLookup} from '../pwa/src/address-index.mjs';

const catalogue=JSON.parse(await readFile(new URL('../pwa/data/stops.json',import.meta.url),'utf8'));
const stops=catalogue.stops;
const metroOnly=mergeSettings({modes:{metro:true,tram:false,bus:false,sbahn:false,regional:false,long:false}});
const t=1794050000000;
const fix=(time=t,extra={})=>({lat:48.2081,lon:16.3717,accuracy:15,timestamp:time,...extra});

test('offline official lines filter stations before any departure is fetched; S/U in names is not a service',()=>{
 const stephansplatz=stops.find(s=>s.name==='Stephansplatz U'),siemensstrasse=stops.find(s=>s.name==='Siemensstraße S');
 assert.equal(stationMatchesModes(stephansplatz,metroOnly),true);
 assert.equal(stationMatchesModes(siemensstrasse,metroOnly),false);
 assert.equal(stationMatchesModes(siemensstrasse,mergeSettings({modes:{bus:false,metro:false,tram:false,sbahn:true}})),false);
 assert.deepEqual(stephansplatz.lines.filter(l=>l.mode==='metro').map(l=>l.route).sort(),['U1','U3']);
 assert.equal(stationMatchesModes({name:'Unbekannt U',rbl:['99']},metroOnly),false);
 assert.equal(stops.filter(s=>s.lines.length).length,catalogue.lineMappedStops);
 assert.ok(catalogue.lineMappedStops>1700);
});
test('turning off every mode really produces no matching stations',()=>{
 const none=mergeSettings({modes:Object.fromEntries(['metro','tram','bus','sbahn','regional','long'].map(k=>[k,false]))});
 assert.equal(stops.some(s=>stationMatchesModes(s,none)),false);
 assert.deepEqual(selectStopIds(stops,none),[]);
});
test('batching only asks for enabled platforms and fairly rotates station directions within 24 IDs',()=>{
 const metroStops=stops.filter(s=>stationMatchesModes(s,metroOnly)).slice(0,15);
 const a=selectStopIds(metroStops,metroOnly,24,0),b=selectStopIds(metroStops,metroOnly,24,1);
 assert.ok(a.length<=24);assert.equal(new Set(a).size,a.length);assert.notDeepEqual(a,b);
 for(const stop of metroStops)assert.ok(a.some(id=>stop.rbl.includes(id)));
 for(const id of a)assert.ok(metroStops.some(s=>s.platforms.some(p=>p.id===id&&p.modes.includes('metro'))));
 const station=stops.find(s=>s.name==='Stephansplatz U');
 assert.deepEqual(selectStopIds([station],null,24).sort(),station.rbl.slice().sort());
});
test('existing locally imported station records keep offline line metadata after enrichment',()=>{
 const s=stops.find(s=>s.name==='Stephansplatz U');
 const copy={id:s.id,name:s.name,provider:'wl',lat:s.lat,lon:s.lon,rbl:s.rbl};
 assert.equal(stationMatchesModes(enrichStops([copy],stops)[0],metroOnly),true);
});
test('monitor-level transport type identifies real tram lines even when line.type is missing',()=>{
 const data={data:{monitors:[{type:'ptTram',locationStop:{properties:{title:'Public test station',attributes:{rbl:1}}},lines:[{name:'1',towards:'Test',departures:{departure:[{departureTime:{timePlanned:new Date(t).toISOString()}}]}}]}]}};
 assert.equal(parseWlMonitors(data)[0].mode,'tram');
});
test('small stationary updates refresh fix time and accuracy instead of remaining stale',()=>{
 const a=updateLocation({},fix(),t),b=updateLocation(a,fix(t+120_000,{lat:48.20811,accuracy:10}),t+120_000);
 assert.equal(b.position.timestamp,t+120_000);assert.equal(b.position.accuracy,10);
 assert.equal(locationSnapshot(b,t+120_001).stale,false);
});
test('coarse underground fix remains usable, preserves a recent overlapping fix and disables reachability',()=>{
 const first=updateLocation({},fix(),t);
 const coarse=updateLocation(first,fix(t+20_000,{lat:48.209,accuracy:600}),t+20_000);
 assert.equal(coarse.position.timestamp,t);assert.equal(locationSnapshot(coarse,t+20_000).approximate,true);
 assert.equal(locationSnapshot(coarse,t+20_000).reliable,false);
 const only=updateLocation({},fix(t,{accuracy:800}),t);
 assert.ok(only.position);assert.equal(locationSnapshot(only,t).reliable,false);
 assert.equal(locationSnapshot(first,t+91_000).stale,true);
 const moved=updateLocation(first,fix(t+100_000,{lat:48.23,accuracy:600}),t+100_000);
 assert.equal(moved.position.lat,48.23);
});
test('fast movement pauses walking certainty, low-speed hysteresis prevents flicker and resumes after stopping',()=>{
 let state=updateLocation({},fix(t,{speed:10}),t);
 assert.equal(locationSnapshot(state,t).moving,true);assert.equal(locationSnapshot(state,t).reliable,false);
 state=updateLocation(state,fix(t+10_000,{speed:0}),t+10_000);
 assert.equal(locationSnapshot(state,t+10_000).moving,true);
 state=updateLocation(state,fix(t+56_000,{speed:0}),t+56_000);
 assert.equal(locationSnapshot(state,t+56_000).moving,false);assert.equal(locationSnapshot(state,t+56_000).reliable,true);
 const noise=updateLocation({},fix(t,{accuracy:700,speed:12}),t);
 assert.equal(locationSnapshot(noise,t).moving,false);
});
test('displacement can identify fast movement without device speed; inaccurate jumps cannot',()=>{
 let state=updateLocation({},fix(),t);
 state=updateLocation(state,fix(t+20_000,{lat:48.212}),t+20_000);
 assert.equal(locationSnapshot(state,t+20_000).moving,true);
 let rough=updateLocation({},fix(t,{accuracy:900}),t);
 rough=updateLocation(rough,fix(t+20_000,{lat:48.3,accuracy:1000}),t+20_000);
 assert.equal(locationSnapshot(rough,t+20_000).moving,false);
});
test('departure cache retains other stations on movement and on failure, expires old/past records',()=>{
 const d=(id,rbl,age=0)=>({id,rbl,provider:'wl',fetchedAt:new Date(t-age).toISOString(),actual:new Date(t+300_000).toISOString()});
 const a=d('a','4111'),b=d('b','4112'),c=d('c','4111');
 assert.deepEqual(retainDepartures([a,b],[c],['4111'],t).map(x=>x.id).sort(),['b','c']);
 assert.deepEqual(retainDepartures([a,b],[],[],t).map(x=>x.id).sort(),['a','b']);
 assert.equal(retainDepartures([d('old','4111',601_000)],[],[],t).length,0);
 assert.equal(departureIsFresh(d('older','4111',91_000),t),false);
 assert.equal(retryDelay(1,403),60_000);assert.equal(retryDelay(8,403),300_000);
});
test('approximate street address uses public offline data and never invents a house number',async()=>{
 const data=JSON.parse(await readFile(new URL('../pwa/data/streets.json',import.meta.url),'utf8'));
 const lookup=createAddressLookup(data),address=lookup({lat:48.2083,lon:16.3731});
 assert.equal(address.postcode,'1010');assert.match(address.street,/Stephansplatz/);
 assert.match(address.text,/Umgebung/);assert.ok(address.meters<150);
 assert.equal(lookup({lat:47.07,lon:15.43}),null);
});
