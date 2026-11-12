import {createTimetable,timetableDate} from './timetable.mjs?v=0.11.23';
import {createLineMaps,lineMapDirections,preferredLinePattern,lineMapTimetableUrl,lineMapMonitorUrl,bindLineStopInteraction} from './line-maps.mjs?v=0.11.23';
import {decodeJourneyPolyline,routeColor} from './journey-geometry.mjs?v=0.11.23';
import {ensureJourneyMap} from './journey-map.mjs?v=0.11.23';
import {createThemeController} from './theme.mjs?v=0.11.23';
import {createVehicleData,vehicleUrl} from './vehicle-data.mjs?v=0.11.23';

const $=id=>document.getElementById(id),params=new URL(location.href).searchParams;
const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const modes={metro:'U-Bahn',tram:'Straßenbahn',bus:'Bus',sbahn:'S-Bahn',regional:'Regionalzug',long:'Fernverkehr'};
const color=line=>/^N\d/.test(line.route)?'#162a63':routeColor(line.route,line.mode);
const shortDate=value=>new Date(value+'T12:00Z').toLocaleDateString('de-AT',{timeZone:'Europe/Vienna'});
let theme='system';try{theme=JSON.parse(localStorage.getItem('foama.settings.v1')||'{}').theme;}catch{}createThemeController({preference:theme});
const timetable=createTimetable(),source=createLineMaps();
let manifest,index,line,pattern,direction,controller,map,tiles,layers,markers=[],popups=[],revision=0;
let selectedStopId=params.get('halt');
let monitorStops=[];
let vehicleCatalogue=null;
let stopTooltip=null,hoveredStop=null;
const status=value=>{$('mapStatus').textContent=value;};
function cancel(){revision++;controller?.abort();controller=null;}
function renderLines(){
 const search=$('mapLineSearch').value.trim().toLocaleLowerCase('de-AT');
 const rows=index.lines.filter(item=>(item.route+' '+(modes[item.mode]||'')).toLocaleLowerCase('de-AT').includes(search));
 $('mapLineOptions').innerHTML=Object.entries(modes).map(([mode,label])=>{const group=rows.filter(item=>item.mode===mode).sort((a,b)=>a.route.localeCompare(b.route,'de-AT',{numeric:true}));return !group.length?'':`<section class="line-mode-group"><h3>${label}</h3><div class="timetable-line-list">${group.map(item=>`<a href="./linienkarte.html?${new URLSearchParams({linie:item.route,verkehrsmittel:item.mode})}" aria-label="Linienkarte ${label} ${escape(item.route)}"><span class="route-pill" style="background:${color(item)}">${escape(item.route)}</span></a>`).join('')}</div></section>`;}).join('')||'<p class="timetable-empty">Keine passende Linie gefunden.</p>';
}
function selectStop(number,{pan=false}={}){
 const stop=pattern.stops[number];if(!stop)return;
 selectedStopId=stop.id;
 $('mapSelectedStop').hidden=false;$('mapSelectedName').textContent=(number+1)+'. '+stop.name;
 const href=lineMapTimetableUrl(line,pattern,stop);$('mapSelectedTimetable').hidden=!href;$('mapSelectedNotice').hidden=!!href;if(href)$('mapSelectedTimetable').href=href;
 const monitor=lineMapMonitorUrl(line,pattern,stop,monitorStops);$('mapSelectedMonitor').hidden=!monitor;if(monitor)$('mapSelectedMonitor').href=monitor;else $('mapSelectedMonitor').removeAttribute('href');
 for(const button of $('mapStops').querySelectorAll('button'))button.setAttribute('aria-pressed',String(Number(button.dataset.stopIndex)===number));
 markers.forEach((marker,i)=>marker.getElement()?.setAttribute('aria-pressed',String(i===number)));
 if(pan&&map&&markers[number]){map.panTo([stop.lat,stop.lon],{animate:false});openStopPopup(number);}
}
function openStopPopup(number){
 const stop=pattern.stops[number];if(!map||!stop||!popups[number])return;
 window.L.popup({autoPan:false}).setLatLng([stop.lat,stop.lon]).setContent(popups[number]).openOn(map);
}
function hideStopHover(){
 if(stopTooltip)map?.removeLayer(stopTooltip);stopTooltip=null;hoveredStop=null;
}
function showStopHover(stops,number){
 const stop=stops[number];if(!map||!stop)return hideStopHover();if(hoveredStop===stop)return;
 const label=document.createElement('span');label.textContent=(number+1)+'. '+stop.name;
 if(!stopTooltip)stopTooltip=window.L.tooltip({direction:'top',offset:[0,-8],opacity:1,interactive:false,className:'line-stop-tooltip'});
 stopTooltip.setLatLng([stop.lat,stop.lon]).setContent(label).addTo(map);hoveredStop=stop;
}
function syncStopNumbers(){
 if(map)$('lineMap').classList.toggle('line-map-numbered',map.getZoom()>=16);
}
function fit(){
 if(!map||!pattern)return;const points=pattern.geometry?decodeJourneyPolyline(line.shapes[pattern.geometry]):pattern.stops.map(s=>[s.lat,s.lon]);
 if(points.length){map.invalidateSize();map.fitBounds(window.L.latLngBounds(points).pad(.1),{maxZoom:16,animate:false});syncStopNumbers();}
}
async function draw(){
 const own=++revision,selected=pattern;
 $('mapSelectedStop').hidden=true;$('mapTileStatus').hidden=true;
 $('mapStopsTitle').textContent=selected.stops.length+' Haltestellen in Fahrtfolge';
 $('mapStops').innerHTML=selected.stops.map((stop,i)=>`<li><button type="button" data-stop-index="${i}" aria-pressed="false">${escape(stop.name)}</button></li>`).join('');
 $('mapVariantInfo').textContent=selected.stops[0].name+' → '+selected.stops.at(-1).name+' · '+selected.stops.length+' Haltestellen'+(selected.geometry?'':' · Verlauf fehlt, nur Haltepunkte');
 $('mapVehiclePilot').hidden=!vehicleCatalogue?.lines.some(l=>l.id===line.id&&l.patternIds?.includes(selected.id));$('mapVehiclePilot').href=vehicleUrl({route:line.route,mode:line.mode,stopId:selectedStopId,towards:selected.towards,patternId:selected.id});
 $('mapTimetable').href='./fahrplan.html?'+new URLSearchParams({linie:line.route,verkehrsmittel:line.mode,richtung:selected.towards});
 status('Linie '+line.route+' · Richtung '+(selected.towards||selected.stops.at(-1).name));
 try{
  const L=await ensureJourneyMap();if(document.hidden||own!==revision||selected!==pattern)return;
  if(!map){
   $('lineMap').textContent='';map=L.map($('lineMap'),{scrollWheelZoom:false,zoomControl:true,attributionControl:true});
   map.on('zoomend',syncStopNumbers);map.on('movestart zoomstart mouseout',hideStopHover);
   tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>'}).addTo(map);
   tiles.on('tileerror',()=>{if(document.hidden)return;$('mapTileStatus').hidden=false;$('mapTileStatus').textContent='Kartenhintergrund teilweise oder vollständig nicht verfügbar. Linienverlauf und Haltestellenliste bleiben sichtbar; ohne Kartenkacheln ist dies keine vollständige Straßenkarte.';});
   layers=L.layerGroup().addTo(map);
  }
  hideStopHover();layers.clearLayers();map.closePopup();markers=[];popups=[];
  const route=color(line),points=selected.geometry?decodeJourneyPolyline(line.shapes[selected.geometry]):[];
  if(points.length)L.polyline(points,{color:route,weight:5,opacity:.9,interactive:false}).addTo(layers);
  selected.stops.forEach((stop,i)=>{
   const icon=L.divIcon({className:'line-stop-marker',html:`<span style="--line-color:${route}">${i+1}</span>`,iconSize:[44,44],iconAnchor:[22,22]});
   const marker=L.marker([stop.lat,stop.lon],{icon,keyboard:true}).addTo(layers);
   const popup=document.createElement('div');popup.className='line-map-popup';const title=document.createElement('strong');title.textContent=(i+1)+'. '+stop.name;popup.append(title);
   const monitor=lineMapMonitorUrl(line,selected,stop,monitorStops);
   if(monitor){const link=document.createElement('a');link.href=monitor;link.textContent='Abfahrtsmonitor';popup.append(link);}
   const href=lineMapTimetableUrl(line,selected,stop);
   if(href){const link=document.createElement('a');link.href=href;link.textContent='Tagesfahrplan & PDF';popup.append(link);}
   else{const note=document.createElement('span');note.textContent='Halt außerhalb des verfügbaren Stationsfahrplans';popup.append(note);}
   popups.push(popup);
   bindLineStopInteraction(marker,map,selected.stops,i,{hover:number=>showStopHover(selected.stops,number),leave:hideStopHover,select:number=>{openStopPopup(number);selectStop(number);}});
   marker.getElement()?.setAttribute('aria-label',(i+1)+'. '+stop.name);markers.push(marker);
  });fit();
  markers.forEach((marker,i)=>marker.getElement()?.setAttribute('aria-label',(i+1)+'. '+selected.stops[i].name));
  const initialStop=selected.stops.findIndex(stop=>stop.id===selectedStopId);
  if(initialStop>=0)selectStop(initialStop,{pan:true});
 }catch{if(own===revision){$('lineMap').textContent='Das Kartenmodul konnte nicht geladen werden. Die Haltestellen stehen unten in Fahrtfolge zur Verfügung.';}}
}
function renderVariants(preferred){
 const patterns=line.patterns.filter(p=>p.direction===direction);
 pattern=patterns.find(p=>p.id===preferred)||preferredLinePattern(patterns,manifest,{day:timetableDate(),stopId:params.get('halt'),towards:params.get('richtung')});
 $('mapVariant').innerHTML=patterns.map((p,i)=>`<option value="${escape(p.id)}">${escape(p.stops[0].name+' → '+p.stops.at(-1).name+' · '+p.stops.length+' Halte'+(patterns.some(q=>q!==p&&q.stops[0].name===p.stops[0].name&&q.stops.at(-1).name===p.stops.at(-1).name)?' · Weg '+(i+1):''))}</option>`).join('');
 $('mapVariant').value=pattern.id;$('mapVariantField').hidden=patterns.length<2;
 for(const button of $('mapDirections').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.direction===direction));
 void draw();
}
async function start(){
 cancel();const own=revision,request=new AbortController();controller=request;
 try{
  manifest=await timetable.metadata(request.signal);if(!manifest)throw Error('Noch kein Fahrplan auf dem Gerät. Bitte mit Internetverbindung öffnen.');
  index=await source.index(manifest,{signal:request.signal});if(request.signal.aborted||document.hidden)return;
  const matches=index.lines.filter(row=>row.route===params.get('linie')),entry=matches.find(row=>row.mode===params.get('verkehrsmittel'))||(matches.length===1?matches[0]:null);
  status(index.lines.length+' Wiener Linien · Fahrwege gültig '+shortDate(manifest.validFrom)+' bis '+shortDate(manifest.validThrough));
  if(!entry){renderLines();return;}
  const catalogue=fetch('./data/stops.json?v=0.11.23',{signal:request.signal,credentials:'omit'}).then(response=>response.ok?response.json():null).then(data=>Array.isArray(data?.stops)?data.stops:[]).catch(()=>[]);
  const result=await source.line(entry,manifest,{signal:request.signal}),monitors=await catalogue;if(own!==revision||request.signal.aborted||document.hidden)return;
  monitorStops=monitors;try{vehicleCatalogue=(await createVehicleData().index()).index;}catch{}if(own!==revision||request.signal.aborted||document.hidden)return;
  line=result.data;$('mapLinePicker').hidden=true;$('mapLineView').hidden=false;
  $('mapTitle').textContent='Linienkarte '+line.route;document.title='Linie '+line.route+' · Karte · foama-wien';$('mapLineBadge').textContent=line.route;$('mapLineBadge').style.background=color(line);$('mapLineTitle').textContent=modes[line.mode]||'Linie';
  const directions=lineMapDirections(line),initial=line.patterns.find(p=>p.id===params.get('variante'))||preferredLinePattern(line.patterns,manifest,{day:timetableDate(),stopId:params.get('halt'),towards:params.get('richtung')});
  direction=initial.direction;
  $('mapDirections').innerHTML=directions.map(d=>`<button type="button" data-direction="${escape(d.id)}" aria-pressed="false">→ ${escape(d.label)}</button>`).join('');
  $('mapOfflineStatus').hidden=result.offline;
  $('mapOfflineStatus').textContent=result.offline?'':'Linie geladen, konnte aber nicht dauerhaft auf dem Gerät gespeichert werden.';
  $('mapSource').textContent='Fahrwege gültig '+shortDate(manifest.validFrom)+'–'+shortDate(manifest.validThrough)+' · '+manifest.attribution;
  if(timetableDate()>manifest.validThrough)$('mapSource').textContent+=' · Fahrplan abgelaufen';
  renderVariants(initial.id);
 }catch(error){if(error.name!=='AbortError')status(error.message);}
 finally{if(controller===request)controller=null;}
}
$('mapLineSearch').addEventListener('input',()=>{if(index)renderLines();});
$('mapDirections').addEventListener('click',event=>{const button=event.target.closest('[data-direction]');if(button){direction=button.dataset.direction;renderVariants();}});
$('mapVariant').addEventListener('change',()=>renderVariants($('mapVariant').value));$('mapFitLine').addEventListener('click',fit);
$('mapStops').addEventListener('click',event=>{const button=event.target.closest('[data-stop-index]');if(button)selectStop(Number(button.dataset.stopIndex),{pan:true});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel();map?.stop();}else if(line&&pattern)void draw();else void start();});
window.addEventListener('pagehide',()=>{cancel();map?.remove();map=null;});
window.addEventListener('pageshow',event=>{if(event.persisted&&line)void draw();});
void start();

if(location.protocol==='https:'&&'serviceWorker' in navigator)void navigator.serviceWorker.register('./sw.js').catch(()=>{});
