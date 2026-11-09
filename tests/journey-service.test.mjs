import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localD1} from '../site/local-d1.mjs';
import {journeyApi,reserveJourneyRequest,geocodePlaces} from '../cloudflare/src/journey-service.mjs';
const now=Date.parse('2026-11-08T21:59:00Z');
const body={from:{lat:48.1966,lon:16.3375},to:{lat:48.2,lon:16.3695},time:new Date(now).toISOString(),modes:{metro:true,tram:true,bus:true},speed:4.5,buffer:1};
const req=(data=body,path='plan')=>new Request('https://example.test/api/journeys/'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
const fixture=JSON.parse(readFileSync(new URL('./fixtures/journey-westbahnhof-karlsplatz.json',import.meta.url)));
test('explicit search calls only the fixed public provider with identification and returns normalized timetable data',async()=>{
 const db=localD1();try{let call;
  const response=await journeyApi(req({...body,privateFavorites:'PRIVATE_FAVORITES',userId:'PRIVATE_USER',url:'https://other.test'}),{DB:db},{now,fetch:async(url,options)=>{call={url:String(url),options};return Response.json({...fixture,privateRaw:'PRIVATE_RAW'});}});
  assert.equal(response.status,200);assert.equal(new URL(call.url).origin,'https://api.transitous.org');assert.equal(new URL(call.url).pathname,'/api/v6/plan');assert.equal(call.options.redirect,'manual');assert.match(call.options.headers['User-Agent'],/foama-wien\/0.6.0.*https:/);
  const json=JSON.stringify(await response.json());assert.ok(!json.includes('PRIVATE'));assert.ok(!json.includes('raw'));assert.match(json,/"quality":"schedule"/);assert.equal(response.headers.get('cache-control'),'no-store');
  const counts=(await db.prepare('SELECT * FROM foama_journey_budget').all()).results;assert.ok(!JSON.stringify(counts).includes('48.'));assert.deepEqual(Object.keys(counts[0]).sort(),['count','hour','id','kind']);
 }finally{db.close();}
});
test('invalid locations, timezone, modes, large bodies, future dates and URL queries do not consume provider requests',async()=>{
 const db=localD1();try{let calls=0;const options={now,fetch:async()=>{calls++;throw Error();}};
  for(const data of [{...body,from:{lat:0,lon:0}},{...body,time:'2026-11-08T23:00'},{...body,modes:{}},{...body,extra:'x'.repeat(5000)},{...body,time:'2030-01-01T00:00Z'}])assert.equal((await journeyApi(req(data),{DB:db},options)).status,400);
  assert.equal((await journeyApi(req(body,'plan?from=48'),{DB:db},options)).status,400);assert.equal(calls,0);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM foama_journey_budget').first()).n,0);
 }finally{db.close();}
});
test('atomic shared budget permits at most 700 planning requests in a conservative rolling window, including across hour boundaries',async()=>{
 const db=localD1();try{
  const hour=Math.floor(now/3600000);await db.prepare('INSERT INTO foama_journey_budget VALUES (?,?,?,?)').bind('plan:'+hour,'plan',hour,699).run();
  assert.equal((await Promise.all(Array.from({length:10},()=>reserveJourneyRequest(db,{now})))).filter(Boolean).length,1);
  assert.equal(await reserveJourneyRequest(db,{now:now+3600000}),false);assert.equal(await reserveJourneyRequest(db,{now:now+24*3600000}),false);assert.equal(await reserveJourneyRequest(db,{now:now+25*3600000}),true);
 }finally{db.close();}
});
test('storage failure, provider throttling, malformed, oversized and cancelled responses stay understandable without returning raw provider errors',async()=>{
 assert.equal((await journeyApi(req(),{},{now,fetch:()=>assert.fail()})).status,429);
 for(const fake of [new Response('PRIVATE_PROVIDER_ERROR',{status:429}),Response.json({bad:true}),new Response('x'.repeat(2000001)),new Response('private malformed')]){
  const db=localD1();try{const response=await journeyApi(req(),{DB:db},{now,fetch:async()=>fake});assert.ok(response.status>=400);assert.ok(!(await response.text()).includes('PRIVATE'));}finally{db.close();}
 }
 const db=localD1(),controller=new AbortController();const request=new Request(req(),{signal:controller.signal});controller.abort();try{const response=await journeyApi(request,{DB:db},{now,fetch:async(url,{signal})=>{assert.equal(signal.aborted,true);throw Error('aborted');}});assert.equal(response.status,502);}finally{db.close();}
});
test('address suggestions use actual MOTIS Match shape, restrict coordinates and expose only chosen display fields',()=>{
 assert.deepEqual(geocodePlaces([{name:'Westbahnhof',lat:48.1966,lon:16.3375,privateId:'PRIVATE'},{name:'Elsewhere',lat:0,lon:0}]),[{name:'Westbahnhof',lat:48.1966,lon:16.3375,kind:'place',detail:''}]);
 assert.deepEqual(geocodePlaces([{type:'ADDRESS',name:'8',street:'Neumayrgasse',houseNumber:'8',zip:'1160',areas:[{name:'Wien',unique:true,adminLevel:4}],lat:48.21,lon:16.33}]),[{name:'Neumayrgasse 8',detail:'1160 Wien',kind:'address',lat:48.21,lon:16.33}]);
});
test('walking-only refresh uses the known boarding station, shares the planning budget and derives an explicitly estimated time from distance and speed',async()=>{
 const db=localD1();try{let call;const response=await journeyApi(req({from:body.from,stopId:'wl:west',speed:4.5},'walk'),{DB:db,JOURNEY_STOPS:[{id:'wl:west',lat:48.1962,lon:16.338}]},{now,fetch:async(url)=>{call=new URL(url);return Response.json([{duration:65,distance:75}]);}});
  assert.equal(response.status,200);assert.equal(call.pathname,'/api/v1/one-to-many');assert.equal(call.searchParams.get('mode'),'WALK');const data=await response.json();assert.equal(data.walk.durationSeconds,60);assert.equal(data.walk.quality,'estimate');assert.equal((await db.prepare('SELECT kind FROM foama_journey_budget').first()).kind,'plan');
  assert.equal((await journeyApi(req({from:body.from,stopId:'unknown'},'walk'),{DB:db},{now,fetch:()=>assert.fail()})).status,400);
 }finally{db.close();}
});
test('Worker-compatible request options reject redirects without following another host or forwarding browser credentials',async()=>{
 const db=localD1();try{let calls=0;const response=await journeyApi(req(),{DB:db},{now,fetch:async(url,options)=>{
  calls++;assert.equal(typeof url,'string');assert.equal(options.redirect,'manual');assert.equal(options.credentials,undefined);assert.deepEqual(Object.keys(options.headers).sort(),['Accept','User-Agent']);return new Response(null,{status:302,headers:{Location:'https://other.test/PRIVATE'}});
 }});assert.equal(response.status,502);assert.equal(calls,1);assert.ok(!(await response.text()).includes('PRIVATE'));}finally{db.close();}
});
