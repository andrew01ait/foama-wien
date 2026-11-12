import {recordMonitorSource} from './monitor-timing.mjs?v=0.11.19';
import {createVehicleReadiness} from './vehicle-readiness.mjs?v=0.11.19';
import {vehicleSymbolMarkup} from './transport-controls.mjs?v=0.11.19';
import {routeColor} from './journey-geometry.mjs?v=0.11.19';
import {createVehicleTracker,normalizePilotSnapshot,vehicleTargetMatches} from './vehicle-tracker.mjs?v=0.11.19';
import {createVehicleData,stationVehicleRange,preferredVehicleDirection,vehicleUrl,stationVehicleTracks,stationVehicleStatus,vehicleDisplayId} from './vehicle-data.mjs?v=0.11.19';
import {createStationVehicleMap} from './vehicle-map.mjs?v=0.11.19';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source=createVehicleData();let session=0;

export function createHorizontalVehicleStrip({direction,range,color=routeColor(direction.route,direction.mode),onSelect=()=>{}}){
 const element=document.createElement('div');element.className='vehicle-strip';element.style.setProperty('--vehicle-line-color',color);
 const stops=direction.stops.slice(range.start,range.end+1),x=progress=>(progress-range.start+.5)/stops.length*100;
 element.innerHTML=`<p class="vehicle-strip-orientation">${range.center-range.start} Halte davor · dein Halt · ${range.end-range.center} danach <span aria-hidden="true">→</span></p><div class="vehicle-strip-viewport" role="region" aria-label="Fahrzeuge fahren von links nach rechts; alle Halte passen in die Ansicht"><div class="vehicle-strip-canvas"><svg class="vehicle-strip-track" width="100%" height="118" aria-hidden="true"><line x1="${x(range.start)}%" x2="98%" y1="88" y2="88"/><line class="strip-arrow" x1="96%" x2="98%" y1="83" y2="88"/><line class="strip-arrow" x1="96%" x2="98%" y1="93" y2="88"/>${stops.map((s,k)=>`<circle cx="${x(range.start+k)}%" cy="88" r="${range.start+k===range.center?12:10}" class="${range.start+k===range.center?'strip-current':''}"/><text x="${x(range.start+k)}%" y="88" dy=".35em" text-anchor="middle" class="${range.start+k===range.center?'strip-current':''}">${k+1}</text>`).join('')}</svg><div class="vehicle-strip-vehicles"></div></div><ol class="vehicle-strip-stops" role="list" aria-label="Haltestellen in Fahrtrichtung">${stops.map((s,k)=>`<li class="vehicle-strip-stop ${range.start+k===range.center?'strip-current':''}" ${range.start+k===range.center?'aria-current="location"':''}><span class="vehicle-strip-number" aria-hidden="true">${k+1}</span><span>${escape(s.name)}${range.start+k===range.center?'<small>Deine Haltestelle</small>':''}</span></li>`).join('')}</ol></div><p class="vehicle-strip-status" role="status">Zuordnung wird aufgebaut · zwei frische Quellenstände nötig.</p><p class="fineprint">Geschätzte Lage · grau: letzte Lage oder Fahrplanannahme. Keine GPS-Position.</p>`;
 const holder=element.querySelector('.vehicle-strip-vehicles'),status=element.querySelector('.vehicle-strip-status');let chosen='',lastState;
 holder.addEventListener('click',event=>{const button=event.target.closest('[data-vehicle]');if(button){chosen=chosen===button.dataset.vehicle?'':button.dataset.vehicle;if(lastState)render(lastState);onSelect(chosen);}});
 function render(state){
  lastState=state;const tracks=stationVehicleTracks(state,range),ids=new Set(tracks.map(t=>t.id));
  for(const node of [...holder.children])if(!ids.has(node.dataset.vehicle))node.remove();
  for(const t of tracks){let button=[...holder.children].find(n=>n.dataset.vehicle===t.id);if(!button){button=document.createElement('button');button.type='button';button.className='vehicle-strip-vehicle';button.dataset.vehicle=t.id;button.innerHTML='<span class="vehicle-body">'+vehicleSymbolMarkup(direction.mode)+'</span><small>'+escape(vehicleDisplayId(t.id,direction.route))+'</small>';holder.append(button);}button.style.left=x(t.position.progress)+'%';button.classList.toggle('uncertain',Boolean(t.position.uncertain||t.position.stale));button.setAttribute('aria-pressed',String(chosen===t.id));button.setAttribute('aria-label',vehicleDisplayId(t.id,direction.route)+' · '+(t.position.basis==='held'?'letzte geschätzte Lage':t.position.station!=null?'bei '+direction.stops[t.position.station].name:'unterwegs nach '+direction.stops[t.position.next].name));}
  status.textContent=stationVehicleStatus(state,direction,range,chosen);
 }
 return {element,render,setSelected(id){chosen=id;if(lastState)render(lastState);}};
}

let panelSession=0;
export function createStationVehiclePanel({target,onIdsChanged=()=>{},dataSource=source,mapFactory=createStationVehicleMap}={}){
 const element=document.createElement('details'),panelId='station-vehicles-'+(++panelSession);element.className='station-vehicle-panel';
 element.innerHTML='<summary>Fahrzeuge im Anflug</summary><div class="station-vehicle-body"><div class="station-vehicle-heading"><h3>Stationsausschnitt</h3><a class="station-vehicle-full" href="'+escape(vehicleUrl({...target,view:'schema'}))+'" aria-label="Ganze Linie in Karte und Schema öffnen">Ganze Linie <span aria-hidden="true">↗</span></a></div><p class="fineprint">Bis zu fünf Halte vor deiner Station und zwei danach.</p><label>Richtung &amp; Strecke <select aria-label="Richtung und Strecke für Fahrzeugschätzung"></select></label><div class="station-vehicle-view-switch" role="group" aria-label="Darstellung der Fahrzeuge im Anflug"><button type="button" data-vehicle-view="schema" aria-pressed="true" aria-controls="'+panelId+'-schema" disabled>Schema</button><button type="button" data-vehicle-view="map" aria-pressed="false" aria-controls="'+panelId+'-map" disabled>Karte</button></div><div class="station-vehicle-readiness"></div><div id="'+panelId+'-schema" class="station-vehicle-strip"></div><div id="'+panelId+'-map" class="station-vehicle-map-holder" hidden></div><p class="station-vehicle-message" role="status"></p></div>';
 const select=element.querySelector('select'),message=element.querySelector('.station-vehicle-message'),holder=element.querySelector('.station-vehicle-strip'),mapHolder=element.querySelector('.station-vehicle-map-holder'),full=element.querySelector('.station-vehicle-full'),schemaButton=element.querySelector('[data-vehicle-view="schema"]'),mapButton=element.querySelector('[data-vehicle-view="map"]');
 const readiness=createVehicleReadiness(),progressHolder=element.querySelector('.station-vehicle-readiness');progressHolder.append(readiness.element);holder.hidden=true;mapHolder.hidden=true;message.hidden=true;
 select.disabled=true;let disposed=false,generation=0,packageData=null,tracker=null,direction=null,range=null,strip=null,mapView=null,mapShown=false,view='schema',chosen='',animation=0,lastFrame=0,waitingUntil=0,lastAttempt=0,requesting=false,repeated=false;
 const active=own=>!disposed&&own===generation&&element.open&&!document.hidden;
 function ids(){return !disposed&&element.open&&!document.hidden?range?.ids||[]:[];}
 function draw(){
  if(!tracker)return;const state=tracker.view(),hasPositions=stationVehicleTracks(state,range).length>0;
  progressHolder.hidden=hasPositions;holder.hidden=!hasPositions||view!=='schema';mapHolder.hidden=!hasPositions||view!=='map';message.hidden=!hasPositions;
  if(!hasPositions)readiness.render({stage:'ready',state,range,requesting,waitingUntil,repeated});
  if(hasPositions&&view==='map'&&element.open&&!document.hidden){
   if(!mapView){mapView=mapFactory({direction,range,line:packageData.line,isCurrent:()=>!disposed&&element.open&&!document.hidden&&!mapHolder.hidden,onSelect:id=>selectVehicle(chosen===id?'':id)});mapHolder.replaceChildren(mapView.element);mapView.setSelected(chosen);}
   mapView.render(state);if(!mapShown){mapShown=true;void mapView.show();}
  }else{if(mapShown){mapShown=false;mapView?.hide();}if(hasPositions&&view==='schema')strip?.render(state);}
 }
 function selectVehicle(id){chosen=id;strip?.setSelected(id);mapView?.setSelected(id);}
 function syncView(){
  schemaButton.setAttribute('aria-pressed',String(view==='schema'));mapButton.setAttribute('aria-pressed',String(view==='map'));
  full.href=vehicleUrl({...target,towards:direction?.towards||target.towards,patternId:direction?.patternId,view:view==='map'?'karte':'schema'});
  draw();
 }
 function setView(next){if(disposed||!direction||next===view)return;view=next;syncView();}
 function animate(at){if(disposed||!element.open||document.hidden)return;if(at-lastFrame>=250){lastFrame=at;draw();}animation=requestAnimationFrame(animate);}
 function resume(){cancelAnimationFrame(animation);if(!disposed&&element.open&&!document.hidden)animation=requestAnimationFrame(animate);}
 function choose(id){
  const original=packageData.data.directions.find(d=>d.id===id);if(!original)return;
  const trips=target.towards?original.trips.filter(t=>vehicleTargetMatches(original,t.towards,target.towards)):original.trips;
  mapView?.dispose();mapView=null;mapShown=false;chosen='';waitingUntil=0;requesting=false;repeated=false;direction={...original,trips};range=stationVehicleRange(direction,target.stopId);tracker=createVehicleTracker(direction,packageData.manifest,{prefix:direction.route+'-'+direction.monitorDirection+(++session)});
  strip=createHorizontalVehicleStrip({direction,range,onSelect:selectVehicle});holder.replaceChildren(strip.element);mapHolder.replaceChildren();select.value=id;schemaButton.disabled=false;mapButton.disabled=false;
  message.textContent='Frische Stationsmeldungen werden beim nächsten gemeinsamen Abruf geladen.';syncView();onIdsChanged();resume();
 }
 async function load(){
  const own=++generation;readiness.render({stage:'line'});message.textContent='Linienverlauf wird geladen …';
  try{const {index}=await dataSource.index();if(!active(own))return;const entry=index.lines.find(l=>l.route===target.route&&l.mode===target.mode);if(!entry)throw Error('Für diese Linie ist noch keine eindeutige Fahrzeugschätzung verfügbar.');const loaded=await dataSource.line(entry);if(!active(own))return;
   packageData=loaded;let candidates=loaded.data.directions.filter(d=>d.stops.some(s=>s.id===target.stopId)&&(!target.towards||d.trips.some(t=>vehicleTargetMatches(d,t.towards,target.towards))));if(!candidates.length)throw Error('Diese Station und Fahrtrichtung ist noch nicht eindeutig zugeordnet.');
   const sided=candidates.filter(d=>target.rbls?.includes(d.stops.find(s=>s.id===target.stopId)?.rbl));if(sided.length)candidates=sided;select.disabled=false;const filtered={...loaded.data,directions:candidates},preferred=preferredVehicleDirection(filtered,loaded.line,loaded.manifest,{stopId:target.stopId,towards:target.towards});select.innerHTML=candidates.map(d=>`<option value="${escape(d.id)}">→ ${escape(d.towards)} · ab ${escape(d.stops[0].name)} · ${d.stops.length} Halte</option>`).join('');choose(preferred.id);
  }catch(error){if(active(own)){range=null;readiness.render({stage:'line',error:error.message});message.textContent=error.message;onIdsChanged();}}
 }
 element.addEventListener('toggle',()=>{if(disposed)return;if(element.open){if(packageData&&direction){onIdsChanged();syncView();resume();}else void load();}else{generation++;cancelAnimationFrame(animation);mapShown=false;mapView?.hide();onIdsChanged();}});
 select.addEventListener('change',()=>choose(select.value));schemaButton.addEventListener('click',()=>setView('schema'));mapButton.addEventListener('click',()=>setView('map'));
 const visibility=()=>{if(document.hidden){generation++;cancelAnimationFrame(animation);mapShown=false;mapView?.hide();}else if(element.open){if(packageData&&direction){syncView();resume();}else void load();}};document.addEventListener('visibilitychange',visibility);
 return {element,ids,waiting(ms){requesting=false;waitingUntil=Date.now()+ms;draw();},requesting(at=Date.now()){lastAttempt=at;requesting=true;draw();},ingest(raw,submittedIds=ids()){if(!ids().length||!tracker)return;try{requesting=false;waitingUntil=Math.max(lastAttempt?lastAttempt+30000:0,recordMonitorSource(raw,submittedIds));const submitted=new Set(submittedIds.map(String)),scope=ids().filter(id=>submitted.has(id));repeated=tracker.ingest(normalizePilotSnapshot({...raw,foamaMonitorAt:raw.foamaMonitorAt||raw.message?.serverTime},direction,Date.now(),scope,ids()))?.ignored===true;message.textContent='Stand '+new Date(tracker.view().at).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna'});draw();}catch(error){this.fail(error.message);}},fail(reason){requesting=false;tracker?.fail(reason);message.textContent=reason;draw();},dispose(){disposed=true;generation++;cancelAnimationFrame(animation);mapView?.dispose();document.removeEventListener('visibilitychange',visibility);element.remove();}};
}
