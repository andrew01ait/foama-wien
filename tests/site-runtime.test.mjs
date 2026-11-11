import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSiteWorker} from '../site/runtime.mjs';
import apiWorker from '../cloudflare/src/index.js';

test('native APK download preserves binary bytes, MIME and attachment filename',async()=>{
 const binary=Buffer.from([0x50,0x4b,0x03,0x04,0x00,0xff,0x80]);
 const worker=createSiteWorker(apiWorker,{'/apk/foama-wien-wear-0.4.1.apk':{type:'application/vnd.android.package-archive',base64:binary.toString('base64')}});
 const url='https://foama.example/apk/foama-wien-wear-0.4.1.apk';
 const response=await worker.fetch(new Request(url),{},{});
 assert.equal(response.headers.get('content-type'),'application/vnd.android.package-archive');
 assert.equal(response.headers.get('content-disposition'),'attachment; filename="foama-wien-wear-0.4.1.apk"');
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),binary);
 const head=await worker.fetch(new Request(url,{method:'HEAD'}),{},{});assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
 assert.equal((await worker.fetch(new Request('https://foama.example/.local/private/foama-wien-release.p12'),{},{})).status,404);
});

test('the site retains app and diagnostics routes, serves real bytes and allows asking for location',async()=>{
 const assets={};for(const file of ['index.html','willkommen.html','fahrzeuge.html','linienkarte.html','fahrplan.html','diagnose.html','manifest.webmanifest','icons/icon-192.png']){
  assets['/'+file]={type:file.endsWith('.png')?'image/png':'text/html',base64:(await readFile(new URL('../pwa/'+file,import.meta.url))).toString('base64')};
 }
 const worker=createSiteWorker(apiWorker,assets);
 for(const path of ['/','/index.html','/willkommen.html','/fahrzeuge.html','/linienkarte.html','/fahrplan.html','/diagnose','/diagnose.html','/icons/icon-192.png']){
  const r=await worker.fetch(new Request('https://foama.example'+path),{},{});
  assert.equal(r.status,200);assert.equal(r.headers.get('permissions-policy'),'geolocation=(self), accelerometer=(self)');assert.ok((await r.arrayBuffer()).byteLength>0);
 }
 assert.equal((await worker.fetch(new Request('https://foama.example/missing'),{},{})).status,404);
 const health=await worker.fetch(new Request('https://foama.example/api/health'),{},{});
 assert.equal((await health.json()).version,'0.11.3');
});
test('line-wide construction is added from the official notice feed while unrelated lift closures stay out',async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;const saved=new Map(),jobs=[];
 globalThis.caches={async open(){return {async match(r){return saved.get(r.url)?.clone();},async put(r,v){saved.set(r.url,v);}};}};
 globalThis.fetch=async url=>Response.json({data:url.endsWith('/trafficInfoList')?{
  trafficInfoCategories:[{id:1,name:'aufzugsinfo'},{id:2,name:'stoerunglang'}],trafficInfos:[
   {name:'construction',refTrafficInfoCategoryId:2,title:'25: Gleisbauarbeiten',relatedLines:['25']},
   {name:'other-line',refTrafficInfoCategoryId:2,relatedLines:['U1']},
   {name:'other-station-lift',refTrafficInfoCategoryId:1,relatedLines:['25'],relatedStops:[999]},
   {name:'this-station-lift',refTrafficInfoCategoryId:1,relatedLines:['25'],relatedStops:[101]}
  ]}:{monitors:[{locationStop:{properties:{attributes:{rbl:101}}},lines:[{name:'25'}]}]}});
 try{
  const response=await apiWorker.fetch(new Request('https://foama.example/api/monitor?stopId=101'),{}, {waitUntil:p=>jobs.push(p)});
  const data=await response.json();assert.equal(response.status,200);assert.equal(data.foamaTraffic.status,'available');
  assert.deepEqual(data.data.trafficInfos.map(n=>n.name),['construction','this-station-lift']);await Promise.all(jobs);
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches;}
});
test('failure of the additional notice feed preserves successful departures and is negatively cached',async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;const saved=new Map(),jobs=[];let notices=0;
 globalThis.caches={async open(){return {async match(r){return saved.get(r.url)?.clone();},async put(r,v){saved.set(r.url,v);}};}};
 globalThis.fetch=async url=>{if(url.endsWith('/trafficInfoList')){notices++;return new Response('Unavailable',{status:503});}return Response.json({data:{monitors:[]}});};
 try{
  for(let i=0;i<2;i++){const response=await apiWorker.fetch(new Request('https://foama.example/api/monitor?stopId=101'),{}, {waitUntil:p=>jobs.push(p)});assert.equal(response.status,200);assert.equal((await response.json()).foamaTraffic.status,'unavailable');await Promise.all(jobs);}
  assert.equal(notices,1);
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches;}
});
test('notice relay excludes foreign stop summaries and preserves the richer monitor copy',async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches,jobs=[];
 globalThis.caches={async open(){return {async match(){},async put(){}};}};
 const categories=[{id:2,name:'stoerunglang'},{id:3,name:'stoerungkurz'}];
 const main={name:'main',refTrafficInfoCategoryId:2,relatedLines:['46'],title:'46: Polizeieinsatz'};
 globalThis.fetch=async url=>Response.json({data:url.endsWith('/trafficInfoList')?{trafficInfoCategories:categories,trafficInfos:[
  {...main,description:''},{name:'foreign-stop',refTrafficInfoCategoryId:3,relatedLines:['46'],relatedStops:[999]},
  {name:'this-stop',refTrafficInfoCategoryId:3,relatedLines:['46'],relatedStops:[101]}
 ]}:{monitors:[{locationStop:{properties:{attributes:{rbl:101}}},lines:[{name:'46'}]}],trafficInfoCategories:categories,trafficInfos:[{...main,description:'Ausführlicher Monitorhinweis.'}]}});
 try{
  const response=await apiWorker.fetch(new Request('https://foama.example/api/monitor?stopId=101'),{}, {waitUntil:p=>jobs.push(p)});
  const data=await response.json();await Promise.all(jobs);
  assert.deepEqual(data.data.trafficInfos.map(n=>n.name),['main','this-stop']);assert.equal(data.data.trafficInfos[0].description,'Ausführlicher Monitorhinweis.');
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches;}
});
test('an upstream access refusal preserves its actual status and pauses other station batches',async()=>{
 const previousFetch=globalThis.fetch,previousCaches=globalThis.caches;
 const storage=new Map();let calls=0;
 globalThis.caches={async open(){return {async match(req){return storage.get(req.url)?.clone();},async put(req,response){storage.set(req.url,response);}};}};
 globalThis.fetch=async()=>{calls++;return new Response('Forbidden',{status:403});};
 try{
  const jobs=[],ctx={waitUntil:job=>jobs.push(job)};
  const first=await apiWorker.fetch(new Request('https://foama.example/api/monitor?stopId=4111'),{},ctx);
  assert.equal(first.status,502);assert.equal(first.headers.get('retry-after'),'60');
  assert.equal((await first.json()).upstreamHttpStatus,403);await Promise.all(jobs);
  const another=await apiWorker.fetch(new Request('https://foama.example/api/monitor?stopId=4112'),{},ctx);
  assert.equal((await another.json()).upstreamHttpStatus,403);assert.equal(calls,1);
 }finally{globalThis.fetch=previousFetch;globalThis.caches=previousCaches;}
});

test('monitor relay uses a fixed official endpoint, batches ids and caches successful real-shaped JSON',async()=>{
 const previousFetch=globalThis.fetch,previousCaches=globalThis.caches;
 const storage=new Map(),calls=[];
 const isolated={async match(req){return storage.get(req.url)?.clone();},async put(req,response){storage.set(req.url,response);}};
 globalThis.caches={get default(){throw Error('Default cache is forbidden in Sites');},async open(name){assert.equal(name,'foama-wien-api-v1');return isolated;}};
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json({data:url.endsWith('/trafficInfoList')?{trafficInfos:[]}:{monitors:[]}});};
 try{
  const jobs=[],ctx={waitUntil:job=>jobs.push(job)};
  for(let i=0;i<2;i++){
   const response=await apiWorker.fetch(new Request('https://foama.example/api/monitor?stopId=4111&stopId=4112&stopId=4111'),{},ctx);
   assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/max-age=30/);await Promise.all(jobs);
  }
  assert.equal(calls.length,2);assert.equal(calls[1].url,'https://www.wienerlinien.at/ogd_realtime/trafficInfoList');const upstream=new URL(calls[0].url);
  assert.equal(upstream.origin+upstream.pathname,'https://www.wienerlinien.at/ogd_realtime/monitor');
  assert.deepEqual(upstream.searchParams.getAll('stopId'),['4111','4112']);
  assert.deepEqual(upstream.searchParams.getAll('activateTrafficInfo'),['stoerunglang','stoerungkurz','aufzugsinfo','fahrtreppeninfo','information']);
  assert.ok(calls[0].options.signal);
  const invalid=await apiWorker.fetch(new Request('https://foama.example/api/monitor?stopId=4111&url=https://other.example'),{},ctx);
  assert.equal(invalid.status,400);assert.equal(calls.length,2);
 }finally{globalThis.fetch=previousFetch;globalThis.caches=previousCaches;}
});
