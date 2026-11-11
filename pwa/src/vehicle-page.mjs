import {createTimetable} from './timetable.mjs?v=0.10.1';
import {createLineMaps} from './line-maps.mjs?v=0.10.1';
import {decodeJourneyPolyline} from './journey-geometry.mjs?v=0.10.1';
import {ensureJourneyMap} from './journey-map.mjs?v=0.10.1';
import {createThemeController} from './theme.mjs?v=0.10.1';
import {decodeVehiclePilot,validateVehiclePilot,normalizePilotSnapshot,createVehicleTracker,vehiclePosition,pilotGeometry} from './vehicle-tracker.mjs?v=0.10.1';
import {getCatalogue,putCatalogue} from './storage.mjs?v=0.10.1';
import {vehicleSymbolMarkup} from './transport-controls.mjs?v=0.10.1';
import {createVehiclePoller} from './vehicle-poller.mjs?v=0.10.1';
const $=id=>document.getElementById(id),params=new URL(location.href).searchParams,escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=t=>new Date(t).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit',second:'2-digit'}),short=id=>id.replace(/^U6-/,''),rowY=i=>55+i*100;
let theme='system';try{theme=JSON.parse(localStorage.getItem('foama.settings.v1')||'{}').theme;}catch{}createThemeController({preference:theme});
let data,manifest,line,direction,tracker,geometry,poller,map,mapLayers,vehicleLayer,view=params.get('ansicht')==='schema'?'schema':'map',selected='',follow=false,started=false,paused=false,frozenAt=0,animation=0,lastRender=0,mapRevision=0;
let lastMarkup='',lastStationMarkup='',lastDetailsMarkup='',runNumber=0,lastAnimation=0;const mapVehicles=new Map();const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function coordinate(position){return position.from!=null?geometry.between(position.from,position.to,position.fraction):geometry.at(position.progress);}
function markerMarkup(){return '<span class="vehicle-body">'+vehicleSymbolMarkup(line?.mode||'metro')+'</span>';}
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
function vehicleInfo(t){const p=t.position;if(!p)return t.status;if(p.basis==='held')return t.status+' · letzte geschätzte Lage';if(p.basis==='schedule-bridge')return 'Anfahrt nach '+direction.stops[p.next].name+' · mit Fahrplan überbrückt';if(p.basis==='terminal-estimate')return 'Geschätzte Ankunft: '+direction.stops[p.next].name;const name=direction.stops[p.next]?.name||'';return p.basis==='onStop'?'Stationsmeldung: '+name:p.station!=null?'Geschätzter Aufenthalt: '+name:'Geschätzt unterwegs nach '+name;}
function render(force=false){
 if(!tracker)return;const now=paused?frozenAt:Date.now(),base=tracker.view(now),state=base,positions=state.tracks.filter(t=>t.position).map(t=>reduced.matches&&!paused&&!t.position.stale&&!t.position.uncertain?{...t,position:vehiclePosition(t,state.at)||t.position}:t).filter(t=>t.position);
 const pauseText=paused?'Pausiert · eingefrorener Stand':!started?'Bereit für den Live-Test':state.problem?state.problem:base.stale&&state.at?'Daten veraltet · keine aktuelle Fahrzeuglage':state.tracks.some(t=>t.hits>=2)?positions.length+' geschätzte Position'+(positions.length===1?'':'en')+' auf der U6':'Stationsmeldungen werden zugeordnet · zwei Quellenstände nötig';
 $('pilotStatus').textContent=pauseText;$('pilotStatus').parentElement.dataset.state=paused||!started?'paused':state.problem||state.partial||base.stale?'error':'live';$('pilotAge').textContent=state.at?'Stand '+clock(state.at)+(paused?'':' · '+Math.max(0,Math.floor((Date.now()-state.at)/1000))+' s'):'';
 $('pilotCoverage').textContent=state.at?state.coverage.length+' von '+state.expected+' Abfahrthaltepunkten aktualisiert · Endstationsanfahrt aus Fahrplan geschätzt':'';
 $('pilotPause').textContent=!started?'Live-Test starten':paused?'Live fortsetzen':'Pause';
 const ids=new Set(positions.map(t=>t.id));
 if(map&&view==='map'){
  for(const [id,marker] of mapVehicles)if(!ids.has(id)){vehicleLayer.removeLayer(marker);mapVehicles.delete(id);}
  for(const t of positions){let marker=mapVehicles.get(t.id);if(!marker){marker=window.L.marker(coordinate(t.position),{icon:window.L.divIcon({className:'pilot-vehicle-marker',html:markerMarkup()+'<small class="vehicle-id">'+escape(short(t.id))+'</small>',iconSize:[82,62],iconAnchor:[41,22]}),keyboard:true,zIndexOffset:1000}).addTo(vehicleLayer);marker.on('click',()=>choose(t.id));mapVehicles.set(t.id,marker);}marker.setLatLng(coordinate(t.position));const el=marker.getElement();el?.setAttribute('aria-label',t.id+' · '+vehicleInfo(t));el?.setAttribute('aria-pressed',String(selected===t.id));el?.classList.toggle('stale',t.position.stale);el?.classList.toggle('uncertain',Boolean(t.position.uncertain));}
  if(follow&&selected&&mapVehicles.has(selected))map.panTo(mapVehicles.get(selected).getLatLng(),{animate:false});
 }
 const schema=$('schemaVehicles');for(const node of [...schema.children])if(!ids.has(node.dataset.train))node.remove();
 for(const t of positions){let button=[...schema.children].find(n=>n.dataset.train===t.id);if(!button){button=document.createElement('button');button.type='button';button.className='schema-vehicle';button.dataset.train=t.id;button.innerHTML=markerMarkup()+'<small class="vehicle-id">'+escape(short(t.id))+'</small>';button.addEventListener('click',()=>choose(t.id));schema.append(button);}button.style.top=rowY(t.position.progress)+'px';button.setAttribute('aria-label',t.id+' · '+vehicleInfo(t));button.setAttribute('aria-pressed',String(selected===t.id));button.classList.toggle('stale',t.position.stale);button.classList.toggle('uncertain',Boolean(t.position.uncertain));}
 const markup=positions.map(t=>`<button class="pilot-train" type="button" data-train="${escape(t.id)}" aria-pressed="${selected===t.id}"><span class="vehicle-list-symbol" aria-hidden="true">${vehicleSymbolMarkup(line.mode)}</span><span class="vehicle-list-copy"><strong>${escape(t.id)}</strong><small>${escape(vehicleInfo(t))}${t.position.stale?' · eingefroren':''}</small></span><span aria-hidden="true">›</span></button>`).join('')||`<p class="fineprint">${!started?'Starte den Test, um frische Stationsmeldungen zu sammeln.':paused?'Keine geschätzte Position im eingefrorenen Stand.':state.problem||state.partial||base.stale?'Aktuell keine ausreichend frische Schätzung.':'Noch keine eindeutige Position im Abschnitt. Die aktuellen Stationsprognosen stehen im Klappbereich unten.'}</p>`;
 if(markup!==lastMarkup){$('pilotTrains').innerHTML=markup;lastMarkup=markup;}
 const selectedTrack=state.tracks.find(t=>t.id===selected);$('pilotSelection').hidden=!selected;
 if(selected){$('selectedVehicle').textContent=selected;$('selectedVehicleInfo').textContent=selectedTrack?vehicleInfo(selectedTrack)+' · '+selectedTrack.status+' · '+selectedTrack.hits+' unterschiedliche Quellenstände. Keine offizielle Fahrzeug-ID.':'Diese vorläufige Fahrt wird nicht mehr ausreichend frisch zugeordnet.';$('pilotFollow').setAttribute('aria-pressed',String(follow));$('pilotFollow').disabled=!selectedTrack?.position;}
 if(!force&&Date.now()-lastRender<1000)return;lastRender=Date.now();
 const stationMarkup=direction.stops.map((s,i)=>`<article class="pilot-station"><h4>${i+1}. ${escape(s.name)}</h4><ul>${state.rows.filter(r=>r.index===i).slice(0,3).map(r=>{const matches=state.tracks.filter(t=>r.candidates?.includes(t.schedule.key)),id=matches.length===1?matches[0].id:'Zuordnung offen';return `<li><time>${escape(clock(r.actual))}</time><span>${escape(id)}${r.onStop?' · an Station gemeldet':''}</span></li>`;}).join('')||'<li>Keine frische Live-Prognose.</li>'}</ul></article>`).join('');
 if(stationMarkup!==lastStationMarkup){$('pilotStations').innerHTML=stationMarkup;lastStationMarkup=stationMarkup;}
 if(follow&&selected&&view==='schema'){const t=positions.find(t=>t.id===selected);if(t)$('pilotSchema').scrollTop=Math.max(0,rowY(t.position.progress)-$('pilotSchema').clientHeight/2);}
 const details=state.events.map(e=>`<div class="pilot-event"><strong>${escape(e.id)}</strong> · ${e.kind==='handover'?escape(direction.stops[e.from].name+' → '+direction.stops[e.to].name):({correction:'Prognosekorrektur · Lage erneut prüfen',gap:'Meldelücke · letzte Lage bleibt sichtbar',reacquired:'Wieder zugeordnet · gleiche Fahrt-ID',expired:'Zuordnung seit 90 Sekunden ausgeblieben',end:'Geschätzte Endstation erreicht'})[e.kind]||'Vorläufiger Kandidat angelegt'}<small>${clock(e.at)} · ${e.kind==='handover'?'Plausible Stationsfolge anhand „an Station“-Meldungen':'Zuordnung aus Sollzeiten und Stationsprognosen'}</small></div>`).join('')||'<p class="fineprint">Noch keine Übergabe beobachtet.</p>';
 if(details!==lastDetailsMarkup){$('pilotEvents').innerHTML=details;lastDetailsMarkup=details;}
 $('pilotCandidates').className='pilot-candidates';$('pilotCandidates').innerHTML=state.tracks.length?'<table><thead><tr><th>Vorläufige ID</th><th>Prüfstand</th></tr></thead><tbody>'+state.tracks.map(t=>`<tr><td>${escape(t.id)}</td><td>${escape(t.status)} · ${t.hits} Quellenstände</td></tr>`).join('')+'</tbody></table>':'';
}
function animate(timestamp){if(document.hidden||paused||!started)return;if(timestamp-lastAnimation>250){lastAnimation=timestamp;render();}animation=requestAnimationFrame(animate);}
function stop(){poller?.stop();cancelAnimationFrame(animation);animation=0;}
function resume(){if(!tracker||document.hidden||paused||!started)return;if(Date.now()-tracker.view().at>90_000)tracker.clear();poller.start();cancelAnimationFrame(animation);animation=requestAnimationFrame(animate);render(true);}
function setDirection(id){
 stop();direction=data.directions.find(d=>d.id===id)||data.directions[0];selected='';follow=false;tracker=createVehicleTracker(direction,manifest,{prefix:'U6-'+direction.monitorDirection+(++runNumber)});const pattern=line.patterns.find(p=>p.id===direction.patternId);geometry=pilotGeometry(decodeJourneyPolyline(line.shapes[pattern.geometry]),direction.stops);
 for(const button of $('pilotDirections').children)button.setAttribute('aria-pressed',String(button.dataset.direction===direction.id));
 const height=rowY(direction.stops.length-1)+55;$('schemaCanvas').style.height=height+'px';$('schemaTrack').setAttribute('viewBox','0 0 100 '+height);$('schemaTrack').innerHTML='<path d="M48 0V'+height+'" class="schema-outside"/><path d="M48 55V'+rowY(direction.stops.length-1)+'" class="schema-line"/>'+direction.stops.map((s,i)=>'<circle cx="48" cy="'+rowY(i)+'" r="7"/>').join('');$('pilotLegendSymbol').innerHTML=vehicleSymbolMarkup(line.mode);
 $('schemaStops').innerHTML=direction.stops.map((s,i)=>`<button type="button" class="schema-stop" style="top:${rowY(i)}px" data-stop="${i}">${escape(s.name)}<small>${i===0?'Beginn der U6':i===direction.stops.length-1?'Endstation · Ankunft geschätzt':'Live-Prognose als Stationsanker'}</small></button>`).join('');
 poller=createVehiclePoller({ids:()=>direction.stops.map(s=>s.rbl).filter(Boolean),onData(raw){try{tracker.ingest(normalizePilotSnapshot(raw,direction));}catch(e){tracker.fail(e.message);}render(true);},onError(message){tracker.fail(message);render(true);},onWaiting(ms){if(!tracker.view().at)$('pilotStatus').textContent='Gemeinsame Abfragepause · nächster Versuch in '+Math.ceil(ms/1000)+' s';}});
 if(view==='map')void showMap();render(true);resume();
}
async function start(){
 try{const timetables=createTimetable();manifest=await timetables.metadata();if(!manifest)throw Error('Pilotdaten fehlen. Bitte einmal mit Internetverbindung öffnen.');const maps=createLineMaps(),index=await maps.index(manifest),entry=index.lines.find(l=>l.route==='U6'&&l.mode==='metro');line=(await maps.line(entry,manifest)).data;
  try{const response=await fetch('./data/vehicle-pilot/u6.json?v=0.10.1&fahrplan='+manifest.version,{credentials:'omit'});if(!response.ok)throw Error();const raw=await response.text();if(raw.length>2_000_000)throw Error();data=validateVehiclePilot(await decodeVehiclePilot(JSON.parse(raw)),manifest,line);await putCatalogue('vehicle-pilot:u6:full-v2',data).catch(()=>{});}catch{data=validateVehiclePilot(await getCatalogue('vehicle-pilot:u6:full-v2').catch(()=>null),manifest,line);}
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
$('pilotFit').addEventListener('click',()=>{follow=false;if(view==='map'&&map)map.fitBounds(window.L.latLngBounds(geometry.points).pad(.2),{maxZoom:16,animate:false});else $('pilotSchema').scrollTop=0;render(true);});
$('pilotSchema').addEventListener('wheel',()=>{follow=false;},{passive:true});$('pilotSchema').addEventListener('pointerdown',()=>{follow=false;},{passive:true});
$('pilotFollow').addEventListener('click',()=>{follow=!follow;render(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();map?.stop();mapRevision++;}else{if(view==='map')void showMap();resume();}});
window.addEventListener('pagehide',()=>{stop();mapRevision++;map?.remove();map=null;});window.addEventListener('pageshow',event=>{if(event.persisted){if(view==='map')void showMap();resume();}});reduced.addEventListener('change',()=>render(true));
$('pilotMap').hidden=view!=='map';$('pilotSchema').hidden=view!=='schema';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
void start();if(location.protocol==='https:'&&'serviceWorker' in navigator)void navigator.serviceWorker.register('./sw.js').catch(()=>{});
