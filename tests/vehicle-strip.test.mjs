import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {createStationVehiclePanel,createHorizontalVehicleStrip} from '../pwa/src/vehicle-strip.mjs';
import {decodeVehiclePilot} from '../pwa/src/vehicle-tracker.mjs';import {stationVehicleRange} from '../pwa/src/vehicle-data.mjs';
const json=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const [index,manifest,mapIndex]=await Promise.all([json('../pwa/data/vehicle-pilot/index.json'),json('../pwa/data/timetables/wien/manifest.json'),json('../pwa/data/line-maps/wien/index.json')]);
const entry=index.lines.find(l=>l.id==='bus|48A'),data=await decodeVehiclePilot(await json('../pwa/data/vehicle-pilot/'+entry.file)),line=await json('../pwa/data/line-maps/wien/'+entry.file),direction=data.directions.find(d=>d.gtfsDirection==='0'&&d.stops.length===22),target={route:'48A',mode:'bus',stopId:direction.stops[8].id,towards:direction.towards};
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.style={setProperty(){}};this.dataset={};this.attributes={};this.handlers=new Map();this.selectors=new Map();this.classList={toggle(){}};this.clientWidth=320;}
 querySelector(selector){if(!this.selectors.has(selector))this.selectors.set(selector,new Element(selector));return this.selectors.get(selector);}
 addEventListener(type,fn){this.handlers.set(type,fn);}emit(type){this.handlers.get(type)?.();}
 setAttribute(k,v){this.attributes[k]=v;}append(child){this.children.push(child);}replaceChildren(...children){this.children=children;}remove(){this.removed=true;}
}
function dom(){const old={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};let serial=0;const listeners=new Map();globalThis.document={hidden:false,createElement:t=>new Element(t),addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)};globalThis.requestAnimationFrame=()=>++serial;globalThis.cancelAnimationFrame=()=>{};return {listeners,restore(){Object.assign(globalThis,old);}};}
const flush=()=>new Promise(setImmediate);
test('a closed station strip makes no data request; opening and closing controls the same eight-stop request scope',async()=>{
 const d=dom();let calls=0,changes=0;const source={index:async()=>{calls++;return {index};},line:async()=>{calls++;return {data,line,manifest};}};const panel=createStationVehiclePanel({target,dataSource:source,onIdsChanged:()=>changes++});
 try{assert.equal(calls,0);assert.deepEqual(panel.ids(),[]);panel.element.open=true;panel.element.emit('toggle');await flush();await flush();assert.equal(calls,2);assert.deepEqual(panel.ids(),stationVehicleRange(direction,target.stopId).ids);assert.equal(changes,1);panel.element.open=false;panel.element.emit('toggle');assert.deepEqual(panel.ids(),[]);assert.equal(changes,2);panel.dispose();assert.equal(d.listeners.size,0);}finally{d.restore();}
});
test('closing or leaving while route data is loading cannot re-enable a hidden vehicle strip',async()=>{
 const d=dom();let release;const source={index:async()=>({index}),line:()=>new Promise(resolve=>release=resolve)},panel=createStationVehiclePanel({target,dataSource:source});
 try{panel.element.open=true;panel.element.emit('toggle');await flush();panel.element.open=false;panel.element.emit('toggle');release({data,line,manifest});await flush();assert.deepEqual(panel.ids(),[]);panel.dispose();assert.equal(panel.element.removed,true);assert.deepEqual(panel.ids(),[]);}finally{d.restore();}
});
test('closing during the catalogue request prevents a later line download',async()=>{
 const d=dom();let release;const source={index:()=>new Promise(resolve=>release=resolve),line:()=>assert.fail('closed panel must not download a line')},panel=createStationVehiclePanel({target,dataSource:source});
 try{panel.element.open=true;panel.element.emit('toggle');panel.element.open=false;panel.element.emit('toggle');release({index});await flush();assert.deepEqual(panel.ids(),[]);panel.dispose();}finally{d.restore();}
});
test('backgrounding discards pending line data and resumes loading only after returning',async()=>{
 const d=dom();let release,calls=0,changes=0;const source={index:async()=>({index}),line:()=>{calls++;return new Promise(resolve=>release=resolve);}},panel=createStationVehiclePanel({target,dataSource:source,onIdsChanged:()=>changes++});
 try{panel.element.open=true;panel.element.emit('toggle');await flush();document.hidden=true;d.listeners.get('visibilitychange')();release({data,line,manifest});await flush();assert.equal(changes,0);assert.deepEqual(panel.ids(),[]);document.hidden=false;d.listeners.get('visibilitychange')();await flush();assert.equal(calls,2);release({data,line,manifest});await flush();assert.equal(changes,1);assert.ok(panel.ids().length);const url=new URL(panel.element.querySelector('.station-vehicle-full').href,'https://example.org');assert.equal(url.searchParams.get('variante'),direction.patternId);assert.equal(url.searchParams.get('halt'),target.stopId);panel.dispose();}finally{d.restore();}
});
test('an unsupported line reports its absence and never supplies query IDs',async()=>{
 const d=dom(),panel=createStationVehiclePanel({target:{...target,route:'unsupported'},dataSource:{index:async()=>({index}),line:()=>assert.fail()}});
 try{panel.element.open=true;panel.element.emit('toggle');await flush();assert.deepEqual(panel.ids(),[]);assert.match(panel.element.querySelector('.station-vehicle-message').textContent,/keine eindeutige/);panel.dispose();}finally{d.restore();}
});
test('the horizontal schematic moves vehicles left to right and keeps the selected real station marked',()=>{
 const d=dom(),range=stationVehicleRange(direction,target.stopId),strip=createHorizontalVehicleStrip({direction,range});
 try{assert.match(strip.element.innerHTML,/aria-current="location"/);assert.match(strip.element.innerHTML,/von links nach rechts/);const t={id:'48A-H1-T001',position:{progress:range.center-1,next:range.center,station:null,basis:'interpolated'},status:'Plausibel'};strip.render({at:1,tracks:[t]});const marker=strip.element.querySelector('.vehicle-strip-vehicles').children[0],before=parseFloat(marker.style.left);t.position.progress+=.5;strip.render({at:1,tracks:[t]});assert.ok(parseFloat(marker.style.left)>before);assert.equal(marker.attributes['aria-label'].includes('48A-H1-T001'),true);}finally{d.restore();}
});
