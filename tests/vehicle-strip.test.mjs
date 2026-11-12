import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {createStationVehiclePanel,createHorizontalVehicleStrip} from '../pwa/src/vehicle-strip.mjs';
import {decodeVehiclePilot,pilotGeometry} from '../pwa/src/vehicle-tracker.mjs';import {stationVehicleRange,vehicleDisplayId} from '../pwa/src/vehicle-data.mjs';
import {createStationVehicleMap,stationVehicleGeometry} from '../pwa/src/vehicle-map.mjs';
import {decodeJourneyPolyline} from '../pwa/src/journey-geometry.mjs';
const json=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const [index,manifest,mapIndex]=await Promise.all([json('../pwa/data/vehicle-pilot/index.json'),json('../pwa/data/timetables/wien/manifest.json'),json('../pwa/data/line-maps/wien/index.json')]);
const entry=index.lines.find(l=>l.id==='bus|48A'),data=await decodeVehiclePilot(await json('../pwa/data/vehicle-pilot/'+entry.file)),line=await json('../pwa/data/line-maps/wien/'+entry.file),direction=data.directions.find(d=>d.gtfsDirection==='0'&&d.stops.length===22),target={route:'48A',mode:'bus',stopId:direction.stops[8].id,towards:direction.towards};
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.style={setProperty(){}};this.dataset={};this.attributes={};this.handlers=new Map();this.selectors=new Map();this.classList={toggle(){}};this.clientWidth=320;}
 querySelector(selector){if(!this.selectors.has(selector))this.selectors.set(selector,new Element(selector));return this.selectors.get(selector);}
 addEventListener(type,fn){this.handlers.set(type,fn);}emit(type,event){this.handlers.get(type)?.(event);}
 setAttribute(k,v){this.attributes[k]=v;}append(child){child.parentElement=this;this.children.push(child);}replaceChildren(...children){for(const c of this.children)c.parentElement=null;this.children=[];for(const c of children)this.append(c);}remove(){this.removed=true;if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(c=>c!==this);this.parentElement=null;}}
}
function dom(){const old={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};let serial=0;const listeners=new Map();globalThis.document={hidden:false,createElement:t=>new Element(t),createTextNode:text=>({textContent:text}),addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)};globalThis.requestAnimationFrame=()=>++serial;globalThis.cancelAnimationFrame=()=>{};return {listeners,restore(){Object.assign(globalThis,old);}};}
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
 try{assert.match(strip.element.innerHTML,/aria-current="location"/);assert.match(strip.element.innerHTML,/von links nach rechts/);const t={id:'48A-H1-T001',position:{progress:range.center-1,next:range.center,station:null,basis:'interpolated'},status:'Plausibel'};strip.render({at:1,tracks:[t]});const marker=strip.element.querySelector('.vehicle-strip-vehicles').children[0],before=parseFloat(marker.style.left);t.position.progress+=.5;strip.render({at:1,tracks:[t]});assert.ok(parseFloat(marker.style.left)>before);assert.equal(marker.attributes['aria-label'].includes('48A · 01'),true);}finally{d.restore();}
});

test('tapping a vehicle again deselects it, and selecting another clears the first highlight',()=>{
 const d=dom(),range=stationVehicleRange(direction,target.stopId),strip=createHorizontalVehicleStrip({direction,range});
 try{const make=(id,progress)=>({id,position:{progress,next:range.center,station:null,basis:'interpolated'},status:'Plausibel'}),state={at:1,tracks:[make('48A-H1-T001',range.center-1),make('48A-H1-T002',range.center-.5)]};strip.render(state);const holder=strip.element.querySelector('.vehicle-strip-vehicles'),[a,b]=holder.children,click=button=>holder.emit('click',{target:{closest:()=>button}});click(a);assert.equal(a.attributes['aria-pressed'],'true');strip.render(state);assert.equal(a.attributes['aria-pressed'],'true');click(a);assert.equal(a.attributes['aria-pressed'],'false');click(a);click(b);assert.equal(a.attributes['aria-pressed'],'false');assert.equal(b.attributes['aria-pressed'],'true');click(b);assert.equal(b.attributes['aria-pressed'],'false');}finally{d.restore();}
});

function leaflet(){
 const stats={maps:0,fits:0,removed:0,added:0,tileRemoved:0,stops:[],markers:[],paths:[],resizes:[]};
 const map={invalidateSize(options){stats.resizes.push(options);},fitBounds(){stats.fits++;},stop(){},remove(){stats.removed++;}};
 const layer=()=>({addTo(){return this;},removeLayer(marker){marker.removed=true;}});
 const L={map(){stats.maps++;return map;},latLngBounds:points=>({points,pad(){return this;}}),layerGroup:layer,divIcon:options=>options,
  tileLayer(){return {on(){return this;},off(){},addTo(){stats.added++;return this;},remove(){stats.tileRemoved++;}};},
  polyline(points){stats.paths.push(points);return layer();},circleMarker(point,options){stats.stops.push({point,options});return {...layer(),bindPopup(){return this;}};},
  marker(point,options){const node=new Element('marker'),handlers=new Map(),marker={point,options,node,on:(type,fn)=>{handlers.set(type,fn);return marker;},addTo(){return marker;},setLatLng(next){marker.point=next;},setZIndexOffset(){},getElement:()=>node,click(){handlers.get('click')?.();}};stats.markers.push(marker);return marker;}};
 return {L,stats};
}

test('the station map establishes its first view before adding any vector layer',async()=>{
 const d=dom(),h=leaflet();let ready=false;const originalMap=h.L.map,originalLine=h.L.polyline;
 h.L.map=(...args)=>{const map=originalMap(...args),fit=map.fitBounds;map.fitBounds=(...bounds)=>{fit(...bounds);ready=true;};return map;};
 h.L.polyline=(...args)=>{assert.equal(ready,true,'queued SVG layers must not race the synchronous cached location hook');return originalLine(...args);};
 const view=createStationVehicleMap({direction,range:stationVehicleRange(direction,target.stopId),line,loadMap:async()=>h.L});
 try{await view.show();assert.equal(h.stats.paths.length,1);assert.equal(h.stats.stops.length,8);assert.equal(h.stats.fits,1);assert.doesNotMatch(view.element.querySelector('.station-vehicle-map-note').textContent,/nicht verfügbar/);view.dispose();}finally{d.restore();}
});

test('a partial map initialization is disposed, ignores track updates and can be retried',async()=>{
 const d=dom(),h=leaflet(),originalLine=h.L.polyline;let fail=true;
 h.L.polyline=(...args)=>{if(fail){fail=false;throw Error('renderer unavailable');}return originalLine(...args);};
 const range=stationVehicleRange(direction,target.stopId),view=createStationVehicleMap({direction,range,line,loadMap:async()=>h.L});
 const state={at:1,tracks:[{id:'48A-R5-T001',position:{progress:range.center-1,next:range.center,basis:'interpolated'},status:'Plausibel'}]};
 try{await view.show();assert.match(view.element.querySelector('.station-vehicle-map-note').textContent,/zum Schema wechseln/);assert.equal(h.stats.removed,1);assert.equal(view.element.querySelector('button').disabled,true);view.render(state);assert.equal(h.stats.markers.length,0);await view.show();assert.equal(h.stats.maps,2);assert.equal(h.stats.paths.length,1);assert.equal(h.stats.markers.length,1);assert.doesNotMatch(view.element.querySelector('.station-vehicle-map-note').textContent,/nicht verfügbar/);view.dispose();assert.equal(h.stats.removed,2);}finally{d.restore();}
});

test('display identifiers include the line and never expose internal direction/session prefixes',()=>{
 for(const [id,route,label] of [['U6-R5-T001','U6','U6 · 01'],['46-H2-T002','46','46 · 02'],['48A-H18-T003','48A','48A · 03'],['N29-R1-T123','N29','N29 · 123']])assert.equal(vehicleDisplayId(id,route),label);
 assert.equal(vehicleDisplayId('unassigned','48A'),'48A');
});

test('the station map crops the real route geometry at the same eight-stop anchors as the schematic',()=>{
 const range=stationVehicleRange(direction,target.stopId),result=stationVehicleGeometry(direction,range,line),pattern=line.patterns.find(p=>p.id===direction.patternId),full=pilotGeometry(decodeJourneyPolyline(line.shapes[pattern.geometry]),direction.stops);
 assert.ok(result.path.length>2,'real intermediate shape bends are retained');
 for(const point of result.path.slice(1,-1))assert.ok(full.points.some(p=>p[0]===point[0]&&p[1]===point[1]),'intermediate vertices come from the actual route');
 for(const [point,expected] of [[result.path[0],full.at(range.start)],[result.path.at(-1),full.at(range.end)]])for(let axis=0;axis<2;axis++)assert.ok(Math.abs(point[axis]-expected[axis])<1e-8);
 assert.deepEqual(result.coordinate({progress:range.center-.5}),full.at(range.center-.5));
 assert.deepEqual(result.coordinate({from:range.start-1,to:range.center,fraction:.8}),full.between(range.start-1,range.center,.8),'skipped-stop projections keep the original global anchors');
 assert.throws(()=>stationVehicleGeometry(direction,range,{patterns:[],shapes:{}}),/Linienverlauf fehlt/);
});

test('startup view toggles keep only the readiness placeholder and defer the map without new requests',async()=>{
 const d=dom();let calls=0,changes=0,created=0,shows=0,hides=0,disposed=0,lastState;const panel=createStationVehiclePanel({target,dataSource:{index:async()=>{calls++;return {index};},line:async()=>{calls++;return {data,line,manifest};}},onIdsChanged:()=>changes++,mapFactory:()=>{created++;return {element:new Element('map'),show(){shows++;},hide(){hides++;},dispose(){disposed++;},render(state){lastState=state;},setSelected(){}};}});
 try{
  assert.equal(created,0);panel.element.open=true;panel.element.emit('toggle');await flush();assert.equal(created,0);const ids=panel.ids(),root=panel.element,map=root.querySelector('[data-vehicle-view="map"]'),schema=root.querySelector('[data-vehicle-view="schema"]');
  map.emit('click');assert.equal(created,0);assert.equal(shows,0);assert.equal(map.attributes['aria-pressed'],'true');assert.deepEqual(panel.ids(),ids);panel.fail('Temporary source outage');assert.equal(root.querySelector('.station-vehicle-readiness').hidden,false);assert.equal(root.querySelector('.station-vehicle-map-holder').hidden,true);
  schema.emit('click');map.emit('click');assert.equal(created,0);assert.equal(root.querySelector('.station-vehicle-strip').hidden,true);assert.equal(calls,2);assert.equal(changes,1,'view changes must not trigger another live request');
  panel.element.open=false;panel.element.emit('toggle');assert.equal(hides,0);assert.deepEqual(panel.ids(),[]);panel.element.open=true;panel.element.emit('toggle');assert.equal(created,0);assert.equal(map.attributes['aria-pressed'],'true');assert.deepEqual(panel.ids(),ids);assert.equal(disposed,0);panel.dispose();assert.equal(disposed,0);
 }finally{d.restore();}
});

test('real bus IDs and selected vehicle survive schematic/map switching; second map tap deselects',async()=>{
 const d=dom(),originalNow=Date.now,recording=await json('./fixtures/vehicle-station-live.json'),context=recording.contexts.find(c=>c.route==='48A'),bus=await decodeVehiclePilot(await json('../pwa/data/vehicle-pilot/'+context.file)),route=bus.directions.find(d=>d.id===context.direction);let now=Date.parse(recording.snapshots[0].foamaMonitorAt),mapOptions,selected='',state,loads=0;
 Date.now=()=>now;const panel=createStationVehiclePanel({target:{...context,towards:route.towards,rbls:context.ids},dataSource:{index:async()=>({index}),line:async()=>{loads++;return {data:{...bus,directions:[route]},line,manifest};}},mapFactory:options=>{mapOptions=options;return {element:new Element('map'),show(){},hide(){},dispose(){},render(s){state=s;},setSelected(id){selected=id;}};}});
 try{
  panel.element.open=true;panel.element.emit('toggle');await flush();for(const raw of recording.snapshots){now=Math.max(Date.parse(raw.foamaMonitorAt),Date.parse(raw.message.serverTime));panel.ingest(raw);}
  const strip=panel.element.querySelector('.station-vehicle-strip').children[0],vehicles=strip.querySelector('.vehicle-strip-vehicles'),marker=vehicles.children[0];assert.ok(marker,'captured bus boards produce a real tracker position');const id=marker.dataset.vehicle;vehicles.emit('click',{target:{closest:()=>marker}});
  panel.element.querySelector('[data-vehicle-view="map"]').emit('click');assert.equal(selected,id);assert.ok(state.tracks.some(t=>t.id===id&&t.position));mapOptions.onSelect(id);assert.equal(selected,'');mapOptions.onSelect(id);assert.equal(selected,id);
  panel.element.open=false;panel.element.emit('toggle');panel.element.open=true;panel.element.emit('toggle');assert.equal(selected,id);assert.equal(panel.element.querySelector('.station-vehicle-readiness').hidden,true);
  panel.element.querySelector('[data-vehicle-view="schema"]').emit('click');assert.equal(vehicles.children.find(n=>n.dataset.vehicle===id).attributes['aria-pressed'],'true');assert.equal(loads,1);panel.dispose();
 }finally{Date.now=originalNow;d.restore();}
});

test('recorded station positions replace startup information, stay visible while held and restore it on expiry',async()=>{
 const d=dom(),originalNow=Date.now,recording=await json('./fixtures/vehicle-station-live.json'),context=recording.contexts.find(c=>c.route==='48A'),bus=await decodeVehiclePilot(await json('../pwa/data/vehicle-pilot/'+context.file)),route=bus.directions.find(d=>d.id===context.direction);let now=Date.parse(recording.snapshots[0].foamaMonitorAt);
 Date.now=()=>now;const panel=createStationVehiclePanel({target:{...context,towards:route.towards,rbls:context.ids},dataSource:{index:async()=>({index}),line:async()=>({data:{...bus,directions:[route]},line,manifest})}});
 try{
  panel.element.open=true;panel.element.emit('toggle');await flush();const progress=panel.element.querySelector('.station-vehicle-readiness'),holder=panel.element.querySelector('.station-vehicle-strip'),message=panel.element.querySelector('.station-vehicle-message'),strip=holder.children[0];
  assert.equal(progress.hidden,false);assert.equal(holder.hidden,true);assert.equal(message.hidden,true);
  panel.ingest(recording.snapshots[0]);assert.equal(progress.hidden,false);assert.equal(holder.hidden,true,'a single source must not reveal an empty diagram');
  for(const raw of recording.snapshots.slice(1)){now=Math.max(Date.parse(raw.foamaMonitorAt),Date.parse(raw.message.serverTime));panel.ingest(raw);}
  assert.equal(progress.hidden,true);assert.equal(holder.hidden,false);assert.equal(message.hidden,false);assert.equal(holder.children[0],strip,'the existing widget stays mounted');
  panel.fail('Test source gap');assert.equal(holder.hidden,false,'a drawable last-known position keeps the diagram visible');assert.equal(progress.hidden,true);
  now+=91_000;panel.waiting(1000);assert.equal(progress.hidden,false);assert.equal(holder.hidden,true);assert.equal(message.hidden,true);assert.equal(holder.children[0],strip);
  panel.dispose();
 }finally{Date.now=originalNow;d.restore();}
});

test('map updates preserve user framing, use readable line labels and remove expired markers',async()=>{
 const d=dom(),h=leaflet(),range=stationVehicleRange(direction,target.stopId);let selected='';const view=createStationVehicleMap({direction,range,line,loadMap:async()=>h.L,onSelect:id=>selected=id});
 try{
  await view.show();assert.equal(h.stats.maps,1);assert.equal(h.stats.fits,1);assert.equal(h.stats.stops.length,8);assert.equal(h.stats.stops.filter(s=>s.options.fillColor==='#73e0b7').length,1);
  const track={id:'48A-R5-T001',position:{progress:range.center-1,next:range.center,basis:'interpolated'},status:'Plausibel'},outside={...track,id:'48A-R5-T002',position:{...track.position,progress:range.end+1}};view.render({at:1,tracks:[track,outside]});assert.equal(h.stats.markers.length,1);const marker=h.stats.markers[0],before=marker.point;
  assert.match(marker.options.icon.html,/48A · 01/);assert.doesNotMatch(marker.options.icon.html,/R5|T001/);marker.click();assert.equal(selected,track.id);view.setSelected(selected);assert.equal(marker.node.attributes['aria-pressed'],'true');
  track.position.progress+=.5;view.render({at:1,tracks:[track]});assert.notDeepEqual(marker.point,before);assert.equal(h.stats.fits,1,'routine movement must not fit or recenter the map');view.hide();await view.show();assert.equal(h.stats.maps,1);assert.equal(h.stats.fits,1,'switching back retains the user map bounds');
  assert.ok(h.stats.resizes.every(options=>options.pan!==false&&!options.animate),'revealing a resized map preserves its geographic center without animation');
  view.render({at:1,tracks:[]});assert.equal(marker.removed,true);view.dispose();assert.equal(h.stats.removed,1);
 }finally{d.restore();}
});

test('a late map module load cannot create a map after hiding, backgrounding or disposing',async()=>{
 for(const stop of ['hide','background','dispose']){
  const d=dom(),h=leaflet();let release;const view=createStationVehicleMap({direction,range:stationVehicleRange(direction,target.stopId),line,loadMap:()=>new Promise(r=>release=r),isCurrent:()=>!document.hidden});
  try{const loading=view.show();if(stop==='background')document.hidden=true;else view[stop]();release(h.L);await loading;assert.equal(h.stats.maps,0);view.dispose();}finally{d.restore();}
 }
});

test('a failed map module reports a recoverable fallback while leaving the schematic available',async()=>{
 const d=dom(),view=createStationVehicleMap({direction,range:stationVehicleRange(direction,target.stopId),line,loadMap:async()=>{throw Error('offline');}});
 try{await view.show();assert.match(view.element.querySelector('.station-vehicle-map-note').textContent,/zum Schema wechseln/);view.dispose();}finally{d.restore();}
});
