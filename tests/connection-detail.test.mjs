import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {connectionDepartures,connectionRequestIds,lineHasCurrentDeparture,connectionTarget,createConnectionNavigation,connectionMonitorUrl,connectionUrlTarget} from '../pwa/src/connection-detail.mjs';
import {parseWlMonitors} from '../pwa/src/core.mjs';
import {retainDepartures,retryDelay} from '../pwa/src/departure-cache.mjs';

const now=Date.parse('2026-11-08T19:30:00Z');
const stop={id:'wl:test',provider:'wl',rbl:['1','2','3','4'],platforms:[{id:'1',modes:['tram']},{id:'2',modes:['metro']},{id:'3',modes:['metro']},{id:'4',modes:['bus']}]};
const target={stopId:stop.id,route:'U6',towards:'Floridsdorf',mode:'metro'};
const departure=(x={})=>({id:'a',provider:'wl',rbl:'2',route:'U6',towards:'Floridsdorf',mode:'metro',actual:new Date(now+120000).toISOString(),fetchedAt:new Date(now).toISOString(),...x});

test('connection filters station, route, direction and past times; sorts and deduplicates',()=>{
 const rows=[departure({id:'later',actual:new Date(now+180000).toISOString()}),departure(),departure(),departure({rbl:'99'}),departure({route:'2'}),departure({towards:'Siebenhirten'}),departure({actual:new Date(now-31000).toISOString()})];
 assert.deepEqual(connectionDepartures(stop,target,rows,now).map(d=>d.id),['a','later']);
 assert.equal(connectionDepartures(stop,{route:'U6'},rows,now).length,3);
});
test('connection requests only the reported platform for the selected direction',()=>{
 const rows=[departure(),departure({rbl:'3',towards:'Siebenhirten'}),departure({rbl:'1',route:'2'}),departure({rbl:'99'})];
 assert.deepEqual(connectionRequestIds(stop,target,rows),['2']);
 assert.deepEqual(connectionRequestIds(stop,{...target,towards:''},rows),['2','3']);
 assert.deepEqual(connectionRequestIds(stop,{...target,towards:'Kurzführung'},rows),['2','3']);
});
test('a line with no reported platform falls back within its mode and station, with the same 24-ID ceiling',()=>{
 assert.deepEqual(connectionRequestIds(stop,target,[]),['2','3']);
 assert.deepEqual(connectionRequestIds(stop,{route:'unknown'},[]),stop.rbl);
 const many={...stop,rbl:Array.from({length:60},(_,i)=>String(i)),platforms:[]};
 assert.equal(connectionRequestIds(many,{route:'U6'},[],99).length,24);
 const rail={id:'rail:5',provider:'rail',platformIds:['5']};
 assert.deepEqual(connectionRequestIds(rail,target,[]),[]);
 assert.equal(connectionDepartures(rail,{route:'S1'},[{provider:'rail',stopId:'5',route:'S1',actual:new Date(now+300000).toISOString()}],now).length,1);
});
test('only fresh confirmed departures color a badge; failures and old or absent data stay unconfirmed',()=>{
 assert.equal(lineHasCurrentDeparture(stop,{route:'U6'},[departure()],{now}),true);
 for(const rows of [[],[departure({rbl:'99'})],[departure({fetchedAt:new Date(now-91000).toISOString()})],[departure({actual:new Date(now-31000).toISOString()})]])assert.equal(lineHasCurrentDeparture(stop,{route:'U6'},rows,{now}),false);
 assert.equal(lineHasCurrentDeparture(stop,{route:'U6'},[departure()],{now,hasError:true}),false);
});
test('vehicle-specific short turns retain their own direction and platform in the PWA parser',()=>{
 const parsed=parseWlMonitors({data:{monitors:[{locationStop:{properties:{title:'Test',attributes:{rbl:'2'}}},lines:[{name:'U6',towards:'Floridsdorf',type:'ptMetro',departures:{departure:[{departureTime:{timeReal:'2026-11-08T20:31:00+0100'}},{vehicle:{name:'U6',towards:'Nußdorfer Straße',type:'ptMetro'},departureTime:{timePlanned:'2026-11-08T20:32:00+0100'}}]}}]}]}});
 assert.deepEqual(parsed.map(d=>[d.route,d.towards,d.rbl,d.quality]),[['U6','Floridsdorf','2','live'],['U6','Nußdorfer Straße','2','schedule']]);
});
function fakeWindow(){
 const listeners=new Map(),entries=[{state:{existing:'kept'},hash:'#original'}];let index=0;
 const win={addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type),history:{
  get state(){return entries[index].state;},
  pushState(state,_,hash){entries.splice(++index);entries.push({state,hash});},replaceState(state,_,hash){entries[index]={state,hash};},
  back(){if(index>0){index--;listeners.get('popstate')?.();}},forward(){if(index+1<entries.length){index++;listeners.get('popstate')?.();}}
 }};return {win,entries};
}
test('browser Back and Forward restore the connection without storing it in favorites or losing other history state',()=>{
 const {win,entries}=fakeWindow(),changes=[],nav=createConnectionNavigation({window:win,onChange:value=>changes.push(value)});
 nav.sync();nav.open(target);assert.equal(win.history.state.existing,'kept');assert.equal(entries.length,2);
 nav.open({...target,towards:'Siebenhirten'});assert.equal(entries.length,2);
 nav.back();assert.equal(changes.at(-1),null);assert.equal(entries[0].hash,'#original');
 win.history.forward();assert.equal(changes.at(-1).towards,'Siebenhirten');
 nav.sync();assert.equal(changes.at(-1).route,'U6');nav.stop();
});
test('invalid history targets are ignored and only validated connection fields are used',()=>{
 assert.equal(connectionTarget({stopId:stop.id,route:'x'.repeat(31)}),null);
 assert.equal(connectionTarget({...target,towards:'x'.repeat(161)}),null);
 assert.deepEqual(connectionTarget({...target,ids:['secret'],extra:'discard'}),target);
});

const app=await readFile(new URL('../pwa/src/app.mjs',import.meta.url),'utf8');
function refreshHarness(){
 let clock=now,serial=0;const timers=new Map(),calls=[];
 class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 const state={settings:{view:'near'},expanded:new Set(),focusedConnection:{...target,ids:['2']},fetchLock:false,refreshPending:false,monitorRequest:null,requestRevision:0,departures:[],lastWlFetch:0,retryAt:0,batchCycle:0,apiFailures:0,fetchError:'',rail:null};
 const document={hidden:false,querySelector:()=>null};
 const ctx=vm.createContext({scheduleRequest:null,regionalRequest:null,loadPlanned:async()=>{},loadRegional:async()=>{},state,document,Date:Clock,AbortController,queueMicrotask,MAX_STOP_IDS:24,WL_RATE_KEY:'rate',
  $:()=>null,currentPlatformStops:()=>[{...stop,id:'other',rbl:['99']}],findStop:()=>stop,visibleStationIds:()=>new Set(['other']),selectStopIds:()=>['99'],favoriteStopIds:()=>['99'],
  localStorage:{getItem:()=>null,setItem(){}},updateAppStatus(){},renderConnection(){},render(){},saveDepartureCache(){},
  setTimeout(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),
  retainDepartures:(before,incoming,ids)=>retainDepartures(before,incoming,ids,clock),railDepartures:()=>[],retryDelay,apiErrorMessage:()=> 'failed',
  fetchWl(stops,ids,signal){return new Promise((resolve,reject)=>calls.push({stops,ids,signal,resolve,reject}));}
 });
 const refresh=app.slice(app.indexOf('async function refreshDepartures('),app.indexOf('async function walkingMatrix('));
 const cancel=app.slice(app.indexOf('function cancelMonitor('),app.indexOf('function showConnection('));
 vm.runInContext(cancel+refresh,ctx);
 return {state,document,calls,timers,refresh:ctx.refreshDepartures,cancel:ctx.cancelMonitor,advance(ms){clock+=ms;},runTimer(){const [id,timer]=[...timers][0]||[];if(timer){timers.delete(id);timer.fn();}}};
}
test('actual app polling focuses on the connection platforms and preserves other cached station data',async()=>{
 const h=refreshHarness();h.state.departures=[departure({id:'other',rbl:'99'})];const pending=h.refresh();
 assert.deepEqual(Array.from(h.calls[0].ids),['2']);assert.equal(h.calls[0].stops[0].id,stop.id);
 h.calls[0].resolve([departure()]);await pending;
 assert.equal(h.state.departures.length,2);assert.equal(h.state.apiFailures,0);
 await h.refresh(true);assert.equal(h.calls.length,1);assert.equal(h.timers.size,1);assert.ok([...h.timers.values()][0].ms>=30000);
});
test('the open vehicle strip joins the existing connection request and closing it removes neighbouring RBLs',async()=>{
 const h=refreshHarness();h.state.vehicleStrip={ids:()=>['1','2','3','4','5','6','7','8']};let pending=h.refresh();assert.deepEqual(Array.from(h.calls[0].ids),['2','1','3','4','5','6','7','8']);h.calls[0].resolve([departure()]);await pending;assert.equal(h.calls.length,1);
 h.state.vehicleStrip.ids=()=>[];h.advance(30100);pending=h.refresh();assert.deepEqual(Array.from(h.calls[1].ids),['2']);h.calls[1].resolve([departure()]);await pending;
});
test('station departures keep priority and the expanded strip never exceeds the shared 24-RBL ceiling',async()=>{
 const h=refreshHarness();h.state.focusedConnection.ids=Array.from({length:20},(_,i)=>String(i+1));h.state.vehicleStrip={ids:()=>Array.from({length:8},(_,i)=>String(i+21))};const pending=h.refresh();assert.equal(h.calls[0].ids.length,24);assert.deepEqual(Array.from(h.calls[0].ids.slice(0,20)),h.state.focusedConnection.ids);h.calls[0].resolve([]);await pending;
});
test('actual app manual refresh and repeated requests preserve the global 30-second wait and backoff',async()=>{
 const h=refreshHarness();const pending=h.refresh();h.calls[0].reject(Object.assign(Error('429'),{status:429}));await pending;
 assert.equal(h.state.apiFailures,1);assert.equal(h.state.retryAt,now+60000);
 await h.refresh(true);await h.refresh(true);assert.equal(h.calls.length,1);assert.equal(h.timers.size,1);assert.ok([...h.timers.values()][0].ms>=60000);
});
test('actual app skips polling in the background and while another dialog covers the connection',async()=>{
 const h=refreshHarness();h.document.hidden=true;await h.refresh();h.document.hidden=false;h.document.querySelector=()=>({open:true});await h.refresh();assert.equal(h.calls.length,0);
});
test('changing view cancels an in-flight broad request, ignores late data and queues the new target without bypassing the interval',async()=>{
 const h=refreshHarness();h.state.focusedConnection=null;const pending=h.refresh();assert.deepEqual(h.calls[0].ids,['99']);
 h.cancel();h.state.focusedConnection={...target,ids:['2']};await h.refresh();assert.equal(h.calls[0].signal.aborted,true);
 h.calls[0].resolve([departure({rbl:'99'})]);await pending;await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.state.departures.length,0);assert.equal(h.state.apiFailures,0);assert.equal(h.calls.length,1);assert.equal(h.timers.size,1);
 h.advance(30100);h.runTimer();assert.deepEqual(Array.from(h.calls[1].ids),['2']);h.calls[1].resolve([departure()]);await new Promise(resolve=>setImmediate(resolve));assert.equal(h.state.departures[0].rbl,'2');
});
test('background cancellation does not turn into a network error or a retry',async()=>{
 const h=refreshHarness(),pending=h.refresh();h.document.hidden=true;h.cancel();h.calls[0].reject(new DOMException('cancelled','AbortError'));await pending;
 assert.equal(h.state.apiFailures,0);assert.equal(h.state.fetchError,'');assert.equal(h.timers.size,0);assert.equal(h.state.fetchLock,false);
});
test('opening and closing the real connection page retains overview scroll, selection and favorite values',()=>{
 const state={focusedConnection:null,departures:[departure()],favorites:[{...target}],connectionOpener:{dataset:{connectionStop:stop.id,connectionRoute:'U6',connectionTowards:'Floridsdorf'}}},nodes=new Map(),frames=[],scrolls=[];let focuses=0;
 const opener={dataset:state.connectionOpener.dataset,focus(options){assert.equal(options.preventScroll,true);focuses++;}};
 const $=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,focus(){},querySelectorAll:()=>[opener]});return nodes.get(id);};
 const ctx=vm.createContext({scheduleRequest:null,regionalRequest:null,loadPlanned:async()=>{},loadRegional:async()=>{},state,$,createStationVehiclePanel:()=>({dispose(){},ids:()=>[]}),findStop:()=>stop,connectionRequestIds,document:{body:{classList:{toggle(){}}}},window:{scrollY:432,scrollTo:value=>scrolls.push(value)},cancelMonitor(){},favoriteMenus:{close(){}},stationViewport:{pause(){},schedule(){}},render(){},requestAnimationFrame:fn=>frames.push(fn),refreshDepartures(){}});
 vm.runInContext(app.slice(app.indexOf('function showConnection('),app.indexOf('function connectionRefreshText(')),ctx);
 const before=JSON.stringify(state.favorites);ctx.showConnection(target);frames.shift()();assert.equal($('overviewMain').hidden,true);assert.equal($('connectionView').hidden,false);assert.equal(state.overviewScroll,432);
 ctx.showConnection({...target,towards:'Siebenhirten'});frames.shift()();assert.equal(state.overviewScroll,432);
 ctx.showConnection(null);frames.shift()();assert.equal(scrolls.at(-1).top,432);assert.equal(focuses,1);assert.equal($('overviewMain').hidden,false);assert.equal($('connectionView').hidden,true);assert.equal(JSON.stringify(state.favorites),before);
});
test('cancelled operator response does not update learned lines, notice caches, checks or error logs',async()=>{
 let release,mutations=0;const controller=new AbortController();
 const state={settings:{},config:{preferProxy:true,apiBase:'.'},queriedIds:new Set(),platformChecks:new Map(),trafficCache:{}};
 const ctx=vm.createContext({scheduleRequest:null,regionalRequest:null,loadPlanned:async()=>{},loadRegional:async()=>{},state,MAX_STOP_IDS:24,URLSearchParams,DOMException,location:{origin:'https://example.test'},performance,
  fetchJson:()=>new Promise(resolve=>release=resolve),parseWlMonitors:()=>{mutations++;return [];},learnMonitorLines:()=>mutations++,debugging:{record:()=>mutations++},updateTrafficCache:()=>mutations++,localStorage:{setItem:()=>mutations++}
 });
 vm.runInContext(app.slice(app.indexOf('async function fetchWl('),app.indexOf('function apiErrorMessage(')),ctx);
 const pending=ctx.fetchWl([stop],['2'],controller.signal);controller.abort();release({data:{monitors:[]}});
 await assert.rejects(pending,{name:'AbortError'});assert.equal(mutations,0);assert.equal(state.platformChecks.size,0);assert.equal(state.directWlBlocked,undefined);
});
test('a delayed open callback cannot scroll a restored overview back to the top',()=>{
 const state={focusedConnection:null,departures:[],connectionOpener:null},frames=[],scrolls=[];
 const ctx=vm.createContext({scheduleRequest:null,regionalRequest:null,loadPlanned:async()=>{},loadRegional:async()=>{},state,createStationVehiclePanel:()=>({dispose(){},ids:()=>[]}),$:()=>({hidden:false,focus(){},querySelectorAll:()=>[]}),findStop:()=>stop,connectionRequestIds,document:{body:{classList:{toggle(){}}}},window:{scrollY:640,scrollTo:value=>scrolls.push(value)},cancelMonitor(){},favoriteMenus:{close(){}},stationViewport:{pause(){},schedule(){}},render(){},requestAnimationFrame:fn=>frames.push(fn),refreshDepartures(){}});
 vm.runInContext(app.slice(app.indexOf('function showConnection('),app.indexOf('function connectionRefreshText(')),ctx);ctx.showConnection(target);ctx.showConnection(null);while(frames.length)frames.shift()();assert.deepEqual(scrolls.map(s=>s.top),[640]);
});

test('monitor links round-trip the exact station, line, mode and Unicode direction without requesting data',()=>{
 const value={...target,towards:'Siebenhirten (über Zentrum)'};
 const href=connectionMonitorUrl(value,[stop]),url=new URL(href,'https://foama-wien.endruuu.chatgpt.site/');
 assert.equal(url.origin,'https://foama-wien.endruuu.chatgpt.site');assert.equal(url.hash,'#verbindung');
 assert.deepEqual(connectionUrlTarget(url.search,[stop]),value);
 assert.equal(connectionUrlTarget('?halt=unknown&linie=U6',[stop]),null);
 assert.equal(connectionUrlTarget('?halt='+encodeURIComponent(stop.id)+'&linie='+'x'.repeat(31),[stop]),null);
});
test('a monitor link requires an exact known station with a Wiener Linien platform, rather than merely a timetable stop',()=>{
 for(const catalogue of [[],[{...stop,rbl:[]}],[{...stop,rbl:['invalid']}],[{...stop,provider:'gtfs'}]])assert.equal(connectionMonitorUrl(target,catalogue),null);
 assert.equal(connectionMonitorUrl({...target,stopId:'another'},[stop]),null);
});
test('opening a link replaces its initial entry and a standalone Back returns to the overview without reopening the link',()=>{
 const {win,entries}=fakeWindow(),changes=[];win.location={pathname:'/'};Object.defineProperty(win.history,'length',{get:()=>entries.length});
 const nav=createConnectionNavigation({window:win,onChange:value=>changes.push(value)});nav.open(target,{replace:true});
 assert.equal(entries.length,1);assert.equal(win.history.state.existing,'kept');assert.equal(changes.at(-1).route,'U6');
 nav.back();assert.equal(changes.at(-1),null);assert.equal(entries[0].hash,'/#naehe');assert.equal(win.history.state.foamaConnection,null);nav.stop();
});
