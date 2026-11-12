import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createWearApproach} from '../site/wear-approach.mjs';
import {decodeVehiclePilot} from '../pwa/src/vehicle-tracker.mjs';
const json=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const recording=(await json('tests/fixtures/u6-full-live.json')).directions.south;
const index=await json('pwa/data/vehicle-pilot/index.json'),entry=index.lines.find(l=>l.id==='metro|U6');
const data=await decodeVehiclePilot(await json('pwa/data/vehicle-pilot/'+entry.file));
const direction=data.directions.find(d=>d.towards==='Siebenhirten'&&d.stops.length===24),stop=direction.stops[12];
const assets={};for(const path of ['/data/timetables/wien/manifest.json','/data/vehicle-pilot/index.json','/data/line-maps/wien/index.json','/data/vehicle-pilot/'+entry.file,'/data/line-maps/wien/'+entry.file])assets[path]={base64:(await readFile(new URL('../pwa'+path,import.meta.url))).toString('base64')};
const request=(extra='')=>new Request('https://foama.example/api/wear/approach?'+new URLSearchParams({route:'U6',mode:'metro',stop:stop.id,towards:'Siebenhirten'})+extra);
function setup(){let n=0,calls=0,clock=Date.parse(recording[0].foamaMonitorAt)+1000,fail=false;const ids=[];
 const handle=createWearApproach({assets,now:()=>clock,monitor:async req=>{calls++;ids.push(new URL(req.url).searchParams.getAll('stopId'));return fail?new Response('',{status:429,headers:{'retry-after':'120'}}):Response.json(recording[n]);}});
 return {handle,calls:()=>calls,ids,clock:()=>clock,advance(ms){clock+=ms;},snapshot(index){n=index;clock=Date.parse(recording[index].foamaMonitorAt)+1000;},fail(){fail=true;}};
}
test('watch reuses the real two-source tracker, immediate board forecast and a bounded upstream excerpt',async()=>{
 const s=setup(),first=await (await s.handle(request())).json();assert.equal(first.available,true);assert.equal(first.tracks.length,0);assert.ok(first.arrivalAt);assert.ok(first.board);assert.deepEqual(first.boardIds,[stop.rbl]);assert.ok(s.ids[0].length<=8);assert.equal(s.calls(),1);
 await s.handle(request());assert.equal(s.calls(),1,'opening or refreshing within 30 seconds shares the existing result');
 s.snapshot(1);const confirmed=await (await s.handle(request())).json();assert.equal(s.calls(),2);assert.ok(confirmed.tracks.length>0);assert.ok(confirmed.tracks.length<=2);assert.ok(confirmed.tracks.every(t=>/^U6 · \d+$/.test(t.id)));assert.equal(confirmed.stops.at(-1).id,stop.id);assert.equal(confirmed.center,confirmed.stops.length-1);
});
test('a cached source response cannot create a second source confirmation and stale positions expire',async()=>{
 const s=setup();await s.handle(request());s.advance(31000);const duplicate=await (await s.handle(request())).json();assert.equal(duplicate.tracks.length,0);s.advance(91000);s.fail();const stale=await (await s.handle(request())).json();assert.equal(stale.arrivalAt,null);assert.equal(stale.tracks.length,0);assert.match(stale.status,/nicht verfügbar/);
});
test('watch honours shared monitor backoff, rejects direction substitution and accepts no arbitrary endpoints',async()=>{
 const s=setup();s.fail();let response=await (await s.handle(request())).json();assert.ok(response.retryAfterMs>=120000);s.advance(60000);await s.handle(request());assert.equal(s.calls(),1);
 const invalid=await s.handle(request('&url=https://attacker.example'));assert.equal(invalid.status,400);
 const wrong=await (await s.handle(new Request(request().url.replace('Siebenhirten','Unknown')))).json();assert.equal(wrong.available,false);assert.equal(s.calls(),1);
 assert.equal((await s.handle(new Request(request().url,{method:'POST'}))).status,405);
});
