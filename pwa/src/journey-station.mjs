import {availableDeparts,countdownMinutes} from './core.mjs?v=0.11.19';
import {departureAtStation} from './connection-detail.mjs?v=0.11.19';
import {departureIsFresh} from './departure-cache.mjs?v=0.11.19';
import {vehicleAccessibilityMarkup,departureCorrectionMarkup} from './departure-indicators.mjs?v=0.11.19';
import {journeyDirectionMatches} from './journey-planning.mjs?v=0.11.19';
import {trafficAtStation} from './traffic-info.mjs?v=0.11.19';
import {warningsForTargets,stationNoticeSections,trafficNoticeMarkup,trafficNoticeBadges} from './warning-panel.mjs?v=0.11.19';

export function journeyTrafficNotices(journey,stops,cache,{now=Date.now()}={}){
 const targets=(journey?.legs||[]).filter(leg=>leg.mode!=='walk'&&leg.route).flatMap(leg=>[leg.from,leg.to].map(point=>({stop:stops.find(stop=>stop.id===point?.stopId),routes:[leg.route]})));
 return warningsForTargets(cache,targets,{now});
}
export function journeyNoticeMarkup(notices,{escape,badge,key,isOpen=()=>false,now=Date.now(),hasError=false}={}){
 const renderBadge=(route,mode)=>badge({route,mode});
 return stationNoticeSections(notices,{key,isOpen,escape,now,renderNotice:notice=>trafficNoticeMarkup(notice,{escape,renderBadge,hasError}),renderLines:rows=>trafficNoticeBadges(rows,{renderBadge})});
}
export function journeyStationMarkup(stop,departures,{escape,badge,now=Date.now(),error='',connection=null,trafficCache={},isNoticeOpen=()=>false}={}){
 const groups=availableDeparts(departures.filter(d=>departureAtStation(stop,d)&&(!connection||d.route===connection.route&&d.mode===connection.mode&&journeyDirectionMatches(connection.towards,d.towards))),{modes:{}},now);
 const clock=value=>new Date(value).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'});
 const notices=journeyNoticeMarkup(stop.provider==='wl'?trafficAtStation(trafficCache,stop,{routes:connection?[connection.route]:null,now}):[],{escape,badge,key:'journey-station:'+stop.id+':'+(connection?.route||''),isOpen:isNoticeOpen,now,hasError:!!error});
 return `<header class="route-station-heading"><div class="eyebrow">${connection?'DEINE VERBINDUNG':'ALLE ABFAHRTEN'}</div><h1 id="journeyStationTitle" tabindex="-1">${escape(stop.name)}</h1>${connection?`<div class="journey-line-heading">${badge(connection)}<strong>→ ${escape(connection.towards)}</strong></div>`:''}<p>${connection?'Gewählte Linie und Richtung':'Alle Linien und Richtungen'} · Aktualisierung alle 30 Sekunden</p></header>${notices}${error?`<p class="journey-data-warning">${escape(error)}</p>`:''}<div class="route-station-departures">${groups.map(group=>{
  const [first,second]=group.departures,fresh=first.source==='gtfs'||!error&&departureIsFresh(first,now),label=!fresh?'Älter':first.quality==='live'?'LIVE':'Fahrplan';
  return `<article class="route-station-row"><div>${badge(group)}<strong>→ ${escape(group.towards)}</strong><small>${escape(clock(first.actual))}${first.platform?' · Bahnsteig '+escape(first.platform):''}</small>${departureCorrectionMarkup(first,{now,hasError:!!error})}</div><div class="route-station-times"><strong>${countdownMinutes(first.actual,now)}′</strong><span>${label}${vehicleAccessibilityMarkup(first,{now,hasError:!!error})}</span>${second?`<small>danach ${countdownMinutes(second.actual,now)}′${vehicleAccessibilityMarkup(second,{now,hasError:!!error})}</small>`:''}</div></article>`;
 }).join('')||'<p class="journey-empty">Noch keine aktuellen Abfahrten bestätigt. Die Station wird innerhalb des gemeinsamen Abrufintervalls geladen.</p>'}</div>`;
}
