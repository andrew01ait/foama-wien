import {monitorAllowedAt,claimMonitorAttempt,recordMonitorSource} from './monitor-timing.mjs?v=0.11.28';
import {CITY_PREFERENCE,cityPreference,stopCity,createCityController,recentDetectedCity,renderCityBrand,loadCityCatalogue} from './city-profiles.mjs?v=0.11.28';
import {regionalRequestStops,fetchRegionalBoards} from './regional-departures.mjs?v=0.11.28';
import {createTimetable,mergeTimetableDepartures} from './timetable.mjs?v=0.11.28';
import {journeyFamily,journeyPathKey,journeyBranch} from './journey-variants.mjs?v=0.11.28';
import {mergeSettings,parseWlMonitors,countdownMinutes,availableDeparts} from './core.mjs?v=0.11.28';
import {createThemeController} from './theme.mjs?v=0.11.28';
import {MODE_CHOICES,modeButtonMarkup,bindModeToggles} from './transport-controls.mjs?v=0.11.28';
import {createJourneyClient,createJourneyComparisonClient,viennaInput,viennaTime,upcomingBoardings,focusedJourneyBoardings,journeyWarningTargets,journeyMonitorIds} from './journey-client.mjs?v=0.11.28';
import {rankedJourneyIndices,compareJourneyOptions,reverseJourneyEndpoints} from './journey-options.mjs?v=0.11.28';
import {mountJourneyPlaces} from './journey-places-ui.mjs?v=0.11.28';
import {journeyLineDepartures,uniqueJourneyPlaces} from './journey-planning.mjs?v=0.11.28';
import {sanitizeJourneyFavorites,saveJourneyFavorite,savedJourney,transferableJourneys} from './journey-favorites.mjs?v=0.11.28';
import {createFavoriteMenuController} from './favorite-menu.mjs?v=0.11.28';
import {createJourneyMap} from './journey-map.mjs?v=0.11.28';
import {publishMapPosition} from './map-position.mjs?v=0.11.28';
import {coordinate} from './journey-geometry.mjs?v=0.11.28';
import {journeyStationMarkup,journeyTrafficNotices,journeyNoticeMarkup} from './journey-station.mjs?v=0.11.28';
import {updateTrafficCache,readTrafficCache,saveTrafficCache,mergeTrafficCaches,TRAFFIC_STORAGE_KEY} from './traffic-info.mjs?v=0.11.28';
import {createStationVehiclePanel} from './vehicle-strip.mjs?v=0.11.28';
import {selectStopIds} from './station-catalog.mjs?v=0.11.28';
import {retainDepartures} from './departure-cache.mjs?v=0.11.28';
import {vehicleAccessibilityMarkup,departureCorrectionMarkup} from './departure-indicators.mjs?v=0.11.28';
import {jsonExportName} from './export-file.mjs?v=0.11.28';
import {bindAppShare} from './app-share.mjs?v=0.11.28';

const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const settings=mergeSettings(get('foama.settings.v1',{})),client=createJourneyComparisonClient(),placeClient=createJourneyClient(),walkClient=createJourneyClient();
let placesUI=null;
const timetable=createTimetable();let plannedDepartures=[],scheduleRequest=null,regionalRequest=null,regionalCycle=0,regionalRetry=0;
function displayDepartures(){return mergeTimetableDepartures(state.departures,plannedDepartures,state.stops);}
async function loadPlanned(stops){scheduleRequest?.abort();const controller=new AbortController(),revision=state.monitorRevision;scheduleRequest=controller;try{const rows=await timetable.load(stops,{signal:controller.signal});if(document.hidden||controller.signal.aborted||revision!==state.monitorRevision)return;plannedDepartures=rows;renderCurrent();}catch{}finally{if(scheduleRequest===controller)scheduleRequest=null;}}
createThemeController({preference:settings.theme});
bindAppShare();
const state={stops:[],from:{kind:'current',name:'Dein Standort'},to:null,journeys:[],selected:null,plannedAt:null,departures:[],monitor:null,monitorTimer:null,renderTimer:null,error:'',lastAttempt:0,retryAt:0,revision:0,monitorRevision:0,busy:false,searchScroll:0,station:null,stationScroll:0,stationCycle:0,routeView:'list',overviewMode:'search',map:null,picker:null,pickerRevision:0,walk:null,focusedLeg:null,stationConnection:null,walkMaps:new Map(),renderedJourney:null,renderedWalk:null,renderedName:null,undoTimer:null,undoUntil:0,family:[],currentJourneyKey:null,variantIndex:0,familyFavoriteId:null};
const cityControl=createCityController({preference:cityPreference(get(CITY_PREFERENCE,'auto')),initialCity:recentDetectedCity(),onChange:profile=>{renderCityBrand(document,profile);void ensureJourneyCities([profile.id]);}});renderCityBrand(document,cityControl.current());
const journeyCityLoads=new Map();
state.trafficCache=readTrafficCache();state.openNotices=new Set();
async function ensureJourneyCities(cities){for(const city of [...new Set(cities)]){if(city==='wien'||state.stops.some(stop=>stop.city===city))continue;if(!journeyCityLoads.has(city))journeyCityLoads.set(city,loadCityCatalogue(city).catch(error=>{journeyCityLoads.delete(city);throw error;}));const rows=await journeyCityLoads.get(city),known=new Set(state.stops.map(stop=>stop.id));state.stops.push(...rows.filter(stop=>!known.has(stop.id)));}}
function journeyCities(journeys){return journeys.flatMap(journey=>[journey,...(journey.alternatives||[])]).flatMap(journey=>journey.legs||[]).flatMap(leg=>[leg.from,leg.to]).map(stopCity);}
const routeMenus=createFavoriteMenuController({root:$('journeyFavoriteList')});
state.preference=get('foama.journeyPreference.v1','fastest')==='transfers'?'transfers':'fastest';state.planContext=null;
state.favorites=sanitizeJourneyFavorites(get('foama.journeyFavorites.v1',[]));
const clock=value=>new Date(value).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'});
const date=value=>new Date(value).toLocaleDateString('de-AT',{timeZone:'Europe/Vienna',day:'2-digit',month:'2-digit'});
const minutes=value=>Math.max(0,Math.ceil(value/60));
const badge=leg=>`<span class="route-pill ${escape(leg.mode)}" data-route="${escape(leg.route)}">${escape(leg.route)}</span>`;
const rides=journey=>journey.legs.filter(leg=>leg.mode!=='walk');
const summary=journey=>`${journey.transfers?journey.transfers+' Umstieg'+(journey.transfers===1?'':'e'):'Direkt'} · ${minutes(journey.walkSeconds)} Min. zu Fuß`;
const top=(id='journeyTitle')=>requestAnimationFrame(()=>{window.scrollTo({top:0,behavior:'instant'});$(id)?.focus({preventScroll:true});});
if('scrollRestoration'in history)history.scrollRestoration='manual';
function status(message){$('journeyStatus').textContent=message;}
function busy(value){state.busy=value;$('journeySubmit').disabled=value;$('journeySubmit').textContent=value?'Verbindung wird gesucht …':'Verbindungen suchen →';}
function cancelSearch(){state.revision++;client.abort();placeClient.abort();walkClient.abort();if(state.busy){busy(false);status('Suche angehalten. Bei Bedarf erneut suchen.');}}
function invalidateResults(){state.journeys=[];state.planContext=null;$('journeyResults').replaceChildren();}
function setOverviewMode(mode){cancelSearch();state.overviewMode=mode;$('journeyForm').hidden=mode==='saved';$('journeyFavorites').hidden=mode!=='saved';$('journeyModeSearch').setAttribute('aria-pressed',String(mode==='search'));$('journeyModeSaved').setAttribute('aria-pressed',String(mode==='saved'));$('journeyResults').hidden=mode==='saved';status('');}
function pointControls(){
 for(const kind of ['from','to'])$(kind+'Address').disabled=!!state[kind];
 const current=state.from?.kind==='current';$('journeyGps').setAttribute('aria-pressed',String(current));$('journeyGpsHint').hidden=!current;
 $('journeyGpsHint').textContent=state.from?.fixedAt?'Standort als Start gesetzt. „Verbindungen suchen“ startet die Planung.':'GPS wird beim Tippen auf „Verbindungen suchen“ ermittelt.';
 placesUI?.renderChoices();
}
function selectPoint(kind,point){
 state[kind]={name:point.name,kind:point.kind==='current'?'current':'point',...(coordinate(point)||{}),...(point.fixedAt?{fixedAt:point.fixedAt}:{}),...(point.placeId?{placeId:point.placeId}:{})};
 const input=$('journey'+(kind==='from'?'From':'To'));input.value=point.name;input.dataset.chosen='true';$(kind+'Choices').replaceChildren();$('journeyGps').setAttribute('aria-pressed',String(state.from?.kind==='current'));pointControls();status('');
}
function localChoices(kind){
 cancelSearch();invalidateResults();state[kind]=null;const input=$('journey'+(kind==='from'?'From':'To'));delete input.dataset.chosen;pointControls();
 const query=input.value.trim().toLocaleLowerCase('de-AT'),rows=query.length<2?[]:state.stops.filter(stop=>stop.name.toLocaleLowerCase('de-AT').includes(query)).sort((a,b)=>Number(stopCity(b)===cityControl.current().id)-Number(stopCity(a)===cityControl.current().id)).slice(0,5);
 choices(kind,rows,'Haltestelle');
}
function choices(kind,rows,label,afterChoice=null){
 const box=$(kind+'Choices');box.replaceChildren();
 for(const row of rows){const button=document.createElement('button');button.type='button';button.append(document.createTextNode(row.name));const small=document.createElement('small');small.textContent=[row.kind==='address'?'Adresse':row.kind==='stop'?'Haltestelle':label,row.detail].filter(Boolean).join(' · ');button.append(small);button.addEventListener('click',()=>{selectPoint(kind,row);afterChoice?.();});box.append(button);}
 const input=$('journey'+(kind==='from'?'From':'To'));if(label==='Haltestelle'&&input.value.trim().length>=3){const button=document.createElement('button');button.type='button';button.className='journey-address-choice';button.textContent='Adresse oder Ort „'+input.value.trim()+'“ suchen';button.addEventListener('click',()=>void address(kind));box.append(button);}
}
async function lookupPlace(kind,{automatic=false,revision=state.revision}={}){
 const input=$('journey'+(kind==='from'?'From':'To')),text=input.value.trim();if(text.length<3)throw Error('Bitte eine Adresse, einen Ort oder eine Haltestelle eingeben.');
 const exact=state.stops.filter(stop=>stop.name.toLocaleLowerCase('de-AT')===text.toLocaleLowerCase('de-AT'));if(automatic&&exact.length===1){selectPoint(kind,exact[0]);return true;}
 status((kind==='from'?'Start':'Ziel')+' wird gesucht …');const {places}=await placeClient.places(text);if(document.hidden||revision!==state.revision)throw new DOMException('Suche beendet','AbortError');
 const unique=uniqueJourneyPlaces(places);
 if(automatic&&unique.length===1){selectPoint(kind,unique[0]);return true;}
 choices(kind,unique,'Ort',automatic?()=>{if(!document.hidden&&revision===state.revision)void search();}:null);status(unique.length?'Bitte '+(kind==='from'?'den Start':'das Ziel')+' aus den gefundenen Orten auswählen.':'Keine passende Adresse gefunden. Bitte Straße, Hausnummer und Stadt angeben.');
 input.scrollIntoView({block:'center',behavior:'smooth'});return false;
}
async function address(kind){cancelSearch();invalidateResults();const revision=state.revision;try{await lookupPlace(kind,{revision});}catch(error){if(revision===state.revision)status(error.name==='AbortError'?'Ortssuche angehalten.':error.message);}}
function getLocation(revision=state.revision){
 return new Promise((resolve,reject)=>{if(!navigator.geolocation){reject(Error('Standort nicht verfügbar. Bitte eine Adresse oder eine Station wählen.'));return;}
  navigator.geolocation.getCurrentPosition(fix=>{if(document.hidden||revision!==state.revision){reject(new DOMException('Standortsuche beendet','AbortError'));return;}if(Date.now()-fix.timestamp>90000||fix.coords.accuracy>150){reject(Error('Standort zu alt oder ungenau. Bitte eine Adresse wählen oder erneut versuchen.'));return;}publishMapPosition({lat:fix.coords.latitude,lon:fix.coords.longitude,accuracy:fix.coords.accuracy,timestamp:fix.timestamp});cityControl.observe({lat:fix.coords.latitude,lon:fix.coords.longitude,accuracy:fix.coords.accuracy,timestamp:fix.timestamp},{visible:!document.hidden});try{sessionStorage.setItem('foama.detectedCity.v1',JSON.stringify({city:cityControl.automatic().id,at:Date.now()}));}catch{}resolve({kind:'current',name:'Dein Standort',lat:fix.coords.latitude,lon:fix.coords.longitude,fixedAt:fix.timestamp});},()=>reject(Error('Standort nicht verfügbar. Du kannst direkt eine Adresse oder eine Station eingeben.')),{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
 });
}
async function useGps(){cancelSearch();invalidateResults();selectPoint('from',{kind:'current',name:'Dein Standort'});const revision=state.revision;status('Standort wird ermittelt …');try{selectPoint('from',await getLocation(revision));status(state.to?'Standort ist als Start gesetzt. Jetzt „Verbindungen suchen“ tippen.':'Standort ist als Start gesetzt. Ziel wählen und „Verbindungen suchen“ tippen.');$('journeySubmit').scrollIntoView({block:'nearest',behavior:'smooth'});}catch(error){if(revision===state.revision)status(error.name==='AbortError'?'Standortsuche angehalten.':error.message);}}

function renderFavorites(){
 routeMenus.close();
 $('journeyFavoriteCount').textContent=String(state.favorites.length);$('journeyFavoriteEmpty').hidden=!!state.favorites.length;
 $('journeyFavoriteList').innerHTML=state.favorites.map(f=>`<article class="journey-favorite"><button type="button" class="journey-favorite-open" data-route-favorite="${escape(f.id)}"><strong>${escape(f.name)}</strong><small class="journey-favorite-stations">${escape(journeyStations(f))}</small><small>${escape(f.from.name)} → ${escape(f.to.name)}${f.alternatives?.length?' · '+f.alternatives.length+' Alternativen':''}</small><span>${f.legs.filter(l=>l.mode!=='walk').map(boardingPreview).join('')}</span></button><details class="journey-favorite-menu favorite-menu" data-favorite-menu="${escape(f.id)}"><summary aria-label="${escape(f.name)} bearbeiten">⋯</summary><div><button type="button" data-route-reverse="${escape(f.id)}">Rückfahrt planen</button><button type="button" data-route-rename="${escape(f.id)}">Umbenennen</button><button type="button" data-route-remove="${escape(f.id)}">Entfernen</button></div></details></article>`).join('');
}
function refreshSavedJourneys(){const next=sanitizeJourneyFavorites(get('foama.journeyFavorites.v1',[]));if(JSON.stringify(next)!==JSON.stringify(state.favorites)){state.favorites=next;renderFavorites();if(state.selected&&!state.station)showSteps();}}
function persistFavorites(){try{localStorage.setItem('foama.journeyFavorites.v1',JSON.stringify(state.favorites));renderFavorites();return true;}catch{state.favorites=sanitizeJourneyFavorites(get('foama.journeyFavorites.v1',[]));renderFavorites();status('Die Route konnte auf diesem Gerät nicht gespeichert werden.');return false;}}
function showResults(){
 const order=rankedJourneyIndices(state.journeys,{preference:state.preference,arriveBy:state.planContext?.arriveBy});
 $('journeyResults').innerHTML=comparisonMarkup()+order.map(index=>{const journey=state.journeys[index];return `<button type="button" class="journey-result" data-journey="${index}"><span class="journey-result-head"><strong>${escape(clock(journey.startTime))} → ${escape(clock(journey.endTime))}</strong><span>${minutes(journey.durationSeconds)} Min.</span></span><span class="journey-result-lines">${rides(journey).map(boardingPreview).join('')||'Zu Fuß'}</span><span>${escape(summary(journey))}</span><small>${escape(date(journey.startTime))}${date(journey.endTime)!==date(journey.startTime)?' → '+escape(date(journey.endTime)):''} · ${rides(journey).some(leg=>leg.quality==='live')?'Mit Echtzeitangaben':'Fahrplan'} · Reise ansehen →</small></button>`;}).join('');
}
function stationName(place){return state.stops.find(stop=>stop.id===place?.stopId)?.name||place?.name||'';}
function journeyStations(journey){const legs=rides(journey);return legs.length?stationName(legs[0].from)+' → '+stationName(legs.at(-1).to):'Zu Fuß';}
function renderRouteOverview(){
 if(!state.selected)return;const from=state.from||state.openedFavorite?.from,to=state.to||state.openedFavorite?.to;
 for(const [key,point] of [['From',from],['To',to]]){
  const label=placesUI?.describeParts?.(point)||{name:point?.name||'',detail:''};
  $('journeyRoute'+key).textContent=label.name;
  const detail=$('journeyRoute'+key+'Detail');detail.textContent=label.detail;detail.hidden=!label.detail;
 }
 const favorite=state.favorites.find(f=>f.id===state.selected.favoriteId)||state.openedFavorite;
 const automatic=favorite&&favorite.from.name+' → '+favorite.to.name;
 $('journeyRouteTitle').textContent=favorite?.name&&favorite.name!==automatic&&favorite.name!==automatic.slice(0,160)?favorite.name:'Deine Reise';
 $('journeyRouteStations').textContent=journeyStations(state.selected);
}
function comparisonMarkup({detail=false}={}){
 if(!state.planContext||!state.journeys.length||(detail&&state.selected?.savedPath))return '';
 const comparison=compareJourneyOptions(state.journeys,state.planContext);if(!comparison)return '';
 const chosen=detail?state.selected:null,selectedKey=chosen&&journeyPathKey(chosen)+'|'+chosen.startTime+'|'+chosen.endTime;
 const cards=[['fastest','Schnellste Route',comparison.fastest],['transfers','Wenig Umstiege',comparison.fewest]].map(([choice,label,index])=>{
  const journey=state.journeys[index],pressed=detail?selectedKey===journeyPathKey(journey)+'|'+journey.startTime+'|'+journey.endTime:state.preference===choice;
  return `<button type="button" class="journey-comparison-choice" data-journey-choice="${choice}" aria-pressed="${pressed}"><strong>${label}</strong><span>${escape(clock(journey.startTime))} → ${escape(clock(journey.endTime))}</span><small>${minutes(journey.durationSeconds)} Min. · ${journey.transfers===0?'Direkt':journey.transfers+' Umstieg'+(journey.transfers===1?'':'e')}</small></button>`;
 }).join('');
 const difference=comparison.same?'Schnellste Route hat bereits die wenigsten Umstiege.':comparison.fewerTransfers===0?'Beide Optionen haben gleich viele Umstiege.':`${comparison.fewerTransfers} Umstieg${comparison.fewerTransfers===1?'':'e'} weniger · ${comparison.minutes?comparison.minutes+' Min. '+(comparison.arriveBy?'früher los':'später am Ziel'):'gleiche '+(comparison.arriveBy?'Abfahrtszeit':'Ankunftszeit')}`;
 return `<section class="journey-comparison" aria-label="Routen vergleichen"><div class="journey-comparison-choices">${cards}</div><p class="fineprint">${difference}${state.planContext.comparisonComplete?'':' Vergleich unvollständig; angezeigt werden die verfügbaren Verbindungen.'}</p></section>`;
}
function setJourneyPreference(value,{open=false}={}){
 if(!['fastest','transfers'].includes(value))return;state.preference=value;try{localStorage.setItem('foama.journeyPreference.v1',JSON.stringify(value));}catch{}
 for(const button of document.querySelectorAll('[data-journey-preference]'))button.setAttribute('aria-pressed',String(button.dataset.journeyPreference===value));
 if(!state.journeys.length)return;
 if(open||state.selected&&!state.selected.savedPath){const index=rankedJourneyIndices(state.journeys,{preference:value,arriveBy:state.planContext?.arriveBy})[0];if(index===undefined)return;const favoriteId=state.familyFavoriteId,view=state.routeView;showJourney(index);if(favoriteId){state.familyFavoriteId=favoriteId;state.selected.favoriteId=favoriteId;state.renderedJourney=null;showSteps();}if(view==='map')void setRouteView('map');}
 else showResults();
}
async function reverseRoute(favorite=null){
 try{
  const source=favorite||state.openedFavorite||{from:state.from,to:state.to},reverse=reverseJourneyEndpoints(source.from,source.to);
  showJourney(null);setOverviewMode('search');invalidateResults();state.family=[];state.familyFavoriteId=null;state.currentJourneyKey=null;state.openedFavorite=null;setTime('now');selectPoint('from',reverse.from);
  if(reverse.to)selectPoint('to',reverse.to);else{state.to=null;$('journeyTo').value='';delete $('journeyTo').dataset.chosen;pointControls();}
  top();if(reverse.requiresDestination){status('Für die Rückfahrt bitte das Ziel wählen. Dein früherer GPS-Standort wurde nicht gespeichert.');$('journeyTo').focus({preventScroll:true});return;}
  await search({openFirst:true});
 }catch(error){status(error.message);}
}
function boardingPreview(leg){return `<span class="journey-boarding"><strong class="journey-boarding-station">${escape(stationName(leg.from))}</strong><span class="journey-boarding-line">${badge(leg)}<span>→ ${escape(leg.towards||leg.to.name)}</span></span></span>`;}
function stopName(place){return place?.stopId&&state.stops.some(stop=>stop.id===place.stopId)?`<button class="journey-stop-link" type="button" data-journey-station="${escape(place.stopId)}">${escape(stationName(place))}</button>`:escape(place?.name);}
function focusLeg(index){
 const leg=state.selected?.legs[index];if(!leg)return;state.focusedLeg=index;
 if(leg.mode==='walk'){void toggleWalkMap(index);return;}
 if(!leg.from.stopId||!state.stops.some(stop=>stop.id===leg.from.stopId)){status('Für diesen Einstieg ist noch kein Abfahrtsmonitor zugeordnet.');return;}
 openStation(leg.from.stopId,{connection:{route:leg.route,mode:leg.mode,towards:leg.towards}});
}
function liveMarkup(leg,index){
 const target={stopId:leg.from.stopId,route:leg.route,mode:leg.mode,towards:leg.towards},active=focusedJourneyBoardings(state.selected,state.focusedLeg).some(t=>t.stopId===target.stopId&&t.route===target.route&&t.towards===target.towards);
 if(!leg.from.stopId||!state.stops.some(stop=>stop.id===leg.from.stopId))return '<p class="fineprint">Für diese Station ist noch kein Abfahrtsmonitor zugeordnet.</p>';
 if(!active)return `<button type="button" class="small-btn" data-journey-leg="${index}">Aktuelle Abfahrten dieser Verbindung</button>`;
 const departures=journeyLineDepartures(target,displayDepartures(),state.stops,{earliest:state.selected.savedPath?Date.now():Math.max(Date.now(),Date.parse(leg.startTime)),now:Date.now()});
 return `<div class="journey-live"><strong>Aktuelle Abfahrten dieser Richtung</strong><div class="journey-live-list">${departures.length?departures.map(d=>`<button type="button" class="journey-departure" data-journey-leg="${index}" aria-label="${escape(d.route)} Richtung ${escape(leg.towards)} in ${countdownMinutes(d.actual)} Minuten: Verbindungsdetails von ${escape(leg.from.name)} öffnen"><strong>${countdownMinutes(d.actual)}′</strong><span>${d.quality==='live'?'LIVE':'Fahrplan'}${vehicleAccessibilityMarkup(d)}<br><small>${escape(clock(d.actual))}</small>${departureCorrectionMarkup(d,{compact:true})}</span></button>`).join(''):escape(state.error||(state.monitor?'Wird geladen …':'Keine aktuelle Abfahrt für diese Richtung bestätigt.'))}</div><p class="fineprint">Gleiche Linie und Richtung; die geplante Fahrt oder der Anschluss sind damit nicht bestätigt.</p></div>`;
}
function variantsMarkup(legIndex){
 const choices=state.family.flatMap((journey,index)=>{if(journey===state.selected)return [];const branch=journeyBranch(state.selected,journey);return branch?.baseLegIndex===legIndex?[{journey,index,branch}]:[];});if(!choices.length)return '';
 const anchor=choices.find(choice=>choice.branch.anchor)?.branch.anchor,title=anchor?'Alternativen nach '+stationName(anchor):'Weitere Wege zum Ziel';
 return `<section class="journey-variants"><h4>${escape(title)}</h4>${choices.map(({journey,index,branch})=>`<button type="button" class="journey-variant" data-journey-variant="${index}"><span class="journey-result-lines">${journey.legs.slice(branch.candidateLegIndex).filter(leg=>leg.mode!=='walk').map(boardingPreview).join('')||'Zu Fuß weiter'}</span><small>${journey.savedPath?'Gespeicherte Alternative · aktuelle Linienzeiten beim Öffnen':escape(clock(journey.legs[branch.candidateLegIndex]?.startTime||journey.startTime))+' weiter · Ankunft '+escape(clock(journey.endTime))+' · Abfahrt am Start '+escape(clock(journey.startTime))}</small><span class="journey-variant-action">Diese Variante ansehen ›</span></button>`).join('')}</section>`;
}
function showVariant(index){
 const candidate=state.family[index];if(!candidate)return;const branch=journeyBranch(state.selected,candidate);showJourney(state.currentJourneyKey,{variantIndex:index});if(branch){state.focusedLeg=branch.candidateLegIndex;showSteps();resumeMonitor();const leg=$('journeySteps').querySelector('[data-journey-leg="'+branch.candidateLegIndex+'"]');leg?.scrollIntoView({block:'start',behavior:'smooth'});}
}
function showSteps(){
 const journey=state.selected;if(!journey||state.station)return;const cached=journey.savedPath,name=state.favorites.find(f=>f.id===journey.favoriteId)?.name||state.openedFavorite?.name||'Gespeicherte Route',saved=state.favorites.some(f=>f.id===journey.favoriteId);
 const noticeHost=$('journeyNotices'),noticeMarkup=journeyNoticeMarkup(journeyTrafficNotices(journey,state.stops,state.trafficCache),{escape,badge,key:'journey:'+journeyPathKey(journey),isOpen:key=>state.openNotices.has(key),hasError:!!state.error});
 if(noticeHost.noticeMarkup!==noticeMarkup){noticeHost.innerHTML=noticeMarkup;noticeHost.noticeMarkup=noticeMarkup;}
 $('journeySave').textContent=saved?'★':'☆';$('journeySave').setAttribute('aria-pressed',String(saved));$('journeySave').setAttribute('aria-label',saved?'Route aus Favoriten entfernen':'Route speichern');
 const currentStart=state.from?.kind==='current'||!state.from,walkAction=currentStart?'Standort & Gehweg aktualisieren':'Gehweg zum Einstieg aktualisieren';
 $('journeyWalkRefresh').hidden=!cached;$('journeyWalkRefreshLabel').textContent=currentStart?'Standort':'Fußweg';$('journeyWalkRefresh').setAttribute('aria-label',walkAction);$('journeyWalkRefresh').setAttribute('title',walkAction);
 if(state.renderedJourney===journey&&state.renderedWalk===state.walk&&state.renderedName===name){for(const slot of $('journeySteps').querySelectorAll('[data-live-leg]'))slot.innerHTML=liveMarkup(journey.legs[Number(slot.dataset.liveLeg)],Number(slot.dataset.liveLeg));return;}
 renderRouteOverview();$('journeyDetailComparison').innerHTML=comparisonMarkup({detail:true});
 clearWalkMaps();state.renderedJourney=journey;state.renderedWalk=state.walk;state.renderedName=name;
 const legs=journey.legs.map((original,index)=>{
  const leg={...original,from:{...original.from,name:index===0?(state.from?.name||original.from.name):original.from.name},to:{...original.to,name:index===journey.legs.length-1?(state.to?.name||original.to.name):original.to.name},...(cached&&index===0&&original.mode==='walk'&&state.walk?state.walk:{})};
  const wait=!cached&&index?Math.round((Date.parse(leg.startTime)-Date.parse(journey.legs[index-1].endTime))/60000):0;
  const isWalk=leg.mode==='walk',legTime=value=>cached?'':`<time>${escape(clock(value))}</time>`;
  const fromPlatform=leg.from.platform?`<span class="journey-platform">Bahnsteig ${escape(leg.from.platform)}</span>`:'',toPlatform=leg.to.platform?`<span class="journey-platform">Bahnsteig ${escape(leg.to.platform)}</span>`:'';
  const startMeta=legTime(leg.startTime)+fromPlatform;
  const heading=isWalk?`<h3><button type="button" class="journey-walk-toggle" data-walk-toggle="${index}" aria-expanded="false" aria-controls="journeyWalkPanel-${index}"><span>↗ ${minutes(leg.durationSeconds)} Min. zu Fuß</span><span aria-hidden="true">⌄</span></button></h3>`:`<div class="journey-leg-head"><h3 class="journey-leg-station">${stopName(leg.from)}</h3>${startMeta?`<span class="journey-leg-meta">${startMeta}</span>`:''}</div><button type="button" class="journey-connection-heading" data-journey-leg="${index}">${badge(leg)}<strong>→ ${escape(leg.towards||leg.to.name)}</strong><span aria-hidden="true">›</span></button>`;
  const vehicleAction=!isWalk&&['metro','tram','bus'].includes(leg.mode)&&state.stops.some(s=>s.id===leg.from.stopId&&s.provider==='wl')?`<button type="button" class="small-btn journey-vehicle-action" data-vehicle-leg="${index}">Fahrzeuge im Anflug →</button>`:'';
  const sameStation=!!leg.from.stopId&&leg.from.stopId===leg.to.stopId;
  const endMeta=legTime(leg.endTime)+toPlatform;
  const walkPoints=sameStation?`${stopName(leg.from)}${!cached||fromPlatform||toPlatform?`<span class="journey-platform-path">${startMeta||'<span>Start</span>'}<span aria-hidden="true">→</span>${endMeta||'<span>Ziel</span>'}</span>`:''}`:`<span class="journey-leg-point">${legTime(leg.startTime)}${stopName(leg.from)}${fromPlatform?`<span aria-hidden="true">·</span>${fromPlatform}`:''}</span><span class="journey-point-arrow" aria-hidden="true">→</span><span class="journey-leg-point">${legTime(leg.endTime)}${stopName(leg.to)}${toPlatform?`<span aria-hidden="true">·</span>${toPlatform}`:''}</span>`;
  const endpoints=isWalk?`<div class="journey-walk-points">${walkPoints}</div>`:`<p class="journey-arrival">${legTime(leg.endTime)}<span>Aussteigen:</span>${stopName(leg.to)}${toPlatform?`<span aria-hidden="true">·</span>${toPlatform}`:''}</p>`;
  return `${wait>0?`<p class="journey-wait">${wait} Min. Wartezeit laut Planung</p>`:''}<article class="journey-leg ${isWalk?'walk':''}">${heading}${endpoints}${isWalk?`<div id="journeyWalkPanel-${index}" class="journey-walk-panel" hidden><div id="journeyWalkMap-${index}" class="journey-walk-map" aria-label="Karte dieses Fußwegs"></div><p id="journeyWalkMapStatus-${index}" class="fineprint" role="status"></p></div>`:''}<p class="fineprint">${isWalk?(leg.distanceMeters!=null?Math.round(leg.distanceMeters)+' m · ':'')+(cached?(index===0&&state.walk?'Weg gerade berechnet · Gehzeit geschätzt · Bahnsteigweg zusätzlich':'Gespeicherter Fußweg · Schätzung'):'Berechneter Fußweg'):cached?'Gespeicherter Linienweg · aktuelle Fahrzeit offen':(leg.quality==='live'?'Echtzeit · Transitous':'Fahrplan · Transitous')+(leg.staySeated?' · Im Fahrzeug bleiben':'')}</p>${!isWalk?`<div class="journey-live-slot" data-live-leg="${index}">${liveMarkup(leg,index)}</div>`:''}${vehicleAction}${variantsMarkup(index)}</article>`;
 }).join('');
 $('journeySteps').innerHTML=cached?`<section class="journey-summary journey-saved-summary" aria-label="Gespeicherter Weg"><p><strong>Gespeicherter Weg · ${escape(date(journey.savedAt))}</strong><span>Fahrzeit und Linienweg mit „Neu planen“ prüfen. Abfahrten je Abschnitt.</span></p></section>${legs}`:`<section class="journey-summary"><h2>${escape(clock(journey.startTime))} → ${escape(clock(journey.endTime))}</h2><strong>${minutes(journey.durationSeconds)} Min. · ${escape(date(journey.startTime))}</strong><p>${escape(summary(journey))}</p><p>Berechnet ${escape(clock(state.plannedAt))}. Zeiten und Anschlüsse können sich ändern.</p></section>${legs}`;
}
function renderCurrent(){if(state.station){$('journeyStationDepartures').innerHTML=journeyStationMarkup(state.station,displayDepartures(),{escape,badge,error:state.station.provider==='transitous'?state.regionalError:state.error,connection:state.stationConnection,trafficCache:state.trafficCache,isNoticeOpen:key=>state.openNotices.has(key)});}else showSteps();}
async function loadRegional(stops){
 const selected=regionalRequestStops(stops,{cycle:regionalCycle});if(!selected.length||document.hidden||regionalRequest)return;
 let last=0;try{last=Number(localStorage.getItem('foama.regional.lastApiAttempt.v1')||0);}catch{}
 if(Date.now()<Math.max(last+30000,regionalRetry))return;
 const controller=new AbortController(),revision=state.monitorRevision;let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},14000);regionalRequest=controller;
 try{localStorage.setItem('foama.regional.lastApiAttempt.v1',String(Date.now()));}catch{}
 try{const result=await fetchRegionalBoards(selected,{signal:controller.signal});if(controller.signal.aborted||document.hidden||revision!==state.monitorRevision)return;state.departures=retainDepartures(state.departures,result.departures,result.stations);state.regionalError=result.partial?'Einige Abfahrten sind noch nicht verfügbar.':'';regionalCycle++;regionalRetry=0;renderCurrent();}
 catch(error){if((timedOut||!controller.signal.aborted)&&!document.hidden&&revision===state.monitorRevision){state.regionalError=timedOut?'Regionale Abfahrtsabfrage dauert zu lange.':error.message;regionalRetry=Date.now()+60000;renderCurrent();}}
 finally{clearTimeout(timer);if(regionalRequest===controller)regionalRequest=null;}
}
function pauseMonitor(){state.monitorRevision++;scheduleRequest?.abort();regionalRequest?.abort();clearTimeout(state.monitorTimer);clearInterval(state.renderTimer);state.monitorTimer=state.renderTimer=null;state.monitor?.abort();state.monitor=null;}
async function monitor(){
 if(document.hidden||(!state.selected&&!state.station)||state.monitor)return;
 const scheduleStops=state.station?[state.station]:focusedJourneyBoardings(state.selected,state.focusedLeg).map(target=>state.stops.find(stop=>stop.id===target.stopId)).filter(Boolean);void loadPlanned(scheduleStops);void loadRegional(scheduleStops);
 const primary=state.station?(state.stationConnection?journeyMonitorIds([{stopId:state.station.id,...state.stationConnection}],state.stops,state.departures):selectStopIds([state.station],null,24,state.stationCycle)):journeyMonitorIds(focusedJourneyBoardings(state.selected,state.focusedLeg),state.stops,state.departures);const warningIds=state.station?[]:journeyMonitorIds(journeyWarningTargets(state.selected),state.stops,state.departures);const ids=[...new Set([...primary,...(state.vehicleStrip?.ids()||[]),...warningIds])].slice(0,24);if(!ids.length){state.monitorTimer=setTimeout(monitor,30000);return;}
 const now=Date.now(),allowed=monitorAllowedAt(ids,{lastAttempt:state.lastAttempt,retryAt:Math.max(state.retryAt,state.vehicleStrip?.notBefore?.()||0)});
 if(now<allowed){state.vehicleStrip?.waiting?.(allowed-now);clearTimeout(state.monitorTimer);state.monitorTimer=setTimeout(monitor,allowed-now+100);return;}
 const controller=new AbortController(),revision=state.monitorRevision,timer=setTimeout(()=>controller.abort(),12000);state.monitor=controller;
 try{
  const claim=await claimMonitorAttempt(ids,{lastAttempt:state.lastAttempt,retryAt:Math.max(state.retryAt,state.vehicleStrip?.notBefore?.()||0)});if(controller.signal.aborted||revision!==state.monitorRevision||document.hidden)return;if(claim.wait){clearTimeout(timer);state.monitor=null;state.vehicleStrip?.waiting?.(claim.wait);state.monitorTimer=setTimeout(monitor,claim.wait+100);return;}state.lastAttempt=claim.at;state.vehicleStrip?.requesting?.(claim.at);
  const params=new URLSearchParams();ids.forEach(id=>params.append('stopId',id));const response=await fetch('./api/monitor?'+params,{signal:controller.signal,cache:'no-store',credentials:'omit'});
  if(!response.ok){state.retryAt=Date.now()+Math.max(30,Math.min(300,Number(response.headers.get('retry-after'))||60))*1000;throw Error('Abfahrten vorübergehend nicht verfügbar.');}
  const raw=await response.json();if(controller.signal.aborted||revision!==state.monitorRevision||document.hidden)return;
  const departures=parseWlMonitors(raw,new Date().toISOString()),trafficCache=saveTrafficCache(updateTrafficCache(mergeTrafficCaches(state.trafficCache,readTrafficCache()),raw,ids,Date.now()));
  recordMonitorSource(raw,ids);state.vehicleStrip?.ingest(raw,ids);state.departures=retainDepartures(state.departures,departures,ids);state.trafficCache=trafficCache;state.error='';state.retryAt=0;state.stationCycle++;
 }catch(error){if(revision===state.monitorRevision&&!document.hidden){state.retryAt=Math.max(state.retryAt,Date.now()+60000);state.error='Aktuelle Abfahrten vorübergehend nicht verfügbar.';state.vehicleStrip?.fail(state.error);}}
 finally{clearTimeout(timer);if(state.monitor===controller)state.monitor=null;}
 if(revision!==state.monitorRevision||document.hidden)return;renderCurrent();const remaining=monitorAllowedAt(ids,{lastAttempt:state.lastAttempt,retryAt:Math.max(state.retryAt,state.vehicleStrip?.notBefore?.()||0)})-Date.now();state.vehicleStrip?.waiting?.(Math.max(0,remaining));state.monitorTimer=setTimeout(monitor,Math.max(100,remaining+100));
}
function resumeMonitor(){pauseMonitor();if(document.hidden||(!state.selected&&!state.station))return;state.trafficCache=mergeTrafficCaches(state.trafficCache,readTrafficCache());renderCurrent();void monitor();state.renderTimer=setInterval(renderCurrent,10000);}
function showJourney(index,{historyChange=true,variantIndex=0}={}){
 state.vehicleStrip?.dispose();state.vehicleStrip=null;
 const keepBundle=state.currentJourneyKey===index?state.familyFavoriteId:null;
 pauseMonitor();cancelSearch();closePicker();clearWalkMaps();state.renderedJourney=null;state.focusedLeg=null;state.station=null;state.stationConnection=null;state.walk=null;$('journeyStation').hidden=true;$('journeyWalkRefresh').disabled=false;$('journeyWalkStatus').textContent='';
 const favorite=typeof index==='string'?state.favorites.find(f=>f.id===index):null,base=favorite?savedJourney(favorite):Number.isInteger(index)?state.journeys[index]:null;state.openedFavorite=favorite;
 state.family=base?(favorite?[base,...(favorite.alternatives||[]).map(option=>savedJourney({...favorite,legs:option.legs,alternatives:[]}))]:journeyFamily(state.journeys,base)):[];state.currentJourneyKey=index;state.variantIndex=state.family[variantIndex]?variantIndex:0;state.familyFavoriteId=favorite?.id||keepBundle||null;const journey=state.family[state.variantIndex];if(journey&&state.familyFavoriteId)journey.favoriteId=state.familyFavoriteId;
 if(favorite){invalidateResults();setTime('now');for(const kind of ['from','to'])selectPoint(kind,favorite[kind]);}
 if(journey){$('journeyIntro').hidden=true;state.searchScroll=window.scrollY;state.selected=journey;$('journeySearch').hidden=true;$('journeyResults').hidden=true;$('journeyDetail').hidden=false;status('');showSteps();if(historyChange)history.pushState(favorite?{foamaJourneyFavorite:favorite.id,foamaJourneyVariant:state.variantIndex}:{foamaJourney:index,foamaJourneyVariant:state.variantIndex},'','#reise');setRouteView('list');top('journeyDetail');resumeMonitor();}
 else{$('journeyIntro').hidden=false;state.selected=null;state.map?.destroy();state.map=null;$('journeySearch').hidden=false;$('journeyDetail').hidden=true;setOverviewMode(state.overviewMode);if(historyChange)history.replaceState(null,'',location.pathname);requestAnimationFrame(()=>window.scrollTo({top:state.searchScroll,behavior:'instant'}));}
}
function openStation(id,{historyChange=true,connection=null}={}){
 state.vehicleStrip?.dispose();state.vehicleStrip=null;
 const stop=state.stops.find(s=>s.id===id);if(!stop)return;pauseMonitor();cancelSearch();clearWalkMaps();if(!state.station)state.stationScroll=window.scrollY;$('journeyIntro').hidden=true;state.station=stop;state.stationConnection=connection;state.error='';$('journeyStationAll').hidden=!connection;$('journeySearch').hidden=true;$('journeyResults').hidden=true;$('journeyDetail').hidden=true;$('journeyStation').hidden=false;
 if(connection&&stop.provider==='wl'&&['metro','tram','bus'].includes(connection.mode)){const panel=createStationVehiclePanel({target:{stopId:id,...connection},onIdsChanged(){if(state.vehicleStrip===panel)resumeMonitor();}});state.vehicleStrip=panel;$('journeyStationVehicles').append(panel.element);}
 if(historyChange)history.pushState({...history.state,foamaJourneyStation:id,foamaJourneyConnection:connection},'','#station');renderCurrent();top('journeyStationTitle');resumeMonitor();
}
function closeStation(){state.vehicleStrip?.dispose();state.vehicleStrip=null;pauseMonitor();state.station=null;state.stationConnection=null;$('journeyStation').hidden=true;if(state.selected){$('journeyDetail').hidden=false;showSteps();state.map?.invalidate();resumeMonitor();requestAnimationFrame(()=>window.scrollTo({top:state.stationScroll,behavior:'instant'}));}else showJourney(null,{historyChange:false});}
async function setRouteView(view){
 state.routeView=view;$('journeyShowList').setAttribute('aria-pressed',String(view==='list'));$('journeyShowMap').setAttribute('aria-pressed',String(view==='map'));$('journeyRouteMapPanel').hidden=view!=='map';$('journeySteps').hidden=view!=='list';$('journeyWalkTools').hidden=view!=='list';
 if(view!=='map'||!state.selected)return;const selected=state.selected;$('journeyMapStatus').textContent='Karte wird geladen …';
 try{if(!state.map){if(state.mapLoading)return;state.mapLoading=true;try{const map=await createJourneyMap({holder:$('journeyRouteMap'),stops:state.stops,onStation:stop=>openStation(stop.id),isCurrent:()=>state.selected===selected&&state.routeView==='map'&&!state.station});if(state.selected!==selected||state.routeView!=='map'||state.station){map.destroy();return;}state.map=map;}finally{state.mapLoading=false;}}if(state.selected!==selected||state.routeView!=='map')return;const result=state.map.draw(selected,{fit:true});$('journeyMapStatus').textContent=result.hasGeometry?(result.schematic?'Gestrichelte Abschnitte sind schematisch zwischen bekannten Punkten dargestellt.':'Fahrtverlauf laut Transitous. Gespeicherte Wege können sich inzwischen geändert haben.'):'Für diese gespeicherte Route fehlt ein Kartenverlauf. „Neu planen“ lädt die aktuelle Fahrtkarte.';}catch(error){if(state.routeView==='map')$('journeyMapStatus').textContent=error.message;}
}
function clearWalkMaps(){
 for(const value of state.walkMaps.values())value.map?.destroy();state.walkMaps.clear();
 for(const button of $('journeySteps').querySelectorAll('[data-walk-toggle]')){button.setAttribute('aria-expanded','false');const panel=$('journeyWalkPanel-'+button.dataset.walkToggle);if(panel)panel.hidden=true;}
}
async function toggleWalkMap(index){
 const journey=state.selected,leg=journey?.legs[index],button=$('journeySteps').querySelector('[data-walk-toggle="'+index+'"]'),panel=$('journeyWalkPanel-'+index);
 if(!leg||leg.mode!=='walk'||!button||!panel)return;const opening=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(opening));panel.hidden=!opening;
 if(!opening){state.walkMaps.get(index)?.map?.destroy();state.walkMaps.delete(index);return;}
 const current={map:null};state.walkMaps.set(index,current);const box=$('journeyWalkMapStatus-'+index);box.textContent='Fußwegkarte wird geladen …';
 try{const map=await createJourneyMap({holder:$('journeyWalkMap-'+index),stops:state.stops,onStation:stop=>openStation(stop.id),isCurrent:()=>state.selected===journey&&state.walkMaps.get(index)===current&&button.getAttribute('aria-expanded')==='true'&&!document.hidden});
 if(state.walkMaps.get(index)!==current){map.destroy();return;}current.map=map;const result=map.draw({legs:[leg]},{fit:true});box.textContent=result.hasGeometry?(result.schematic?'Schematische Verbindung der bekannten Punkte. „Neu planen“ lädt den aktuellen Fußwegverlauf.':'Dieser Fußweg laut Planung. Gestrichelt dargestellt.'): 'Für diesen gespeicherten Fußweg fehlt der Kartenverlauf. Bitte „Neu planen“ wählen.';
 }catch(error){if(state.walkMaps.get(index)===current)box.textContent=error.message;}
}
function closePicker(){state.pickerRevision++;state.picker?.destroy();state.picker=null;if($('journeyMapPicker').open)$('journeyMapPicker').close();}
async function pickOnMap(kind){
 cancelSearch();closePicker();const revision=state.pickerRevision;$('journeyMapPickerTitle').textContent=(kind==='from'?'Start':'Ziel')+' auf Karte wählen';$('journeyPickerStatus').textContent='Karte wird geladen …';$('journeyMapPicker').showModal();
 const choose=point=>{selectPoint(kind,point);invalidateResults();closePicker();};
 try{const map=await createJourneyMap({holder:$('journeyPickerMap'),stops:state.stops,getModes:()=>settings.modes,picker:kind,center:coordinate(state[kind])||coordinate(state.from)||cityControl.current().center,onStation:choose,onPoint:choose,isCurrent:()=>revision===state.pickerRevision});if(revision!==state.pickerRevision){map.destroy();return;}state.picker=map;$('journeyPickerStatus').textContent='Station wählen oder Kartenausschnitt verschieben.';}catch(error){if(revision===state.pickerRevision)$('journeyPickerStatus').textContent=error.message;}
}
async function search({openFirst=false}={}){
 cancelSearch();const revision=state.revision;busy(true);status('Start und Ziel werden geprüft …');
 try{
  // Resolve typed addresses before requesting GPS, so a typo never causes an
  // unnecessary permission prompt. Never silently pick an ambiguous place.
  for(const kind of ['from','to'])if(!state[kind]&&!(await lookupPlace(kind,{automatic:true,revision})))return;
  for(const kind of ['from','to'])if(state[kind]?.kind==='current'&&(!coordinate(state[kind])||Date.now()-(state[kind].fixedAt||0)>90000)){status('Standort wird ermittelt …');selectPoint(kind,await getLocation(revision));}
  if(document.hidden||revision!==state.revision)return;
  if(!coordinate(state.from)||!coordinate(state.to))throw Error('Bitte Start und Ziel auswählen.');
  if(state.from.lat===state.to.lat&&state.from.lon===state.to.lon)throw Error('Start und Ziel sind gleich. Bitte ein anderes Ziel wählen.');
  const point=p=>({lat:p.lat,lon:p.lon}),when=$('journeyWhen').value,request={from:point(state.from),to:point(state.to),time:when==='now'?new Date(Math.floor(Date.now()/60000)*60000).toISOString():viennaTime($('journeyTime').value),arriveBy:when==='arrive',modes:settings.modes,speed:settings.speed,buffer:settings.buffer};
  status('Schnelle Wege und Wege mit wenig Umstiegen werden verglichen …');invalidateResults();const result=await client.plan(request);if(document.hidden||revision!==state.revision)return;
  await ensureJourneyCities(journeyCities(result.journeys));if(document.hidden||revision!==state.revision)return;
  state.journeys=result.journeys;state.plannedAt=result.plannedAt;state.planContext={arriveBy:request.arriveBy,comparisonComplete:result.comparisonComplete};showResults();status(result.journeys.length?'':'Keine passende Verbindung gefunden. Bitte Zeit oder Verkehrsmittel ändern.');
  if(state.journeys.length){if(openFirst)setJourneyPreference(state.preference,{open:true});else $('journeyResults').scrollIntoView({block:'start',behavior:'smooth'});}
 }catch(error){if(revision===state.revision)status(error.name==='AbortError'?'Suche angehalten oder zu langsam. Bitte erneut versuchen.':error.message);}
 finally{if(revision===state.revision)busy(false);}
}
function setTime(value){$('journeyWhen').value=value;for(const button of document.querySelectorAll('[data-journey-when]'))button.setAttribute('aria-pressed',String(button.dataset.journeyWhen===value));const later=value!=='now';$('journeyTime').hidden=$('journeyTimeLabel').hidden=!later;}
function saveRoute(){
 const journey=state.selected;if(!journey)return;const existing=state.favorites.find(f=>f.id===journey.favoriteId);
 if(existing){removeFavorite(existing.id);showSteps();return;}
 try{const saved=saveJourneyFavorite(state.favorites,{from:state.from??state.openedFavorite?.from,to:state.to??state.openedFavorite?.to,journey,alternatives:state.family});state.favorites=saved.favorites;if(persistFavorites()){journey.favoriteId=saved.favorite.id;state.familyFavoriteId=saved.favorite.id;showSteps();status('Route unter „Meine Routen“ gespeichert.');}}catch(error){status(error.message);}
}
function expireUndo(){clearTimeout(state.undoTimer);state.undoTimer=null;state.deletedFavorite=null;state.undoUntil=0;$('journeyUndo').hidden=true;}
function removeFavorite(id){const index=state.favorites.findIndex(f=>f.id===id);if(index<0)return;const deleted={favorite:state.favorites[index],index};state.favorites=state.favorites.filter(f=>f.id!==id);if(persistFavorites()){clearTimeout(state.undoTimer);state.deletedFavorite=deleted;state.undoUntil=Date.now()+60000;$('journeyUndo').hidden=false;state.undoTimer=setTimeout(expireUndo,60000);}}
function undoRemoval(){const deleted=state.deletedFavorite;if(!deleted)return;if(Date.now()>=state.undoUntil){expireUndo();return;}if(state.favorites.some(f=>f.id===deleted.favorite.id)){expireUndo();return;}if(state.favorites.length>=30){status('Bitte zuerst Platz für die Route schaffen.');return;}state.favorites.splice(Math.min(deleted.index,state.favorites.length),0,deleted.favorite);if(persistFavorites())expireUndo();}

$('journeyForm').addEventListener('submit',event=>{event.preventDefault();void search();});
for(const kind of ['from','to']){const input=$('journey'+(kind==='from'?'From':'To'));input.addEventListener('input',()=>localChoices(kind));input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();if(state[kind])void search();else void address(kind);}});$(kind+'Address').addEventListener('click',()=>void address(kind));$(kind+'Map').addEventListener('click',()=>void pickOnMap(kind));}
$('journeyGps').addEventListener('click',()=>void useGps());
$('journeySwap').addEventListener('click',()=>{cancelSearch();invalidateResults();const {from,to}=state;if(from&&to){selectPoint('from',to);selectPoint('to',from);}else status('Bitte zuerst Start und Ziel auswählen.');});
$('journeyTime').value=viennaInput();$('journeyTime').addEventListener('change',()=>{cancelSearch();invalidateResults();});
document.querySelectorAll('[data-journey-when]').forEach(button=>button.addEventListener('click',()=>{cancelSearch();invalidateResults();setTime(button.dataset.journeyWhen);}));
$('journeyModes').innerHTML=MODE_CHOICES.map(([id])=>modeButtonMarkup(id,settings.modes[id]!==false)).join('');
bindModeToggles($('journeyModes'),mode=>{cancelSearch();invalidateResults();settings.modes[mode]=!settings.modes[mode];$('journeyModes').innerHTML=MODE_CHOICES.map(([id])=>modeButtonMarkup(id,settings.modes[id]!==false)).join('');});
$('journeyWalk').textContent=settings.speed.toFixed(1).replace('.',',')+' km/h · '+settings.buffer+' Min. Umstiegsreserve';
$('journeyModeSearch').addEventListener('click',()=>setOverviewMode('search'));$('journeyModeSaved').addEventListener('click',()=>setOverviewMode('saved'));
$('journeyResults').addEventListener('click',event=>{const choice=event.target.closest('[data-journey-choice]'),button=event.target.closest('[data-journey]');if(choice)setJourneyPreference(choice.dataset.journeyChoice,{open:true});else if(button)showJourney(Number(button.dataset.journey));});
document.querySelectorAll('[data-journey-preference]').forEach(button=>button.addEventListener('click',()=>setJourneyPreference(button.dataset.journeyPreference)));
$('journeyDetailComparison').addEventListener('click',event=>{const choice=event.target.closest('[data-journey-choice]');if(choice)setJourneyPreference(choice.dataset.journeyChoice,{open:true});});
const persistNotice=event=>{const key=event.target.dataset?.persistKey;if(key)event.target.open?state.openNotices.add(key):state.openNotices.delete(key);};
$('journeyNotices').addEventListener('toggle',persistNotice,true);$('journeyStationContent').addEventListener('toggle',persistNotice,true);
$('journeyReverse').addEventListener('click',()=>void reverseRoute());
$('journeyAlternatives').addEventListener('click',()=>history.back());$('journeyReplan').addEventListener('click',()=>{showJourney(null);setOverviewMode('search');top();void search();});$('journeySave').addEventListener('click',saveRoute);
$('journeyShowList').addEventListener('click',()=>void setRouteView('list'));$('journeyShowMap').addEventListener('click',()=>void setRouteView('map'));
$('journeySteps').addEventListener('click',event=>{const vehicles=event.target.closest('[data-vehicle-leg]'),variant=event.target.closest('[data-journey-variant]'),walk=event.target.closest('[data-walk-toggle]'),leg=event.target.closest('[data-journey-leg]'),target=event.target.closest('[data-journey-station]');if(vehicles){focusLeg(Number(vehicles.dataset.vehicleLeg));if(state.vehicleStrip)state.vehicleStrip.element.open=true;}else if(variant)showVariant(Number(variant.dataset.journeyVariant));else if(walk)void toggleWalkMap(Number(walk.dataset.walkToggle));else if(leg)focusLeg(Number(leg.dataset.journeyLeg));else if(target)openStation(target.dataset.journeyStation);});
$('journeyStationBack').addEventListener('click',()=>history.back());$('journeyStationRefresh').addEventListener('click',()=>void monitor());$('journeyStationAll').addEventListener('click',()=>{const id=state.station?.id;if(!id)return;history.replaceState({...history.state,foamaJourneyConnection:null},'','#station');openStation(id,{historyChange:false});});
$('journeyMapPickerClose').addEventListener('click',closePicker);$('journeyMapPicker').addEventListener('cancel',event=>{event.preventDefault();closePicker();});
$('journeyPickerLocate').addEventListener('click',async()=>{const revision=state.revision,picker=state.picker;$('journeyPickerStatus').textContent='Standort wird ermittelt …';try{const fix=await getLocation(revision);if(picker&&picker===state.picker){picker.recenter(fix);$('journeyPickerStatus').textContent='Dein Standort. Wähle eine Station oder einen Kartenpunkt.';}}catch(error){$('journeyPickerStatus').textContent=error.message;}});
$('journeyFavoriteList').addEventListener('click',event=>{
 const rename=event.target.closest('[data-route-rename]'),remove=event.target.closest('[data-route-remove]'),reverse=event.target.closest('[data-route-reverse]'),open=event.target.closest('[data-route-favorite]');
 if(remove){routeMenus.close();removeFavorite(remove.dataset.routeRemove);}else if(reverse){routeMenus.close();void reverseRoute(state.favorites.find(f=>f.id===reverse.dataset.routeReverse));}else if(rename){routeMenus.close();state.renameId=rename.dataset.routeRename;const favorite=state.favorites.find(f=>f.id===state.renameId);if(!favorite)return;$('journeyRenameInput').value=favorite.name;$('journeyRenameDialog').showModal();}else if(open)showJourney(open.dataset.routeFavorite);
});
$('journeyRenameClose').addEventListener('click',()=>$('journeyRenameDialog').close());$('journeyRenameForm').addEventListener('submit',event=>{event.preventDefault();const name=$('journeyRenameInput').value.trim();if(!name)return;state.favorites=state.favorites.map(f=>f.id===state.renameId?{...f,name}:f);if(persistFavorites())$('journeyRenameDialog').close();});
$('journeyUndoAction').addEventListener('click',undoRemoval);
$('journeyWalkRefresh').addEventListener('click',async()=>{
 const selected=state.selected;if(!selected?.savedPath)return;cancelSearch();const revision=state.revision,box=$('journeyWalkStatus');$('journeyWalkRefresh').disabled=true;box.textContent='Gehweg wird ermittelt …';
 try{const first=selected.legs.find(leg=>leg.mode!=='walk'),stop=state.stops.find(stop=>stop.id===first?.from.stopId);if(!stop)throw Error('Für diesen Einstieg fehlt eine genaue Stationszuordnung. Bitte neu planen.');let from=state.from;if(!from||from.kind==='current')from=await getLocation(revision);if(document.hidden||revision!==state.revision||state.selected!==selected)return;const {walk}=await walkClient.walk({from:{lat:from.lat,lon:from.lon},stopId:stop.id,speed:settings.speed});if(document.hidden||revision!==state.revision||state.selected!==selected)return;state.walk=walk;showSteps();box.textContent=`Zum Einstieg ${stop.name}: ca. ${minutes(walk.durationSeconds)} Min. · ${Math.round(walk.distanceMeters)} m. Aus Weglänge und Gehtempo geschätzt; Bahnsteigwege zusätzlich.`;}catch(error){if(revision===state.revision)box.textContent=error.name==='AbortError'?'Gehwegsuche angehalten.':error.message;}finally{if(revision===state.revision)$('journeyWalkRefresh').disabled=false;}
});
window.addEventListener('popstate',()=>{if(history.state?.foamaJourneyStation){openStation(history.state.foamaJourneyStation,{historyChange:false,connection:history.state.foamaJourneyConnection||null});return;}if(state.station){closeStation();return;}showJourney(history.state?.foamaJourneyFavorite??(Number.isInteger(history.state?.foamaJourney)?history.state.foamaJourney:null),{historyChange:false,variantIndex:history.state?.foamaJourneyVariant||0});});
function pause(){cancelSearch();pauseMonitor();closePicker();clearWalkMaps();placesUI?.pause();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else{refreshSavedJourneys();placesUI?.refresh();if(state.undoUntil&&Date.now()>=state.undoUntil)expireUndo();resumeMonitor();}});window.addEventListener('pagehide',pause);window.addEventListener('storage',event=>{if(event.key===TRAFFIC_STORAGE_KEY){state.trafficCache=readTrafficCache();if(!document.hidden)renderCurrent();}if(event.key==='foama.journeyFavorites.v1')refreshSavedJourneys();if(event.key==='foama.journeyPlaces.v1')placesUI?.refresh();});window.addEventListener('pageshow',()=>{refreshSavedJourneys();placesUI?.refresh();if(state.undoUntil&&Date.now()>=state.undoUntil)expireUndo();if(!document.hidden)resumeMonitor();});
placesUI=mountJourneyPlaces({client:createJourneyClient(),escape,getPoint:kind=>state[kind],onOpen:cancelSearch,onChoose:(kind,point)=>{cancelSearch();invalidateResults();setOverviewMode('search');selectPoint(kind,point);},onChange:()=>{if(state.selected&&!state.station)renderRouteOverview();}});
pointControls();renderFavorites();setJourneyPreference(state.preference);setOverviewMode(location.hash==='#routen'?'saved':'search');
try{const response=await fetch('./data/stops.json?v=0.11.28');if(!response.ok)throw Error();const data=await response.json();state.stops=Array.isArray(data.stops)?data.stops:[];await ensureJourneyCities([cityControl.current().id,...journeyCities(state.favorites)]);renderFavorites();if(history.state?.foamaJourneyStation)openStation(history.state.foamaJourneyStation,{historyChange:false,connection:history.state.foamaJourneyConnection||null});else if(history.state?.foamaJourneyFavorite)showJourney(history.state.foamaJourneyFavorite,{historyChange:false,variantIndex:history.state?.foamaJourneyVariant||0});}catch{status('Haltestellenkatalog gerade nicht verfügbar. Adressen kannst du weiterhin über „Suchen“ wählen.');}
