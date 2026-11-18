import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {readTrafficCache,saveTrafficCache,mergeTrafficCaches,TRAFFIC_STORAGE_KEY,updateTrafficCache,trafficAtStation} from '../pwa/src/traffic-info.mjs';
import {journeyTrafficNotices,journeyNoticeMarkup} from '../pwa/src/journey-station.mjs';
import {journeyWarningTargets,journeyMonitorIds} from '../pwa/src/journey-client.mjs';
import {trafficNoticeMarkup,noticeTitle} from '../pwa/src/warning-panel.mjs';
const now=Date.now(),stops=[0,1,2,3].map(i=>({id:'wl:s'+i,name:'Halt '+i,provider:'wl',rbl:[String(i+1)],lines:[{route:i<2?'U6':'29B',mode:i<2?'metro':'bus'}]}));
const ride=(i,route,mode)=>({mode,route,towards:'Ziel',from:{stopId:stops[i].id},to:{stopId:stops[i+1].id}}),journey={savedPath:true,legs:[ride(0,'U6','metro'),{mode:'walk',from:{stopId:stops[1].id},to:{stopId:stops[2].id}},ride(2,'29B','bus')]};
const event={name:'u6-event',refTrafficInfoCategoryId:1,title:'U6: Verspätungen',description:'Unregelmäßige Intervalle in beiden Richtungen.',relatedLines:['U6']};
const response=(events=[event],at=now)=>({foamaMonitorAt:new Date(at).toISOString(),message:{serverTime:new Date(at).toISOString()},data:{trafficInfoCategories:[{id:1,name:'stoerunglang'}],monitors:['1','2'].map(rbl=>({locationStop:{properties:{attributes:{rbl}}},lines:[{name:'U6'}]})),trafficInfos:events}});
const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),values};};
const escape=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),badge=l=>'<b>'+escape(l.route)+'</b>';
test('opening a saved route reuses monitor warnings immediately during the shared request pause',()=>{
 const store=storage(),initial=updateTrafficCache({},response(),['1','2'],now);saveTrafficCache(initial,{storage:store,now});
 const source=readFileSync(new URL('../pwa/src/journey-page.mjs',import.meta.url),'utf8'),context=vm.createContext({state:{},readTrafficCache:()=>readTrafficCache({storage:store,now})});
 vm.runInContext(source.slice(source.indexOf('state.trafficCache='),source.indexOf('async function ensureJourneyCities')),context);
 const notices=journeyTrafficNotices(journey,stops,context.state.trafficCache,{now});assert.equal(notices.length,1);assert.equal(notices[0].id,event.name);assert.equal(notices[0].checkedAt,now);
 const markup=journeyNoticeMarkup(notices,{escape,badge,key:'saved',now});assert.match(markup,/Warnmeldungen/);assert.match(markup,/Verspätungen/);
});
test('monitor and route updates share empty/resolved records as well as alerts, without renewing source age',()=>{
 const store=storage(),initial=updateTrafficCache({},response(),['1','2'],now);saveTrafficCache(initial,{storage:store,now});
 const read=readTrafficCache({storage:store,now:now+91000});assert.ok(journeyTrafficNotices(journey,stops,read,{now:now+91000}).every(n=>n.stale&&n.checkedAt===now));
 const cleared=updateTrafficCache(mergeTrafficCaches(initial,read,now+92000),response([],now+92000),['1','2'],now+92000);saveTrafficCache(cleared,{storage:store,now:now+92000});
 const resumed=mergeTrafficCaches(initial,readTrafficCache({storage:store,now:now+93000}),now+93000);assert.deepEqual(journeyTrafficNotices(journey,stops,resumed,{now:now+93000}),[]);assert.equal(resumed['1'].notices.length,0);
});
test('expiry and malformed or unavailable local storage cannot create or block a warning',()=>{
 const store=storage();saveTrafficCache(updateTrafficCache({},response(),['1','2'],now),{storage:store,now});assert.deepEqual(readTrafficCache({storage:store,now:now+15*60000+1}),{});
 for(const value of ['invalid',JSON.stringify({'1':{checkedAt:now,notices:[{title:'bad'}]}}),JSON.stringify({'1':{checkedAt:now+61000,notices:[]}})]){store.setItem(TRAFFIC_STORAGE_KEY,value);const read=readTrafficCache({storage:store,now});assert.doesNotThrow(()=>journeyTrafficNotices(journey,stops,read,{now}));assert.deepEqual(journeyTrafficNotices(journey,stops,read,{now}),[]);}
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.deepEqual(readTrafficCache({storage:blocked,now}),{});assert.doesNotThrow(()=>saveTrafficCache({}, {storage:blocked,now}));
});
test('every selected ride contributes warning anchors while focus retains the first slots and the 24-board limit',()=>{
 const third={id:'wl:extra',name:'Dritter Einstieg',provider:'wl',rbl:['99'],lines:[{route:'46',mode:'tram'}]},extended={...journey,legs:[...journey.legs,{mode:'tram',route:'46',from:{stopId:third.id},to:{stopId:stops[0].id}},{mode:'bus',route:'graz',from:{stopId:'graz:123'},to:{stopId:'graz:234'}}]};
 const targets=journeyWarningTargets(extended);assert.ok(targets.some(t=>t.stopId===third.id));assert.ok(targets.some(t=>t.stopId===stops[1].id));assert.ok(targets.every(t=>t.stopId.startsWith('wl:')));const ids=journeyMonitorIds(targets,[...stops,third]);assert.ok(ids.includes('99'));assert.equal(new Set(ids).size,ids.length);assert.ok(ids.length<=24);
});
test('warning articles show each route badge once and do not repeat the route prefix or warning icon',()=>{
 const notice={...updateTrafficCache({},response(),['1'],now)['1'].notices[0],checkedAt:now};const html=trafficNoticeMarkup(notice,{escape,renderBadge:(route)=>'<b>'+route+'</b>'});
 assert.equal((html.match(/<b>U6<\/b>/g)||[]).length,1);assert.match(html,/<strong>Verspätungen<\/strong>/);assert.doesNotMatch(html,/<svg|U6: Verspätungen|Haltestellenhinweis|Linienhinweis/);assert.equal(noticeTitle({title:'Störung der Linien U6',lines:['U6']}),'Störung der Linien U6');
});
