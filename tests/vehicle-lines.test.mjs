import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {decodeVehiclePilot,validateVehiclePilot,pilotGeometry,normalizePilotSnapshot,createVehicleTracker,vehicleTargetMatches} from '../pwa/src/vehicle-tracker.mjs';
import {vehicleWindows,stationVehicleRange,preferredVehicleDirection,createVehicleData,vehicleUrl} from '../pwa/src/vehicle-data.mjs';
import {decodeJourneyPolyline} from '../pwa/src/journey-geometry.mjs';
const read=async p=>readFile(new URL(p,import.meta.url),'utf8'),json=async p=>JSON.parse(await read(p));
const [index,mapIndex,manifest]=await Promise.all([json('../pwa/data/vehicle-pilot/index.json'),json('../pwa/data/line-maps/wien/index.json'),json('../pwa/data/timetables/wien/manifest.json')]);
const packages=new Map();
async function load(id){if(!packages.has(id)){const entry=index.lines.find(l=>l.id===id),raw=await read('../pwa/data/vehicle-pilot/'+entry.file),data=await decodeVehiclePilot(JSON.parse(raw)),line=await json('../pwa/data/line-maps/wien/'+entry.file);packages.set(id,{entry,raw,data,line});}return packages.get(id);}
test('all published vehicle packages retain timetable hashes, exact platform order, usable real geometry and bounded monitor windows',async()=>{
 assert.equal(index.lines.length,165);assert.deepEqual(index.lines.filter(l=>l.mode==='metro').map(l=>l.route).sort(),['U1','U2','U3','U4','U6']);assert.equal(index.lines.length+index.unavailable.length,173);
 let patterns=0;
 for(const entry of index.lines){const {data,line,raw}=await load(entry.id);assert.equal(createHash('sha256').update(raw).digest('hex'),entry.sha256);assert.equal(validateVehiclePilot(data,manifest,line),data);assert.equal(data.lineFile,mapIndex.lines.find(l=>l.id===entry.id).file);assert.equal(data.route,entry.route);assert.equal(data.mode,entry.mode);assert.deepEqual(entry.patternIds,data.directions.map(d=>d.id));
  for(const d of data.directions){patterns++;const p=line.patterns.find(p=>p.id===d.patternId),geo=pilotGeometry(decodeJourneyPolyline(line.shapes[p.geometry]),d.stops);assert.deepEqual(geo.at(d.stops.length-1),geo.points.at(-1));const windows=vehicleWindows(d);assert.ok(windows.every(w=>w.ids.length>=2&&w.ids.length<=24&&new Set(w.ids).size===w.ids.length));assert.deepEqual(new Set(windows.flatMap(w=>w.ids)),new Set(d.stops.map(s=>s.rbl).filter(Boolean)));}
 }assert.equal(patterns,index.lines.reduce((n,l)=>n+l.patterns,0));assert.ok(patterns>600);
});
test('station neighbourhoods keep up to five real stops before and two after without padding route ends',async()=>{
 const {data}=await load('bus|48A'),d=data.directions.find(d=>d.stops.length===22);const middle=stationVehicleRange(d,d.stops[8].id);assert.deepEqual([middle.start,middle.center,middle.end],[3,8,10]);assert.ok(middle.ids.length<=8);
 const first=stationVehicleRange(d,d.stops[0].id),last=stationVehicleRange(d,d.stops.at(-1).id);assert.deepEqual([first.start,first.end],[0,2]);assert.deepEqual([last.start,last.end],[16,21]);assert.equal(stationVehicleRange(d,'wl:unknown'),null);
});
test('long lines use explicit overlapping sections while a station view stays below eight RBLs',async()=>{
 const {data}=await load('tram|5'),d=data.directions.find(d=>d.stops.length===28),ws=vehicleWindows(d);assert.equal(ws.length,2);assert.equal(ws[0].ids.length,24);assert.deepEqual(ws[1].ids.slice(0,2),ws[0].ids.slice(-2));assert.ok(vehicleWindows(d,99).every(w=>w.ids.length<=24));
});
test('destination aliases are bound to the actual endpoint and do not use fuzzy matching',async()=>{
 const {data}=await load('bus|48A'),d=data.directions.find(d=>d.towards==='Parlament/Volkstheater');assert.ok(d);assert.equal(vehicleTargetMatches(d,d.towards,'Parlament, U Volkstheater'),true);assert.equal(vehicleTargetMatches(d,d.towards,'Parlament, U Karlsplatz'),false);assert.equal(vehicleTargetMatches(d,d.towards,'Volkstheater'),false);
 const {line}=await load('bus|48A'),chosen=preferredVehicleDirection(data,line,manifest,{stopId:d.stops[8].id,towards:'Parlament, U Volkstheater',day:'2026-11-11'});assert.equal(chosen.monitorDirectionId,'2');
});
test('vehicle data loads one selected line on demand, verifies its content and reuses the versioned local package',async()=>{
 const item=await load('bus|48A'),cache=new Map(),requests=[];let mapCalls=0;
 const source=createVehicleData({now:()=>Date.parse('2026-11-11T09:00Z'),timetable:{metadata:async()=>manifest},maps:{index:async()=>mapIndex,line:async()=>{mapCalls++;return {data:item.line};}},get:async k=>cache.get(k),put:async(k,v)=>cache.set(k,v),fetch:async url=>{requests.push(url);return new Response(url.includes('index.json')?JSON.stringify(index):item.raw);}});
 await source.index();assert.equal(requests.length,1);await source.line(item.entry);assert.equal(requests.length,2);await source.line(item.entry);assert.equal(requests.length,2);assert.equal(mapCalls,2);
 const wrong={...item.entry,sha256:'0'.repeat(64)};await assert.rejects(source.line(wrong));
});
test('expired calendars and a catalog from another timetable cannot enable vehicle estimates',async()=>{
 const item=await load('bus|48A'),source=createVehicleData({now:()=>Date.parse('2026-12-13T09:00Z'),timetable:{metadata:async()=>manifest},get:async()=>null,put:async()=>{},fetch:async()=>new Response(JSON.stringify(index))});await assert.rejects(source.line(item.entry),/gültig/);
 const stale=createVehicleData({timetable:{metadata:async()=>manifest},get:async()=>null,put:async()=>{},fetch:async()=>new Response(JSON.stringify({...index,version:'other'}))});await assert.rejects(stale.index(),/Fahrzeugübersicht/);
});
test('links preserve route, mode, station, direction and variant without selecting another stop',()=>{
 const url=new URL(vehicleUrl({route:'48A',mode:'bus',stopId:'wl:60201372',towards:'Parlament/Volkstheater',view:'station',patternId:'abc'}),'https://example.test/');assert.equal(url.searchParams.get('halt'),'wl:60201372');assert.equal(url.searchParams.get('linie'),'48A');assert.equal(url.searchParams.get('verkehrsmittel'),'bus');assert.equal(url.searchParams.get('ansicht'),'station');assert.equal(url.searchParams.get('variante'),'abc');
});
