import {createAppUpdates} from './app-updates.mjs?v=0.6.6';
import {bindAppShare} from './app-share.mjs?v=0.6.6';
import {createNotifications} from './notifications.mjs?v=0.6.6&r=3';
import {visibleStationIds,bindStationViewport} from './station-viewport.mjs?v=0.6.6';
import {jsonExportName} from './export-file.mjs?v=0.6.6';
import {transferableJourneys} from './journey-favorites.mjs?v=0.6.6';
import {mergeTransferBundle} from './transfer.mjs?v=0.6.6';
import {warningsForTargets,updateWarningPanel,stationNoticeSections} from './warning-panel.mjs?v=0.6.6';
import {createFavoriteMenuController} from './favorite-menu.mjs?v=0.6.6';
import {MODE_CHOICES,modeButtonMarkup,compactFiltersMarkup,bindModeToggles,bindLocationDisclosure} from './transport-controls.mjs?v=0.6.6';
import {createThemeController} from './theme.mjs?v=0.6.6';
import {favoriteEntries,groupFavoriteEntries,moveFavoriteStation,removeFavoriteStation,addStationFavorite,favoriteDistanceText,favoriteStopIds} from './favorite-state.mjs?v=0.6.6';
import {openStationFavoritePicker} from './favorite-picker.mjs?v=0.6.6';
import {connectionsAtStation} from './station-search.mjs?v=0.6.6';
import {createLocationController,locationMessage} from './location.mjs?v=0.6.6';
import {updateLocation,locationSnapshot,positionAgeText} from './location-state.mjs?v=0.6.6';
import {MODE_LABELS,stationLines,stationPriority,stationQueryIncomplete,stationMatchesModes,selectStopIds,enrichStops,nearbyMapStops} from './station-catalog.mjs?v=0.6.6';
import {retainDepartures,departureIsFresh,retryDelay} from './departure-cache.mjs?v=0.6.6';
import {vehicleAccessibilityMarkup,departureCorrectionMarkup} from './departure-indicators.mjs?v=0.6.6';
import {stationAddressMarkup} from './station-addresses.mjs?v=0.6.6';
import {createAddressLookup} from './address-index.mjs?v=0.6.6';
import {googleMapsLocation,googleMapsWalk} from './map-links.mjs?v=0.6.6';
import {updateTrafficCache,trafficAtStation,affectedNoticeLines,noticeLines} from './traffic-info.mjs?v=0.6.6';
import {createDebugging} from './debugging.mjs?v=0.6.6&r=2';
import {DEFAULTS,MAX_STOP_IDS,mergeSettings,parseWlStopsCsv,parseWlMonitors,modeFromWl,withinRadius,haversineMeters,walkingMinutes,reachability,countdownMinutes,availableDeparts,railDepartures,dedupeFavorites,favoriteKey,favoriteMatches} from './core.mjs?v=0.6.6';
import {mergeObservedLines,evidenceForStation} from './line-evidence.mjs?v=0.6.6';
import {getCatalogue,putCatalogue} from './storage.mjs?v=0.6.6';
import {connectionDepartures,connectionRequestIds,lineHasCurrentDeparture,createConnectionNavigation} from './connection-detail.mjs?v=0.6.6';
const $=id=>document.getElementById(id), escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const WL_RATE_KEY='foama.wl.lastApiAttempt.v1';
let notifications=null;
const appUpdates=createAppUpdates({version:'0.6.6'});
const keys={settings:'foama.settings.v1',favorites:'foama.favorites.v1',stops:'foama.stops.v1',rail:'foama.rail.v1',departures:'foama.departures.v1',lines:'foama.stationLines.v1'};
function datasetDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(Error('IndexedDB fehlt'));const request=indexedDB.open('foama-wien',1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('datasets'))db.createObjectStore('datasets');};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function datasetGet(key){let db;try{db=await datasetDB();return await new Promise((resolve,reject)=>{const tx=db.transaction('datasets','readonly'),request=tx.objectStore('datasets').get(key);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);});}catch{return null;}finally{db?.close();}}
async function datasetPut(key,value){const db=await datasetDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('datasets','readwrite');tx.objectStore('datasets').put(value,key);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
function retrieve(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
const state={settings:mergeSettings(retrieve(keys.settings,{})),favorites:dedupeFavorites(retrieve(keys.favorites,[])),stops:[],rail:null,position:null,manual:false,nearby:[],expanded:new Set(),departures:[],fetchError:'',locationError:'',routes:new Map(),lastWlFetch:0,lastRefresh:null,watchId:null,timer:null,renderTimer:null,routingLock:false,fetchLock:false,mode:'',transfer:null,config:{apiBase:'',version:'0.6.6'},idleMode:false,stopsUnavailable:false,lastQueryKey:'',nextFetchTimer:null,lastRouteAt:0,lastWlData:[],map:null,liveSource:'auto'};
Object.assign(state,{locationData:{},locationPhase:'ready',locationInfo:{phase:'ready'},nearbyAnchor:null,addressLookup:null,bundledStops:[],learnedLines:retrieve(keys.lines,{}),apiFailures:0,retryAt:0,batchCycle:0,queriedIds:new Set(),platformChecks:new Map(),positionMap:null});
const themeControl=createThemeController({preference:state.settings.theme});
state.trafficCache=retrieve('foama.traffic.v1',{});state.noticesError=false;
state.openDetails=new Set();state.batteryState='off';state.lineEvidence=retrieve('foama.stationLineEvidence.v1',{});
Object.assign(state,{focusedConnection:null,monitorRequest:null,requestRevision:0,refreshPending:false,overviewScroll:0,connectionOpener:null});
const connectionNavigation=createConnectionNavigation({window,onChange:showConnection});
const favoriteMenus=createFavoriteMenuController({root:$('content'),document});
const stationViewport=bindStationViewport($('content'),()=>{if(!document.hidden)void refreshDepartures();});
const debugging=createDebugging({version:()=>state.config.version});
state.departures=retainDepartures(retrieve(keys.departures,[]));
if(state.departures.length)state.lastRefresh=state.departures[0].fetchedAt;
function learnedFor(stop){const entry=state.learnedLines[stop.id],now=Date.now(),registry=state.lineEvidence[stop.id];const local=mergeObservedLines((entry?.lines||[]).map(line=>({...line,lastSeen:line.lastSeen??entry.at})),[],now);return [...local,...evidenceForStation(registry,now).filter(line=>!line.suppressed||!local.some(seen=>seen.route===line.route&&seen.mode===line.mode&&seen.lastSeen>registry.checkedAt))];}
function mergeLineEvidence(raw){
 const registry=raw.foamaLines,status=$('lineEvidenceStatus');
 if(status)status.textContent=registry?.status==='available'&&Array.isArray(registry.stations)?`Zentrale Linienbestätigung verfügbar · ${registry.stations.length} Stationen · ${registry.stations.reduce((count,entry)=>count+(entry.lines||[]).filter(line=>Number.isFinite(line.lastSeen)&&Date.now()-line.lastSeen<=30*86400_000).length,0)} bestätigte Linien. Stand ${new Date().toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'})}.`:'Zentrale Linienbestätigung derzeit nicht verfügbar · lokale Daten bleiben erhalten.';
 if(registry?.version!==1||registry.status!=='available'||!Array.isArray(registry.stations))return;
 for(const entry of registry.stations.slice(0,24))if(findStop(entry.stopId)&&Number.isFinite(entry.checkedAt)&&entry.checkedAt<=Date.now()+30_000&&entry.checkedAt>=(state.lineEvidence[entry.stopId]?.checkedAt||0)){
  const safe=evidenceForStation(entry);state.lineEvidence[entry.stopId]={stopId:entry.stopId,checkedAt:entry.checkedAt,lines:safe.filter(line=>!line.suppressed).slice(0,256),suppressed:safe.filter(line=>line.suppressed).slice(0,256).map(({route,mode})=>({route,mode}))};
 }
 state.lineEvidence=Object.fromEntries(Object.entries(state.lineEvidence).filter(([,entry])=>Date.now()-entry.checkedAt<=90*86400_000).sort((a,b)=>b[1].checkedAt-a[1].checkedAt).slice(0,2000));
 try{const json=JSON.stringify(state.lineEvidence);if(json.length<=1_000_000)localStorage.setItem('foama.stationLineEvidence.v1',json);}catch{}
}
function locationNow(){const snapshot=locationSnapshot(state.locationData,Date.now(),state.manual);snapshot.reliable=snapshot.reliable&&state.locationPhase==='active'&&state.batteryState!=='resting';return snapshot;}
function saveSettings(){try{localStorage.setItem(keys.settings,JSON.stringify(state.settings));}catch{}}
function saveFavorites(){try{localStorage.setItem(keys.favorites,JSON.stringify(state.favorites));}catch{}$('favCount').textContent=String(state.favorites.length);notifications?.favoritesChanged();}
function msgStatus(message,offline=false){$('status').hidden=false;$('status').classList.toggle('offline',offline);$('status').querySelector('span:last-child').textContent=message;}
function metersFor(stop){const route=state.routes.get(stop.id);return route?.meters??((Number.isFinite(stop.airMeters)?stop.airMeters:haversineMeters(state.position,stop))*1.3);}
function hasRealRoute(stop){return !!state.routes.get(stop.id)?.real;}
function walkText(stop){const loc=locationNow(),m=metersFor(stop),mins=walkingMinutes(m,state.settings.speed);if(!state.manual&&(loc.moving||loc.stale||loc.approximate))return `ca. ${Math.round(haversineMeters(state.position,stop)/10)*10} m ${loc.stale?'zur letzten Position':'Luftlinie · ungefähr'}`;return `${Math.ceil(mins??0)} Min. Fußweg · ${Math.round(m/10)*10} m ${hasRealRoute(stop)?'':'(geschätzt)'}`;}
function statusText(s){return {good:'Gut erreichbar',tight:'Knapp',missed:'Kaum erreichbar',unknown:'Ungewiss'}[s];}
function statusSymbol(s){return {good:'●',tight:'●',missed:'●',unknown:'○'}[s];}
function qualityText(d){return d?.provider==='wl'&&(!!state.fetchError||!departureIsFresh(d))?'ÄLTER':d?.quality==='live'?'LIVE':'FAHRPLAN';}
function relevantDepartures(stop){return state.departures.filter(d=>d.provider==='wl'?(stop.provider==='wl'&&stop.rbl.includes(d.rbl)):(d.provider==='rail'&&(stop.platformIds||[stop.id.slice(5)]).includes(d.stopId)));}
function orderedFavorites(){return favoriteEntries(state.favorites,state.stops,state.position,state.settings.favoriteSort);}
function favoriteGroups(){return groupFavoriteEntries(orderedFavorites());}
function currentPlatformStops(){return state.settings.view==='fav'?orderedFavorites().map(entry=>entry.stop).filter(Boolean):state.nearby;}
function findStop(id){return state.stops.find(s=>s.id===id);}
function timeMarkup(d){if(!d)return '<small>—</small>';const fresh=d.provider!=='wl'||(!state.fetchError&&departureIsFresh(d));return `${fresh?'':'~'}${countdownMinutes(d.actual)}′ <span class="quality ${fresh&&d.quality==='live'?'live':!fresh?'cached':''}" title="${!fresh?'Letzter Abruf '+escape(new Date(d.fetchedAt).toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'})):''}">${qualityText(d)}${vehicleAccessibilityMarkup(d,{hasError:!!state.fetchError})}</span>`;}
function secondaryTimeMarkup(d){return d?`${countdownMinutes(d.actual)}′${vehicleAccessibilityMarkup(d,{hasError:!!state.fetchError})}`:'—';}
function correctionMarkup(d){return departureCorrectionMarkup(d,{hasError:!!state.fetchError});}
function reachFor(stop,d){if(!locationNow().reliable||!stop||!d||(d.provider==='wl'&&(state.fetchError||!departureIsFresh(d))))return {status:'unknown'};const dist=haversineMeters(state.position,stop);if(dist>2200)return {status:'unknown'};const walk=walkingMinutes(metersFor(stop),state.settings.speed);return reachability(d.actual,walk,state.settings.buffer,Date.now(),true);}
function routeBadge(route,mode='bus'){return `<span class="route-pill ${escape(mode)}" data-route="${escape(String(route).replace(/\s+/g,'').toUpperCase())}">${escape(route)}</span>`;}
function connectionAttributes(stop,route,towards='',mode=''){return `data-connection-stop="${escape(stop.id)}" data-connection-route="${escape(route)}" data-connection-towards="${escape(towards)}" data-connection-mode="${escape(mode)}"`;}
function connectionLink(stop,route,towards='',mode=''){return `<button type="button" class="connection-link" ${connectionAttributes(stop,route,towards,mode)} aria-label="${escape(route+' Richtung '+(towards||'alle Richtungen')+' bei '+stop.name+' öffnen')}"></button>`;}
function stationBadges(stop){
 const selected=stationLines(stop,learnedFor(stop)).filter(l=>state.settings.modes[l.mode]!==false),modes=[...new Set(selected.map(l=>MODE_LABELS[l.mode]))];
 const muted=selected.some(line=>!lineHasCurrentDeparture(stop,line,state.departures,{hasError:!!state.fetchError}));
 return `<span class="station-modes">${escape(modes.join(' · '))}</span><span class="station-badges">${selected.slice(0,8).map(line=>{
  const current=lineHasCurrentDeparture(stop,line,state.departures,{hasError:!!state.fetchError});
  return `<button type="button" class="station-line-button ${current?'':'line-unconfirmed'}" ${connectionAttributes(stop,line.route,'',line.mode)} aria-label="${escape(line.route+(current?' · aktuelle Abfahrten':' · keine aktuelle Abfahrt bestätigt')+' · Details öffnen')}" title="${current?'Aktuelle Abfahrten':'Keine aktuelle Abfahrt bestätigt'}">${routeBadge(line.route,line.mode)}</button>`;
 }).join('')}${selected.length>8?`<span class="more-lines">+${selected.length-8}</span>`:''}</span>${muted?'<small class="line-availability-hint">Gedimmt: aktuell keine Abfahrt bestätigt.</small>':''}`;
}
function noticesFor(stop,route=''){
 const routes=Array.isArray(route)?route:route?[route]:stationLines(stop,learnedFor(stop)).filter(line=>state.settings.view==='fav'||state.settings.modes[line.mode]!==false).map(line=>line.route);
 return trafficAtStation(state.trafficCache,stop,{routes});
}
const noticeDate=iso=>iso?new Date(iso).toLocaleString('de-AT',{timeZone:'Europe/Vienna',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
function trafficNoticeMarkup(notice,stop=null){
 const lines=stop?stationLines(stop,learnedFor(stop)):[];
 return `<article class="traffic-notice"><div class="notice-topline"><span>${escape(notice.label)} · ${notice.scope==='stop'?'Haltestellenhinweis':'Linienhinweis'}</span>${notice.planned?'<span>Geplant</span>':''}</div><strong>${escape(notice.title)}</strong><div class="station-badges">${noticeLines(notice).map(line=>routeBadge(line,lines.find(item=>item.route===line)?.mode||notice.lineModes?.[line]||'bus')).join('')}</div>${notice.scope==='stop'&&notice.stationNames?.length?`<p class="notice-stations">${escape(notice.stationNames.join(' · '))}</p>`:''}${notice.description&&notice.description!==notice.title?`<p>${escape(notice.description)}</p>`:''}<p class="notice-validity">${notice.start?'Ab '+escape(noticeDate(notice.start)):''}${notice.end?' · Bis '+escape(noticeDate(notice.end)):''}</p><small>${notice.scope==='line'?'Betrifft die Linie, nicht zwingend diese Haltestelle. ':''}${notice.stale||state.fetchError?'Letzter Stand – nicht aktuell bestätigt. ':''}Abruf ${escape(noticeDate(new Date(notice.checkedAt).toISOString()))} · Wiener Linien</small></article>`;
}
function noticeBadges(notices){return affectedNoticeLines(notices).map(line=>{const known=state.stops.flatMap(stop=>stop.lines||[]).find(item=>item.route===line.route);return routeBadge(line.route,known?.mode||line.mode);}).join('');}
function stationNotices(stop,route=''){
 const notices=noticesFor(stop,route);if(!notices.length)return '';
 const key='notices:'+stop.id+':'+(Array.isArray(route)?route.join(','):route);
 return stationNoticeSections(notices,{key,isOpen:id=>state.openDetails.has(id),escape,renderNotice:notice=>trafficNoticeMarkup(notice,stop),renderLines:noticeBadges});
}
function renderWarnings(){
 const targets=state.settings.view==='fav'?orderedFavorites().map(({stop,favorite})=>({stop,routes:favorite.route?[favorite.route]:null})):state.nearby.map(stop=>({stop,routes:stationLines(stop,learnedFor(stop)).filter(line=>state.settings.modes[line.mode]!==false).map(line=>line.route)}));
 const notices=warningsForTargets(state.trafficCache,targets);
 updateWarningPanel({panel:$('warningPanel'),count:$('warningCount'),preview:$('warningPreview'),list:$('warningList'),details:$('warningDetails'),lines:$('warningLines')},notices,notice=>trafficNoticeMarkup(notice),noticeBadges);
}
function lineMarkup(stop,g,allowStar=true){const [first,second]=g.departures,reach=reachFor(stop,first);const name=escape(g.route),direction=escape(g.towards);const fav={stopId:stop.id,route:g.route,towards:g.towards};const saved=state.favorites.some(f=>favoriteKey(f)===favoriteKey(fav));return `<div class="line-row connection-row">${connectionLink(stop,g.route,g.towards,g.mode)}<div class="line-name"><div class="line-head">${routeBadge(g.route,g.mode)}${allowStar?`<button class="star-btn ${saved?'saved':''}" data-favorite-line="${escape(stop.id)}" data-route="${name}" data-towards="${direction}" aria-label="Linie als Favorit ${saved?'entfernen':'hinzufügen'}">${saved?'★':'☆'}</button>`:''}</div><span class="line-towards">→ ${direction}</span></div><div class="line-right"><div class="times"><strong>${timeMarkup(first)}</strong><small>${secondaryTimeMarkup(second)}</small></div>${correctionMarkup(first)}<div class="mini-status ${reach.status}">${statusSymbol(reach.status)} ${statusText(reach.status)}</div></div></div>`;}
function stopMarkup(stop){
 const expanded=state.expanded.has(stop.id),departures=availableDeparts(relevantDepartures(stop),state.settings),next=departures[0],best=next?.departures?.[0],faved=state.favorites.some(f=>f.stopId===stop.id&&!f.route),detailsId='departures-'+stop.id;
 const noData=state.fetchError?'Live-Daten derzeit nicht verfügbar':stop.rbl?.some(id=>state.queriedIds.has(id))?'Linien und Richtungen ansehen':'Abfahrten werden geladen';
 const incomplete=stationQueryIncomplete(stop,state.settings,state.platformChecks);
 const preview=expanded?`<span class="station-preview-copy">${departures.length?departures.length+' Linien &amp; Richtungen':'Linien &amp; Richtungen'} · ${incomplete?(state.fetchError?'Abfrage unvollständig':'weitere werden nachgeladen'):'zum Schließen tippen'}</span>`:
  next?`<span class="station-next-connection">${routeBadge(next.route,next.mode)}<span title="${escape(next.towards)}">${escape(next.towards)}</span></span>`:`<span class="station-preview-copy">${escape(noData)}</span>`;
 return `<article class="stop-card station-card ${expanded?'is-expanded':''}" data-station-id="${escape(stop.id)}">
  <div class="station-card-head"><div class="station-heading-block"><h3><button class="station-title-link" type="button" data-route-map="${escape(stop.id)}" aria-label="Fußweg zu ${escape(stop.name)} auf Karte öffnen"><span>${escape(stop.name)}</span><small>Karte ↗</small></button></h3><p class="station-walk-meta">${escape(walkText(stop))}</p></div><button type="button" class="station-save ${faved?'saved':''}" data-stop-fav="${escape(stop.id)}" aria-pressed="${faved}" aria-label="${escape(stop.name)} als Haltestellenfavorit ${faved?'entfernen':'speichern'}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg></button></div>
  <div class="station-services">${stationBadges(stop)}</div>${stationNotices(stop)}
  <button type="button" class="station-departures" data-toggle="${escape(stop.id)}" aria-expanded="${expanded}" aria-controls="${escape(detailsId)}" aria-label="Abfahrten für ${escape(stop.name)} ${expanded?'schließen':'anzeigen'}"><span class="station-preview-main"><strong>Abfahrten</strong>${preview}${!expanded?correctionMarkup(best):''}</span><span class="station-preview-time">${!expanded&&best?`<strong>${timeMarkup(best)}</strong>`:''}</span><span class="station-expand-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" focusable="false"><path d="m6 9 6 6 6-6"/></svg></span></button>
  <div class="stop-inner" id="${escape(detailsId)}" ${expanded?'':'hidden'}>${expanded?(departures.length?departures.map(g=>lineMarkup(stop,g)).join(''):`<div class="empty-departures"><p>${state.fetchError?'Live-Abfrage fehlgeschlagen. Die Linien oben bleiben aus dem lokalen Katalog verfügbar.':stop.rbl?.some(id=>state.queriedIds.has(id))?'Derzeit keine Abfahrten der gewählten Verkehrsmittel gemeldet.':'Abfahrten werden nachgeladen. Die Linien oben sind bereits offline verfügbar.'}</p></div>`):''}</div></article>`;
}
function favoriteConnectionMarkup(stop,f,departures){
 const byDirection=new Map();
 for(const d of departures.filter(d=>favoriteMatches(f,d)))if(!byDirection.has(d.route+'|'+d.towards))byDirection.set(d.route+'|'+d.towards,[]);
 for(const d of departures.filter(d=>favoriteMatches(f,d)))byDirection.get(d.route+'|'+d.towards).push(d);
 const groups=[...byDirection.values()];if(!groups.length)groups.push([]);
 return groups.map(group=>{
  const [a,b]=group,reach=reachFor(stop,a),mode=a?.mode||stationLines(stop,learnedFor(stop)).find(line=>line.route===f.route)?.mode||f.mode||modeFromWl('',f.route);
  return `<div class="line-row favorite-selected-line connection-row">${connectionLink(stop,f.route,a?.towards||f.towards||'',mode)}<div class="line-name"><div class="line-head">${routeBadge(f.route,mode)}<button type="button" class="star-btn saved" data-remove-fav="${escape(favoriteKey(f))}" aria-label="Gespeicherte Verbindung ${escape(f.route+' Richtung '+(f.towards||'alle Richtungen'))} entfernen">★</button></div><span class="line-towards">→ ${escape(a?.towards||f.towards||'Alle Richtungen')}${correctionMarkup(a)}</span></div><div class="line-right"><div class="times"><strong>${timeMarkup(a)}</strong><small>${secondaryTimeMarkup(b)}</small></div><span class="mini-status ${reach.status}">${a?statusSymbol(reach.status)+' '+statusText(reach.status):'Keine Abfahrten'}</span></div></div>`;
 }).join('');
}
function favoriteMarkup(group,index,count){
 const {stopId,stop,distance,entries}=group,menuKey='station:'+stopId,name=stop?.name||entries[0].favorite.stopName||stopId,whole=entries.find(({favorite:f})=>!f.route),selected=entries.filter(({favorite:f})=>f.route);
 const menu=`<details class="favorite-menu" data-favorite-menu="${escape(menuKey)}" ${favoriteMenus.isOpen(menuKey)?'open':''}><summary aria-label="Favoriten für ${escape(name)} bearbeiten">⋯</summary><div class="favorite-menu-actions">${state.settings.favoriteSort==='distance'?'':`<button type="button" data-move-fav-station="${escape(stopId)}" data-delta="-1" ${index===0?'disabled':''}>Nach oben</button><button type="button" data-move-fav-station="${escape(stopId)}" data-delta="1" ${index===count-1?'disabled':''}>Nach unten</button>`}${whole&&selected.length?`<button type="button" data-remove-fav="${escape(favoriteKey(whole.favorite))}">Nur Haltestellenfavorit entfernen</button>`:''}<button type="button" class="remove-favorite" data-remove-fav-station="${escape(stopId)}">${entries.length>1?'Alle Favoriten dieser Station entfernen':'Entfernen'}</button></div></details>`;
 const heading=`<div class="fav-main"><div class="favorite-heading"><h3 class="fav-title">${escape(name)}</h3>${stop?`<button type="button" class="fav-place station-map-link" data-route-map="${escape(stopId)}" aria-label="Fußweg zu ${escape(name)} auf Karte öffnen">Fußweg & Karte ↗</button>`:''}${whole?'<small class="favorite-scope">Ganze Haltestelle</small>':''}${state.settings.favoriteSort==='distance'?`<small class="favorite-distance">${escape(favoriteDistanceText(distance))}</small>`:''}</div>${menu}</div>`;
 if(!stop)return `<article class="fav-card" data-station-id="${escape(stopId)}">${heading}<p class="secondary-text">Haltestelle aktuell nicht im lokalen Index</p>${selected.map(({favorite:f})=>`<div class="unknown-favorite"><span>${escape(f.route+' → '+(f.towards||'Alle Richtungen'))}</span><button type="button" class="small-btn" data-remove-fav="${escape(favoriteKey(f))}">Entfernen</button></div>`).join('')}</article>`;
 const departures=[...new Map(relevantDepartures(stop).filter(d=>Date.parse(d.actual)>=Date.now()-30_000).sort((a,b)=>Date.parse(a.actual)-Date.parse(b.actual)).map(d=>[d.route+'|'+d.towards+'|'+d.actual,d])).values()];
 const rows=selected.map(({favorite:f})=>favoriteConnectionMarkup(stop,f,departures)).join('');
 const remaining=whole?departures.filter(d=>!selected.some(({favorite:f})=>favoriteMatches(f,d))):[];
 const stationRows=[...new Map(remaining.map(d=>[d.route+'|'+d.towards,d])).values()].map(d=>{
  const row=remaining.filter(x=>x.route===d.route&&x.towards===d.towards).slice(0,2),r=reachFor(stop,row[0]);
  return `<div class="favorite-station-line connection-row">${connectionLink(stop,d.route,d.towards,d.mode)}${routeBadge(d.route,d.mode)}<div class="favorite-line-destination"><span class="line-towards">${escape(d.towards)}</span><span class="mini-status ${r.status}">${statusSymbol(r.status)} ${statusText(r.status)}</span>${correctionMarkup(row[0])}</div><span class="times"><strong>${timeMarkup(row[0])}</strong><small>${secondaryTimeMarkup(row[1])}</small></span></div>`;
 }).join('');
 return `<article class="fav-card" data-station-id="${escape(stopId)}">${heading}${stationNotices(stop,whole?'':selected.map(({favorite:f})=>f.route))}<div class="favorite-station-lines">${rows+stationRows||'<p class="secondary-text">Noch keine aktuellen Abfahrten geladen.</p>'}</div></article>`;
}
function render(){if(state.focusedConnection){renderConnection();return;}if($('locationMapDialog').open)syncMapFavorites();renderLocation();updateAppStatus();renderWarnings();if($('routeDialog').open)renderStationAddress();const fav=state.settings.view==='fav';$('viewTitle').textContent=fav?'Meine Favoriten':'In der Nähe';renderFavoriteTools(fav);$('nearTools').classList.toggle('hidden',fav);$('tabNear').classList.toggle('active',!fav);$('tabFav').classList.toggle('active',fav);$('tabNear').setAttribute('aria-current',fav?'false':'page');$('tabFav').setAttribute('aria-current',fav?'page':'false');$('favCount').textContent=String(state.favorites.length);
  $('updated').textContent=state.lastRefresh?`Stand ${new Date(state.lastRefresh).toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'})}`:'Noch keine Daten';
  if(!fav){const near=state.nearby.slice().sort((a,b)=>stationPriority(a,state.settings,learnedFor(a))-stationPriority(b,state.settings,learnedFor(b))||metersFor(a)-metersFor(b));$('content').innerHTML=near.map(stopMarkup).join('');if(!near.length){$('content').innerHTML=`<div class="empty"><strong>${state.stopsUnavailable?'Haltestellendaten fehlen':state.position?'Keine passenden Haltestellen im Suchradius':'Standort noch nicht verfügbar'}</strong><p>${state.stopsUnavailable?'Importiere die offizielle Haltepunkte-CSV über ⚙ Einstellungen. Danach erscheinen Haltestellen in deiner Nähe.':state.position?'Wähle passende Verkehrsmittel oder erweitere den Suchradius. Stationen ohne bestätigte Zuordnung werden ausgeblendet.':'Erlaube den Standortzugriff oder wähle in den Einstellungen eine Haltestelle manuell.'}</p><button class="primary-btn" data-open-settings>⚙ Einstellungen öffnen</button></div>`;}}
  else{$('content').innerHTML=(favoriteGroups().map((group,index,groups)=>favoriteMarkup(group,index,groups.length)).join(''))+`<button class="primary-btn" style="width:100%;margin-top:8px" data-add-fav>＋ Favorit hinzufügen</button>`;}
 if(!document.hidden)stationViewport.schedule();
}
function cancelMonitor(){state.requestRevision++;state.monitorRequest?.abort();clearTimeout(state.nextFetchTimer);state.nextFetchTimer=null;}
function showConnection(target){
 const stop=target&&findStop(target.stopId);if(target&&!stop)target=null;
 const previous=state.focusedConnection;
 if(target&&!previous)state.overviewScroll=window.scrollY;
 cancelMonitor();favoriteMenus.close();stationViewport.pause();
 state.focusedConnection=target?{...target,ids:connectionRequestIds(stop,target,state.departures)}:null;
 for(const id of ['appHeader','overviewMain','appFooter'])$(id).hidden=!!target;
 $('connectionView').hidden=!target;document.body.classList.toggle('connection-open',!!target);
 render();
 if(target)requestAnimationFrame(()=>{if(state.focusedConnection?.stopId!==target.stopId||state.focusedConnection?.route!==target.route||state.focusedConnection?.towards!==target.towards)return;window.scrollTo({top:0,behavior:'instant'});$('connectionTitle')?.focus({preventScroll:true});});
 else if(previous)requestAnimationFrame(()=>{
  window.scrollTo({top:state.overviewScroll,behavior:'instant'});
  const opener=state.connectionOpener?.dataset;
  const button=opener&&[...$('content').querySelectorAll('[data-connection-stop]')].find(b=>b.dataset.connectionStop===opener.connectionStop&&b.dataset.connectionRoute===opener.connectionRoute&&b.dataset.connectionTowards===opener.connectionTowards);
  button?.focus({preventScroll:true});stationViewport.schedule();
 });
 void refreshDepartures();
}
function connectionRefreshText(){
 const target=state.focusedConnection;if(!target)return '';
 if(document.hidden)return 'Aktualisierung pausiert.';
 if(state.fetchLock&&!state.monitorRequest?.signal.aborted)return 'Diese Verbindung wird aktualisiert …';
 if(findStop(target.stopId)?.provider==='rail')return 'Fahrplandaten · keine Live-Prognose.';
 const wait=Math.ceil((Math.max(state.lastWlFetch+30_000,state.retryAt)-Date.now())/1000);
 if(state.fetchError)return state.fetchError+(wait>0?' Nächster Versuch in '+wait+' s.':'');
 return wait>0?'Nächste Aktualisierung in '+wait+' s · nur diese Verbindung.':'Alle 30 s, solange diese Ansicht sichtbar ist.';
}
function renderConnection(){
 const target=state.focusedConnection,stop=target&&findStop(target.stopId);if(!stop)return;
 const active=document.activeElement,focusAction=$('connectionContent').contains(active)?active.dataset.connectionAction:null;
 const departures=connectionDepartures(stop,target,state.departures),first=departures[0],reach=reachFor(stop,first);
 const saved=state.favorites.some(f=>favoriteKey(f)===favoriteKey(target));
 const directions=[...new Set(connectionDepartures(stop,{route:target.route},state.departures).map(d=>d.towards))];
 const checked=target.ids.length&&target.ids.every(id=>Date.now()-(state.platformChecks.get(id)||0)<=90_000);
 const empty=state.fetchError?'Live-Daten derzeit nicht verfügbar.':checked?'Derzeit keine Abfahrten für diese Verbindung gemeldet.':stop.provider==='rail'?'Keine aktuellen Fahrplandaten für diese Verbindung.':'Für diese Verbindung ist noch keine aktuelle Abfahrt bestätigt.';
 const clock=iso=>new Date(iso).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'});
 $('connectionContent').innerHTML=`<div class="connection-heading"><div class="eyebrow">${escape(MODE_LABELS[target.mode]||'VERBINDUNG')}</div><h1 id="connectionTitle" tabindex="-1">${escape(stop.name)}</h1><div class="connection-destination ${lineHasCurrentDeparture(stop,target,state.departures,{hasError:!!state.fetchError})?'':'line-unconfirmed'}">${routeBadge(target.route,target.mode||first?.mode||'bus')}<h2>→ ${escape(target.towards||'Alle Richtungen')}</h2></div></div>
  ${!target.towards&&directions.length?`<div class="connection-directions" aria-label="Richtung auswählen">${directions.map((direction,i)=>`<button type="button" class="small-btn" data-connection-action="direction-${i}" data-connection-direction="${escape(direction)}">→ ${escape(direction)}</button>`).join('')}</div>`:''}
  <section class="connection-countdown" aria-label="Nächste Abfahrt">${first?`<span class="connection-next-label">Nächste Abfahrt${!target.towards?' → '+escape(first.towards):''}</span><div class="connection-time">${timeMarkup(first)}</div><p class="connection-clock">um ${escape(clock(first.actual))}${first.platform?' · Bahnsteig '+escape(first.platform):''}</p>${correctionMarkup(first)}<p class="mini-status ${reach.status}">${statusSymbol(reach.status)} ${statusText(reach.status)}</p>`:`<div class="connection-time">—</div><p>${escape(empty)}</p>`}</section>
  <p class="connection-refresh-status" id="connectionRefreshStatus" role="status">${escape(connectionRefreshText())}</p>
  ${departures.length>1?`<section class="connection-following"><h3>Danach</h3><ol>${departures.slice(1,7).map(d=>`<li><span>${escape(clock(d.actual))}${!target.towards?`<small>→ ${escape(d.towards)}</small>`:''}${correctionMarkup(d)}</span><strong>${timeMarkup(d)}</strong></li>`).join('')}</ol></section>`:''}
  ${stationNotices(stop,target.route)}
  <div class="connection-walk"><strong>${state.position?escape(walkText(stop)):'Gehzeit ohne Standort ungewiss'}</strong><span>${escape(state.settings.buffer)} Min. Reserve berücksichtigt</span></div>
  <div class="connection-actions"><button type="button" class="primary-btn" data-connection-action="favorite" id="connectionFavorite" aria-pressed="${saved}">${saved?'★ Favorit entfernen':'☆ Als Favorit speichern'}</button><button type="button" class="small-btn" data-connection-action="map" id="connectionMap">Fußweg & Karte ↗</button></div>`;
 if(focusAction)[...$('connectionContent').querySelectorAll('[data-connection-action]')].find(b=>b.dataset.connectionAction===focusAction)?.focus({preventScroll:true});
}
function renderFavoriteTools(visible){
 $('favoriteTools').hidden=!visible;for(const button of $('favoriteSort').querySelectorAll('[data-favorite-sort]'))button.setAttribute('aria-pressed',String(button.dataset.favoriteSort===state.settings.favoriteSort));
 const missingPosition=state.settings.favoriteSort==='distance'&&!state.position;$('favoriteSortHint').hidden=!missingPosition;$('favoriteTools').classList.toggle('has-context',missingPosition);$('favoriteSortHint').textContent=missingPosition?'Ohne Standort gilt deine gespeicherte Reihenfolge.':'';
}
function refreshNearby(shouldRoute=false){if(!state.position){state.nearby=[];render();return;}state.nearby=nearbyMapStops(state.stops,state.position,state.settings,learnedFor,15);render();if(shouldRoute)void walkingMatrix();}
function locationDescription(){
 const loc=locationNow();
 if(!state.position)return locationMessage(state.locationInfo);
 const phase=state.locationPhase;
 if(state.manual)return {title:'Manueller Startpunkt',detail:'Keine GPS-Ortung aktiv. Für deine tatsächliche Position den Standort erneut aktivieren.'};
 if(loc.stale)return {title:'Letzter bekannter Standort',detail:'Keine aktuelle Position – etwa im Tunnel. Stationen beziehen sich auf den letzten Fix; die Geh-Erreichbarkeit bleibt ungewiss.'};
 if(loc.approximate)return {title:'Standort nur ungefähr',detail:'Nähe-Suche um die ungefähre / letzte brauchbare Position. Keine verlässliche Geh-Erreichbarkeit. Bei besserem Empfang aktualisiert sich die App automatisch.'};
 if(['requesting','timeout','unavailable','denied','error'].includes(phase))return {title:'Letzter bekannter Standort',detail:phase==='requesting'?'Standort wird aktualisiert. Der letzte Fix bleibt sichtbar.':locationMessage(state.locationInfo).detail};
 if(loc.moving)return {title:'Unterwegs',detail:'Du bewegst dich schneller als zu Fuß. Nahe Stationen folgen deiner Position; Geh-Erreichbarkeit und präzise Gehwegberechnung pausieren.'};
 if(state.batteryState==='resting')return {title:'Standort spart Akku',detail:'Wenig Bewegung und zuletzt stabile Position. Ortung pausiert kurz; bei Bewegung oder spätestens nach einer Minute wird erneut geprüft. Geh-Erreichbarkeit bleibt bis zum nächsten Fix ungewiss.'};
 return {title:'Dein Standort',detail:''};
}
function renderLocation(){
 renderBatteryState();
 const loc=locationNow(),message=locationDescription(),position=state.position;
 $('locationPanel').hidden=false;$('locationPanel').classList.toggle('has-position',!!position);$('locationTitle').textContent='Dein Standort';$('locationHelp').textContent=message.detail;
 const updating=position&&!state.manual&&!loc.stale&&!loc.approximate&&state.locationPhase==='requesting';
 $('locationStatus').textContent=updating?'Standort wird aktualisiert':message.title==='Dein Standort'?'Standort aktiv':message.title;
 const problem=position&&!state.manual&&(loc.stale||loc.approximate||!['active','inaccurate','requesting'].includes(state.locationPhase));
 $('locationStatus').dataset.state=problem||(!position&&locationMessage(state.locationInfo).isError)?'warning':updating||state.locationPhase==='requesting'?'waiting':!state.manual&&position&&!loc.moving&&state.batteryState!=='resting'?'active':'neutral';
 $('locationRefresh').hidden=!!state.fetchError||!state.stops.length;
 const warning=position&&!state.manual&&(loc.stale||loc.approximate||!['active','inaccurate'].includes(state.locationPhase));
 $('locationHelp').hidden=!message.detail;
 $('locationPanel').classList.toggle('location-error',!position&&locationMessage(state.locationInfo).isError);
 $('locationPanel').classList.toggle('location-warning',!!warning);
 $('locationMap').disabled=!position;$('locationAddress').hidden=!position;$('locationMeta').hidden=!position;
 if(position){
  const address=state.addressLookup?.(position),nearest=withinRadius(state.stops,position,1500)[0];
  const rough=!state.manual&&position.accuracy>150;
  $('locationAddress').textContent=address?(rough?`Grobe Umgebung · ${address.postcode} Wien`:address.text):nearest?`Ungefähr bei ${nearest.name}`:'Keine Straßenumgebung im lokalen Wien-Index';
  const accuracy=state.manual?'manuell gewählt':Number.isFinite(position.accuracy)?`±${Math.round(position.accuracy)} m`:'Genauigkeit unbekannt';
  const recent=state.locationData.latest,extra=!state.manual&&recent&&recent!==position&&state.locationData.coarseReceived?` · neuer Empfang nur ±${Math.round(recent.accuracy)} m`:'';
  const text=`${accuracy} · Fix ${positionAgeText(loc.age)}${extra}`;
  $('locationMeta').textContent=text;$('locationDetails').textContent=`${$('locationAddress').textContent} · ${text}`;
 }
 const waiting=state.locationPhase==='requesting';
 $('activateLocation').hidden=!!position&&!state.manual&&!['denied','unsupported','policy','insecure'].includes(state.locationPhase);
 $('activateLocation').textContent=waiting?'Standort wird angefragt …':'⌖ Standort aktivieren';$('activateLocation').disabled=waiting;
}
function updateAppStatus(){
 if(state.fetchError){const wait=Math.max(0,Math.ceil((state.retryAt-Date.now())/1000));msgStatus(`${state.fetchError}${wait?' · Nächster Versuch in '+wait+' s':''}`,true);return;}
 if(state.stopsUnavailable){msgStatus('Haltestellenkatalog fehlt · CSV importieren oder Serverdaten aktivieren',true);return;}
 if(!state.stops.length){msgStatus('Haltestellenindex wird geladen',true);return;}
 // Location status has one home: the location card, including errors and uncertainty.
 $('status').hidden=true;
}

function setPosition(loc,manual=false){
 const old=state.position;state.manual=manual;
 state.locationData=updateLocation(manual?{}:state.locationData,{...loc,timestamp:loc.timestamp||Date.now(),accuracy:manual?0:loc.accuracy});
 state.position=state.locationData.position;if(!state.position)return;
 if(manual){state.locationPhase='manual';state.locationInfo={phase:'manual'};}
 const anchor=state.nearbyAnchor,distance=anchor?haversineMeters(anchor,state.position):Infinity;
 const changed=!old||manual||distance>=state.settings.movementMeters||(old.accuracy>150)!==(state.position.accuracy>150);
 if(changed){state.nearbyAnchor=state.position;state.routes.clear();refreshNearby(true);void refreshDepartures(true);}else render();
}
function locationState(info){state.locationInfo=info;state.locationPhase=info.phase;state.locationError=locationMessage(info).isError?locationMessage(info).title:'';render();}
function renderBatteryState(){
 const messages={off:'Aus · normale, energiesparende Browser-Ortung.',
  'waiting-location':'Standort aktivieren, um die Bewegungshilfe zu nutzen.',
  checking:'Bewegungshilfe aktiv · Ortung läuft, bis Sensor und Standort ausreichend Ruhe zeigen.',
  resting:'Akku-Pause · neue Standortprüfung spätestens nach einer Minute, sofort bei erkannter Bewegung.',
  paused:'Pausiert · keine Sensoren oder Ortung im Hintergrund.',
  unsupported:'Bewegungssensor hier nicht unterstützt · normale Ortung bleibt aktiv.',
  blocked:'Bewegungssensor gesperrt · normale Ortung bleibt aktiv. Prüfe bei Bedarf die Website-Berechtigung für Bewegungssensoren.',
  unavailable:'Keine verlässlichen Sensordaten · normale Ortung bleibt aktiv.'};
 $('motionSavingStatus').textContent=messages[state.batteryState]||messages.off;
}
const locationControl=createLocationController({batterySaving:state.settings.motionBatterySaving===true,onPosition:loc=>setPosition(loc),onState:locationState,onBatteryState:value=>{state.batteryState=value;render();}});
function stopLocation(){locationControl.pause();}
function requestLocation(){state.manual=false;locationControl.request();}
function stopActive(){cancelMonitor();state.refreshPending=false;clearInterval(state.timer);clearInterval(state.renderTimer);clearTimeout(state.nextFetchTimer);state.timer=state.renderTimer=state.nextFetchTimer=null;stationViewport.pause();stopLocation();}
function startActive(){if(document.hidden)return;if(!state.manual)locationControl.resume();clearInterval(state.timer);clearInterval(state.renderTimer);state.timer=setInterval(()=>{if(!document.hidden)void refreshDepartures();},30_000);state.renderTimer=setInterval(()=>{if(!document.hidden)render();},10_000);void refreshDepartures();}
async function fetchJson(url,timeoutMs=12000,signal=null){const ctrl=new AbortController(),abort=()=>ctrl.abort();if(signal?.aborted)ctrl.abort();else signal?.addEventListener('abort',abort,{once:true});const t=setTimeout(abort,timeoutMs);try{const res=await fetch(url,{signal:ctrl.signal,cache:'no-store'});if(!res.ok){let payload={};try{payload=await res.json();}catch{}const error=new Error(`HTTP ${res.status}${payload.error?' · '+payload.error:''}`);error.status=res.status;error.upstreamStatus=payload.upstreamHttpStatus||0;throw error;}return await res.json();}finally{clearTimeout(t);signal?.removeEventListener('abort',abort);}}
function learnMonitorLines(raw){
 for(const monitor of raw.data?.monitors||[]){const rbl=String(monitor.locationStop?.properties?.attributes?.rbl??'');
  const stop=state.stops.find(s=>s.provider==='wl'&&s.rbl?.includes(rbl));if(!stop)continue;
  const incoming=(monitor.lines||[]).filter(l=>l.name).map(l=>({route:String(l.name),mode:modeFromWl(l.type||monitor.type,l.name)}));
  if(incoming.length){const previous=state.learnedLines[stop.id];state.learnedLines[stop.id]={at:Date.now(),lines:mergeObservedLines((previous?.lines||[]).map(line=>({...line,lastSeen:line.lastSeen??previous.at})),incoming)};}
 }
 const entries=Object.entries(state.learnedLines).filter(([,v])=>Date.now()-v.at<30*86400_000).sort((a,b)=>b[1].at-a[1].at).slice(0,2000);
 state.learnedLines=Object.fromEntries(entries);try{localStorage.setItem(keys.lines,JSON.stringify(state.learnedLines));}catch{}
}
async function fetchWl(stops,requestedIds=null,signal=null){
 const rbl=requestedIds||[...new Set(stops.filter(s=>s.provider==='wl').flatMap(s=>s.rbl))].slice(0,MAX_STOP_IDS);
 if(!rbl.length)return [];
 const qs=new URLSearchParams();for(const id of rbl)qs.append('stopId',id);
 const base=state.settings.proxyBase||state.config.apiBase||(location.origin!=='null'?location.origin:'');
 const sources=(state.config.preferProxy||state.settings.proxyBase||state.directWlBlocked)?[]:[`https://www.wienerlinien.at/ogd_realtime/monitor?${qs}`];
 if(base&&(!state.config.staticOnly||state.settings.proxyBase||state.config.apiBase))sources.push(`${base.replace(/\/$/,'')}/api/monitor?${qs}`);
 let lastError;
 for(const url of sources){const start=performance.now();try{
  const raw=await fetchJson(url,12000,signal);if(signal?.aborted)throw new DOMException('Request cancelled','AbortError');const departures=parseWlMonitors(raw,new Date().toISOString());learnMonitorLines(raw);mergeLineEvidence(raw);state.queriedIds=new Set(rbl);
  const checkedAt=Date.now();for(const id of rbl)state.platformChecks.set(String(id),checkedAt);for(const [id,at] of state.platformChecks)if(checkedAt-at>600000)state.platformChecks.delete(id);
  try{state.trafficCache=updateTrafficCache(state.trafficCache,raw,rbl);state.noticesError=raw.foamaTraffic?.status==='unavailable';const json=JSON.stringify(state.trafficCache);if(json.length<1000000)localStorage.setItem('foama.traffic.v1',json);}catch{state.noticesError=true;}
  debugging.record({kind:'monitor',outcome:'ok',code:'ok',httpStatus:200,elapsedMs:performance.now()-start,stopCount:rbl.length,departureCount:departures.length,noticeCount:raw.data?.trafficInfos?.length||0});return departures;
 }catch(e){if(signal?.aborted)throw e;lastError=e;debugging.record({kind:'monitor',outcome:'error',code:e.upstreamStatus?'upstream-http':e.status?'http':e.name==='AbortError'?'timeout':e.name==='SyntaxError'?'invalid-data':'network',httpStatus:e.status,upstreamHttpStatus:e.upstreamStatus,elapsedMs:performance.now()-start,stopCount:rbl.length});if(url.includes('wienerlinien.at/ogd_realtime/monitor'))state.directWlBlocked=true;}}
 const error=new Error(lastError?.message||'Wiener-Linien-Livedaten nicht erreichbar (Netzwerk/CORS)');error.upstreamStatus=lastError?.upstreamStatus||0;error.status=lastError?.status||0;throw error;
}
function apiErrorMessage(error){const code=error.upstreamStatus||error.status;
 if(code===403)return 'Wiener Linien lässt derzeit keine Live-Abfrage zu. Gespeicherter Stand bleibt sichtbar.';
 if(code===429)return 'Live-Abfragen vorübergehend begrenzt. Gespeicherter Stand bleibt sichtbar.';
 return 'Live-Daten vorübergehend nicht verfügbar. Gespeicherter Stand bleibt sichtbar.';
}
function saveDepartureCache(){try{localStorage.setItem(keys.departures,JSON.stringify(retainDepartures(state.departures)));}catch{}}
async function refreshDepartures(force=false){
 if(document.hidden||document.querySelector('dialog[open]'))return;
 if(state.fetchLock){state.refreshPending=true;return;}
 const focused=state.focusedConnection;
 const stops=focused?[findStop(focused.stopId)].filter(Boolean):currentPlatformStops().slice();
 if(state.settings.view!=='fav')stops.sort((a,b)=>Number(state.expanded.has(b.id))-Number(state.expanded.has(a.id)));
 const railStopIds=stops.filter(s=>s?.provider==='rail').flatMap(s=>s.platformIds||[s.id.slice(5)]);
 const visible=visibleStationIds($('content'));
 const ids=focused?focused.ids:state.settings.view==='fav'?(visible.size?selectStopIds(stops,null,MAX_STOP_IDS,state.batchCycle,new Set(),visible):favoriteStopIds(stops,MAX_STOP_IDS,state.batchCycle)):selectStopIds(stops,state.settings,MAX_STOP_IDS,state.batchCycle,state.expanded,visible);
 const now=Date.now();let globalLast=0;try{globalLast=Number(localStorage.getItem(WL_RATE_KEY)||0);}catch{}
 const next=Math.max(Math.max(state.lastWlFetch,globalLast)+30_000,state.retryAt);
 if(ids.length&&now<next){clearTimeout(state.nextFetchTimer);state.nextFetchTimer=setTimeout(()=>{if(!document.hidden)void refreshDepartures(true);},next-now+100);updateAppStatus();if(focused)renderConnection();return;}
 state.fetchLock=true;state.refreshPending=false;const controller=new AbortController(),revision=state.requestRevision;state.monitorRequest=controller;let incoming=[];if(focused)renderConnection();
 try{
  if(ids.length){state.lastWlFetch=now;try{localStorage.setItem(WL_RATE_KEY,String(now));}catch{}
   incoming=await fetchWl(stops,ids,controller.signal);if(controller.signal.aborted||revision!==state.requestRevision)return;state.lastWlData=incoming;state.lastQueryKey=ids.join(',');state.batchCycle++;
   state.departures=retainDepartures(state.departures,incoming,ids);state.lastRefresh=new Date().toISOString();state.apiFailures=0;state.retryAt=0;state.fetchError='';saveDepartureCache();
  }
 }catch(error){if(controller.signal.aborted||revision!==state.requestRevision)return;state.apiFailures++;state.retryAt=Date.now()+retryDelay(state.apiFailures,error.upstreamStatus||error.status);state.fetchError=apiErrorMessage(error);
  clearTimeout(state.nextFetchTimer);state.nextFetchTimer=setTimeout(()=>{if(!document.hidden)void refreshDepartures();},state.retryAt-Date.now()+100);
 }finally{state.fetchLock=false;if(state.monitorRequest===controller)state.monitorRequest=null;if(state.refreshPending){state.refreshPending=false;queueMicrotask(()=>void refreshDepartures());}}
 if(controller.signal.aborted||revision!==state.requestRevision)return;
 const rail=railDepartures(state.rail,railStopIds,new Date());state.departures=[...retainDepartures(state.departures),...rail];
 render();
}
async function walkingMatrix(){if(document.hidden||!state.settings.enableRouting||!locationNow().reliable||!state.position||state.manual||state.routingLock||!state.nearby.length||Date.now()-state.lastRouteAt<75_000)return;state.lastRouteAt=Date.now();const stops=state.focusedConnection?[findStop(state.focusedConnection.stopId)].filter(Boolean):state.nearby.slice(0,10);state.routingLock=true;const base=state.settings.routingBase||DEFAULTS.routingBase;const payload={sources:[{lat:state.position.lat,lon:state.position.lon}],targets:stops.map(s=>({lat:s.lat,lon:s.lon})),costing:'pedestrian',units:'kilometers'};
  try{const u=`${base}/sources_to_targets?json=${encodeURIComponent(JSON.stringify(payload))}`;const res=await fetch(u,{headers:{'X-Client-Id':'foama-wien'}});if(!res.ok)throw Error('Routingdienst nicht erreichbar');const data=await res.json();const results=data.sources_to_targets?.[0]||[];for(let i=0;i<stops.length;i++){const target=results[i];if(target&&Number.isFinite(target.distance)&&target.distance>0&&target.distance<15){state.routes.set(stops[i].id,{meters:Math.round(target.distance*1000),real:true});}}render();}catch(e){/* Fall back to transparently labelled air distance estimate. */}finally{state.routingLock=false;}}
function setView(view){favoriteMenus.close();state.settings.view=view;saveSettings();render();void refreshDepartures(true);}
function configureUI(){$('modeFilters').innerHTML=MODE_CHOICES.map(([id])=>modeButtonMarkup(id,state.settings.modes[id]!==false)).join('');$('radius').value=state.settings.radius;$('radiusValue').textContent=`${state.settings.radius} m`;$('speed').value=state.settings.speed;$('speedValue').textContent=state.settings.speed.toFixed(1).replace('.',',')+' km/h';$('buffer').value=state.settings.buffer;$('bufferValue').textContent=state.settings.buffer+' Min.';$('apiBase').value=state.settings.proxyBase||'';$('routingConsent').checked=!!state.settings.enableRouting;$('motionSaving').checked=state.settings.motionBatterySaving===true;$('version').textContent='v'+state.config.version;configureFilters();}
function configureFilters(){const collapsed=state.settings.filtersCollapsed===true;$('filterBody').hidden=collapsed;$('filterSummary').hidden=!collapsed;$('toggleFilters').setAttribute('aria-expanded',String(!collapsed));$('filterChevron').textContent=collapsed?'⌄':'⌃';$('filterSummary').innerHTML=compactFiltersMarkup(state.settings.modes,state.settings.radius);$('filterRadius').hidden=!collapsed;$('filterRadius').textContent=state.settings.radius+' m';}
function toggleFav(f){favoriteMenus.close();const i=state.favorites.findIndex(x=>favoriteKey(x)===favoriteKey(f));if(i>=0)state.favorites.splice(i,1);else state.favorites.push(f);saveFavorites();render();}
const favoriteDepartureCache=new Map();
async function favoriteConnections(stop){
 const existing=connectionsAtStation(state.departures,stop);
 if(existing.length)return {connections:existing,notice:'Linie und Richtung auswählen. Die zuletzt geladenen Abfahrten werden verwendet.'};
 if(stop.provider==='rail')return {connections:connectionsAtStation(railDepartures(state.rail,stop.platformIds||[stop.id.slice(5)],new Date()),stop),notice:'Verbindungen aus dem importierten ÖBB-Sollfahrplan.'};
 let globalLast=0;try{globalLast=Number(localStorage.getItem(WL_RATE_KEY)||0);}catch{}
 const remaining=Math.max(Math.max(state.lastWlFetch,globalLast)+30_000,state.retryAt)-Date.now();
 if(remaining>0)return {connections:[],notice:`Bitte noch ${Math.ceil(remaining/1000)} Sekunden warten und dann „Linien & Richtungen laden“ antippen (API-Fair-Use). Die ganze Haltestelle kannst du sofort speichern.`};
 if(document.hidden)throw Error('Zum Laden der Verbindungen die App geöffnet lassen.');
 const now=Date.now();state.lastWlFetch=now;try{localStorage.setItem(WL_RATE_KEY,String(now));}catch{}
 let departures;try{departures=await fetchWl([stop]);state.apiFailures=0;state.retryAt=0;state.fetchError='';}catch(error){state.apiFailures++;state.retryAt=Date.now()+retryDelay(state.apiFailures,error.upstreamStatus||error.status);state.fetchError=apiErrorMessage(error);updateAppStatus();throw new Error(state.fetchError);}
 favoriteDepartureCache.set(stop.id,{departures,at:Date.now()});if(favoriteDepartureCache.size>24)favoriteDepartureCache.delete(favoriteDepartureCache.keys().next().value);
 state.departures=retainDepartures(state.departures,departures,stop.rbl);saveDepartureCache();render();
 return {connections:connectionsAtStation(departures,stop)};
}
function openFavoritePicker(stopId=''){
 openStationFavoritePicker({dialog:$('favoriteDialog'),root:$('favoriteForm'),stops:state.stops,nearby:state.nearby,initialStop:findStop(stopId),getFavorites:()=>state.favorites,
  routeBadge,loadConnections:favoriteConnections,onSave:favorite=>{
   if(state.favorites.some(item=>favoriteKey(item)===favoriteKey(favorite)))return;
   const cached=favoriteDepartureCache.get(favorite.stopId),stop=findStop(favorite.stopId);
   if(cached&&stop&&Date.now()-cached.at<90_000){const ids=new Set(stop.rbl||[]);state.departures=[...state.departures.filter(d=>d.provider!=='wl'||!ids.has(d.rbl)),...cached.departures];}
   state.favorites.push(favorite);saveFavorites();state.settings.view='fav';saveSettings();render();
   if($('locationMapDialog').open){syncMapFavorites();$('positionMapFeedback').textContent=favorite.route?`${favorite.stopName}: ${favorite.route} → ${favorite.towards} gespeichert.`:`${favorite.stopName} ist als Haltestelle gespeichert.`;}
  }});
}
let leafletLoading=null;
async function ensureLeaflet(){
 if(window.L)return window.L;if(leafletLoading)return leafletLoading;
 leafletLoading=new Promise((resolve,reject)=>{
  if(!document.querySelector('[data-leaflet-css]')){const css=document.createElement('link');css.rel='stylesheet';css.href='./vendor/leaflet/leaflet.css';css.dataset.leafletCss='';document.head.append(css);}
  const script=document.createElement('script'),timer=setTimeout(()=>{script.remove();reject(Error('Kartenmodul nicht verfügbar'));},10000);
  script.src='./vendor/leaflet/leaflet.js';script.onload=()=>{clearTimeout(timer);window.L?resolve(window.L):reject(Error('Kartenmodul fehlt'));};script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('Kartenmodul nicht verfügbar'));};document.head.append(script);
 }).catch(error=>{leafletLoading=null;throw error;});return leafletLoading;
}
function mapStationPopup(stop){
 const lines=stationLines(stop,learnedFor(stop)).filter(line=>state.settings.modes[line.mode]!==false),address=state.addressLookup?.(stop);
 return `<div class="station-popup"><strong>${escape(stop.name)}</strong><div class="station-badges">${lines.map(line=>routeBadge(line.route,line.mode)).join('')}</div><p>${stationAddressMarkup(stop,state.stationAddresses,address,{escape})}</p><div class="map-station-actions"><button type="button" class="small-btn" data-map-station="${escape(stop.id)}">Fußweg &amp; Navigation →</button><button type="button" class="small-btn map-favorite-btn" data-map-favorite="${escape(stop.id)}">☆ Ganze Haltestelle merken</button><button type="button" class="small-btn" data-map-lines="${escape(stop.id)}">☆ Linien &amp; Richtungen wählen</button></div></div>`;
}
async function drawPositionMap(){
 const dialog=$('locationMapDialog'),position=state.position;if(!position||!dialog.open)return;
 const token=state.positionMapGeneration=(state.positionMapGeneration||0)+1,stops=nearbyMapStops(state.stops,position,state.settings,learnedFor);
 const accuracy=state.manual?0:Math.max(position.accuracy||0,state.locationData.coarseReceived?state.locationData.latest?.accuracy||0:0);
 $('positionMapInfo').textContent=`${locationDescription().title} · ${$('locationAddress').textContent} · ${$('locationMeta').textContent}`;
 $('positionMapSummary').textContent=`${stops.length}${stops.length===60?' (max. 60)':''} passende Haltestellen · ${state.settings.radius} m Suchradius · Stationen antippen zeigt Linien, Adresse und Favoriten für Haltestelle oder Linie/Richtung.`;
 $('positionMapListTitle').textContent=`Haltestellen als Liste (${stops.length})`;
 $('positionMapStations').innerHTML=stops.map(stop=>`<div class="map-station-item">${mapStationPopup(stop)}</div>`).join('')||'<p>Keine passenden Stationen im gewählten Radius. Prüfe Verkehrsmittel und Suchradius.</p>';
 $('externalPosition').href=`https://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lon}#map=16/${position.lat}/${position.lon}`;
 $('googlePosition').href=googleMapsLocation(position);$('positionMapTileStatus').hidden=true;syncMapFavorites();
 const holder=$('positionMapHolder');if(state.positionMap){state.positionMap.remove();state.positionMap=null;}holder.innerHTML='<p>Karte wird geladen …</p>';
 try{
  const L=await ensureLeaflet();if(!dialog.open||token!==state.positionMapGeneration)return;holder.innerHTML='';
  const map=L.map(holder,{zoomControl:true,attributionControl:true}).setView([position.lat,position.lon],16);state.positionMap=map;
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap-Mitwirkende'}).addTo(map);let tileErrorLogged=false;
  tiles.on('tileerror',()=>{if(!dialog.open||token!==state.positionMapGeneration)return;$('positionMapTileStatus').hidden=false;$('positionMapTileStatus').textContent='Kartenhintergrund nicht verfügbar. Haltestellen, Linien und die Liste bleiben nutzbar.';if(!tileErrorLogged){debugging.record({kind:'map',outcome:'error',code:'network'});tileErrorLogged=true;}});
  const radius=L.circle([position.lat,position.lon],{radius:state.settings.radius,color:'#299c82',weight:1.5,dashArray:'5 6',fill:false}).addTo(map),bounds=radius.getBounds();
  if(Number.isFinite(accuracy)&&accuracy>0){const circle=L.circle([position.lat,position.lon],{radius:accuracy,color:'#299c82',weight:1,fillOpacity:.12}).addTo(map);bounds.extend(circle.getBounds());}
  L.circleMarker([position.lat,position.lon],{radius:7,color:'#103c38',fillColor:'#73e0b7',fillOpacity:1,weight:2}).addTo(map).bindPopup(locationDescription().title);
  for(const stop of stops){
   const lines=stationLines(stop,learnedFor(stop)).filter(line=>state.settings.modes[line.mode]!==false),shown=lines.slice(0,2),width=shown.length>1?64:32;
   const icon=L.divIcon({className:'station-map-marker',html:shown.map(line=>routeBadge(line.route,line.mode)).join(''),iconSize:[width,26],iconAnchor:[width/2,13]});
   const marker=L.marker([stop.lat,stop.lon],{icon,title:stop.name,keyboard:true}).addTo(map).bindPopup(mapStationPopup(stop));
   marker.on('popupopen',syncMapFavorites);marker.getElement()?.setAttribute('role','button');marker.getElement()?.setAttribute('aria-label',stop.name+': '+lines.map(line=>line.route).join(', '));bounds.extend([stop.lat,stop.lon]);
  }
  map.fitBounds(bounds.pad(.15),{maxZoom:17});setTimeout(()=>{if(dialog.open&&state.positionMap===map)map.invalidateSize();},100);
 }catch{
  if(!dialog.open||token!==state.positionMapGeneration)return;state.positionMap?.remove();state.positionMap=null;
  holder.innerHTML='<p class="map-fallback">Die Karte konnte nicht geladen werden. Die Haltestellenliste mit Linien und Adressen ist weiterhin verfügbar. Du kannst die Position auch in Google Maps öffnen.</p>';
  debugging.record({kind:'map',outcome:'error',code:window.L?'unexpected':'network'});
 }
}
function syncMapFavorites(){
 for(const button of $('locationMapDialog').querySelectorAll('[data-map-favorite]')){
  const stop=findStop(button.dataset.mapFavorite),saved=state.favorites.some(f=>f.stopId===stop?.id&&!f.route&&!f.towards);
  button.disabled=saved;button.textContent=saved?'★ Haltestelle gespeichert':'☆ Ganze Haltestelle merken';
  button.setAttribute('aria-label',saved?`${stop?.name}: als Haltestelle gespeichert`:`${stop?.name}: Haltestelle als Favorit speichern`);
 }
}
function openLocationMap(){if(!state.position)return;$('positionMapFeedback').textContent='';$('locationMapDialog').showModal();void drawPositionMap();}
function renderStationAddress(){
 const stop=state.routeStop;if(!stop)return;
 const address=state.addressLookup?.(stop);$('routeTraffic').innerHTML=stationNotices(stop);
 $('stationAddress').innerHTML=stationAddressMarkup(stop,state.stationAddresses,address,{escape});
}
async function openRoute(stop){
  if(!stop)return;
  state.routeStop=stop;renderStationAddress();
  $('googleRoute').href=googleMapsWalk(stop,state.manual?state.position:null);
  if(!state.position){
   $('routeInfo').textContent=`${stop.name} · Für die eingebettete Fußwegroute fehlt eine Startposition. Google Maps kann deinen aktuellen Telefonstandort verwenden.`;
   const params=new URLSearchParams({bbox:[stop.lon-.003,stop.lat-.002,stop.lon+.003,stop.lat+.002].join(','),marker:`${stop.lat},${stop.lon}`,layer:'mapnik'});
   $('mapHolder').innerHTML=`<iframe title="OpenStreetMap: Haltestelle ${escape(stop.name)}" loading="lazy" referrerpolicy="no-referrer" src="https://www.openstreetmap.org/export/embed.html?${escape(params)}"></iframe>`;
   $('externalRoute').href=`https://www.openstreetmap.org/?mlat=${stop.lat}&mlon=${stop.lon}#map=17/${stop.lat}/${stop.lon}`;
   $('externalRoute').textContent='Station in OpenStreetMap öffnen ↗';$('routeDialog').showModal();return;
  }
  const d=$('routeDialog'),from=state.position;
  const startDescription=state.manual?'manueller Startpunkt':locationNow().reliable?'dein aktueller Standort':'ungefähre / letzte Position';
  $('routeInfo').textContent=`${stop.name} · ${walkText(stop)} · Start: ${startDescription}`;
  $('externalRoute').textContent='Route in OpenStreetMap öffnen ↗';
  const bbox=[Math.min(stop.lon,from.lon)-.002,Math.min(stop.lat,from.lat)-.002,Math.max(stop.lon,from.lon)+.002,Math.max(stop.lat,from.lat)+.002];
  const params=new URLSearchParams({bbox:bbox.join(','),marker:`${stop.lat},${stop.lon}`,layer:'mapnik'});
  const holder=$('mapHolder');holder.innerHTML=`<p>Karte und Fußweg werden geladen …</p>`;
  const route=`${from.lat},${from.lon};${stop.lat},${stop.lon}`;
  $('externalRoute').href=`https://www.openstreetmap.org/directions?engine=fossgis_valhalla_foot&route=${encodeURIComponent(route)}`;d.showModal();
  let leaflet=null,walkGeo=null;
  try{
    const payload={locations:[{lat:from.lat,lon:from.lon},{lat:stop.lat,lon:stop.lon}],costing:'pedestrian',format:'osrm',shape_format:'geojson',units:'kilometers'};
    const u=`${state.settings.routingBase||DEFAULTS.routingBase}/route?json=${encodeURIComponent(JSON.stringify(payload))}`;
    const result=await fetchJson(u,12000);
    walkGeo=result.routes?.[0]?.geometry;
    leaflet=await ensureLeaflet();
    if(!d.open)return;
    holder.innerHTML='';const map=leaflet.map(holder,{zoomControl:true,attributionControl:true});
    leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap-Mitwirkende'}).addTo(map);
    leaflet.circleMarker([from.lat,from.lon],{radius:7,color:'#36c6a1',fillColor:'#55e4ba',fillOpacity:.95}).addTo(map).bindPopup('Dein Standort');
    leaflet.marker([stop.lat,stop.lon]).addTo(map).bindPopup(stop.name);
    if(walkGeo?.coordinates?.length){
      const coords=walkGeo.coordinates.map(([lon,lat])=>[lat,lon]);leaflet.polyline(coords,{color:'#1e9d7f',weight:5,opacity:.94}).addTo(map);map.fitBounds(leaflet.latLngBounds(coords).pad(.25));
      const km=result.routes?.[0]?.distance/1000;if(Number.isFinite(km)){state.routes.set(stop.id,{meters:Math.round(km*1000),real:true});$('routeInfo').textContent=`${stop.name} · ${(km*1000).toFixed(0)} m entlang der Fußwege · ${Math.ceil(walkingMinutes(km*1000,state.settings.speed))} Min. · Start: ${startDescription}`;}
    }else{map.fitBounds([[from.lat,from.lon],[stop.lat,stop.lon]]);}
    setTimeout(()=>map.invalidateSize(),150);
    d.addEventListener('close',()=>map.remove(),{once:true});
  }catch(error){
    if(!d.open)return;
    holder.innerHTML=`<iframe title="OpenStreetMap: Haltestelle ${escape(stop.name)}" loading="lazy" referrerpolicy="no-referrer" src="https://www.openstreetmap.org/export/embed.html?${escape(params)}"></iframe><div class="map-legend" style="padding:8px"><span>Fußweg konnte hier nicht geladen werden. Über „Route in OpenStreetMap öffnen“ bekommst du die Wegführung.</span></div>`;
  }
}
function saveFile(name,text){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function validateFavorites(obj){const favs=obj?.favorites;if(!Array.isArray(favs)||favs.length>1000)throw Error('Keine gültige Favoriten-Datei');return dedupeFavorites(favs.filter(x=>x&&typeof x.stopId==='string'&&x.stopId.length<100&&typeof(x.route||'')==='string'&&typeof(x.towards||'')==='string').map(x=>({stopId:x.stopId,stopName:String(x.stopName||'').slice(0,120),route:String(x.route||'').slice(0,40),towards:String(x.towards||'').slice(0,100)})));}
function bindEvents(){const persistDetails=e=>{const key=e.target.dataset?.persistKey;if(key)e.target.open?state.openDetails.add(key):state.openDetails.delete(key);};$('content').addEventListener('toggle',persistDetails,true);$('routeTraffic').addEventListener('toggle',persistDetails,true);$('connectionContent').addEventListener('toggle',persistDetails,true);
 $('connectionBack').addEventListener('click',()=>connectionNavigation.back());$('connectionRefresh').addEventListener('click',()=>void refreshDepartures(true));
 $('connectionContent').addEventListener('click',e=>{const button=e.target.closest('button');if(!button||!state.focusedConnection)return;const target=state.focusedConnection,stop=findStop(target.stopId);
  if(button.dataset.connectionDirection!==undefined)connectionNavigation.open({...target,towards:button.dataset.connectionDirection});
  else if(button.id==='connectionFavorite')toggleFav({stopId:stop.id,stopName:stop.name,route:target.route,towards:target.towards});
  else if(button.id==='connectionMap')openRoute(stop);
 });
 const clickView=e=>setView(e.currentTarget.id.toLowerCase().includes('fav')?'fav':'near');for(const id of ['tabNear','tabFav'])$(id).addEventListener('click',clickView);
  $('settingsToggle').addEventListener('click',()=>{$('settings').showModal();void notifications?.refresh();});bindAppShare();
  $('toggleFilters').addEventListener('click',()=>{state.settings.filtersCollapsed=!state.settings.filtersCollapsed;saveSettings();configureFilters();});
  $('resetModes').addEventListener('click',()=>{state.settings.modes={...DEFAULTS.modes};saveSettings();configureUI();refreshNearby(true);void refreshDepartures();});
  $('favoriteSort').addEventListener('click',e=>{const button=e.target.closest('[data-favorite-sort]');if(!button||button.dataset.favoriteSort===state.settings.favoriteSort)return;favoriteMenus.close();state.settings.favoriteSort=button.dataset.favoriteSort==='distance'?'distance':'manual';saveSettings();render();void refreshDepartures(true);});
  const toggleMode=mode=>{
   const focused=document.activeElement?.closest?.('[data-mode]'),container=focused?.parentElement?.closest?.('#modeFilters,#filterSummary')?.id;
   state.settings.modes[mode]=state.settings.modes[mode]===false;saveSettings();configureUI();
   if(container)$(container).querySelector(`[data-mode="${mode}"]`)?.focus({preventScroll:true});
   refreshNearby(true);void refreshDepartures();
  };
  bindModeToggles($('modeFilters'),toggleMode);bindModeToggles($('filterSummary'),toggleMode);
  bindLocationDisclosure($('toggleLocation'),$('locationBody'),$('locationChevron'));
  let radiusWait;$('radius').addEventListener('input',e=>{$('radiusValue').textContent=e.target.value+' m';clearTimeout(radiusWait);radiusWait=setTimeout(()=>{state.settings.radius=Number(e.target.value);saveSettings();configureFilters();refreshNearby(true);void refreshDepartures(true);},350);});
  $('speed').addEventListener('input',e=>{state.settings.speed=Number(e.target.value);$('speedValue').textContent=state.settings.speed.toFixed(1).replace('.',',')+' km/h';saveSettings();render();});
  $('buffer').addEventListener('input',e=>{state.settings.buffer=Number(e.target.value);$('bufferValue').textContent=e.target.value+' Min.';saveSettings();render();});
  $('apiBase').addEventListener('change',e=>{state.settings.proxyBase=e.target.value.trim().replace(/\/$/,'');state.liveSource='auto';saveSettings();});
  $('routingConsent').addEventListener('change',e=>{state.settings.enableRouting=e.target.checked;saveSettings();if(e.target.checked){state.lastRouteAt=0;void walkingMatrix();}else{state.routes.clear();render();}});
  $('motionSaving').addEventListener('change',e=>{state.settings.motionBatterySaving=e.target.checked;saveSettings();locationControl.setBatterySaving(e.target.checked);});
  $('themeChoices').addEventListener('click',e=>{const button=e.target.closest('[data-theme-choice]');if(!button||button.dataset.themeChoice===state.settings.theme)return;state.settings.theme=button.dataset.themeChoice;saveSettings();themeControl.set(state.settings.theme);});
  $('locationMap').addEventListener('click',openLocationMap);const stationMapClick=e=>{
   const button=e.target.closest('button');if(!button)return;
   if(button.dataset.mapLines){const stop=findStop(button.dataset.mapLines);if(stop)openFavoritePicker(stop.id);return;}
   if(button.dataset.mapFavorite){
    const stop=findStop(button.dataset.mapFavorite),result=addStationFavorite(state.favorites,stop);
    if(result.added){state.favorites=result.favorites;saveFavorites();render();}
    syncMapFavorites();$('positionMapFeedback').textContent=stop?`${stop.name} ist als Haltestelle gespeichert.`:'';return;
   }
   const id=button.dataset.mapStation;if(!id)return;$('locationMapDialog').close();void openRoute(findStop(id));
  };$('positionMapHolder').addEventListener('click',stationMapClick);$('positionMapStations').addEventListener('click',stationMapClick);$('recenterLocationMap').addEventListener('click',()=>void drawPositionMap());$('closeLocationMap').addEventListener('click',()=>$('locationMapDialog').close());$('locationMapDialog').addEventListener('close',()=>{state.positionMapGeneration++;state.positionMap?.remove();state.positionMap=null;});
  $('requestGps').addEventListener('click',requestLocation);$('activateLocation').addEventListener('click',requestLocation);
  $('chooseStop').addEventListener('click',()=>{const q=$('manualStop').value.trim().toLocaleLowerCase('de-AT');const stop=state.stops.find(s=>s.name.toLocaleLowerCase('de-AT')===q)||state.stops.find(s=>s.name.toLocaleLowerCase('de-AT').includes(q));if(!q||!stop){alert('Haltestelle nicht im importierten Katalog gefunden.');return;}locationControl.stop();setPosition({lat:stop.lat,lon:stop.lon},true);$('settings').close();});
  $('stopsFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const stops=enrichStops(parseWlStopsCsv(await f.text()),state.bundledStops);if(!stops.length)throw Error('Keine gültigen Haltepunkte gefunden');state.stops=[...state.stops.filter(s=>s.provider!=='wl'),...stops];await datasetPut('wl',stops).catch(()=>localStorage.setItem(keys.stops,JSON.stringify(stops)));state.stopsUnavailable=false;refreshNearby(true);render();alert(`${stops.length} Haltestellen importiert.`);}catch(err){alert(err.message);}});
  $('railFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.stops)||!Array.isArray(data.departures))throw Error('Ungültige ÖBB-Fahrplandatei');state.rail=data;state.stops=[...state.stops.filter(s=>s.provider!=='rail'),...data.stops];await datasetPut('rail',data).catch(()=>{throw Error('Fahrplan ist zu groß für lokale Speicherung. Bitte die vorbereitete rail.json statisch ausliefern.');});refreshNearby(true);void refreshDepartures(true);alert(`${data.stops.length} Bahnstationen / ${data.departures.length} Fahrplanabfahrten geladen.`);}catch(err){alert(err.message);}});
  $('exportFav').addEventListener('click',()=>{const journeys=transferableJourneys(retrieve('foama.journeyFavorites.v1',[]));saveFile(jsonExportName('favoriten'),JSON.stringify({format:journeys.length?'foama-favorites-v2':'foama-favorites-v1',favorites:state.favorites,...(journeys.length?{journeys}:{})},null,2));});
  $('importFav').addEventListener('change',async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>512*1024)throw Error('Favoriten-Datei zu groß.');const value=JSON.parse(await f.text());if(value?.format==='foama-favorites-v2'){const old=localStorage.getItem('foama.journeyFavorites.v1'),merged=mergeTransferBundle({favorites:state.favorites,journeys:retrieve('foama.journeyFavorites.v1',[])},value);try{localStorage.setItem('foama.journeyFavorites.v1',JSON.stringify(merged.journeys));localStorage.setItem(keys.favorites,JSON.stringify(merged.favorites));}catch(error){if(old===null)localStorage.removeItem('foama.journeyFavorites.v1');else localStorage.setItem('foama.journeyFavorites.v1',old);throw error;}state.favorites=merged.favorites;render();alert(`${merged.added} Stationsfavoriten und ${merged.addedJourneys} Routen hinzugefügt, ${merged.updatedJourneys} aktualisiert.`);}else{const fs=validateFavorites(value);state.favorites=dedupeFavorites([...state.favorites,...fs]);saveFavorites();render();alert(`${fs.length} Favoriten verarbeitet.`);}}catch(err){alert(err.message);}});
  $('closeRoute').addEventListener('click',()=>{$('routeDialog').close();if(state.map){state.map.remove();state.map=null;}});$('closeFavoriteDialog').addEventListener('click',()=>$('favoriteDialog').close());$('favoriteDialog').addEventListener('close',()=>void refreshDepartures(true));$('closeTransfer').addEventListener('click',()=>$('transferDialog').close());
  $('content').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const x=b.dataset;
    if(x.connectionStop){state.connectionOpener=b;connectionNavigation.open({stopId:x.connectionStop,route:x.connectionRoute,towards:x.connectionTowards,mode:x.connectionMode});return;}
    if(x.toggle){state.expanded.has(x.toggle)?state.expanded.delete(x.toggle):state.expanded.add(x.toggle);render();void refreshDepartures(true);return;}
    if(x.stopFav){const stop=findStop(x.stopFav);toggleFav({stopId:stop.id,stopName:stop.name,route:'',towards:''});return;}
    if(x.favoriteLine){const stop=findStop(x.favoriteLine);toggleFav({stopId:stop.id,stopName:stop.name,route:x.route,towards:x.towards});return;}
    if(x.routeMap){const stop=findStop(x.routeMap);openRoute(stop);return;}
    if(x.removeFav!==undefined){const index=state.favorites.findIndex(f=>favoriteKey(f)===x.removeFav);favoriteMenus.close();if(index>=0){state.favorites.splice(index,1);saveFavorites();render();}return;}
    if(x.removeFavStation!==undefined){favoriteMenus.close();state.favorites=removeFavoriteStation(state.favorites,x.removeFavStation);saveFavorites();render();return;}
    if(x.moveFavStation!==undefined){
      const key='station:'+x.moveFavStation;favoriteMenus.close();if(state.settings.favoriteSort==='distance')return;
      const result=moveFavoriteStation(state.favorites,x.moveFavStation,Number(x.delta));if(!result.moved)return;
      state.favorites=result.favorites;saveFavorites();render();
      Array.from($('content').querySelectorAll('.favorite-menu')).find(menu=>menu.dataset.favoriteMenu===key)?.querySelector('summary')?.focus({preventScroll:true});
      void refreshDepartures(true);return;
    }
    if(x.addFav!==undefined)openFavoritePicker();if(x.openSettings!==undefined)$('settings').showModal();});
  for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>void refreshDepartures());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopActive();else startActive();});window.addEventListener('pagehide',stopActive);
}
async function prepareTransfer(){if(location.hash.includes('session='))location.replace('./transfer.html'+location.hash);}
async function init(){try{const config=await fetchJson('./config.json?v=0.6.6');state.config={...state.config,...config};}catch{}configureUI();bindEvents();appUpdates.start();if(['debugging','settings'].some(key=>new URLSearchParams(location.search).has(key)))$('settings').showModal();
  try{const baked=await fetchJson('./data/stops.json?v=0.6.6');state.stops=Array.isArray(baked.stops)?baked.stops:[];state.bundledStops=state.stops;}catch{}
  const storedStops=(await datasetGet('wl'))||retrieve(keys.stops,[]);if(storedStops.length)state.stops=[...state.stops.filter(s=>s.provider!=='wl'),...enrichStops(storedStops,state.bundledStops)];
  try{state.rail=(await datasetGet('rail'))||retrieve(keys.rail,null)||await fetchJson('./data/rail.json');if(state.rail?.stops)state.stops.push(...state.rail.stops);}catch{}
  state.stopsUnavailable=!state.stops.length;$('stopNames').innerHTML=state.stops.slice(0,9000).map(s=>`<option value="${escape(s.name)}"></option>`).join('');
  // Request a prepared WL index from the proxy only if the static bundle contains none.
  if(state.stopsUnavailable&&(!state.config.staticOnly||state.settings.proxyBase||state.config.apiBase)){try{const api=state.settings.proxyBase||state.config.apiBase||(location.origin!=='null'?location.origin:'');if(!api)throw Error('Kein Index-Backend konfiguriert');const index=await fetchJson(`${api}/api/stops-index`,10_000);if(index.stops?.length){state.stops=index.stops;state.stopsUnavailable=false;$('stopNames').innerHTML=state.stops.map(s=>`<option value="${escape(s.name)}"></option>`).join('');}}catch{}}
  void fetchJson('./data/station-addresses.json?v=0.6.6').then(data=>{state.stationAddresses=data;renderStationAddress();}).catch(()=>{});
  void fetchJson('./data/streets.json?v=0.6.6').then(data=>{state.addressLookup=createAddressLookup(data);renderLocation();renderStationAddress();}).catch(()=>{state.addressLookup=()=>null;renderStationAddress();});
  for(const stop of state.stops.filter(s=>s.provider==='rail')){const departures=(state.rail?.departures||[]).filter(d=>(stop.platformIds||[stop.id.slice(5)]).includes(d.stop));stop.lines=[...new Map(departures.map(d=>[(d.mode||'regional')+'|'+d.route,{route:d.route,mode:d.mode||'regional'}])).values()];}
  if(['#favoriten','#naehe'].includes(location.hash)){state.settings.view=location.hash==='#favoriten'?'fav':'near';saveSettings();}saveFavorites();connectionNavigation.sync();render();await prepareTransfer();void locationControl.init();startActive();if(state.stopsUnavailable)msgStatus('Haltestellenkatalog fehlt · CSV importieren oder Serverdaten aktivieren',true);
  notifications=createNotifications({getFavorites:()=>state.favorites,getStops:()=>state.stops,getJourneys:()=>retrieve('foama.journeyFavorites.v1',[])});
  if('serviceWorker'in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js').then(registration=>{appUpdates.setRegistration(registration);return notifications.init();}).catch(()=>notifications.init());
  else void notifications.init();
}
init().catch(err=>{msgStatus('Startfehler: '+err.message,true);debugging.record({kind:'app',outcome:'error',code:'unexpected'});console.error(err);});
