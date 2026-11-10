import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createLineMaps,validateLineMap,lineMapDirections,preferredLinePattern,lineMapTimetableUrl,lineMapMonitorUrl,nearestLineStop,bindLineStopInteraction} from '../pwa/src/line-maps.mjs';
import {decodeJourneyPolyline} from '../pwa/src/journey-geometry.mjs';

const data=name=>readFile(new URL('../pwa/data/'+name,import.meta.url),'utf8');
const manifest=JSON.parse(await data('timetables/wien/manifest.json'));
const index=JSON.parse(await data('line-maps/wien/index.json'));
const entry=index.lines.find(line=>line.route==='U1'&&line.mode==='metro');
const raw=await data('line-maps/wien/'+entry.file),u1=JSON.parse(raw);
test('overlapping touch targets choose the station nearest the actual pointer; keyboard and identical points retain the intended stop',()=>{
 const points=[{x:100,y:100},{x:100,y:120}];
 assert.equal(nearestLineStop(points,{x:100,y:100},1),0);
 assert.equal(nearestLineStop(points,{x:100,y:120},0),1);
 assert.equal(nearestLineStop(points,{x:400,y:400},1),1);
 assert.equal(nearestLineStop(points,null,0),0);
 assert.equal(nearestLineStop([{x:1,y:1},{x:1,y:1}],{x:1,y:1},1),1);
});

test('every published Vienna line has real decodable geometry, ordered actual stops and matching source/calendar',async()=>{
 const timetables=JSON.parse(await data('timetables/wien/lines.json'));
 assert.deepEqual(index.lines.map(line=>line.id).sort(),timetables.lines.map(line=>line.id).sort());
 assert.equal(index.sourceSha256,manifest.sourceSha256);let count=0;
 for(const line of index.lines){
  const text=await data('line-maps/wien/'+line.file),bundle=JSON.parse(text);
  assert.equal(createHash('sha256').update(text).digest('hex'),line.sha256);
  assert.equal(validateLineMap(bundle,line,manifest),bundle);assert.equal(line.mapped,line.patterns);
  for(const p of bundle.patterns){assert.ok(p.geometry);const points=decodeJourneyPolyline(bundle.shapes[p.geometry]);assert.ok(points.length>1);assert.ok(p.services.length);assert.ok(p.sourceShapeIds.length);assert.ok(p.stops.every(s=>s.platformId));count++;}
 }
 assert.ok(count>500);
});
test('U1 has both full real-world directions and separate short workings; calendar duplicates are merged',()=>{
 assert.equal(u1.patterns.length,5);assert.equal(lineMapDirections(u1).length,2);
 const north=u1.patterns.find(p=>p.direction==='0'&&p.stops.length===24),south=u1.patterns.find(p=>p.direction==='1'&&p.stops.length===24);
 assert.match(north.stops[0].name,/Oberlaa/);assert.match(north.stops.at(-1).name,/Leopoldau/);
 assert.deepEqual(north.stops.map(s=>s.id),south.stops.map(s=>s.id).reverse());
 assert.ok(north.sourceShapeIds.length>1);assert.ok(u1.patterns.some(p=>p.direction==='0'&&p.stops.length===22));
 const karls=north.stops.findIndex(s=>s.name==='Karlsplatz U'),stephans=north.stops.findIndex(s=>s.name==='Stephansplatz U');assert.equal(stephans,karls+1);
 const points=decodeJourneyPolyline(u1.shapes[north.geometry]);assert.ok(points.some(([lat,lon])=>lat>48.25&&lon>16.4));
});
test('line selection uses exact mode, stop identity and direction; outside-catalogue stops do not get invented timetable links',()=>{
 const pattern=preferredLinePattern(u1.patterns,manifest,{day:'2026-11-10',stopId:'wl:60200657',towards:'Oberlaa'});
 assert.equal(pattern.direction,'1');assert.equal(pattern.stops.length,24);
 const link=new URL(lineMapTimetableUrl(u1,pattern,pattern.stops[0]),'https://example.test');
 assert.equal(link.searchParams.get('verkehrsmittel'),'metro');assert.equal(link.searchParams.get('halt'),pattern.stops[0].id);
 assert.equal(lineMapTimetableUrl(u1,pattern,{id:'gtfs:external'}),null);
});
test('corrupt or mixed geometry, source versions and stop sequences fail rather than drawing invented connections',()=>{
 for(const mutate of [d=>d.version='old',d=>d.sourceSha256='different',d=>d.mode='bus',d=>d.patterns[0].stops[1].sequence=d.patterns[0].stops[0].sequence,d=>d.patterns[0].stops[0].lat=0,d=>d.shapes[d.patterns[0].geometry]='bad']){
  const copy=structuredClone(u1);mutate(copy);assert.throws(()=>validateLineMap(copy,entry,manifest));
 }
});
test('a selected line survives a cold offline reopen; an unavailable unsaved line does not pretend it is cached',async()=>{
 const saved=new Map();let online=true;
 const options={get:async key=>saved.get(key),put:async(key,value)=>saved.set(key,value),fetch:async url=>{if(!online)throw Error('offline');return new Response(String(url).includes('index.json')?JSON.stringify(index):raw);}};
 const first=createLineMaps(options);await first.index(manifest);assert.equal((await first.line(entry,manifest)).offline,true);
 online=false;const cold=createLineMaps(options);assert.equal((await cold.index(manifest)).version,manifest.version);assert.equal((await cold.line(entry,manifest)).data.patterns.length,5);
 await assert.rejects(()=>cold.line(index.lines.find(row=>row.id!==entry.id),manifest),/offline/);
 await assert.rejects(()=>cold.index({...manifest,version:'new'}),/anderen Fahrplan/);
});
test('failed storage is reported honestly and aborted responses cannot save new data',async()=>{
 let writes=0;const store=createLineMaps({get:async()=>null,put:async()=>{writes++;throw Error('full');},fetch:async()=>new Response(raw)});
 assert.equal((await store.line(entry,manifest)).offline,false);
 const abort=new AbortController();abort.abort();await assert.rejects(()=>store.line(entry,manifest,{signal:abort.signal}),{name:'AbortError'});assert.equal(writes,1);
});

test('a map stop offers separate schedule and monitor links only when the exact monitor station is known',()=>{
 const line={route:'U6',mode:'metro'},pattern={towards:'Siebenhirten'},stop={id:'wl:60201372',name:'Thaliastraße U'},catalogue=[{...stop,provider:'wl',rbl:['5668']}];
 const href=lineMapMonitorUrl(line,pattern,stop,catalogue),url=new URL(href,'https://foama-wien.endruuu.chatgpt.site/');
 assert.equal(url.searchParams.get('halt'),stop.id);assert.equal(url.searchParams.get('linie'),'U6');assert.equal(url.searchParams.get('richtung'),'Siebenhirten');
 assert.match(lineMapTimetableUrl(line,pattern,stop),/^\.\/fahrplan.html/);
 assert.equal(lineMapMonitorUrl(line,pattern,{id:'gtfs:outside'},catalogue),null);
});

test('hover, movement inside an overlapping hit area and click resolve the same station; keyboard keeps its own marker',()=>{
 const handlers={},marker={on(names,fn){for(const name of names.split(' '))handlers[name]=fn;return this;}},events=[];
 const stops=[{lat:100,lon:100},{lat:100,lon:120}],map={latLngToContainerPoint:([x,y])=>({x,y}),mouseEventToContainerPoint:mouse=>({x:mouse.clientX,y:mouse.clientY})};
 bindLineStopInteraction(marker,map,stops,1,{hover:i=>events.push(['hover',i]),leave:()=>events.push(['leave']),select:i=>events.push(['select',i])});
 const at=(x,y)=>({originalEvent:{clientX:x,clientY:y}});
 handlers.mouseover(at(100,100));handlers.click(at(100,100));assert.deepEqual(events,[['hover',0],['leave'],['select',0]]);
 events.length=0;handlers.mousemove(at(100,120));handlers.click(at(100,120));assert.deepEqual(events,[['hover',1],['leave'],['select',1]]);
 events.length=0;handlers.click({originalEvent:{key:'Enter'}});assert.deepEqual(events,[['leave'],['select',1]]);
 events.length=0;handlers.keypress({originalEvent:{key:'Enter'}});assert.deepEqual(events,[['leave'],['select',1]]);
 events.length=0;handlers.keypress({originalEvent:{keyCode:13}});assert.deepEqual(events,[['leave'],['select',1]]);
 events.length=0;handlers.keypress({originalEvent:{key:'a'}});assert.deepEqual(events,[]);
 handlers.mouseout();assert.deepEqual(events.at(-1),['leave']);
});
