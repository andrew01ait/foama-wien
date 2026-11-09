import {availableDeparts,countdownMinutes} from './core.mjs?v=0.6.1';
import {departureAtStation} from './connection-detail.mjs?v=0.6.1';
import {departureIsFresh} from './departure-cache.mjs?v=0.6.1';
import {journeyDirectionMatches} from './journey-planning.mjs?v=0.6.1';
export function journeyStationMarkup(stop,departures,{escape,badge,now=Date.now(),error='',connection=null}={}){
 const groups=availableDeparts(departures.filter(d=>departureAtStation(stop,d)&&(!connection||d.route===connection.route&&d.mode===connection.mode&&journeyDirectionMatches(connection.towards,d.towards))),{modes:{}},now);
 const clock=value=>new Date(value).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'});
 return `<header class="route-station-heading"><div class="eyebrow">${connection?'DEINE VERBINDUNG':'ALLE ABFAHRTEN'}</div><h1 id="journeyStationTitle" tabindex="-1">${escape(stop.name)}</h1>${connection&&!groups.length?`<div class="journey-line-heading">${badge(connection)}<strong>→ ${escape(connection.towards)}</strong></div>`:''}<p>${connection?'Gewählte Linie und Richtung':'Alle Linien und Richtungen'} · Aktualisierung alle 30 Sekunden</p></header>${error?`<p class="journey-data-warning">${escape(error)}</p>`:''}<div class="route-station-departures">${groups.map(group=>{
  const [first,second]=group.departures,fresh=!error&&departureIsFresh(first,now),label=!fresh?'Älter':first.quality==='live'?'LIVE':'Fahrplan';
  return `<article class="route-station-row"><div>${badge(group)}<strong>→ ${escape(group.towards)}</strong><small>${escape(clock(first.actual))}${first.platform?' · Bahnsteig '+escape(first.platform):''}</small></div><div class="route-station-times"><strong>${countdownMinutes(first.actual,now)}′</strong><span>${label}</span>${second?`<small>danach ${countdownMinutes(second.actual,now)}′</small>`:''}</div></article>`;
 }).join('')||'<p class="journey-empty">Noch keine aktuellen Abfahrten bestätigt. Die Station wird innerhalb des gemeinsamen Abrufintervalls geladen.</p>'}</div>`;
}
