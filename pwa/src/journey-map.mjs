import {coordinate,journeyLegPath,routeColor} from './journey-geometry.mjs?v=0.11.16';
import {installMapPositions} from './map-position.mjs?v=0.11.16';
let pending;
export function ensureJourneyMap(){
 if(window.L)return Promise.resolve(installMapPositions(window.L));
 if(pending)return pending;
 pending=new Promise((resolve,reject)=>{
  if(!document.querySelector('[data-leaflet-css]')){const css=document.createElement('link');css.rel='stylesheet';css.href='./vendor/leaflet/leaflet.css';css.dataset.leafletCss='true';document.head.append(css);}
  const script=document.createElement('script'),timer=setTimeout(()=>{script.remove();pending=null;reject(Error('Karte konnte nicht geladen werden.'));},12000);
  script.src='./vendor/leaflet/leaflet.js';script.onload=()=>{clearTimeout(timer);if(window.L)resolve(installMapPositions(window.L));else{pending=null;reject(Error('Karte nicht verfügbar.'));}};script.onerror=()=>{clearTimeout(timer);pending=null;reject(Error('Karte nicht verfügbar.'));};document.head.append(script);
 });return pending;
}
const nameNode=(name)=>{const title=document.createElement('strong');title.textContent=name;return title;};
function action(label,callback){const button=document.createElement('button');button.type='button';button.className='small-btn';button.textContent=label;button.addEventListener('click',callback);return button;}
export async function createJourneyMap({holder,stops,getModes=()=>({}),onStation,onPoint,picker=false,center=null,isCurrent=()=>true}){
 const L=await ensureJourneyMap();if(!isCurrent()||!holder.isConnected||!holder.getClientRects().length)throw Error('Karte geschlossen.');
 const map=L.map(holder,{scrollWheelZoom:false}).setView(coordinate(center)?[center.lat,center.lon]:[48.2082,16.3738],picker?14:13);
 // OSM requires a genuine Referer. Override this page's privacy default only
 // for tile images and send the public app origin, never a route or fragment.
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>'}).addTo(map);
 const lines=L.layerGroup().addTo(map),stations=L.layerGroup().addTo(map);let current=null,disposed=false;
 function stationMarker(stop){
  const marker=L.circleMarker([stop.lat,stop.lon],{radius:7,weight:2,color:'#276953',fillColor:'#fff',fillOpacity:.95,bubblingMouseEvents:false}).addTo(stations),popup=document.createElement('div');
  popup.className='journey-map-popup';popup.append(nameNode(stop.name));
  if(picker)popup.append(action('Als '+(picker==='from'?'Start':'Ziel')+' wählen',()=>onStation?.(stop)));
  else popup.append(action('Alle Abfahrten',()=>onStation?.(stop)));
  marker.bindPopup(popup);marker.on('click',()=>marker.openPopup());
  const target=marker.getElement();if(target){target.setAttribute('role','button');target.setAttribute('tabindex','0');target.setAttribute('aria-label',stop.name);target.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();marker.openPopup();}});}
 }
 function updateStations(){
  if(disposed||!picker)return;stations.clearLayers();const bounds=map.getBounds(),modes=getModes();
  const list=stops.filter(stop=>coordinate(stop)&&bounds.contains([stop.lat,stop.lon])&&(stop.modes||[]).some(mode=>modes[mode]!==false));
  const c=map.getCenter();list.sort((a,b)=>(a.lat-c.lat)**2+(a.lon-c.lng)**2-((b.lat-c.lat)**2+(b.lon-c.lng)**2));list.slice(0,160).forEach(stationMarker);
 }
 if(picker){map.on('moveend',updateStations);map.on('click',event=>{const point={name:'Kartenpunkt',lat:event.latlng.lat,lon:event.latlng.lng},popup=document.createElement('div');popup.className='journey-map-popup';popup.append(nameNode('Gewählter Kartenpunkt'),action('Hier '+(picker==='from'?'starten':'hinfahren'),()=>onPoint?.(point)));L.popup().setLatLng(event.latlng).setContent(popup).openOn(map);});updateStations();}
 return {
  map,
  recenter(point){if(coordinate(point)){map.setView([point.lat,point.lon],16);updateStations();}},
  invalidate(){map.invalidateSize();},
  draw(journey,{fit=false}={}){
   if(disposed||current===journey&&!fit)return;current=journey;lines.clearLayers();stations.clearLayers();const bounds=[],seen=new Set();let schematic=false;
   for(const leg of journey?.legs||[]){
    const path=journeyLegPath(leg,stops);if(path.points.length){L.polyline(path.points,{color:routeColor(leg.route,leg.mode),weight:leg.mode==='walk'?3:5,opacity:.9,dashArray:leg.mode==='walk'||path.schematic?'6 7':undefined}).addTo(lines);bounds.push(...path.points);schematic||=path.schematic;}
    for(const point of [leg.from,leg.to]){const stop=stops.find(s=>s.id===point?.stopId);if(stop&&!seen.has(stop.id)){stationMarker(stop);seen.add(stop.id);}else if(coordinate(point)&&!point?.stopId){L.circleMarker([point.lat,point.lon],{radius:5,color:'#1d6853',weight:2,fillOpacity:1}).bindTooltip(nameNode(point.name)).addTo(lines);bounds.push([point.lat,point.lon]);}}
   }
   if(fit&&bounds.length){map.invalidateSize();map.fitBounds(L.latLngBounds(bounds).pad(.12),{maxZoom:16,animate:false});}
   return {schematic,hasGeometry:bounds.length>0};
  },
  destroy(){disposed=true;tiles.off();map.remove();}
 };
}
