import {createVehicleReadiness} from './vehicle-readiness.mjs?v=0.11.16';
import {decodeJourneyPolyline,routeColor} from './journey-geometry.mjs?v=0.11.16';
import {ensureJourneyMap} from './journey-map.mjs?v=0.11.16';
import {createThemeController} from './theme.mjs?v=0.11.16';
import {normalizePilotSnapshot,createVehicleTracker,vehiclePosition,pilotGeometry} from './vehicle-tracker.mjs?v=0.11.16';
import {vehicleSymbolMarkup} from './transport-controls.mjs?v=0.11.16';
import {createVehiclePoller} from './vehicle-poller.mjs?v=0.11.16';
import {createVehicleData,vehicleWindows,stationVehicleRange,stationVehicleTracks,preferredVehicleDirection,vehicleUrl,vehicleDisplayId} from './vehicle-data.mjs?v=0.11.16';
import {createHorizontalVehicleStrip} from './vehicle-strip.mjs?v=0.11.16';
const $=id=>document.getElementById(id),params=new URL(location.href).searchParams,escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=t=>new Date(t).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit',second:'2-digit'}),short=id=>vehicleDisplayId(id,line?.route),rowY=i=>55+i*100;
let theme='system';try{theme=JSON.parse(localStorage.getItem('foama.settings.v1')||'{}').theme;}catch{}createThemeController({preference:theme});
let data,manifest,line,direction,tracker,geometry,poller,map,mapLayers,vehicleLayer,view=params.get('ansicht')==='station'?'station':params.get('ansicht')==='schema'?'schema':'map',selected='',follow=false,started=false,paused=false,frozenAt=0,animation=0,lastRender=0,mapRevision=0;
let lastMarkup='',lastStationMarkup='',lastDetailsMarkup='',runNumber=0,lastAnimation=0,waitingUntil=0,requesting=false,repeated=false,readinessStage='catalogue',mapShown=false,mapDirection=null;const mapVehicles=new Map();const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readiness=createVehicleReadiness();$('pilotReadiness').append(readiness.element);
const source=createVehicleData();let catalogue,loading=0,windows=[],windowIndex=0,requestedIds=[],focusStop=params.get('halt'),localRange=null,localStrip=null;
function coordinate(position){return position.from!=null?geometry.between(position.from,position.to,position.fraction):geometry.at(position.progress);}
function markerMarkup(){return '<span class="vehicle-body">'+vehicleSymbolMarkup(line?.mode||'metro')+'</span>';}
function choose(id){selected=selected===id?'':id;follow=false;render(true);}
async function showMap(){
 const own=++mapRevision;if(!mapShown||view!=='map'||document.hidden||!geometry)return;
 $('pilotMapNote').hidden=true;
 try{const L=await ensureJourneyMap();if(own!==mapRevision||document.hidden||!mapShown||view!=='map')return;
  if(!map){$('pilotMap').textContent='';map=L.map($('pilotMap'),{scrollWheelZoom:false});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>'}).on('tileerror',()=>{$('pilotMapNote').hidden=false;$('pilotMapNote').textContent='Kartenhintergrund nicht vollständig erreichbar. Der echte Linienverlauf bleibt sichtbar; das Schema funktioniert auch ohne Straßenkarte.';}).addTo(map);mapLayers=L.layerGroup().addTo(map);vehicleLayer=L.layerGroup().addTo(map);}
  if(mapDirection===direction){map.invalidateSize({pan:true,animate:false});render(true);return;}
  mapLayers.clearLayers();vehicleLayer.clearLayers();mapVehicles.clear();L.polyline(geometry.points,{color:routeColor(line.route,line.mode),weight:5,interactive:false}).addTo(mapLayers);
  direction.stops.forEach((s,i)=>{const marker=L.circleMarker([s.lat,s.lon],{radius:7,color:routeColor(line.route,line.mode),weight:3,fillColor:'#fff',fillOpacity:1}).addTo(mapLayers);marker.bindPopup(document.createTextNode(s.name));});
  mapDirection=direction;map.invalidateSize({pan:true,animate:false});map.fitBounds(L.latLngBounds(geometry.points).pad(.2),{maxZoom:16,animate:false});render(true);
 }catch{if(own===mapRevision&&mapShown){$('pilotMapNote').hidden=false;$('pilotMapNote').textContent='Kartenmodul nicht verfügbar. Bitte zur Schemaansicht wechseln.';}}
}
function syncPresentation(hasPositions){
 $('pilotReadiness').hidden=hasPositions;
 for(const id of ['pilotLiveSummary','pilotCoverage','pilotResults','pilotStationsDetails','pilotEventsDetails'])$(id).hidden=!hasPositions;
 $('pilotMap').hidden=!hasPositions||view!=='map';$('pilotSchema').hidden=!hasPositions||view!=='schema';$('pilotLocal').hidden=!hasPositions||view!=='station';$('pilotLegend').hidden=!hasPositions||view==='station';
 if(hasPositions&&view==='map'&&!document.hidden){if(!mapShown){mapShown=true;void showMap();}}
 else{if(mapShown){mapShown=false;mapRevision++;map?.stop();}$('pilotMapNote').hidden=true;}
}
function vehicleInfo(t){const p=t.position;if(!p)return t.status;if(p.basis==='held')return t.status+' · letzte geschätzte Lage';if(p.basis==='schedule-bridge')return 'Anfahrt nach '+direction.stops[p.next].name+' · mit Fahrplan überbrückt';if(p.basis==='terminal-estimate')return 'Geschätzte Ankunft: '+direction.stops[p.next].name;const name=direction.stops[p.next]?.name||'';return p.basis==='onStop'?'Stationsmeldung: '+name:p.station!=null?'Geschätzter Aufenthalt: '+name:'Geschätzt unterwegs nach '+name;}
function render(force=false){
 if(!tracker)return;const now=paused?frozenAt:Date.now(),base=tracker.view(now),state=base,tracks=view==='station'?stationVehicleTracks(state,localRange):state.tracks,positions=tracks.filter(t=>t.position).map(t=>reduced.matches&&!paused&&!t.position.stale&&!t.position.uncertain?{...t,position:vehiclePosition(t,state.at)||t.position}:t).filter(t=>t.position);
 syncPresentation(positions.length>0);
 if(!positions.length)readiness.render({stage:readinessStage,state,range:view==='station'?localRange:null,running:started,paused,requesting,waitingUntil,repeated,now});
 const waitSeconds=Math.max(0,Math.ceil((waitingUntil-now)/1000)),waiting=waitSeconds?' · nächste Abfrage in '+waitSeconds+' s':'';
 const startup=state.tracks.some(t=>t.hits===1&&!t.blocked)?'Erster Quellenstand zugeordnet · zweite Bestätigung folgt':state.at?'Noch keine eindeutig zuordenbare Fahrt':'Stationsmeldungen werden geladen';
 const pauseText=paused?'Pausiert · eingefrorener Stand':!started?'Bereit für Fahrzeuge im Anflug':state.problem?state.problem:base.stale&&state.at?'Daten veraltet · keine aktuelle Fahrzeuglage':state.tracks.some(t=>t.hits>=2)?positions.length+' geschätzte Position'+(positions.length===1?'':'en')+' auf Linie '+line.route:startup+waiting;
 $('pilotStatus').textContent=pauseText;$('pilotStatus').parentElement.dataset.state=paused||!started?'paused':state.problem||state.partial||base.stale?'error':'live';$('pilotAge').textContent=state.at?'Stand '+clock(state.at)+(paused?'':' · '+Math.max(0,Math.floor((Date.now()-state.at)/1000))+' s'):'';
 $('pilotCoverage').textContent=state.at?state.coverage.length+' von '+state.expected+' angefragten Haltepunkten aktualisiert · '+(view==='station'?'Ausschnitt bei deiner Station':windows.length>1?'Live-Abschnitt '+(windowIndex+1)+' von '+windows.length:'Linienverlauf'):'';
 $('pilotPause').textContent=!started?'Anzeige starten':paused?'Live fortsetzen':'Pause';
 if(localStrip&&view==='station')localStrip.render(state);
 const ids=new Set(positions.map(t=>t.id));
 if(map&&mapShown&&mapDirection===direction&&view==='map'){
  for(const [id,marker] of mapVehicles)if(!ids.has(id)){vehicleLayer.removeLayer(marker);mapVehicles.delete(id);}
  for(const t of positions){let marker=mapVehicles.get(t.id);if(!marker){marker=window.L.marker(coordinate(t.position),{icon:window.L.divIcon({className:'pilot-vehicle-marker',html:markerMarkup()+'<small class="vehicle-id">'+escape(short(t.id))+'</small>',iconSize:[82,62],iconAnchor:[41,22]}),keyboard:true,zIndexOffset:1000}).addTo(vehicleLayer);marker.on('click',()=>choose(t.id));mapVehicles.set(t.id,marker);}marker.setLatLng(coordinate(t.position));marker.setZIndexOffset(selected===t.id?1400:t.position.uncertain?900:1000);const el=marker.getElement();el?.setAttribute('aria-label',short(t.id)+' · '+vehicleInfo(t));el?.setAttribute('aria-pressed',String(selected===t.id));el?.classList.toggle('stale',t.position.stale);el?.classList.toggle('uncertain',Boolean(t.position.uncertain));}
  if(follow&&selected&&mapVehicles.has(selected))map.panTo(mapVehicles.get(selected).getLatLng(),{animate:false});
 }
 const schema=$('schemaVehicles');for(const node of [...schema.children])if(!ids.has(node.dataset.train))node.remove();
 for(const t of positions){let button=[...schema.children].find(n=>n.dataset.train===t.id);if(!button){button=document.createElement('button');button.type='button';button.className='schema-vehicle';button.dataset.train=t.id;button.innerHTML=markerMarkup()+'<small class="vehicle-id">'+escape(short(t.id))+'</small>';button.addEventListener('click',()=>choose(t.id));schema.append(button);}button.style.top=rowY(t.position.progress)+'px';button.setAttribute('aria-label',short(t.id)+' · '+vehicleInfo(t));button.setAttribute('aria-pressed',String(selected===t.id));button.classList.toggle('stale',t.position.stale);button.classList.toggle('uncertain',Boolean(t.position.uncertain));}
 const markup=positions.map(t=>`<button class="pilot-train ${t.position.uncertain||t.position.stale?'uncertain':''}" type="button" data-train="${escape(t.id)}" aria-pressed="${selected===t.id}"><span class="vehicle-list-symbol" aria-hidden="true">${vehicleSymbolMarkup(line.mode)}</span><span class="vehicle-list-copy"><strong>${escape(short(t.id))}</strong><small>${escape(vehicleInfo(t))}${t.position.stale?' · eingefroren':''}</small></span><span aria-hidden="true">›</span></button>`).join('')||`<p class="fineprint">${!started?'Starte die Anzeige, um frische Stationsmeldungen zu sammeln.':paused?'Keine geschätzte Position im eingefrorenen Stand.':state.problem||state.partial||base.stale?'Aktuell keine ausreichend frische Schätzung.':'Noch keine eindeutige Position im Abschnitt. Die aktuellen Stationsprognosen stehen im Klappbereich unten.'}</p>`;
 if(markup!==lastMarkup){$('pilotTrains').innerHTML=markup;lastMarkup=markup;}
 const selectedTrack=state.tracks.find(t=>t.id===selected);$('pilotSelection').hidden=!positions.length||!selected;
 if(selected){$('selectedVehicle').textContent=short(selected);$('selectedVehicleInfo').textContent=selectedTrack?vehicleInfo(selectedTrack)+' · Vorläufige Fahrt-ID, keine offizielle Fahrzeugnummer.':'Diese vorläufige Fahrt wird nicht mehr ausreichend frisch zugeordnet.';$('pilotFollow').setAttribute('aria-pressed',String(follow));$('pilotFollow').textContent=follow?'Folgen beenden':'Fahrt folgen';$('pilotFollow').disabled=!selectedTrack?.position;}
 if(!force&&Date.now()-lastRender<1000)return;lastRender=Date.now();
 const stationMarkup=direction.stops.map((s,i)=>`<article class="pilot-station"><h4>${i+1}. ${escape(s.name)}</h4><ul>${state.rows.filter(r=>r.index===i).slice(0,3).map(r=>{const matches=state.tracks.filter(t=>r.candidates?.includes(t.schedule.key)),id=matches.length===1?short(matches[0].id):'Zuordnung offen';return `<li><time>${escape(clock(r.actual))}</time><span>${escape(id)}${r.onStop?' · an Station gemeldet':''}</span></li>`;}).join('')||'<li>Keine frische Live-Prognose.</li>'}</ul></article>`).join('');
 if(stationMarkup!==lastStationMarkup){$('pilotStations').innerHTML=stationMarkup;lastStationMarkup=stationMarkup;}
 if(follow&&selected&&view==='schema'){const t=positions.find(t=>t.id===selected);if(t)$('pilotSchema').scrollTop=Math.max(0,rowY(t.position.progress)-$('pilotSchema').clientHeight/2);}
 const details=state.events.map(e=>`<div class="pilot-event"><strong>${escape(short(e.id))}</strong> · ${e.kind==='handover'?escape(direction.stops[e.from].name+' → '+direction.stops[e.to].name):({correction:'Prognosekorrektur · Lage erneut prüfen',gap:'Meldelücke · letzte Lage bleibt sichtbar',reacquired:'Wieder zugeordnet · gleiche Fahrt-ID',expired:'Zuordnung seit 90 Sekunden ausgeblieben',superseded:'Letzte Lage durch bestätigte Folgefahrt überholt',end:'Geschätzte Endstation erreicht'})[e.kind]||'Vorläufiger Kandidat angelegt'}<small>${clock(e.at)} · ${e.kind==='handover'?'Plausible Stationsfolge anhand „an Station“-Meldungen':'Zuordnung aus Sollzeiten und Stationsprognosen'}</small></div>`).join('')||'<p class="fineprint">Noch keine Übergabe beobachtet.</p>';
 if(details!==lastDetailsMarkup){$('pilotEvents').innerHTML=details;lastDetailsMarkup=details;}
 $('pilotCandidates').className='pilot-candidates';$('pilotCandidates').innerHTML=state.tracks.length?'<table><thead><tr><th>Vorläufige ID</th><th>Prüfstand</th></tr></thead><tbody>'+state.tracks.map(t=>`<tr><td>${escape(short(t.id))}</td><td>${escape(t.status)} · ${t.hits} Quellenstände</td></tr>`).join('')+'</tbody></table>':'';
}
function animate(timestamp){if(document.hidden||paused||!started)return;if(timestamp-lastAnimation>250){lastAnimation=timestamp;render();}animation=requestAnimationFrame(animate);}
function stop(){poller?.stop();cancelAnimationFrame(animation);animation=0;}
function resume(){if(!tracker||document.hidden||paused||!started)return;if(Date.now()-tracker.view().at>90_000)tracker.clear();poller.start();cancelAnimationFrame(animation);animation=requestAnimationFrame(animate);render(true);}
function controls(){
 const groups=[...new Set(data.directions.map(d=>d.gtfsDirection))];$('pilotDirections').innerHTML=groups.map(id=>{const d=preferredVehicleDirection(data,line,manifest,{gtfsDirection:id});return `<button type="button" data-direction="${escape(id)}" aria-pressed="${direction.gtfsDirection===id}">→ ${escape(d.towards)}</button>`;}).join('');
 const variants=data.directions.filter(d=>d.gtfsDirection===direction.gtfsDirection);$('pilotVariantLabel').hidden=variants.length<2;$('pilotVariant').innerHTML=variants.map(d=>`<option value="${escape(d.id)}" ${d.id===direction.id?'selected':''}>${escape(d.stops[0].name)} → ${escape(d.towards)} · ${d.stops.length} Halte</option>`).join('');
 $('pilotWindowLabel').hidden=windows.length<2||view==='station';$('pilotWindow').innerHTML=windows.map((w,i)=>`<option value="${i}" ${i===windowIndex?'selected':''}>${escape(direction.stops[w.start].name)} → ${escape(direction.stops[Math.min(w.end+1,direction.stops.length-1)].name)}</option>`).join('');
 $('pilotStation').innerHTML='<option value="">Station auswählen</option>'+direction.stops.map(s=>`<option value="${escape(s.id)}" ${s.id===focusStop?'selected':''}>${escape(s.name)}</option>`).join('');document.querySelector('[data-view="station"]').disabled=!localRange;
}
function setDirection(id){
 stop();syncPresentation(false);waitingUntil=0;requesting=false;repeated=false;direction=data.directions.find(d=>d.id===id)||data.directions[0];selected='';follow=false;tracker=createVehicleTracker(direction,manifest,{prefix:line.route+'-'+direction.monitorDirection+(++runNumber)});const pattern=line.patterns.find(p=>p.id===direction.patternId);geometry=pilotGeometry(decodeJourneyPolyline(line.shapes[pattern.geometry]),direction.stops);
 windows=vehicleWindows(direction);windowIndex=Math.min(windowIndex,windows.length-1);localRange=focusStop?stationVehicleRange(direction,focusStop):null;if(view==='station'&&!localRange)view='schema';requestedIds=view==='station'?localRange.ids:windows[windowIndex].ids;
 const url=new URL(vehicleUrl({route:line.route,mode:line.mode,stopId:focusStop,towards:direction.towards,view:view==='map'?'karte':view,patternId:direction.patternId}),location.href);history.replaceState(history.state,'',url);
 controls();syncView();$('pilotTrainsTitle').textContent='Auf Linie '+line.route;$('pilotBackLine').href='./linienkarte.html?'+new URLSearchParams({linie:line.route,verkehrsmittel:line.mode,halt:focusStop||'',richtung:direction.towards});$('pilotLineTitle').textContent=line.route+' · LIVE-ÜBERSICHT';$('pilotIntro').textContent=direction.stops[0].name+' → '+direction.stops.at(-1).name+' · '+direction.stops.length+' Stationen · aus Stationsprognosen geschätzt.';document.title='Fahrzeuge im Anflug · '+line.route+' · foama-wien';document.querySelector('.vehicle-page').style.setProperty('--vehicle-line-color',routeColor(line.route,line.mode));
 const height=rowY(direction.stops.length-1)+55;$('schemaCanvas').style.height=height+'px';$('schemaTrack').setAttribute('viewBox','0 0 100 '+height);$('schemaTrack').innerHTML='<path d="M48 0V'+height+'" class="schema-outside"/><path d="M48 55V'+rowY(direction.stops.length-1)+'" class="schema-line"/>'+direction.stops.map((s,i)=>'<circle cx="48" cy="'+rowY(i)+'" r="7"/>').join('');$('pilotLegendSymbol').innerHTML=vehicleSymbolMarkup(line.mode);
 $('schemaStops').innerHTML=direction.stops.map((s,i)=>`<button type="button" class="schema-stop" style="top:${rowY(i)}px" data-stop="${i}">${escape(s.name)}<small>${i===0?'Linienbeginn':i===direction.stops.length-1?'Endstation · Ankunft geschätzt':s.rbl?'Live-Prognose als Stationsanker':'Keine eindeutige Monitorseite'}</small></button>`).join('');
 if(localRange){localStrip=createHorizontalVehicleStrip({direction,range:localRange});$('pilotLocal').replaceChildren(localStrip.element);}else{localStrip=null;$('pilotLocal').replaceChildren();}
 poller=createVehiclePoller({ids:()=>requestedIds,onData(raw){requesting=false;try{repeated=tracker.ingest(normalizePilotSnapshot(raw,direction,Date.now(),requestedIds))?.ignored===true;}catch(e){tracker.fail(e.message);}render(true);},onError(message){requesting=false;tracker.fail(message);render(true);},onRequest(){requesting=true;render(true);},onWaiting(ms){waitingUntil=Date.now()+ms;render(true);}});
 render(true);resume();
}
function syncView(){
 $('pilotFit').textContent=view==='schema'?'Zum Linienanfang':'Gesamte Linie';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
}
async function loadLine(entry){
 const own=++loading;stop();syncPresentation(false);$('pilotSelection').hidden=true;readinessStage='line';readiness.render({stage:readinessStage});mapRevision++;tracker=null;mapLayers?.clearLayers();vehicleLayer?.clearLayers();mapVehicles.clear();mapDirection=null;$('pilotPause').disabled=true;$('pilotStatus').textContent='Fahrzeuglinie wird geladen …';$('pilotTrains').textContent='';
 try{const result=await source.line(entry);if(own!==loading)return;({data,line,manifest}=result);readinessStage='ready';windowIndex=0;$('pilotLine').value=entry.id;
  const explicit=params.get('variante'),preferred=(explicit&&data.directions.find(d=>d.id===explicit&&(!focusStop||d.stops.some(s=>s.id===focusStop))))||preferredVehicleDirection(data,line,manifest,{stopId:focusStop,towards:params.get('richtung')});if(!preferred)throw Error('Die gewählte Station kommt in den verfügbaren Strecken dieser Linie nicht vor. Bitte eine andere Linie wählen.');
  $('pilotPause').disabled=false;$('pilotSource').textContent='Wiener Linien · Sollfahrplan '+manifest.validFrom+' bis '+manifest.validThrough+' · Live-Monitor · '+manifest.attribution;setDirection(preferred.id);
 }catch(e){if(own===loading){readiness.render({stage:readinessStage,error:e.message});$('pilotStatus').textContent=e.message;$('pilotPause').disabled=true;}}
}
async function start(){
 try{const result=await source.index();({manifest,index:catalogue}=result);const modes={metro:'U-Bahn',tram:'Straßenbahn',bus:'Bus'};$('pilotLine').innerHTML='<option value="">Linie wählen</option>'+Object.entries(modes).map(([mode,label])=>'<optgroup label="'+label+'">'+catalogue.lines.filter(l=>l.mode===mode).sort((a,b)=>a.route.localeCompare(b.route,'de-AT',{numeric:true})).map(l=>'<option value="'+escape(l.id)+'">'+escape(l.route)+'</option>').join('')+'</optgroup>').join('');
  if(Date.now()>Date.parse(manifest.validThrough+'T23:00Z'))throw Error('Die Fahrplanbasis ist abgelaufen. Bitte zuerst erneuern.');
  const route=params.get('linie')||'U6',mode=params.get('verkehrsmittel')||'metro',entry=catalogue.lines.find(l=>l.route===route&&l.mode===mode);if(!entry)throw Error('Für diese Linie ist noch keine eindeutige Fahrzeugschätzung verfügbar. Wähle oben eine andere Linie.');await loadLine(entry);
 }catch(e){readiness.render({stage:readinessStage,error:e.message});$('pilotStatus').textContent=e.message;$('pilotPause').disabled=true;}
}
$('pilotPause').addEventListener('click',()=>{if(!started){started=true;paused=false;resume();}else if(paused){paused=false;resume();}else{frozenAt=Date.now();paused=true;stop();render(true);}});
$('pilotDirections').addEventListener('click',event=>{const b=event.target.closest('[data-direction]');if(b&&b.dataset.direction!==direction?.gtfsDirection){windowIndex=0;const d=preferredVehicleDirection(data,line,manifest,{gtfsDirection:b.dataset.direction,stopId:focusStop});if(d)setDirection(d.id);}});
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{if(!tracker)return;const old=view;view=button.dataset.view;follow=false;if(old==='station'||view==='station'){setDirection(direction.id);return;}syncView();render(true);}));
$('pilotLine').addEventListener('change',()=>{const entry=catalogue.lines.find(l=>l.id===$('pilotLine').value);if(entry){focusStop=null;params.delete('variante');params.delete('richtung');view=view==='station'?'schema':view;void loadLine(entry);}});
$('pilotVariant').addEventListener('change',()=>{windowIndex=0;setDirection($('pilotVariant').value);});
$('pilotWindow').addEventListener('change',()=>{windowIndex=Number($('pilotWindow').value);setDirection(direction.id);});
$('pilotStation').addEventListener('change',()=>{focusStop=$('pilotStation').value||null;if(focusStop)view='station';setDirection(direction.id);});
$('pilotTrains').addEventListener('click',event=>{const b=event.target.closest('[data-train]');if(b)choose(b.dataset.train);});
$('schemaStops').addEventListener('click',event=>{const b=event.target.closest('[data-stop]');if(b){const s=direction.stops[Number(b.dataset.stop)];$('pilotStations').parentElement.open=true;$('pilotStations').children[Number(b.dataset.stop)]?.scrollIntoView({block:'center',behavior:reduced.matches?'instant':'smooth'});}});
$('pilotFit').addEventListener('click',()=>{follow=false;if(view==='map'&&map)map.fitBounds(window.L.latLngBounds(geometry.points).pad(.2),{maxZoom:16,animate:false});else $('pilotSchema').scrollTop=0;render(true);});
$('pilotSchema').addEventListener('wheel',()=>{follow=false;},{passive:true});$('pilotSchema').addEventListener('pointerdown',()=>{follow=false;},{passive:true});
$('pilotFollow').addEventListener('click',()=>{follow=!follow;render(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();mapShown=false;map?.stop();mapRevision++;}else{resume();render(true);}});
window.addEventListener('pagehide',()=>{loading++;stop();mapShown=false;mapDirection=null;mapRevision++;map?.remove();map=null;});window.addEventListener('pageshow',event=>{if(event.persisted){resume();render(true);}});reduced.addEventListener('change',()=>render(true));
syncView();
void start();if(location.protocol==='https:'&&'serviceWorker' in navigator)void navigator.serviceWorker.register('./sw.js').catch(()=>{});
