import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {stationMapMarker,stationMapPosition} from '../pwa/src/station-map-marker.mjs';import {stationLines} from '../pwa/src/station-catalog.mjs';
test('Floridsdorf marker contains every catalogue line in a compact multirow icon',async()=>{const raw=JSON.parse(await readFile(new URL('../pwa/data/stops.json',import.meta.url),'utf8')),stop=(raw.stops||raw).find(s=>/Floridsdorf S U/.test(s.name));assert.ok(stop);const lines=stationLines(stop).filter(l=>['metro','tram','bus','sbahn'].includes(l.mode));assert.ok(lines.length>2);const icon=stationMapMarker(lines,r=>'<b>'+r+'</b>');for(const line of lines)assert.ok(icon.html.includes('<b>'+line.route+'</b>'));assert.equal((icon.html.match(/<b>/g)||[]).length,lines.length);assert.ok(icon.iconSize[0]<=160);assert.ok(icon.iconSize[1]>44);assert.equal(icon.iconAnchor[1],icon.iconSize[1]-6);assert.match(icon.html,/station-map-point/);assert.match(icon.html,/station-map-stem/);});
test('single-line markers retain a 44-pixel target',()=>{assert.deepEqual(stationMapMarker([{route:'U6',mode:'metro'}],r=>r).iconSize,[44,44]);});

test('Giefinggasse and Paukerwerkstraße use physical platforms from the installed timetable',async()=>{
 const catalogue=JSON.parse(await readFile(new URL('../pwa/data/stops.json',import.meta.url),'utf8'));
 const points=JSON.parse(await readFile(new URL('../pwa/data/station-map-points.json',import.meta.url),'utf8'));
 for(const [name,expected] of [['Giefinggasse',[48.267875,16.426297]],['Paukerwerkstraße',[48.269681,16.426665]]]){
  const stop=catalogue.stops.find(s=>s.name===name);
  assert.deepEqual(stationMapPosition(stop,points,stationLines(stop),'2026-11-12'),expected);
  assert.notDeepEqual(expected,[stop.lat,stop.lon]);
 }
});

test('map positions respect identity, modes, service dates and safe catalogue fallback',()=>{
 const stop={id:'station',lat:48.2,lon:16.4};
 const row={lat:48.201,lon:16.401,route:'3',mode:'bus',services:[0]};
 const data={format:1,city:'wien',validFrom:'2026-11-09',validThrough:'2026-12-12',services:[['2026-11-12']],stations:{station:[row]}};
 const lines=[{route:'3',mode:'bus'}],fallback=[stop.lat,stop.lon];
 assert.deepEqual(stationMapPosition(stop,data,lines,'2026-11-12'),[row.lat,row.lon]);
 assert.deepEqual(stationMapPosition(stop,data,[{route:'3',mode:'tram'}],'2026-11-12'),fallback);
 for(const day of ['2026-11-13','2026-12-13'])assert.deepEqual(stationMapPosition(stop,data,lines,day),fallback);
 assert.deepEqual(stationMapPosition({...stop,id:'other'},data,lines,'2026-11-12'),fallback);
 assert.deepEqual(stationMapPosition(stop,null,lines,'2026-11-12'),fallback);
 assert.deepEqual(stationMapPosition(stop,{...data,stations:{station:[{...row,lat:NaN}]}},lines,'2026-11-12'),fallback);
 const other={...row,lat:48.21,lon:16.41};
 assert.deepEqual(stationMapPosition(stop,{...data,stations:{station:[other,row]}},lines,'2026-11-12'),[row.lat,row.lon]);
});
