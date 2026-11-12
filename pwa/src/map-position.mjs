// Current position is page-memory only. Maps never request a new permission.
const MAX_AGE=90_000;
export function validMapPosition(fix,now=Date.now()){
 return !!fix&&Number.isFinite(fix.lat)&&Math.abs(fix.lat)<=90&&Number.isFinite(fix.lon)&&Math.abs(fix.lon)<=180&&Number.isFinite(fix.accuracy)&&fix.accuracy>=0&&Number.isFinite(fix.timestamp)&&fix.timestamp<=now+30_000&&now-fix.timestamp<=MAX_AGE;
}
export function createMapPositionSource({nav=globalThis.navigator,doc=globalThis.document,now=()=>Date.now(),schedule=setInterval,cancel=clearInterval}={}){
 let latest=null,watch=null,timer=null,external=false,generation=0,checking=false,permission='unknown';const listeners=new Set();
 const position=()=>validMapPosition(latest,now())?latest:null;
 const notify=()=>{const fix=position();for(const listener of listeners)listener(fix);};
 function clearWatch(){generation++;checking=false;if(watch!==null)nav?.geolocation?.clearWatch(watch);watch=null;}
 function publish(fix){if(validMapPosition(fix,now())&&(!latest||fix.timestamp>=latest.timestamp)){latest={lat:fix.lat,lon:fix.lon,accuracy:fix.accuracy,timestamp:fix.timestamp};notify();}}
 async function resume(){
  if(!listeners.size||doc?.hidden||external||watch!==null||checking)return;
  checking=true;const own=generation;
  try{permission=(await nav?.permissions?.query({name:'geolocation'}))?.state||'unknown';}catch{permission='unknown';}
  if(own!==generation)return;checking=false;
  if(permission!=='granted'||!listeners.size||doc?.hidden||external||!nav?.geolocation)return;
  try{const id=nav.geolocation.watchPosition(fix=>{if(own===generation&&!doc?.hidden)publish({lat:fix.coords.latitude,lon:fix.coords.longitude,accuracy:fix.coords.accuracy,timestamp:fix.timestamp});},error=>{if(own!==generation)return;latest=null;notify();if(error?.code===1){permission='denied';clearWatch();}},{enableHighAccuracy:false,maximumAge:30_000,timeout:20_000});if(own===generation)watch=id;else nav.geolocation.clearWatch(id);}catch{latest=null;notify();}
 }
 function sync(){
  if(!listeners.size||doc?.hidden){clearWatch();cancel(timer);timer=null;if(doc?.hidden)notify();return;}
  if(timer===null)timer=schedule(()=>{notify();},1000);
  void resume();notify();
 }
 const visibility=()=>sync();doc?.addEventListener?.('visibilitychange',visibility);
 return {publish,position,clear(){latest=null;notify();},externalTracking(value){external=value===true;if(external)clearWatch();sync();},subscribe(listener){listeners.add(listener);sync();return()=>{listeners.delete(listener);sync();};},dispose(){listeners.clear();clearWatch();cancel(timer);doc?.removeEventListener?.('visibilitychange',visibility);latest=null;}};
}
let shared;
const source=()=>shared??=createMapPositionSource();
export const publishMapPosition=fix=>source().publish(fix);
export const clearMapPosition=()=>source().clear();
export const setMapPositionExternalTracking=value=>source().externalTracking(value);

export function attachMapPosition(L,map,{positionSource=source(),doc=globalThis.document,Observer=globalThis.MutationObserver}={}){
 const container=map.getContainer();let marker=null,accuracy=null,unsubscribe=null,disposed=false,fix=null;
 const visible=()=>!disposed&&!doc?.hidden&&container.isConnected&&container.getClientRects().length>0;
 function remove(){marker?.remove();accuracy?.remove();marker=accuracy=null;}
 const button=doc.createElement('button');button.type='button';button.className='map-position-button';button.textContent='⌖';button.title='Deinen Standort zeigen';button.setAttribute('aria-label','Deinen aktuellen Standort auf der Karte zeigen');button.disabled=true;
 button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(fix&&visible())map.setView([fix.lat,fix.lon],Math.max(15,map.getZoom()),{animate:false});});
 const control=L.control({position:'bottomright'});control.onAdd=()=>{L.DomEvent?.disableClickPropagation(button);L.DomEvent?.disableScrollPropagation(button);return button;};control.addTo(map);
 function render(value){
  fix=visible()?value:null;button.disabled=!fix;button.title=fix?'Deinen Standort zeigen':'Aktueller Standort nicht verfügbar';
  if(!fix){remove();return;}
  const point=[fix.lat,fix.lon],label='Dein Standort'+(fix.accuracy>150?' · ungefähr':'')+' · Genauigkeit ±'+Math.round(fix.accuracy)+' m';
  if(!marker){marker=L.circleMarker(point,{radius:8,color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1,className:'map-current-position',bubblingMouseEvents:false}).addTo(map).bindTooltip(label);marker.bindPopup(label);}else{marker.setLatLng(point);marker.setTooltipContent(label);marker.setPopupContent(label);}
  const node=marker.getElement();node?.setAttribute('aria-label',label);node?.setAttribute('role','img');
  if(fix.accuracy>0){if(!accuracy)accuracy=L.circle(point,{radius:fix.accuracy,color:'#2563eb',weight:1,fillColor:'#2563eb',fillOpacity:.1,interactive:false}).addTo(map);else{accuracy.setLatLng(point);accuracy.setRadius(fix.accuracy);}accuracy.bringToBack?.();}else{accuracy?.remove();accuracy=null;}
  marker.bringToFront?.();
 }
 function sync(){if(visible()){if(!unsubscribe)unsubscribe=positionSource.subscribe(render);}else{unsubscribe?.();unsubscribe=null;render(null);}}
 const observer=Observer?new Observer(sync):null;for(let node=container;node&&node!==doc;node=node.parentElement)observer?.observe(node,{attributes:true,attributeFilter:['hidden','open','style','class']});
 doc?.addEventListener?.('visibilitychange',sync);map.on('load resize',sync);map.on('unload',dispose);
 function dispose(){if(disposed)return;disposed=true;unsubscribe?.();unsubscribe=null;observer?.disconnect();doc?.removeEventListener?.('visibilitychange',sync);remove();control.remove();}
 sync();return {sync,dispose};
}
const installed=new WeakSet();
export function installMapPositions(L){
 if(L?.Map?.addInitHook&&!installed.has(L)){
  installed.add(L);
  // A cached GPS fix is delivered synchronously on subscription. Leaflet's
  // vector paths do not exist until the initial view has finished loading.
  L.Map.addInitHook(function(){this.whenReady(()=>attachMapPosition(L,this));});
 }return L;
}
