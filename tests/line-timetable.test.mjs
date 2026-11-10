import test from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {readFile} from 'node:fs/promises';
import {lineDayDepartures,hourlyTimetable,timetableHourKey,timetableDayOptions} from '../pwa/src/line-timetable.mjs';
import {createTimetable} from '../pwa/src/timetable.mjs';

const manifest={format:1,city:'wien',timezone:'Europe/Vienna',version:'test',validFrom:'2026-11-09',validThrough:'2026-11-12',services:[['2026-11-09'],['2026-11-10'],['2026-11-11']],stations:{'wl:1':0},shards:{0:'hash'}};
const rows={'wl:1':[['3','Nord','bus','at:49:1:0:1','0',0,[93600]],['3','Nord','bus','at:49:1:0:1','0',1,[3600,43200]],['3','Süd','bus','at:49:1:0:2','1',1,[43200]],['3','Nord','tram','at:49:1:0:3','0',1,[36000]],['3','Nord','bus','at:49:1:0:1','0',2,[43200]]]};
test('date choices always start with Heute in Vienna, roll over at local midnight and stay within future coverage',()=>{
 const before=timetableDayOptions(manifest,Date.parse('2026-11-09T22:59:00Z'));
 assert.equal(before[0].value,'2026-11-09');assert.match(before[0].label,/^Heute ·/);
 const after=timetableDayOptions(manifest,Date.parse('2026-11-09T23:01:00Z'));
 assert.deepEqual(after.map(day=>day.value),['2026-11-10','2026-11-11','2026-11-12']);assert.match(after[0].label,/^Heute ·/);
 assert.deepEqual(timetableDayOptions(manifest,Date.parse('2026-11-13T12:00Z')).map(day=>day.value),['2026-11-13']);
 const notStarted=timetableDayOptions({...manifest,validFrom:'2026-11-11'},Date.parse('2026-11-09T23:01Z'));
 assert.deepEqual(notStarted.map(day=>day.value),['2026-11-10','2026-11-11','2026-11-12']);
});
test('current-hour markers distinguish dates and both occurrences of the autumn clock hour',()=>{
 const autumn={...manifest,validFrom:'2026-10-25',validThrough:'2026-10-25',services:[['2026-10-25']]};
 const hours=hourlyTimetable(lineDayDepartures(autumn,{'wl:1':[['U1','Nord','metro','p','0',0,[3600,7200]]]}, {route:'U1',mode:'metro',stopId:'wl:1',day:'2026-10-25'}));
 const first=timetableHourKey(Date.parse('2026-10-25T00:30Z')),second=timetableHourKey(Date.parse('2026-10-25T01:30Z'));
 assert.notEqual(first,second);assert.deepEqual(hours.filter(hour=>hour.key===first).map(hour=>hour.departures[0].time),[Date.parse('2026-10-25T00:00Z')]);
 assert.deepEqual(hours.filter(hour=>hour.key===second).map(hour=>hour.departures[0].time),[Date.parse('2026-10-25T01:00Z')]);
 assert.equal(hours.filter(hour=>hour.key===timetableHourKey(Date.parse('2026-10-26T01:30Z'))).length,0);
 assert.notEqual(timetableHourKey(Date.parse('2026-11-09T23:59Z')),timetableHourKey(Date.parse('2026-11-10T00:00Z')));
});
test('whole-day line timetable respects the real service date, overnight runs, mode, direction and station',()=>{
 const d=lineDayDepartures(manifest,rows,{route:'3',mode:'bus',stopId:'wl:1',towards:'Nord',day:'2026-11-10'});
 assert.deepEqual(d.map(row=>row.clock),['01:00','02:00','12:00']);assert.equal(d[1].serviceDay,'2026-11-09');
 assert.equal(lineDayDepartures(manifest,rows,{route:'3',mode:'tram',stopId:'wl:1',day:'2026-11-10'})[0].clock,'10:00');
 assert.equal(lineDayDepartures(manifest,rows,{route:'3',mode:'bus',stopId:'wl:999',day:'2026-11-10'}).length,0);
 assert.equal(lineDayDepartures(manifest,rows,{route:'3',mode:'bus',stopId:'wl:1',day:'2026-11-10'}).filter(d=>d.clock==='12:00').length,2);
});
test('invalid, expired or uncovered dates never become a different timetable day',()=>{
 for(const day of ['2026-11-08','2026-11-13','2026-99-99','2026-02-30','invalid',''])assert.deepEqual(lineDayDepartures(manifest,rows,{route:'3',mode:'bus',stopId:'wl:1',day}),[]);
 assert.deepEqual(lineDayDepartures({...manifest,timezone:'UTC'},rows,{route:'3',mode:'bus',stopId:'wl:1',day:'2026-11-10'}),[]);
});
test('repeated autumn clock hours remain distinct and spring has no nonexistent hour',()=>{
 const autumn={...manifest,validFrom:'2026-10-25',validThrough:'2026-10-25',services:[['2026-10-25']]};
 const values={'wl:1':[['U1','Nord','metro','p','0',0,[3600,7200]]]};
 const d=lineDayDepartures(autumn,values,{route:'U1',mode:'metro',stopId:'wl:1',day:'2026-10-25'});assert.deepEqual(d.map(d=>d.clock),['02:00','02:00']);const hours=hourlyTimetable(d);assert.equal(hours.length,2);assert.notEqual(hours[0].label,hours[1].label);
 const spring={...manifest,validFrom:'2026-03-29',validThrough:'2026-03-29',services:[['2026-03-29']]};values['wl:1'][0][6]=[3600,7200,10800];
 assert.ok(lineDayDepartures(spring,values,{route:'U1',mode:'metro',stopId:'wl:1',day:'2026-03-29'}).every(d=>d.hour!=='02'));
});
test('line data remains available offline in the existing versioned station cache, beyond the two-hour monitor window',async()=>{
 const cached=new Map(),packed={format:1,version:manifest.version,encoding:'gzip-base64',payload:gzipSync(JSON.stringify(rows)).toString('base64')};let online=true,calls=0;
 const options={now:()=>Date.parse('2026-11-10T20:00Z'),get:async key=>cached.get(key),put:async(key,value)=>{cached.set(key,value);return true;},fetch:async url=>{calls++;if(!online)throw Error('offline');return Response.json(String(url).includes('manifest')?manifest:packed);}};
 const source=createTimetable(options),first=await source.stationRows([{id:'wl:1',provider:'wl'}]);assert.equal(first.offline,true);assert.deepEqual(first.rows,rows);assert.equal(calls,2);assert.equal((await source.load([{id:'wl:1',provider:'wl'}])).length,0);
 online=false;const offline=createTimetable(options),second=await offline.stationRows([{id:'wl:1',provider:'wl'}]);assert.equal(second.offline,true);assert.deepEqual(second.rows,rows);assert.equal(lineDayDepartures(second.manifest,second.rows,{route:'3',mode:'bus',stopId:'wl:1',day:'2026-11-10'}).length,4);
});
test('failed device storage is never reported as an offline saved line, including a second memory-only load',async()=>{
 const packed={format:1,version:manifest.version,encoding:'gzip-base64',payload:gzipSync(JSON.stringify(rows)).toString('base64')};
 const source=createTimetable({get:async()=>null,put:async()=>{throw Error('storage full');},fetch:async url=>Response.json(String(url).includes('manifest')?manifest:packed)});
 assert.equal((await source.stationRows([{id:'wl:1',provider:'wl'}])).offline,false);assert.equal((await source.stationRows([{id:'wl:1',provider:'wl'}])).offline,false);
});
test('published line index is bound to the imported calendar version and known exact station identities',async()=>{
 const data=async name=>JSON.parse(await readFile(new URL('../pwa/data/'+name,import.meta.url),'utf8'));
 const [index,manifest,stops]=await Promise.all([data('timetables/wien/lines.json'),data('timetables/wien/manifest.json'),data('stops.json')]);
 assert.equal(index.version,manifest.version);assert.ok(index.lines.some(line=>line.route==='U1'&&line.mode==='metro'));assert.ok(index.lines.length>150);const known=new Set(stops.stops.map(s=>s.id));
 for(const line of index.lines){assert.equal(line.id,line.mode+'|'+line.route);assert.ok(line.stops.length);for(const stop of line.stops){assert.ok(known.has(stop.id));assert.ok(stop.towards.length);}}
});
