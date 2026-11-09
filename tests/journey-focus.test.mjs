import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {focusedJourneyBoardings,journeyMonitorIds} from '../pwa/src/journey-client.mjs';
import {journeyStationMarkup} from '../pwa/src/journey-station.mjs';
import {journeyLineDepartures} from '../pwa/src/journey-planning.mjs';
const source=readFileSync(new URL('../pwa/src/journey-page.mjs',import.meta.url),'utf8');
const walk={mode:'walk',from:{name:'A'},to:{name:'B'},durationSeconds:480,geometry:'selected-walk'};
const ride=(stopId,route,towards)=>({mode:'metro',route,towards,from:{stopId,name:stopId},to:{name:'Exit'},endTime:'2099-01-01T00:00:00Z'});
test('third-stage focus selects its own boarding station and next transfer within the shared 24-platform budget',()=>{
 const legs=[walk,ride('wl:1','U1','A'),walk,ride('wl:2','U2','B'),walk,ride('wl:3','U3','C')],journey={legs,savedPath:true};
 assert.deepEqual(focusedJourneyBoardings(journey,5).map(t=>t.stopId),['wl:3']);assert.deepEqual(focusedJourneyBoardings(journey,3).map(t=>t.stopId),['wl:2','wl:3']);assert.deepEqual(focusedJourneyBoardings(journey,null).map(t=>t.stopId),['wl:1','wl:2']);
 const stops=[1,2,3].map(i=>({id:'wl:'+i,provider:'wl',rbl:[String(i)],platforms:[{id:String(i),modes:['metro']}]}));assert.deepEqual(journeyMonitorIds(focusedJourneyBoardings(journey,5),stops),['3']);
});
test('focused station shows only the selected line, mode and direction, while explicit all departures keeps the opposite direction',()=>{
 const now=Date.now(),stop={id:'wl:s',provider:'wl',name:'Thaliastraße U',rbl:['1']},first={provider:'wl',rbl:'1',mode:'metro',route:'U6',towards:'Floridsdorf',actual:new Date(now+240000).toISOString(),fetchedAt:new Date(now).toISOString(),quality:'live'};
 const rows=[first,{...first,towards:'Siebenhirten'},{...first,route:'U4'},{...first,mode:'tram'},{...first,rbl:'9'}],opts={now,escape:String,badge:g=>'<b>'+g.route+'</b>'};
 const html=journeyStationMarkup(stop,rows,{...opts,connection:{mode:'metro',route:'U6',towards:'Wien Floridsdorf'}});assert.ok(html.includes('Floridsdorf'));assert.ok(!html.includes('Siebenhirten'));assert.ok(!html.includes('U4'));assert.ok(html.indexOf('Thaliastraße U')<html.indexOf('U6'));assert.ok(journeyStationMarkup(stop,rows,opts).includes('Siebenhirten'));
});
test('the real 29B planner/monitor headsign difference retains current times in both route and focused station',()=>{
 const now=Date.now(),stop={id:'wl:s',provider:'wl',name:'Floridsdorf S U',rbl:['1']},connection={mode:'bus',route:'29B',towards:'Wien Großfeldsiedlung'},first={provider:'wl',rbl:'1',mode:'bus',route:'29B',towards:'Großfeldsiedlung U (über Leopoldau S U)',actual:new Date(now+240000).toISOString(),fetchedAt:new Date(now).toISOString(),quality:'live'};
 const rows=[first,{...first,towards:'Floridsdorf S U',actual:new Date(now+60000).toISOString()},{...first,route:'29A'}],options={now,escape:String,badge:g=>'<b>'+g.route+'</b>',connection};
 assert.deepEqual(journeyLineDepartures({stopId:stop.id,...connection},rows,[stop],{now,earliest:now}),[first]);
 const html=journeyStationMarkup(stop,rows,options);assert.ok(html.includes('>4′<'));assert.ok(html.includes('>LIVE<'));assert.ok(html.includes('über Leopoldau'));assert.ok(!html.includes('29A'));assert.ok(!html.includes('>1′<'));
});
test('journey previews resolve the exact boarding station and place it before its line and direction',()=>{
 const ctx=vm.createContext({state:{stops:[{id:'wl:s',name:'Thaliastraße U'}]},escape:String,badge:l=>'<b>'+l.route+'</b>'});vm.runInContext(source.slice(source.indexOf('function stationName('),source.indexOf('function stopName(')),ctx);
 const html=ctx.boardingPreview({from:{stopId:'wl:s',name:'A street address'},to:{name:'Exit'},route:'U6',towards:'Floridsdorf'});assert.ok(!html.includes('A street address'));assert.ok(html.indexOf('Thaliastraße U')<html.indexOf('U6'));assert.ok(html.indexOf('U6')<html.indexOf('Floridsdorf'));
});
test('removal undo expires at sixty seconds, replaces its previous timer and cannot restore after background delay',()=>{
 let now=1000,seq=0,saves=0;const timers=new Map(),toast={hidden:true},state={favorites:[{id:'a'},{id:'b'}],undoTimer:null,undoUntil:0};
 const ctx=vm.createContext({state,Date:class extends Date{static now(){return now;}},$:()=>toast,persistFavorites:()=>{saves++;return true;},status(){},setTimeout:(fn,ms)=>{const id=++seq;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(source.slice(source.indexOf('function expireUndo('),source.indexOf("$('journeyForm')",source.indexOf('function expireUndo('))),ctx);ctx.removeFavorite('a');assert.equal(toast.hidden,false);assert.equal([...timers.values()][0].ms,60000);now+=100;ctx.removeFavorite('b');assert.equal(timers.size,1);assert.equal(state.undoUntil,now+60000);now+=59999;ctx.undoRemoval();assert.deepEqual(state.favorites,[{id:'b'}]);assert.equal(toast.hidden,true);
 ctx.removeFavorite('b');now+=60000;ctx.undoRemoval();assert.equal(state.favorites.length,0);assert.equal(toast.hidden,true);assert.equal(state.deletedFavorite,null);assert.equal(saves,4);
});
test('a walking map draws exactly its selected section and does not plan or request another route',async()=>{
 const journey={legs:[{...walk,geometry:'first'},ride('wl:1','U1','A'),{...walk,geometry:'second'}]},state={selected:journey,stops:[],walkMaps:new Map()},elements=new Map();let plotted=null,destroyed=0;
 for(let index of [0,2]){const attrs={};elements.set('button'+index,{dataset:{walkToggle:String(index)},setAttribute:(k,v)=>attrs[k]=v,getAttribute:k=>attrs[k]});elements.set('journeyWalkPanel-'+index,{hidden:true});elements.set('journeyWalkMap-'+index,{});elements.set('journeyWalkMapStatus-'+index,{});}
 const steps={querySelector:selector=>elements.get('button'+selector.match(/\d+/)[0]),querySelectorAll:()=>[elements.get('button0'),elements.get('button2')]};
 const ctx=vm.createContext({state,document:{hidden:false},$:id=>id==='journeySteps'?steps:elements.get(id),openStation(){},createJourneyMap:async()=>({draw:value=>{plotted=value;return {hasGeometry:true,schematic:false};},destroy(){destroyed++;}})});
 vm.runInContext(source.slice(source.indexOf('function clearWalkMaps('),source.indexOf('function closePicker(')),ctx);await ctx.toggleWalkMap(2);assert.equal(plotted.legs.length,1);assert.equal(plotted.legs[0].geometry,'second');assert.equal(elements.get('journeyWalkPanel-2').hidden,false);await ctx.toggleWalkMap(2);assert.equal(destroyed,1);assert.equal(state.walkMaps.size,0);
});
test('routine departure updates preserve expanded walking maps and update only the current time slots',()=>{
 const journey={legs:[walk,ride('wl:1','U1','A')]},state={selected:journey,station:null,favorites:[],renderedJourney:journey,renderedWalk:null,walk:null,renderedName:'Gespeicherte Route',from:{},walkMaps:new Map([[0,{map:{}}]])},slot={dataset:{liveLeg:'1'},innerHTML:'old'};let rebuilt=0,cleared=0;
 const ui=new Map(),steps={querySelectorAll:()=>[slot],set innerHTML(value){rebuilt++;}};const $=id=>{if(id==='journeySteps')return steps;if(!ui.has(id))ui.set(id,{setAttribute(){}});return ui.get(id);};
 const ctx=vm.createContext({state,$,clearWalkMaps:()=>cleared++,liveMarkup:()=>'<span>new LIVE</span>'});vm.runInContext(source.slice(source.indexOf('function showSteps('),source.indexOf('function renderCurrent(')),ctx);ctx.showSteps();assert.equal(rebuilt,0);assert.equal(cleared,0);assert.equal(state.walkMaps.size,1);assert.ok(slot.innerHTML.includes('new LIVE'));
});
