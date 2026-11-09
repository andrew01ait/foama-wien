import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeRegionalBoard,normalizeLinzBoard,efaDate} from '../pwa/src/regional-departures.mjs';
import {regionalApi} from '../cloudflare/src/regional-service.mjs';
import {localD1} from '../site/local-d1.mjs';
import {retainDepartures} from '../pwa/src/departure-cache.mjs';
import {departureAtStation} from '../pwa/src/connection-detail.mjs';
import {journeyStation,journeyLineDepartures} from '../pwa/src/journey-planning.mjs';
const fixture=async city=>JSON.parse(await readFile(new URL('./fixtures/'+city+'-board.json',import.meta.url),'utf8')).payload;
const grazer=await fixture('graz'),salzburger=await fixture('salzburg'),linzer=await fixture('linz');
const graz={id:'graz:at:46:4046',city:'graz',provider:'transitous',name:'Graz Hauptplatz/Congress',ifopt:'at:46:4046',providerStopId:'at-PTA-Styria-Flex-2026_at:46:4046:0:2'};
const linz={id:'linz:at:44:41166',city:'linz',provider:'transitous',name:'Linz/Donau Hauptplatz',ifopt:'at:44:41166',providerStopId:'at-Fahrplandaten-Linz-AG-Flex-2026_at:44:41166:0:0'};
const reference=Date.parse(grazer.stopTimes[0].place.departure)-1000;
test('real Graz data retains planned/actual, direction and known wheelchair availability, without associating a neighboring IFOPT station',()=>{
 const rows=normalizeRegionalBoard(grazer,graz,reference);assert.ok(rows.length);assert.ok(rows.every(d=>d.quality==='live'&&d.scheduled&&d.realtime));
 const wrong=structuredClone(grazer);wrong.stopTimes.forEach(row=>{row.place.stopId='other_at:46:9999:0:1';delete row.place.parentId;});assert.deepEqual(normalizeRegionalBoard(wrong,graz,reference),[]);
 const cancelled=structuredClone(grazer);cancelled.stopTimes.forEach(row=>row.cancelled=true);assert.deepEqual(normalizeRegionalBoard(cancelled,graz,reference),[]);
 const unknown=structuredClone(grazer);unknown.stopTimes.forEach(row=>row.wheelchairAccessible='UNKNOWN');assert.ok(normalizeRegionalBoard(unknown,graz,reference).every(d=>d.barrierFree===null));
 assert.equal(journeyStation(graz.providerStopId,[graz]),graz);assert.equal(departureAtStation(graz,rows[0]),true);
 assert.equal(retainDepartures([],rows,[],reference).length,rows.length);
 assert.ok(journeyLineDepartures({stopId:graz.id,route:rows[0].route,mode:rows[0].mode,towards:rows[0].towards},rows,[graz],{earliest:reference,now:reference}).length);
});
test('Salzburg always displays planned times in its initial timetable profile, including a hypothetical realtime row',()=>{
 const first=salzburger.stopTimes[0],ifopt=first.place.stopId.match(/P?(at:\d+:\d+)/)[1],stop={id:'salzburg:'+ifopt,ifopt,city:'salzburg',name:'Salzburg Hbf'};
 const payload=structuredClone(salzburger);payload.stopTimes.forEach(row=>row.realTime=true);
 const now=Date.parse(first.place.scheduledDeparture)-1000,rows=normalizeRegionalBoard(payload,stop,now);assert.ok(rows.length);assert.ok(rows.every(d=>d.quality==='schedule'&&d.realtime===null&&d.actual===d.scheduled));
});
test('Linz resolves the actual IFOPT identity reported by EFA, distinguishes realtime and rejects a wrong station or nonexistent DST wall time',()=>{
 const now=Date.parse(efaDate(linzer.departureList[0].dateTime))-1000,rows=normalizeLinzBoard(linzer,linz,now);assert.ok(rows.length);assert.ok(rows.some(d=>d.quality==='live'));assert.ok(rows.every(d=>d.stopId===linz.id));
 assert.throws(()=>normalizeLinzBoard(linzer,{...linz,ifopt:'at:44:99999'},now));assert.equal(efaDate({year:'2026',month:'03',day:'29',hour:'02',minute:'30'}),null);
});
test('regional relay permits only catalog identities and fixed providers, coalesces and caches without renewing timestamps, and shares the plan budget',async()=>{
 const db=localD1(),cacheMap=new Map(),calls=[],cache={match:async req=>cacheMap.get(req.url)?.clone(),put:async(req,res)=>cacheMap.set(req.url,res)};
 const env={DB:db,REGIONAL_STOPS:[graz]},request=()=>new Request('https://regional-test.example/api/regional/board?station='+encodeURIComponent(graz.id));
 const options={now:reference,cache,fetcher:async(url,settings)=>{calls.push({url,settings});return Response.json(grazer);}};
 try{
  const [a,b]=await Promise.all([regionalApi(request(),env,options),regionalApi(request(),env,options)]);assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(calls.length,1);
  assert.equal(new URL(calls[0].url).origin,'https://api.transitous.org');assert.equal(calls[0].settings.redirect,'manual');
  const second=await (await regionalApi(request(),env,{...options,now:reference+10000})).json();assert.equal(calls.length,1);assert.equal(second.checkedAt,reference);
  assert.equal((await db.prepare("SELECT SUM(count) AS n FROM foama_journey_budget WHERE kind='plan'").first()).n,1);
  const bad=await regionalApi(new Request('https://regional-test.example/api/regional/board?station=https://evil.example/&lat=PRIVATE'),env,options);assert.equal(bad.status,400);assert.equal(calls.length,1);
  assert.equal((await regionalApi(request(),{REGIONAL_STOPS:[graz]},{...options,cache:null})).status,429);assert.equal(calls.length,1);
 }finally{db.close();}
});
test('Linz provider failure falls back to real Transitous timetable data with a separately counted request',async()=>{
 const db=localD1(),calls=[];const payload=structuredClone(grazer);payload.stopTimes.forEach(row=>{row.place.stopId=linz.providerStopId;row.realTime=false;});
 try{const res=await regionalApi(new Request('https://linz-test.example/api/regional/board?station='+encodeURIComponent(linz.id)),{DB:db,REGIONAL_STOPS:[linz]},{now:reference,cache:null,fetcher:async url=>{calls.push(url);return url.startsWith('https://www.linzag.at/')?new Response(null,{status:503}):Response.json(payload);}});
  assert.equal(res.status,200);assert.equal(calls.length,2);const rows=await res.json();assert.ok(rows.departures.every(d=>d.quality==='schedule'));assert.equal((await db.prepare("SELECT SUM(count) AS n FROM foama_journey_budget WHERE kind='plan'").first()).n,2);
 }finally{db.close();}
});
