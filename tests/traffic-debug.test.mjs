import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTrafficInfos,updateTrafficCache,trafficAtStation} from '../pwa/src/traffic-info.mjs';
import {debugReport,appendDebugEvent} from '../pwa/src/debug-core.mjs';
import {createDebugging} from '../pwa/src/debugging.mjs';
import {nearbyMapStops} from '../pwa/src/station-catalog.mjs';
import {mergeSettings} from '../pwa/src/core.mjs';

const t=Date.parse('2026-11-07T15:00:00+01:00');
const station={id:'wl:test',rbl:['101','102'],lat:48.2,lon:16.3,provider:'wl',lines:[{route:'25',mode:'tram'}]};
function response(notices,ids=['101']){
 return {data:{monitors:ids.map(id=>({locationStop:{properties:{attributes:{rbl:Number(id)}}},lines:[{name:'25'}],refTrafficInfoNames:notices.filter(n=>n.bound).map(n=>n.name)})),trafficInfos:notices,trafficInfoCategories:[{id:2,name:'stoerunglang'}]}};
}
const construction={name:'construction',refTrafficInfoCategoryId:2,title:'25: Gleisbauarbeiten',description:'Umleitung laut Betreiber.',status:'active',relatedLines:['25'],relatedLinesDetails:[{lineName:'25',vehicleType:'ptTram'}],time:{start:'2026-11-01T04:00:00+0100',end:'2026-12-01T04:00:00+0100'}};

test('official construction notices retain text, periods and affected lines without claiming every station is closed',()=>{
 const cache=updateTrafficCache({},response([construction]),['101'],t),notice=trafficAtStation(cache,station,{now:t})[0];
 assert.equal(notice.label,'Baustelle');assert.equal(notice.scope,'line');assert.equal(notice.lineModes['25'],'tram');
 assert.equal(notice.planned,false);assert.equal(notice.stale,false);assert.ok(notice.end);
 assert.equal(trafficAtStation(cache,station,{routes:['U1'],now:t}).length,0);
});
test('monitor references and related stop IDs are identified as station notices',()=>{
 for(const item of [{...construction,bound:true},{...construction,relatedStops:[101]}]){
  const cache=updateTrafficCache({},response([item]),['101'],t);
  assert.equal(trafficAtStation(cache,station,{now:t})[0].scope,'stop');
 }
});
test('planned notices stay planned, expired/resolved notices disappear and cached notices are marked old',()=>{
 const planned={...construction,name:'future',time:{start:'2026-11-10T04:00:00+0100'}},expired={...construction,name:'old',time:{end:'2026-11-01T04:00:00+0100'}},resolved={...construction,name:'resolved',status:'resolved'};
 const cache=updateTrafficCache({},response([planned,expired,resolved]),['101'],t);
 const list=trafficAtStation(cache,station,{now:t+91_000});assert.equal(list.length,1);assert.equal(list[0].planned,true);assert.equal(list[0].stale,true);
 assert.equal(trafficAtStation(cache,station,{now:t+16*60_000}).length,0);
});
test('successful empty notice refresh clears only queried records; explicit resolution clears the event family',()=>{
 const initial=updateTrafficCache({},response([construction],['101','102']),['101','102'],t);
 const refreshed=updateTrafficCache(initial,response([],['101']),['101'],t+30_000);
 assert.equal(refreshed['101'].notices.length,0);assert.equal(refreshed['102'].notices.length,1);
 const resolved=updateTrafficCache(refreshed,response([{...construction,status:'resolved'}]),['101'],t+60_000);
 assert.equal(trafficAtStation(resolved,station,{now:t+60_000}).length,0);
});
test('notice parsing bounds content, strips markup and rejects unreadable notice collections',()=>{
 const result=parseTrafficInfos(response([{...construction,title:'<img src=x onerror=alert(1)>Gleisbau',descriptionHTML:'<p>Info</p>',description:'<script>unsafe</script> '+ 'x'.repeat(5000)}]),t)[0];
 assert.equal(result.title,'Gleisbau');assert.ok(result.description.length<=2200);assert.ok(!result.description.includes('<script>'));
 assert.throws(()=>parseTrafficInfos({data:{trafficInfos:{unexpected:true}}}),/Meldungsformat/);
});
test('map station selection shares transport filters, radius ordering and a bounded marker count',()=>{
 const settings=mergeSettings({radius:300,modes:{tram:true,metro:false,bus:false,sbahn:false,regional:false,long:false}});
 const stops=[station,{...station,id:'far',lat:49},{...station,id:'bus',lines:[{route:'13A',mode:'bus'}]},{...station,id:'nearby',lat:48.2001}];
 assert.deepEqual(nearbyMapStops(stops,{lat:48.2,lon:16.3},settings).map(s=>s.id),['wl:test','nearby']);
 assert.equal(nearbyMapStops(Array.from({length:80},(_,i)=>({...station,id:String(i)})),station,settings).length,60);
 assert.deepEqual(nearbyMapStops(stops,null,settings),[]);
});
test('error export admits only technical fields and bounded counts, never location/favorites/URLs/raw messages',()=>{
 const events=appendDebugEvent([],{kind:'monitor',outcome:'error',code:'upstream-http',httpStatus:502,upstreamHttpStatus:403,elapsedMs:200,
  lat:48.123456,lon:16.123456,stopId:'PRIVATE_STOP',favorites:['PRIVATE_FAVORITE'],url:'PRIVATE_URL',message:'PRIVATE_MESSAGE',summary:{position:'PRIVATE_POSITION'},stack:'PRIVATE_STACK',qrKey:'PRIVATE_KEY'});
 const report=debugReport(events,{secureContext:true,online:true,serviceWorkerControlled:true,pageProtocol:'https:',latitude:48.123456});
 const json=JSON.stringify(report);assert.equal(report.format,'foama-wien-debug-v1');assert.equal(report.events[0].upstreamHttpStatus,403);
 assert.ok(!json.includes('PRIVATE_'));assert.ok(!json.includes('48.123456'));assert.equal(report.version,'0.11.13');
 let bounded=[];for(let i=0;i<100;i++)bounded=appendDebugEvent(bounded,{kind:'app',outcome:'error',code:'unexpected'});assert.equal(bounded.length,60);
});
test('collapsed settings logger opens without requests and its actual download handler exports a valid private-data-free JSON blob',async()=>{
 const elements=new Map(),downloads=[],timers=[];const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',open:false,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);};
 const storage=new Map([['foama.settings.v1','PRIVATE_SETTINGS'],['foama.favorites.v1','PRIVATE_FAVORITES']]);
 const doc={getElementById:element,createElement:()=>({click(){downloads.push({url:this.href,name:this.download});}})};
 let requested=0;
 const logger=createDebugging({doc,storage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},nav:{onLine:true,serviceWorker:{controller:{}},geolocation:{getCurrentPosition(){requested++;}}},win:{isSecureContext:true,location:{protocol:'https:'}},schedule:fn=>timers.push(fn)});
 assert.equal(requested,0);assert.equal(element('debugging').open,false);
 logger.record({kind:'monitor',outcome:'error',code:'upstream-http',httpStatus:502,upstreamHttpStatus:403});
 element('downloadDebug').handlers.click();assert.equal(downloads.length,1);assert.match(downloads[0].name,/^\d{8}_foama-wien-debug\.json$/);
 const json=await (await fetch(downloads[0].url)).text(),report=JSON.parse(json);assert.equal(report.events[0].upstreamHttpStatus,403);assert.ok(!json.includes('PRIVATE_'));
 element('debugging').open=true;element('settings').handlers.close();assert.equal(element('debugging').open,false);timers.forEach(fn=>fn());
});
