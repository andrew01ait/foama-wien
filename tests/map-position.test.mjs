import test from 'node:test';
import assert from 'node:assert/strict';
import {createMapPositionSource,validMapPosition,attachMapPosition,installMapPositions} from '../pwa/src/map-position.mjs';
const flush=()=>new Promise(setImmediate),fix={lat:48.208,lon:16.37,accuracy:12,timestamp:100000};
function harness(permission='granted'){
 let now=100000,sequence=0;const timers=new Map(),events=new Map(),watches=[],cleared=[];
 const doc={hidden:false,addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
 const nav={permissions:{query:async()=>({state:permission})},geolocation:{watchPosition:(success,error,options)=>{watches.push({success,error,options});return watches.length;},clearWatch:id=>cleared.push(id)}};
 const source=createMapPositionSource({nav,doc,now:()=>now,schedule:f=>{timers.set(++sequence,f);return sequence;},cancel:id=>timers.delete(id)});
 return {source,doc,nav,watches,cleared,timers,events,advance(ms){now+=ms;for(const f of timers.values())f();}};
}
test('current-map fixes require real coordinates, accuracy and fresh timestamps',()=>{
 assert.equal(validMapPosition(fix,100000),true);assert.equal(validMapPosition({...fix,accuracy:500},100000),true);
 for(const change of [{lat:91},{lon:181},{accuracy:-1},{accuracy:undefined},{timestamp:9999},{timestamp:131000},{timestamp:undefined}])assert.equal(validMapPosition({...fix,...change},100000),false);
});
test('multiple visible maps share one granted location watch and never request high accuracy',async()=>{
 const h=harness(),seen=[];const a=h.source.subscribe(v=>seen.push(v)),b=h.source.subscribe(()=>{});await flush();assert.equal(h.watches.length,1);assert.equal(h.watches[0].options.enableHighAccuracy,false);
 h.watches[0].success({coords:{latitude:fix.lat,longitude:fix.lon,accuracy:12},timestamp:100000});assert.deepEqual(h.source.position(),fix);
 a();assert.deepEqual(h.cleared,[]);b();assert.deepEqual(h.cleared,[1]);assert.equal(h.timers.size,0);h.watches[0].success({coords:{latitude:49,longitude:16,accuracy:5},timestamp:100000});assert.deepEqual(h.source.position(),fix);h.source.dispose();
});
test('ungranted, denied and unavailable permissions never trigger a location prompt',async()=>{
 for(const permission of ['prompt','denied','unknown']){const h=harness(permission),stop=h.source.subscribe(()=>{});await flush();assert.equal(h.watches.length,0);stop();h.source.dispose();}
 const h=harness();h.nav.permissions=null;const stop=h.source.subscribe(()=>{});await flush();assert.equal(h.watches.length,0);stop();h.source.dispose();
});
test('existing monitor positioning is reused, while stale and revoked fixes disappear',async()=>{
 const h=harness(),seen=[];h.source.externalTracking(true);const stop=h.source.subscribe(v=>seen.push(v));await flush();assert.equal(h.watches.length,0);h.source.publish(fix);assert.deepEqual(seen.at(-1),fix);h.advance(90001);assert.equal(seen.at(-1),null);
 h.source.publish({...fix,timestamp:190001});h.source.clear();assert.equal(seen.at(-1),null);h.source.externalTracking(false);await flush();assert.equal(h.watches.length,1,'a map can use an already granted fix when the main monitor is inactive or manually centered');stop();h.source.dispose();
});
test('backgrounding, disposal and late permission answers cannot leave a GPS watch active',async()=>{
 const h=harness(),stop=h.source.subscribe(()=>{});await flush();h.doc.hidden=true;h.events.get('visibilitychange')();assert.deepEqual(h.cleared,[1]);assert.equal(h.timers.size,0);h.doc.hidden=false;h.events.get('visibilitychange')();await flush();assert.equal(h.watches.length,2);stop();h.source.dispose();
 const late=harness();let reply;late.nav.permissions.query=()=>new Promise(r=>reply=r);const leave=late.source.subscribe(()=>{});leave();reply({state:'granted'});await flush();assert.equal(late.watches.length,0);late.source.dispose();
});
test('provider errors remove the displayed current position without retaining a false live dot',async()=>{
 const h=harness(),seen=[],stop=h.source.subscribe(v=>seen.push(v));await flush();h.source.publish(fix);h.watches[0].error({code:1});assert.equal(seen.at(-1),null);assert.deepEqual(h.cleared,[1]);stop();h.source.dispose();
});
function overlayHarness(){
 const layers=[],events=new Map(),moves=[];let visible=true,subscriber;
 const element=()=>({className:'',dataset:{},attributes:{},handlers:new Map(),setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.handlers.set(k,f);}});
 const container={isConnected:true,parentElement:null,getClientRects:()=>visible?[{}]:[]};const doc={hidden:false,createElement:element,addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
 const map={getContainer:()=>container,getZoom:()=>13,setView:(p,z)=>moves.push([p,z]),on(k,f){events.set(k,f);}};
 const make=(point,options)=>{const node=element(),layer={point,options,node,addTo(){layers.push(this);return this;},bindTooltip(s){this.tooltip=s;return this;},bindPopup(s){this.popup=s;return this;},setLatLng(p){this.point=p;},setTooltipContent(s){this.tooltip=s;},setPopupContent(s){this.popup=s;},setRadius(r){this.options.radius=r;},getElement:()=>node,remove(){this.removed=true;},bringToBack(){},bringToFront(){}};return layer;};
 const control={onAdd:null,addTo(){this.button=this.onAdd();},remove(){this.removed=true;}},L={control:()=>control,circleMarker:make,circle:make};
 const source={subscribe(f){subscriber=f;return()=>{subscriber=null;};}};
 const overlay=attachMapPosition(L,map,{doc,positionSource:source,Observer:null});
 return {overlay,layers,moves,control,events,doc,emit:v=>subscriber?.(v),hide(){visible=false;overlay.sync();}};
}
test('the blue dot and accuracy circle move in place without changing user framing; recenter is explicit',()=>{
 const h=overlayHarness();h.emit(fix);assert.equal(h.layers.length,2);const marker=h.layers[0];assert.equal(marker.options.fillColor,'#2563eb');assert.match(marker.popup,/±12 m/);h.emit({...fix,lat:48.21,accuracy:200});assert.equal(h.layers.length,2);assert.deepEqual(marker.point,[48.21,16.37]);assert.match(marker.popup,/ungefähr/);assert.equal(h.layers[1].options.radius,200);assert.deepEqual(h.moves,[]);
 h.control.button.handlers.get('click')({preventDefault(){},stopPropagation(){}});assert.deepEqual(h.moves,[[[48.21,16.37],15]]);h.emit(null);assert.equal(marker.removed,true);assert.equal(h.control.button.disabled,true);h.overlay.dispose();
});
test('closing a map unsubscribes and removes its location layers, and unload removes its control',()=>{
 const h=overlayHarness();h.emit(fix);h.hide();assert.ok(h.layers.every(l=>l.removed));assert.equal(h.control.button.disabled,true);h.events.get('unload')();assert.equal(h.control.removed,true);
});
test('all Leaflet map instances receive the location hook exactly once',()=>{
 let hooks=0;const L={Map:{addInitHook(){hooks++;}}};assert.equal(installMapPositions(L),L);installMapPositions(L);assert.equal(hooks,1);assert.equal(installMapPositions({}).Map,undefined);
});

test('the installed overlay waits for all queued first-view renderer layers, including a cached GPS fix',t=>{
 let hook,ready,reads=0,rendererReady=false;const pending=[];
 t.mock.method(globalThis,'queueMicrotask',callback=>pending.push(callback));
 const L={Map:{addInitHook(callback){hook=callback;}}};
 installMapPositions(L);
 const map={once(){},whenReady(callback){ready=callback;},getContainer(){reads++;assert.equal(rendererReady,true);throw Error('overlay attached');}};
 hook.call(map);
 assert.equal(reads,0,'a synchronous cached GPS fix must not touch uninitialized vector paths');
 assert.equal(typeof ready,'function');
 ready();assert.equal(reads,0,'the first load listener must allow later queued vector/renderer listeners to finish');
 rendererReady=true;assert.equal(pending.length,1);assert.throws(()=>pending[0](),/overlay attached/);
 assert.equal(reads,1,'overlay starts after the complete load event');
});

test('removing a map before its deferred position hook runs cannot resurrect the overlay',t=>{
 const pending=[];t.mock.method(globalThis,'queueMicrotask',callback=>pending.push(callback));
 for(const removeBeforeReady of [false,true]){
  let hook,ready,unload;
  const L={Map:{addInitHook(callback){hook=callback;}}};installMapPositions(L);
  const map={once(event,callback){assert.equal(event,'unload');unload=callback;},whenReady(callback){ready=callback;},getContainer(){assert.fail('removed map must not attach position layers or subscribe to GPS');}};
  hook.call(map);if(removeBeforeReady)unload();ready();if(!removeBeforeReady)unload();pending.shift()();
 }
});
