import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {timetableDepartures,serviceDayStart,createTimetable,mergeTimetableDepartures} from '../pwa/src/timetable.mjs';
import {departureAtStation,lineHasCurrentDeparture} from '../pwa/src/connection-detail.mjs';
import {journeyLineDepartures} from '../pwa/src/journey-planning.mjs';
import {availableDeparts,DEFAULTS,favoriteMatches,directionEquivalent} from '../pwa/src/core.mjs';
import {connectionDepartures,connectionRequestIds} from '../pwa/src/connection-detail.mjs';

const now=Date.parse('2026-11-09T11:00:00Z'),stop={id:'wl:60201468',provider:'wl',rbl:['123']};
const manifest={format:1,timezone:'Europe/Vienna',version:'test',validFrom:'2026-11-09',validThrough:'2026-11-10',services:[['2026-11-08','2026-11-09']],stations:{[stop.id]:0},shards:{0:'hash'}};
const row=(seconds,towards='Siebenhirten')=>['U6',towards,'metro','at:49:1468:0:2','1',0,seconds];
test('GTFS calendar validity, yesterday after 24h, next day and no boarding duplicates are evaluated independently of API availability',()=>{
 const morning=Date.parse('2026-11-09T00:10:00Z');
 const rows=timetableDepartures(manifest,{[stop.id]:[row([25*3600+20*60]),row([25*3600+20*60])]},morning);
 assert.equal(rows.length,1);assert.equal(rows[0].actual,'2026-11-09T00:20:00.000Z');assert.equal(rows[0].serviceDay,'2026-11-08');
 assert.equal(rows[0].quality,'schedule');assert.equal(rows[0].realtime,null);assert.equal(rows[0].fetchedAt,null);
 assert.equal(timetableDepartures(manifest,{[stop.id]:[row([43260])]},Date.parse('2026-11-11T00:10Z')).length,0);
 assert.equal(timetableDepartures(manifest,{[stop.id]:[row([43260])]},Date.parse('2026-11-08T11:00Z')).length,0);
 assert.equal(timetableDepartures({...manifest,services:[['2026-11-10']]},{[stop.id]:[row([43260])]},now).length,0);
});
test('service-day origin uses Europe/Vienna noon minus twelve hours across both DST changes',()=>{
 assert.equal(new Date(serviceDayStart('2026-03-29')+3*3600000).toISOString(),'2026-03-29T01:00:00.000Z');
 assert.equal(new Date(serviceDayStart('2026-10-25')+3*3600000).toISOString(),'2026-10-25T02:00:00.000Z');
});
test('fresh operator data takes precedence per actual station, line and direction; stale or absent lines get labelled schedule',()=>{
 const planned=timetableDepartures(manifest,{[stop.id]:[row([43260]),row([43320],'Floridsdorf')]},now);
 const live={id:'live',provider:'wl',rbl:'123',route:'U6',mode:'metro',towards:'Wien Siebenhirten',actual:new Date(now+180000).toISOString(),fetchedAt:new Date(now).toISOString(),quality:'live'};
 const merged=mergeTimetableDepartures([live],planned,[stop],now);
 assert.equal(merged.length,2);assert.ok(merged.includes(live));assert.equal(merged.find(d=>d.source==='gtfs').towards,'Floridsdorf');
 const stale={...live,fetchedAt:new Date(now-120000).toISOString()};assert.equal(mergeTimetableDepartures([stale],planned,[stop],now).length,2);
 assert.equal(mergeTimetableDepartures([],planned,[stop],now).length,2);
 assert.equal(mergeTimetableDepartures([{...live,rbl:'999'}],planned,[stop],now).length,3);
 assert.equal(departureAtStation(stop,planned[0]),true);assert.equal(lineHasCurrentDeparture(stop,{route:'U6'},planned,{now,hasError:true}),true);
 assert.equal(journeyLineDepartures({stopId:stop.id,route:'U6',mode:'metro',towards:'Siebenhirten'},planned,[stop],{now,earliest:now}).length,1);
});
test('tram 46 endpoint aliases suppress duplicate timetable rows and preserve saved direction links and platform choice',()=>{
 const station={id:'wl:60201372',provider:'wl',rbl:['1379','1392']};
 const live={provider:'wl',rbl:'1392',route:'46',mode:'tram',towards:'Parlament, U Volkstheater',actual:new Date(now+180000).toISOString(),fetchedAt:new Date(now).toISOString(),quality:'live'};
 const outward={...live,rbl:'1379',towards:'Joachimsthalerplatz'};
 const planned={...live,stopId:station.id,rbl:undefined,source:'gtfs',towards:'Parlament/Volkstheater',quality:'schedule',fetchedAt:null};
 const target={stopId:station.id,route:'46',mode:'tram',towards:planned.towards};
 const merged=mergeTimetableDepartures([live,outward],[planned],[station],now);
 assert.deepEqual(merged,[live,outward]);assert.equal(availableDeparts(merged,DEFAULTS,now).length,2);
 assert.equal(availableDeparts([live,planned],DEFAULTS,now).length,1);
 assert.equal(favoriteMatches(target,live),true);assert.deepEqual(connectionDepartures(station,target,merged,now),[live]);
 assert.deepEqual(connectionRequestIds(station,target,merged),['1392']);
 const stale={...live,fetchedAt:new Date(now-120000).toISOString()};
 assert.deepEqual(mergeTimetableDepartures([stale],[planned],[station],now),[planned]);
 for(const towards of ['Volkstheater','Parlament, U Karlsplatz','Parlament, U Volkstheater (via Zentrum)'])assert.equal(favoriteMatches({...target,towards},live),false);
 assert.equal(directionEquivalent(planned.towards,live.towards),true);
 assert.equal(directionEquivalent('Parlament/Volkstheater (via A)','Parlament, U Volkstheater (via B)'),false);
 assert.equal(mergeTimetableDepartures([{...live,mode:'bus'}],[planned],[station],now).length,2);
 assert.equal(mergeTimetableDepartures([{...live,rbl:'999'}],[planned],[station],now).length,2);
});
test('station shards persist for a cold offline load, remain bound to their calendar version, and metadata expiry prevents false departures',async()=>{
 const packed={format:1,version:manifest.version,encoding:'gzip-base64',payload:gzipSync(JSON.stringify({[stop.id]:[row([43260])]})).toString('base64')};
 const saved=new Map(),requests=[];const options={now:()=>now,get:async key=>saved.get(key),put:async(key,value)=>saved.set(key,value)};
 const online=createTimetable({...options,fetch:async url=>{requests.push(url);return Response.json(url.includes('manifest')?manifest:packed);}});
 assert.equal((await online.load([stop])).length,1);assert.equal(requests.length,2);
 assert.equal((await online.load([stop])).length,1);assert.equal(requests.length,2);
 const offline=createTimetable({...options,fetch:async()=>{throw Error('offline');}});assert.equal((await offline.load([stop])).length,1);
 const expired=createTimetable({...options,now:()=>now+3*86400000,fetch:async()=>{throw Error('offline');}});assert.deepEqual(await expired.load([stop]),[]);
 const controller=new AbortController();controller.abort();await assert.rejects(offline.load([stop],{signal:controller.signal}),{name:'AbortError'});
});
test('real official Vienna timetable covers Westbahnhof independently, without fabricated RBL mappings or line 1/2 associations',async()=>{
 const base=new URL('../pwa/data/timetables/wien/',import.meta.url),meta=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
 const cache=createTimetable({now:()=>now,get:async()=>null,put:async()=>{},fetch:async url=>Response.json(JSON.parse(await readFile(new URL(url.replace('./data/timetables/wien/','').split('?')[0],base),'utf8')))});
 const rows=await cache.load([stop]);assert.ok(rows.some(d=>d.route==='U6'));assert.ok(rows.some(d=>d.route==='U3'));assert.ok(rows.every(d=>!['1','2'].includes(d.route)&&!d.rbl&&d.source==='gtfs'));
 assert.equal(meta.validThrough,'2026-12-12');assert.ok(Object.keys(meta.stations).length>1500);
});
