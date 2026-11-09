import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CITY_PROFILES,createCityController,detectedCity,stopCity,recentDetectedCity} from '../pwa/src/city-profiles.mjs';
import {sanitizeJourneyFavorites} from '../pwa/src/journey-favorites.mjs';
import {providerStationIdentity,regionalRequestStops} from '../pwa/src/regional-departures.mjs';

const now=Date.parse('2026-11-09T12:00Z');
const fix=(city,options={})=>({...CITY_PROFILES[city].center,accuracy:20,timestamp:now,...options});
test('Vienna is the default; only fresh foreground GPS can select another city, without changing the manual preference',()=>{
 let at=now;const changes=[],controller=createCityController({onChange:city=>changes.push(city.id),now:()=>at});
 assert.equal(controller.current().id,'wien');
 for(const options of [{visible:false},{manual:true}])controller.observe(fix('linz'),options);
 controller.observe(fix('linz',{accuracy:1000}));controller.observe(fix('linz',{timestamp:now-90001}));assert.equal(controller.current().id,'wien');
 controller.observe(fix('linz'));assert.equal(controller.current().id,'linz');assert.deepEqual(changes,['linz']);assert.equal(controller.preference(),'auto');
 controller.select('salzburg');controller.observe(fix('graz'));assert.equal(controller.current().id,'salzburg');assert.equal(controller.automatic().id,'graz');
 controller.select('auto');assert.equal(controller.current().id,'graz');assert.equal(detectedCity({lat:49,lon:11,accuracy:20,timestamp:now},{now}),'wien');
 at+=90001;controller.select('wien');controller.select('auto');assert.equal(controller.current().id,'wien');
});
test('moderate fixes require distinct confirmations; city edges use hysteresis and leaving returns to Vienna',()=>{
 let at=now;const controller=createCityController({now:()=>at});controller.observe(fix('graz',{accuracy:150}));assert.equal(controller.current().id,'wien');
 at+=6000;controller.observe(fix('graz',{accuracy:150,timestamp:at}));assert.equal(controller.current().id,'graz');
 const edge={lat:47.0707+12.2/111.195,lon:15.4395,accuracy:80,timestamp:at};controller.observe(edge);at+=6000;controller.observe({...edge,timestamp:at});assert.equal(controller.current().id,'graz');
 controller.observe(fix('wien',{timestamp:at}));assert.equal(controller.current().id,'wien');
});
test('navigation cache is short-lived, stores only a city and timestamp, and never replaces missing initial GPS with an old detection',()=>{
 const session={getItem:()=>JSON.stringify({city:'linz',at:now-30000})};assert.equal(recentDetectedCity(session,now),'linz');assert.equal(recentDetectedCity(session,now+90000),'wien');
 assert.equal(recentDetectedCity({getItem:()=>'{broken'},now),'wien');assert.equal(stopCity({stopId:'wl:60201468'}),'wien');assert.equal(stopCity({stopId:'graz:at:46:4046'}),'graz');
});
test('regional catalogs retain source namespaces and exact IFOPT identity; visible stations win the bounded rotation',async()=>{
 for(const city of ['graz','linz','salzburg']){const data=JSON.parse(await readFile(new URL(`../pwa/data/cities/${city}.json`,import.meta.url),'utf8'));
  assert.ok(data.stops.length>400);assert.equal(new Set(data.stops.map(s=>s.id)).size,data.stops.length);
  for(const stop of data.stops){assert.equal(stop.id,city+':'+providerStationIdentity(stop.providerStopId));assert.equal(stop.city,city);assert.equal(stop.provider,'transitous');assert.ok(stop.modes.length);assert.deepEqual(stop.lines,[]);}
 }
 const stops=Array.from({length:7},(_,i)=>({id:'graz:'+i,provider:'transitous'}));
 const selected=regionalRequestStops(stops,{visible:new Set(['graz:5']),expanded:new Set(['graz:4']),cycle:0});assert.equal(selected.length,3);assert.equal(selected[0].id,'graz:5');
 const visited=new Set();for(let i=0;i<7;i++)regionalRequestStops(stops,{cycle:i}).forEach(s=>visited.add(s.id));assert.equal(visited.size,7);
});
test('saved route IDs for other cities survive export sanitization alongside existing Vienna stations',()=>{
 const route={id:'route',savedAt:now,name:'Arbeit',from:{kind:'point',name:'Graz Hauptplatz',lat:47.07,lon:15.43},to:{kind:'point',name:'Graz Hbf',lat:47.07,lon:15.42},legs:[{mode:'tram',route:'1',towards:'Graz Hbf',from:{name:'Graz Hauptplatz',stopId:'graz:at:46:4046'},to:{name:'Graz Hbf',stopId:'graz:at:46:3040'},durationSeconds:500}]};
 const [safe]=sanitizeJourneyFavorites([route]);assert.equal(safe.legs[0].from.stopId,route.legs[0].from.stopId);assert.equal(safe.name,'Arbeit');
});
