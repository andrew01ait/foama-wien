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
test('changing the selected stop keeps the line evidence, vehicle IDs, source age and retry deadline',async()=>{
 const s=setup();await s.handle(request());s.snapshot(1);const original=await (await s.handle(request())).json(),other=direction.stops[11],url=new URL(request().url);url.searchParams.set('stop',other.id);
 const changed=await (await s.handle(new Request(url))).json();assert.equal(s.calls(),2,'station switching within the gate must not fetch again');assert.equal(changed.at,original.at);assert.ok(changed.tracks.length>0);assert.ok(changed.tracks.every(t=>original.tracks.some(x=>x.id===t.id)));assert.equal(changed.stops.at(-1).id,other.id);assert.equal(changed.retryAfterMs,original.retryAfterMs);assert.equal(changed.board.foamaMonitorAt,recording[1].foamaMonitorAt);
 s.advance(original.retryAfterMs+1);await s.handle(new Request(url));assert.equal(s.calls(),3);assert.ok(s.ids.at(-1).includes(other.rbl));assert.ok(s.ids.at(-1).length<=8,'only the selected stop excerpt is requested');
});
test('concurrent views of one line share one pending monitor request and retain first-source uncertainty',async()=>{
 let release,calls=0;const now=()=>Date.parse(recording[0].foamaMonitorAt)+1000,handle=createWearApproach({assets,now,monitor:()=>{calls++;return new Promise(resolve=>release=()=>resolve(Response.json(recording[0])));}}),a=handle(request());
 while(!release)await new Promise(setImmediate);const url=new URL(request().url);url.searchParams.set('stop',direction.stops[11].id);const b=handle(new Request(url));await new Promise(setImmediate);assert.equal(calls,1);release();const [first,other]=await Promise.all([a.then(r=>r.json()),b.then(r=>r.json())]);assert.equal(first.tracks.length,0);assert.equal(other.tracks.length,0);assert.ok(first.progress<4);assert.equal(first.at,other.at);
});
test('source cache expiry delays the next request and errors never refresh the retained board timestamp',async()=>{
 let clock=Date.parse(recording[0].foamaMonitorAt)+1000,calls=0,fail=false;const source=recording[0].foamaMonitorAt,handle=createWearApproach({assets,now:()=>clock,monitor:async()=>{calls++;return fail?new Response('',{status:429,headers:{'retry-after':'120'}}):Response.json({...recording[0],foamaNextMonitorAt:new Date(Date.parse(source)+35000).toISOString()});}});
 const first=await (await handle(request())).json();assert.ok(first.retryAfterMs>=34000);clock+=31000;await handle(request());assert.equal(calls,1);clock+=4000;fail=true;const failed=await (await handle(request())).json();assert.equal(calls,2);assert.equal(failed.problem,true);assert.equal(failed.board.foamaMonitorAt,source);assert.equal(failed.arrivalAt,null);assert.ok(failed.retryAfterMs>=120000);
});
