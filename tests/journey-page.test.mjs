import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {upcomingBoardings,focusedJourneyBoardings,journeyMonitorIds} from '../pwa/src/journey-client.mjs';
import {parseWlMonitors} from '../pwa/src/core.mjs';
import {retainDepartures} from '../pwa/src/departure-cache.mjs';
const source=readFileSync(new URL('../pwa/src/journey-page.mjs',import.meta.url),'utf8');
const monitorCode=source.slice(source.indexOf('function pauseMonitor('),source.indexOf('function showJourney('));
function harness(){
 let clock=Date.parse('2026-11-08T22:00:00Z'),nextId=0,renders=0;const calls=[],timers=new Map(),storage=new Map(),document={hidden:false};
 const stops=[{id:'wl:1',provider:'wl',rbl:['1','2'],platforms:[{id:'1',modes:['metro']},{id:'2',modes:['metro']}]}];
 const selected={savedPath:true,legs:[{mode:'metro',route:'U6',from:{stopId:'wl:1'},to:{},towards:'Floridsdorf'}]};
 const state={selected,departures:[],monitor:null,monitorTimer:null,renderTimer:null,lastAttempt:0,retryAt:0,stops,error:'',monitorRevision:0,stationCycle:0};
 const ctx=vm.createContext({state,document,Date:class extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}},AbortController,URLSearchParams,
  upcomingBoardings:journey=>upcomingBoardings(journey,clock),focusedJourneyBoardings:(journey,index)=>focusedJourneyBoardings(journey,index,clock),journeyMonitorIds,
  localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},
  setTimeout:(fn,ms)=>{const id=++nextId;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),setInterval:()=>++nextId,clearInterval(){},
  selectStopIds:(stops,modes,limit)=>stops.flatMap(s=>s.rbl).slice(0,limit),retainDepartures:(old,rows,ids)=>retainDepartures(old,rows,ids,clock),
  fetch:(url,options)=>new Promise(resolve=>calls.push({url,options,resolve})),parseWlMonitors,renderCurrent:()=>renders++});
 vm.runInContext(monitorCode,ctx);return {state,document,calls,timers,storage,monitor:ctx.monitor,pause:ctx.pauseMonitor,advance:ms=>clock+=ms,response:()=>Response.json({data:{monitors:[{locationStop:{properties:{title:'Test station',attributes:{rbl:'1'}}},lines:[{name:'U6',type:'ptMetro',towards:'Floridsdorf',departures:{departure:[{departureTime:{timeReal:new Date(clock+240000).toISOString()}}]}}]}]}}),get renders(){return renders;}};
}
test('actual journey page monitor respects the shared app 30-second budget and updates only known boarding platforms',async()=>{
 const h=harness();h.storage.set('foama.wl.lastApiAttempt.v1',String(Date.parse('2026-11-08T22:00:00Z')));await h.monitor();assert.equal(h.calls.length,0);assert.ok([...h.timers.values()].some(timer=>timer.ms>=30000));
 h.pause();h.advance(30100);const pending=h.monitor();assert.match(h.calls[0].url,/stopId=1/);assert.match(h.calls[0].url,/stopId=2/);h.calls[0].resolve(h.response());await pending;assert.equal(h.state.departures.length,1);assert.equal(typeof h.state.departures[0].fetchedAt,'string');assert.equal(h.renders,1);
});
test('actual journey page cancels on pause or navigation and ignores a late response without cache or render changes',async()=>{
 const h=harness();h.document.hidden=true;await h.monitor();assert.equal(h.calls.length,0);h.document.hidden=false;
 const pending=h.monitor();h.document.hidden=true;h.pause();assert.equal(h.calls[0].options.signal.aborted,true);h.calls[0].resolve(h.response());await pending;assert.equal(h.state.departures.length,0);assert.equal(h.renders,0);assert.equal(h.timers.size,0);
 h.document.hidden=false;h.advance(30100);const second=h.monitor();h.state.selected=null;h.pause();h.calls[1].resolve(h.response());await second;assert.equal(h.state.departures.length,0);assert.equal(h.renders,0);
});
test('editing a route endpoint discards earlier alternatives before they can be saved under different endpoints',()=>{
 const state={from:{name:'Old start'},journeys:[{old:true}],stops:[{name:'New station'}]},input={value:'New',dataset:{chosen:'true'},setAttribute(){}};let cleared=0,rows=[];
 const ctx=vm.createContext({state,placesUI:null,$:id=>id==='journeyResults'?{replaceChildren(){cleared++;}}:input,cancelSearch(){},choices(kind,values){rows=values;}});
 vm.runInContext(source.slice(source.indexOf('function invalidateResults('),source.indexOf('function selectPoint('))+source.slice(source.indexOf('function localChoices('),source.indexOf('function choices(')),ctx);
 ctx.localChoices('from');assert.equal(state.from,null);assert.equal(state.journeys.length,0);assert.equal(cleared,1);assert.equal(rows[0].name,'New station');assert.equal(input.dataset.chosen,undefined);
});
test('switching from a route to its station cancels the narrower request even while the selected route remains the same',async()=>{
 const h=harness(),selected=h.state.selected,pending=h.monitor();h.pause();h.state.station=h.state.stops[0];h.calls[0].resolve(h.response());await pending;assert.equal(h.renders,0);assert.equal(h.state.departures.length,0);assert.equal(h.state.selected,selected);
 h.advance(30100);const station=h.monitor();assert.match(h.calls[1].url,/stopId=1/);assert.match(h.calls[1].url,/stopId=2/);h.calls[1].resolve(h.response());await station;assert.equal(h.renders,1);
});
test('ambiguous typed destinations never trigger GPS or routing before explicit selection',async()=>{
 const state={revision:0,from:{kind:'current'},to:null};let gps=0,plans=0,busy=false;const ctx=vm.createContext({state,document:{hidden:false},cancelSearch:()=>state.revision++,busy:value=>busy=value,status(){},lookupPlace:async()=>false,getLocation:async()=>gps++,client:{plan:async()=>plans++}});
 vm.runInContext(source.slice(source.indexOf('async function search('),source.indexOf('function setTime(')),ctx);await ctx.search();assert.equal(gps,0);assert.equal(plans,0);assert.equal(busy,false);
});
