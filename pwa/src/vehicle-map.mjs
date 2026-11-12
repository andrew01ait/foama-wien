import {ensureJourneyMap} from './journey-map.mjs?v=0.11.31';
import {decodeJourneyPolyline,routeColor} from './journey-geometry.mjs?v=0.11.31';
import {pilotGeometry} from './vehicle-tracker.mjs?v=0.11.31';
import {vehicleSymbolMarkup} from './transport-controls.mjs?v=0.11.31';
import {stationVehicleTracks,stationVehicleStatus,vehicleDisplayId} from './vehicle-data.mjs?v=0.11.31';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function stationVehicleGeometry(direction,range,line){
 const pattern=line.patterns.find(p=>p.id===direction.patternId),encoded=pattern&&line.shapes[pattern.geometry];
 if(!encoded)throw Error('Geografischer Linienverlauf fehlt. Das Schema bleibt verfügbar.');
 const points=decodeJourneyPolyline(encoded),geometry=pilotGeometry(points,direction.stops);
 // Crop the actual shape at the same stop anchors as the schematic, preserving bends.
 const path=pilotGeometry(points,direction.stops.slice(range.start,range.end+1)).points;
 return {path,coordinate(position){return position.from!=null?geometry.between(position.from,position.to,position.fraction):geometry.at(position.progress);}};
}

export function createStationVehicleMap({direction,range,line,loadMap=ensureJourneyMap,isCurrent=()=>true,onSelect=()=>{}}){
 const element=document.createElement('div');element.className='station-vehicle-map';
 element.innerHTML='<div class="station-vehicle-map-tools"><span>'+String(range.center-range.start)+' Halte davor · dein Halt · '+String(range.end-range.center)+' danach</span><button class="small-btn" type="button" disabled>Ausschnitt zeigen</button></div><div class="station-vehicle-map-canvas" role="region" aria-label="Karte der Fahrzeuge rund um deine Haltestelle"></div><p class="station-vehicle-map-note fineprint" role="status">Kartenmodul wird geladen …</p><p class="vehicle-strip-status" role="status">Zuordnung wird aufgebaut · zwei frische Quellenstände nötig.</p><p class="fineprint">Geschätzte Lage · grau: letzte Lage oder Fahrplanannahme. Keine GPS-Position.</p>';
 const canvas=element.querySelector('.station-vehicle-map-canvas'),note=element.querySelector('.station-vehicle-map-note'),status=element.querySelector('.vehicle-strip-status'),fit=element.querySelector('button');
 const markers=new Map();let map,tiles,vehicles,L,geometry,lastState,chosen='',shown=false,disposed=false,revision=0,tilesAdded=false;
 const active=own=>!disposed&&shown&&isCurrent()&&(own==null||own===revision);
 function fitRange(){if(!active()||!map)return;map.invalidateSize({pan:true,animate:false});map.fitBounds(L.latLngBounds(geometry.path).pad(.12),{padding:[26,32],maxZoom:16,animate:false});}
 function removeMap(){const previous=map;map=vehicles=geometry=null;tiles?.off();tiles=null;tilesAdded=false;markers.clear();fit.disabled=true;previous?.remove();}
 fit.addEventListener('click',fitRange);
 function render(state){
  if(disposed)return;lastState=state;status.textContent=stationVehicleStatus(state,direction,range,chosen);
  if(!active()||!map||!vehicles)return;
  const tracks=stationVehicleTracks(state,range),ids=new Set(tracks.map(t=>t.id));
  for(const [id,marker] of markers)if(!ids.has(id)){vehicles.removeLayer(marker);markers.delete(id);}
  for(const track of tracks){
   let marker=markers.get(track.id);const point=geometry.coordinate(track.position);
   if(!marker){marker=L.marker(point,{icon:L.divIcon({className:'station-vehicle-marker',html:'<span class="vehicle-body">'+vehicleSymbolMarkup(direction.mode)+'</span><small>'+escape(vehicleDisplayId(track.id,direction.route))+'</small>',iconSize:[52,62],iconAnchor:[26,20]}),keyboard:true,zIndexOffset:1000}).addTo(vehicles);marker.on('click',()=>onSelect(track.id));markers.set(track.id,marker);}
   marker.setLatLng(point);marker.setZIndexOffset(chosen===track.id?1400:track.position.uncertain||track.position.stale?900:1000);
   const node=marker.getElement();if(node){node.dataset.vehicle=track.id;node.setAttribute('role','button');node.setAttribute('aria-pressed',String(chosen===track.id));node.setAttribute('aria-label',vehicleDisplayId(track.id,direction.route)+' · '+(track.position.basis==='held'?'letzte geschätzte Lage':track.position.station!=null?'bei '+direction.stops[track.position.station].name:'unterwegs nach '+direction.stops[track.position.next].name));node.classList.toggle('uncertain',Boolean(track.position.uncertain||track.position.stale));}
  }
 }
 async function show(){
  if(disposed)return;shown=true;const own=++revision;
  try{
   if(!map){L=await loadMap();if(!active(own))return;geometry=stationVehicleGeometry(direction,range,line);map=L.map(canvas,{scrollWheelZoom:false});
    // Establish the first view before adding vector paths or their renderer.
    fitRange();
    tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>'});
    tiles.on('tileerror',()=>{if(active())note.textContent='Kartenhintergrund nicht vollständig erreichbar. Linienverlauf und Schema bleiben verfügbar.';});
    L.polyline(geometry.path,{color:routeColor(direction.route,direction.mode),weight:5,interactive:false}).addTo(map);
    direction.stops.slice(range.start,range.end+1).forEach((stop,k)=>{const current=range.start+k===range.center;L.circleMarker([stop.lat,stop.lon],{radius:current?8:5,weight:current?3:2,color:current?'#074b3b':routeColor(direction.route,direction.mode),fillColor:current?'#73e0b7':'#fff',fillOpacity:1}).addTo(map).bindPopup(document.createTextNode((current?'Deine Haltestelle: ':'')+stop.name));});
    vehicles=L.layerGroup().addTo(map);fit.disabled=false;note.textContent='Deine Haltestelle ist mintfarben hervorgehoben.';
   }
   if(!active(own))return;if(!tilesAdded){tiles.addTo(map);tilesAdded=true;}map.invalidateSize({pan:true,animate:false});if(lastState)render(lastState);
  }catch{if(active(own)){removeMap();note.textContent='Karte gerade nicht verfügbar. Du kannst jederzeit zum Schema wechseln.';}}
 }
 function hide(){shown=false;revision++;map?.stop();if(tilesAdded){tiles.remove();tilesAdded=false;}}
 return {element,show,hide,render,setSelected(id){chosen=id;if(lastState)render(lastState);},dispose(){hide();disposed=true;removeMap();element.remove();}};
}
