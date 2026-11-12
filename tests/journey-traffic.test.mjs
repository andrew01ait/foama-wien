import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {updateTrafficCache} from '../pwa/src/traffic-info.mjs';
import {journeyTrafficNotices,journeyNoticeMarkup,journeyStationMarkup} from '../pwa/src/journey-station.mjs';
import {journeyPathKey} from '../pwa/src/journey-variants.mjs';

const now=Date.now(),stops=[{id:'wl:a',provider:'wl',name:'Einstieg',rbl:['1','2'],lines:[{route:'U6'},{route:'46'},{route:'U4'}]},{id:'wl:b',provider:'wl',name:'Umstieg',rbl:['3']},{id:'wl:c',provider:'wl',name:'Ziel',rbl:['4']}];
const ride=(from,to,route,mode='metro')=>({mode,route,towards:'Ziel',from:{stopId:from},to:{stopId:to}});
const journey={savedPath:true,legs:[ride('wl:a','wl:b','U6'),{mode:'walk',from:{stopId:'wl:b'},to:{stopId:'wl:b'}},ride('wl:b','wl:c','46','tram')]};
const event=(id,route,extra={})=>({name:id,title:route+': Unterbrechung',description:'Fahrten unregelmäßig',relatedLines:[route],refTrafficInfoCategoryId:1,...extra});
const raw={data:{trafficInfoCategories:[{id:1,name:'stoerunglang'},{id:2,name:'aufzugsinfo'},{id:3,name:'stoerungkurz'}],monitors:['1','2','3','4'].map(rbl=>({locationStop:{properties:{attributes:{rbl}}},lines:[{name:'U6'},{name:'46'},{name:'U4'}]})),trafficInfos:[event('signal','U6'),event('tram','46'),event('other-line','U4'),event('lift','U6',{refTrafficInfoCategoryId:2}),event('future','46',{time:{start:new Date(now+3600000).toISOString()}}),event('foreign-stop','U6',{refTrafficInfoCategoryId:3,relatedStops:['99']})]}};
const cache=updateTrafficCache({},raw,['1','2','3','4'],now);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const badge=leg=>'<b>'+escape(leg.route)+'</b>';

test('A-to-B warnings follow every selected transit leg, deduplicate shared stops and exclude other lines or informational events',()=>{
 const notices=journeyTrafficNotices(journey,stops,cache,{now});assert.deepEqual(new Set(notices.map(n=>n.id)),new Set(['signal','tram']));assert.equal(notices.length,2);
 assert.deepEqual(journeyTrafficNotices({legs:[ride('wl:a','wl:b','U4')]},stops,cache,{now}).map(n=>n.id),['other-line']);
 assert.deepEqual(journeyTrafficNotices({legs:[{mode:'walk',route:'U6',from:{stopId:'wl:a'}}]},stops,cache,{now}),[]);
 assert.deepEqual(journeyTrafficNotices(journey,stops.map(s=>({...s,provider:'transitous'})),cache,{now}),[]);
 assert.deepEqual(journeyTrafficNotices(null,stops,cache,{now}),[]);
});

test('A-to-B warning data retains its source age and disappears on expiry, resolution or a current empty response',()=>{
 const old=journeyTrafficNotices(journey,stops,cache,{now:now+91000});assert.equal(old.length,2);assert.ok(old.every(n=>n.stale&&n.checkedAt===now));
 assert.deepEqual(journeyTrafficNotices(journey,stops,cache,{now:now+15*60000+1}),[]);
 const empty=updateTrafficCache(cache,{data:{...raw.data,trafficInfos:[]}},['1','2','3','4'],now+30000);assert.deepEqual(journeyTrafficNotices(journey,stops,empty,{now:now+30000}),[]);
 const resolved=updateTrafficCache(cache,{data:{...raw.data,monitors:[],trafficInfos:[event('signal','U6',{status:'resolved'})]}},[],now+30000);assert.deepEqual(journeyTrafficNotices(journey,stops,resolved,{now:now+30000}).map(n=>n.id),['tram']);
});

test('A-to-B station warnings sit after the station and chosen line but before departures, with the same focused-line filter',()=>{
 const stop=stops[0],connection={route:'U6',mode:'metro',towards:'Ziel'},departure={provider:'wl',rbl:'1',route:'U6',mode:'metro',towards:'Ziel',actual:new Date(now+240000).toISOString(),fetchedAt:new Date(now).toISOString(),quality:'live'};
 const html=journeyStationMarkup(stop,[departure],{escape,badge,now,connection,trafficCache:cache,isNoticeOpen:()=>true});
 assert.ok(html.indexOf('Einstieg')<html.indexOf('⚠'));assert.ok(html.indexOf('journey-line-heading')<html.indexOf('⚠'));assert.ok(html.indexOf('⚠')<html.indexOf('route-station-departures'));assert.match(html,/U6: Unterbrechung/);assert.doesNotMatch(html,/U4: Unterbrechung|46: Unterbrechung/);assert.match(html,/secondary-notices/);assert.match(html,/ open>/);
 const all=journeyStationMarkup(stop,[],{escape,badge,now,trafficCache:cache});assert.match(all,/U4: Unterbrechung/);
});

test('journey warning details retain source scope and stale labels and escape provider text',()=>{
 const notices=journeyTrafficNotices(journey,stops,cache,{now:now+91000});notices[0]={...notices[0],description:'<script>provider text</script>'};
 const html=journeyNoticeMarkup(notices,{escape,badge,key:'chosen-route',isOpen:key=>key==='chosen-route',now:now+91000});
 assert.match(html,/Letzter Stand – nicht aktuell bestätigt/);assert.match(html,/Betrifft die Linie, nicht zwingend diese Haltestelle/);assert.match(html,/Wiener Linien Betriebsinfo/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/ open>/);
});

test('routine A-to-B warning updates and route switches keep existing walking maps mounted',()=>{
 const source=readFileSync(new URL('../pwa/src/journey-page.mjs',import.meta.url),'utf8'),state={selected:journey,station:null,favorites:[],stops,trafficCache:cache,openNotices:new Set(),renderedJourney:journey,renderedWalk:null,walk:null,renderedName:'Gespeicherte Route',from:{},walkMaps:new Map([[0,{map:{}}]])};let writes=0,cleared=0,markup='';
 const slot={dataset:{liveLeg:'0'}},ui=new Map(),host={get innerHTML(){return markup;},set innerHTML(value){writes++;markup=value;}},steps={querySelectorAll:()=>[slot],set innerHTML(value){assert.fail('existing journey body must stay mounted');}};
 const $=id=>{if(id==='journeyNotices')return host;if(id==='journeySteps')return steps;if(!ui.has(id))ui.set(id,{setAttribute(){}});return ui.get(id);};
 const ctx=vm.createContext({state,$,journeyTrafficNotices,journeyNoticeMarkup,journeyPathKey,escape,badge,clearWalkMaps:()=>cleared++,liveMarkup:()=>'<p>Live departure</p>'});
 vm.runInContext(source.slice(source.indexOf('function showSteps('),source.indexOf('function renderCurrent(')),ctx);ctx.showSteps();ctx.showSteps();assert.equal(writes,1);assert.match(markup,/U6: Unterbrechung/);assert.match(markup,/46: Unterbrechung/);
 state.selected={savedPath:true,legs:[ride('wl:a','wl:b','U4')]};state.renderedJourney=state.selected;ctx.showSteps();assert.match(markup,/U4: Unterbrechung/);assert.doesNotMatch(markup,/U6: Unterbrechung/);assert.equal(cleared,0);assert.equal(state.walkMaps.size,1);
});
