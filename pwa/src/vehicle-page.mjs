import {createTimetable} from './timetable.mjs?v=0.10.0';
import {createLineMaps} from './line-maps.mjs?v=0.10.0';
import {decodeJourneyPolyline} from './journey-geometry.mjs?v=0.10.0';
import {ensureJourneyMap} from './journey-map.mjs?v=0.10.0';
import {createThemeController} from './theme.mjs?v=0.10.0';
import {validateVehiclePilot,normalizePilotSnapshot,createVehicleTracker,vehiclePosition,pilotGeometry} from './vehicle-tracker.mjs?v=0.10.0';
import {getCatalogue,putCatalogue} from './storage.mjs?v=0.10.0';
import {createVehiclePoller} from './vehicle-poller.mjs?v=0.10.0';
const $=id=>document.getElementById(id),params=new URL(location.href).searchParams,escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=t=>new Date(t).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit',second:'2-digit'}),short=id=>id.replace(/^U6-/,''),rowY=i=>55+i*140;
let theme='system';try{theme=JSON.parse(localStorage.getItem('foama.settings.v1')||'{}').theme;}catch{}createThemeController({preference:theme});
let data,manifest,line,direction,tracker,geometry,poller,map,mapLayers,vehicleLayer,view=params.get('ansicht')==='schema'?'schema':'map',selected='',follow=false,started=false,paused=false,frozenAt=0,animation=0,lastRender=0,mapRevision=0;
let lastMarkup='',lastStationMarkup='',lastDetailsMarkup='',runNumber=0,lastAnimation=0;const mapVehicles=new Map();const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function choose(id){selected=id;follow=false;render(true);}
async function showMap(){
 const own=++mapRevision;if(view!=='map'||document.hidden||!geometry)return;
 try{const L=await ensureJourneyMap();if(own!==mapRevision||document.hidden||view!=='map')return;
  if(!map){$('pilotMap').textContent='';map=L.map($('pilotMap'),{scrollWheelZoom:false});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>'}).on('tileerror',()=>{$('pilotMapNote').hidden=false;$('pilotMapNote').textContent='Kartenhintergrund nicht vollständig erreichbar. Der echte Linienverlauf bleibt sichtbar; das Schema funktioniert auch ohne Straßenkarte.';}).addTo(map);mapLayers=L.layerGroup().addTo(map);vehicleLayer=L.layerGroup().addTo(map);}
  mapLayers.clearLayers();vehicleLayer.clearLayers();mapVehicles.clear();L.polyline(geometry.points,{color:'#a87e48',weight:5,interactive:false}).addTo(mapLayers);
  direction.stops.forEach((s,i)=>{const marker=L.circleMarker([s.lat,s.lon],{radius:7,color:'#a87e48',weight:3,fillColor:'#fff',fillOpacity:1}).addTo(mapLayers);marker.bindPopup(document.createTextNode(s.name));});
  map.invalidateSize();map.fitBounds(L.latLngBounds(geometry.points).pad(.2),{maxZoom:16,animate:false});render(true);
 }catch{$('pilotMapNote').hidden=false;$('pilotMapNote').textContent='Kartenmodul nicht verfügbar. Bitte zur Schemaansicht wechseln.';}
}
function vehicleInfo(t){const p=t.position;if(!p)return t.status;const name=direction.stops[p.next]?.name||'';return p.basis==='onStop'?'Stationsmeldung: '+name:p.station!=null?'Geschätzter Aufenthalt: '+name:'Geschätzt unterwegs nach '+name;}
function render(force=false){
 if(!tracker)return;const now=paused?frozenAt:Date.now(),base=tracker.view(now),state=base,positions=state.tracks.filter(t=>t.position).map(t=>reduced.matches&&!paused?{...t,position:vehiclePosition(t,state.at)}:t).filter(t=>t.position);
 const pauseText=paused?'Pausiert · eingefrorener Stand':!started?'Bereit für den Live-Test':state.problem?state.problem:state.partial?'Stationsdaten unvollständig · Schätzung pausiert':base.stale&&state.at?'Daten veraltet · keine aktuelle Fahrzeuglage':state.tracks.some(t=>t.hits>=2)?positions.length+' geschätzte Position'+(positions.length===1?'':'en')+' im Testabschnitt':'Stationsmeldungen werden zugeordnet · zwei Quellenstände nötig';
 $('pilotStatus').textContent=pauseText;$('pilotStatus').parentElement.dataset.state=paused||!started?'paused':state.problem||state.partial||base.stale?'error':'live';$('pilotAge').textContent=state.at?'Stand '+clock(state.at)+(paused?'':' · '+Math.max(0,Math.floor((Date.now()-state.at)/1000))+' s'):'';
 $('pilotPause').textContent=!started?'Live-Test starten':paused?'Live fortsetzen':'Pause';
 const ids=new Set(positions.map(t=>t.id));
 if(map&&view==='map'){
  for(const [id,marker] of mapVehicles)if(!ids.has(id)){vehicleLayer.removeLayer(marker);mapVehicles.delete(id);}
  for(const t of positions){let marker=mapVehicles.get(t.id);if(!marker){marker=window.L.marker(geometry.at(t.position.progress),{icon:window.L.divIcon({className:'pilot-vehicle-marker',html:'<span>▸ '+escape(short(t.id))+'</span>',iconSize:[76,46],iconAnchor:[38,23]}),keyboard:true,zIndexOffset:1000}).addTo(vehicleLayer);marker.on('click',()=>choose(t.id));mapVehicles.set(t.id,marker);}marker.setLatLng(geometry.at(t.position.progress));const el=marker.getElement();el?.setAttribute('aria-label',t.id+' · '+vehicleInfo(t));el?.setAttribute('aria-pressed',String(selected===t.id));el?.classList.toggle('stale',t.position.stale);}
  if(follow&&selected&&mapVehicles.has(selected))map.panTo(mapVehicles.get(selected).getLatLng(),{animate:false});
 }
 const schema=$('schemaVehicles');for(const node of [...schema.children])if(!ids.has(node.dataset.train))node.remove();
 for(const t of positions){let button=[...schema.children].find(n=>n.dataset.train===t.id);if(!button){button=document.createElement('button');button.type='button';button.className='schema-vehicle';button.dataset.train=t.id;const span=document.createElement('span');span.textContent='▾ '+short(t.id);button.append(span);button.addEventListener('click',()=>choose(t.id));schema.append(button);}button.style.top=(rowY(t.position.progress)/390*100)+'%';button.setAttribute('aria-label',t.id+' · '+vehicleInfo(t));button.setAttribute('aria-pressed',String(selected===t.id));button.classList.toggle('stale',t.position.stale);}
 const markup=positions.map(t=>`<button class="pilot-train" type="button" data-train="${escape(t.id)}" aria-pressed="${selected===t.id}"><span><strong>${escape(t.id)}</strong><small>${escape(vehicleInfo(t))}${t.position.stale?' · eingefroren':''}</small></span><span aria-hidden="true">›</span></button>`).join('')||`<p class="fineprint">${!started?'Starte den Test, um frische Stationsmeldungen zu sammeln.':paused?'Keine geschätzte Position im eingefrorenen Stand.':state.problem||state.partial||base.stale?'Aktuell keine ausreichend frische Schätzung.':'Noch keine eindeutige Position im Abschnitt. Die aktuellen Stationsprognosen stehen im Klappbereich unten.'}</p>`;
 if(markup!==lastMarkup){$('pilotTrains').innerHTML=markup;lastMarkup=markup;}
 const selectedTrack=state.tracks.find(t=>t.id===selected);$('pilotSelection').hidden=!selected;
 if(selected){$('selectedVehicle').textContent=selected;$('selectedVehicleInfo').textContent=selectedTrack?vehicleInfo(selectedTrack)+' · '+selectedTrack.status+' · '+selectedTrack.hits+' unterschiedliche Quellenstände. Keine offizielle Fahrzeug-ID.':'Diese vorläufige Fahrt wird nicht mehr ausreichend frisch zugeordnet.';$('pilotFollow').setAttribute('aria-pressed',String(follow));$('pilotFollow').disabled=!selectedTrack?.position||view!=='map';}
 if(!force&&Date.now()-lastRender<1000)return;lastRender=Date.now();
 const stationMarkup=direction.stops.map((s,i)=>`<article class="pilot-station"><h4>${i+1}. ${escape(s.name)}</h4><ul>${state.rows.filter(r=>r.index===i).slice(0,3).map(r=>{const matches=state.tracks.filter(t=>r.candidates?.includes(t.schedule.key)),id=matches.length===1?matches[0].id:'Zuordnung offen';return `<li><time>${escape(clock(r.actual))}</time><span>${escape(id)}${r.onStop?' · an Station gemeldet':''}</span></li>`;}).join('')||'<li>Keine frische Live-Prognose.</li>'}</ul></article>`).join('');
 if(stationMarkup!==lastStationMarkup){$('pilotStations').innerHTML=stationMarkup;lastStationMarkup=stationMarkup;}
 const details=state.events.map(e=>`<div class="pilot-event"><strong>${escape(e.id)}</strong> · ${e.kind==='handover'?escape(direction.stops[e.from].name+' → '+direction.stops[e.to].name):e.kind==='correction'?'Prognosekorrektur · Lage erneut prüfen':'Vorläufiger Kandidat angelegt'}<small>${clock(e.at)} · ${e.kind==='handover'?'Plausible Stationsfolge anhand „an Station“-Meldungen':'Zuordnung aus Sollzeiten und Stationsprognosen'}</small></div>`).join('')||'<p class="fineprint">Noch keine Übergabe beobachtet.</p>';
 if(details!==lastDetailsMarkup){$('pilotEvents').innerHTML=details;lastDetailsMarkup=details;}
 $('pilotCandidates').className='pilot-candidates';$('pilotCandidates').innerHTML=state.tracks.length?'<table><thead><tr><th>Vorläufige ID</th><th>Prüfstand</th></tr></thead><tbody>'+state.tracks.map(t=>`<tr><td>${escape(t.id)}</td><td>${escape(t.status)} · ${t.hits} Quellenstände</td></tr>`).join('')+'</tbody></table>':'';
}
function animate(timestamp){if(document.hidden||paused||!started)return;if(timestamp-lastAnimation>250){lastAnimation=timestamp;render();}animation=requestAnimationFrame(animate);}
function stop(){poller?.stop();cancelAnimationFrame(animation);animation=0;}
function resume(){if(!tracker||document.hidden||paused||!started)return;if(Date.now()-tracker.view().at>90_000)tracker.clear();poller.start();cancelAnimationFrame(animation);animation=requestAnimationFrame(animate);render(true);}
function setDirection(id){
 stop();direction=data.directions.find(d=>d.id===id)||data.directions[0];selected='';follow=false;tracker=createVehicleTracker(direction,manifest,{prefix:'U6-'+direction.monitorDirection+(++runNumber)});const pattern=line.patterns.find(p=>p.id===direction.patternId);geometry=pilotGeometry(decodeJourneyPolyline(line.shapes[pattern.geometry]),direction.stops);
 for(const button of $('pilotDirections').children)button.setAttribute('aria-pressed',String(button.dataset.direction===direction.id));
 $('schemaStops').innerHTML=direction.stops.map((s,i)=>`<button type="button" class="schema-stop" style="top:${rowY(i)/390*100}%" data-stop="${i}">${escape(s.name)}<small>${i===0?'Beginn des beobachteten Abschnitts':i===2?'Ende des beobachteten Abschnitts':'Live-Prognose als Stationsanker'}</small></button>`).join('');
 poller=createVehiclePoller({ids:()=>direction.stops.map(s=>s.rbl),onData(raw){try{tracker.ingest(normalizePilotSnapshot(raw,direction));}catch(e){tracker.fail(e.message);}render(true);},onError(message){tracker.fail(message);render(true);},onWaiting(ms){if(!tracker.view().at)$('pilotStatus').textContent='Gemeinsame Abfragepause · nächster Versuch in '+Math.ceil(ms/1000)+' s';}});
 if(view==='map')void showMap();render(true);resume();
}
async function start(){
 try{const timetables=createTimetable();manifest=await timetables.metadata();if(!manifest)throw Error('Pilotdaten fehlen. Bitte einmal mit Internetverbindung öffnen.');const maps=createLineMaps(),index=await maps.index(manifest),entry=index.lines.find(l=>l.route==='U6'&&l.mode==='metro');line=(await maps.line(entry,manifest)).data;
  try{const response=await fetch('./data/vehicle-pilot/u6.json?v='+manifest.version,{credentials:'omit'});if(!response.ok)throw Error();const raw=await response.text();if(raw.length>2_000_000)throw Error();data=validateVehiclePilot(JSON.parse(raw),manifest,line);await putCatalogue('vehicle-pilot:u6',data).catch(()=>{});}catch{data=validateVehiclePilot(await getCatalogue('vehicle-pilot:u6').catch(()=>null),manifest,line);}
  $('pilotDirections').innerHTML=data.directions.map(d=>`<button type="button" data-direction="${escape(d.id)}" aria-pressed="false">→ ${escape(d.towards)}</button>`).join('');$('pilotPause').disabled=false;
  $('pilotSource').textContent='Wiener Linien · Sollfahrplan '+manifest.validFrom+' bis '+manifest.validThrough+' · Live-Monitor · '+manifest.attribution;
  if(Date.now()>Date.parse(manifest.validThrough+'T23:00Z'))throw Error('Die Pilot-Fahrplanbasis ist abgelaufen. Bitte zuerst erneuern.');setDirection(data.directions.find(d=>d.towards===params.get('richtung'))?.id||'1');
 }catch(e){$('pilotStatus').textContent=e.message;$('pilotPause').disabled=true;}
}
$('pilotPause').addEventListener('click',()=>{if(!started){started=true;paused=false;resume();}else if(paused){paused=false;resume();}else{frozenAt=Date.now();paused=true;stop();render(true);}});
$('pilotDirections').addEventListener('click',event=>{const b=event.target.closest('[data-direction]');if(b&&b.dataset.direction!==direction?.id)setDirection(b.dataset.direction);});
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('pilotMap').hidden=view!=='map';$('pilotSchema').hidden=view!=='schema';follow=false;if(view==='map')void showMap();else{mapRevision++;map?.stop();}render(true);}));
$('pilotTrains').addEventListener('click',event=>{const b=event.target.closest('[data-train]');if(b)choose(b.dataset.train);});
$('schemaStops').addEventListener('click',event=>{const b=event.target.closest('[data-stop]');if(b){const s=direction.stops[Number(b.dataset.stop)];$('pilotStations').parentElement.open=true;$('pilotStations').children[Number(b.dataset.stop)]?.scrollIntoView({block:'center',behavior:reduced.matches?'instant':'smooth'});}});
$('pilotFollow').addEventListener('click',()=>{follow=!follow;render(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();map?.stop();mapRevision++;}else{if(view==='map')void showMap();resume();}});
window.addEventListener('pagehide',()=>{stop();mapRevision++;map?.remove();map=null;});window.addEventListener('pageshow',event=>{if(event.persisted){if(view==='map')void showMap();resume();}});reduced.addEventListener('change',()=>render(true));
$('pilotMap').hidden=view!=='map';$('pilotSchema').hidden=view!=='schema';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
void start();if(location.protocol==='https:'&&'serviceWorker' in navigator)void navigator.serviceWorker.register('./sw.js').catch(()=>{});
