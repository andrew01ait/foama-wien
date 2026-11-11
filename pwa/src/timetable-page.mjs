import {createTimetable,timetableDate} from './timetable.mjs?v=0.11.2';
import {lineDayDepartures,hourlyTimetable,timetableHourKey,timetableDayOptions} from './line-timetable.mjs?v=0.11.2';
import {getCatalogue,putCatalogue} from './storage.mjs?v=0.11.2';
import {createThemeController} from './theme.mjs?v=0.11.2';
import {createTimetablePdf,timetablePdfName} from './timetable-pdf.mjs?v=0.11.2';
import {createLineMaps} from './line-maps.mjs?v=0.11.2';
import {pdfRoutePatterns,pdfMapViewport,createPdfMapBackground} from './timetable-pdf-map.mjs?v=0.11.2';

const $=id=>document.getElementById(id),escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const modes={metro:'U-Bahn',tram:'Straßenbahn',bus:'Bus',sbahn:'S-Bahn',regional:'Regionalzug',long:'Fernverkehr'};
const colors={U1:'#ed1c24',U2:'#a066aa',U3:'#f58220',U4:'#009a49',U6:'#9a6b38'};
const color=line=>/^N\d/.test(line.route)?'#162a63':colors[line.route]||(line.mode==='tram'?'#c13e45':line.mode==='metro'?'#3b6175':'#225a7c');
let theme='system';try{theme=JSON.parse(localStorage.getItem('foama.settings.v1')||'{}').theme;}catch{}createThemeController({preference:theme});
const timetable=createTimetable(),lineMaps=createLineMaps(),params=new URL(location.href).searchParams;
let index=null,manifest=null,line=null,request=null,revision=0,clockTimer=null,optionsToday=null,loadedStation=null,exporting=false;
function status(message){$('timetableStatus').textContent=message;}
function cancel(){revision++;request?.abort();request=null;}
const shortDate=day=>new Date(day+'T12:00Z').toLocaleDateString('de-AT',{timeZone:'Europe/Vienna'});
function renderMetadata(){
 const dateTime=value=>{const at=Date.parse(value);return Number.isFinite(at)?new Date(at).toLocaleString('de-AT',{timeZone:'Europe/Vienna',dateStyle:'medium',timeStyle:'short'}):'Nicht angegeben';};
 const check=manifest.sourceCheck;
 $('timetableMetadata').innerHTML=`<dl><dt>Veröffentlicht vom Anbieter</dt><dd>${manifest.sourcePublishedAt?escape(dateTime(manifest.sourcePublishedAt)):'Nicht angegeben'}</dd><dt>Quelldatei zuletzt geändert</dt><dd>${manifest.sourceLastModified?escape(dateTime(manifest.sourceLastModified)):"Nicht angegeben"}</dd><dt>Dateistand im Quellarchiv</dt><dd>${manifest.sourceArchiveDate?escape(shortDate(manifest.sourceArchiveDate)):'Nicht angegeben'}</dd><dt>In die App importiert</dt><dd>${escape(dateTime(manifest.generated))}</dd><dt>Fahrplan gültig</dt><dd>${shortDate(manifest.validFrom)}–${shortDate(manifest.validThrough)}</dd><dt>Quelle zuletzt geprüft</dt><dd>${check?.checkedAt?escape(dateTime(check.checkedAt)):'Noch nicht protokolliert'}</dd><dt>Ergebnis dieser Prüfung</dt><dd>${check?.status==='unchanged'?'Quelldatei unverändert (Prüfsumme)':check?.status==='changed'?'Neuere / geänderte Quelldatei gefunden':'Kein bestätigter Vergleich'}</dd></dl><p>Archivdateistand und Importdatum sind kein bestätigtes Veröffentlichungsdatum. Die letzte Quellenprüfung ist ein gespeicherter Prüfstand. Gültigkeit allein bestätigt keine zwischenzeitlichen Fahrplanänderungen.</p>`;
}
const selectedStop=()=>line?.stops.find(stop=>stop.id===$('timetableStop').value);
function renderLines(){
 const search=$('lineSearch').value.trim().toLocaleLowerCase('de-AT');
 const rows=index.lines.filter(item=>(item.route+' '+(modes[item.mode]||'')).toLocaleLowerCase('de-AT').includes(search));
 $('timetableLines').innerHTML=Object.entries(modes).map(([mode,label])=>{const group=rows.filter(item=>item.mode===mode).sort((a,b)=>a.route.localeCompare(b.route,'de-AT',{numeric:true}));return !group.length?'':`<section class="line-mode-group"><h3>${label}</h3><div class="timetable-line-list">${group.map(item=>`<a href="./fahrplan.html?${new URLSearchParams({linie:item.route,verkehrsmittel:item.mode})}" aria-label="Fahrplan ${label} ${escape(item.route)}"><span class="route-pill" style="background:${color(item)}">${escape(item.route)}</span></a>`).join('')}</div></section>`;}).join('')||'<p class="timetable-empty">Keine passende Linie gefunden.</p>';
}
function directions(preferred=''){
 const values=selectedStop()?.towards||[];
 $('timetableDirection').innerHTML='<option value="">Alle Richtungen</option>'+values.map(value=>`<option value="${escape(value)}">${escape(value)}</option>`).join('');
 $('timetableDirection').value=values.includes(preferred)?preferred:values[0]||'';
}
function renderDays(now=Date.now()){
 const previous=$('timetableDay').value,followToday=!optionsToday||previous===optionsToday;
 const options=timetableDayOptions(manifest,now);optionsToday=options[0].value;
 $('timetableDay').innerHTML=options.map(option=>`<option value="${option.value}">${escape(option.label)}</option>`).join('');
 $('timetableDay').value=!followToday&&options.some(option=>option.value===previous)?previous:optionsToday;
}
function markCurrentHour(now=Date.now()){
 const current=timetableHourKey(now);
 for(const row of $('dayTimetable').querySelectorAll('[data-hour]')){
  const active=row.dataset.hour===current;if(row.classList.contains('hour-current')===active)continue;
  row.classList.toggle('hour-current',active);row.querySelector('.current-hour-label').hidden=!active;
  if(active)row.setAttribute('aria-current','time');else row.removeAttribute('aria-current');
 }
}
function stopClock(){clearTimeout(clockTimer);clockTimer=null;}
function refreshClock(){
 stopClock();if(document.hidden||!line||!manifest)return;
 const now=Date.now();
 if(optionsToday!==timetableDate(now)){
  const previous=$('timetableDay').value;renderDays(now);
  if(previous!==$('timetableDay').value&&loadedStation?.stop.id===selectedStop()?.id)renderDay(loadedStation.result,loadedStation.stop,$('timetableDay').value);
 }
 markCurrentHour(now);clockTimer=setTimeout(refreshClock,60000-now%60000+20);
}
function renderDay(result,stop,day){
 if(result.manifest?.version!==index.version)throw Error('Der Fahrplan wurde erneuert. Bitte die Seite neu öffnen.');
 if(day<manifest.validFrom||day>manifest.validThrough){$('dayTimetable').innerHTML='<p class="timetable-empty">Für dieses Datum liegt kein gültiger Fahrplan vor. Bitte den Gültigkeitszeitraum unter Datenstand &amp; Aktualität prüfen.</p>';updatePdfButtons();return;}
 const departures=lineDayDepartures(result.manifest,result.rows,{route:line.route,mode:line.mode,stopId:stop.id,towards:$('timetableDirection').value,day});
 const hours=hourlyTimetable(departures),all=!$('timetableDirection').value;
 $('dayTimetable').innerHTML=hours.length?`<table class="hour-table"><caption>${escape(stop.name)} · ${shortDate(day)}</caption><thead><tr><th scope="col">Stunde</th><th scope="col">Abfahrt in Minute</th></tr></thead><tbody>${hours.map(hour=>`<tr data-hour="${escape(hour.key)}"><th scope="row">${escape(hour.label)}<span class="current-hour-label" hidden>Jetzt</span></th><td><div class="schedule-minutes">${hour.departures.map(d=>`<span class="schedule-minute"><time datetime="${new Date(d.time).toISOString()}" title="${escape(d.clock+' → '+d.towards)}">${d.minute}</time>${all?`<small>→ ${escape(d.towards)}</small>`:''}</span>`).join('')}</div></td></tr>`).join('')}</tbody></table>`:'<p class="timetable-empty">Für diese Haltestelle und Richtung gibt es an diesem Tag keine geplante Abfahrt im importierten Fahrplan.</p>';
 markCurrentHour();
 status('Linie '+line.route+' · '+departures.length+' geplante Abfahrten am '+shortDate(day));
 updatePdfButtons();
}
function updatePdfButtons(){
 const day=$('timetableDay').value,valid=line&&day>=manifest.validFrom&&day<=manifest.validThrough;
 $('downloadDayPdf').disabled=exporting||!valid||loadedStation?.stop.id!==selectedStop()?.id;
 $('downloadLinePdf').disabled=exporting||!valid;
}
async function loadPdfLine(meta,signal){
 const catalogue=await lineMaps.index(meta,{signal}),entry=catalogue.lines.find(row=>row.route===line.route&&row.mode===line.mode);
 if(!entry)throw Error('Für diese Linie fehlt der geografische Verlauf.');return lineMaps.line(entry,meta,{signal});
}
async function exportPdf(wholeLine){
 if(exporting||!line||!wholeLine&&!loadedStation)return;
 const chosen=line,stop=selectedStop(),day=$('timetableDay').value,towards=$('timetableDirection').value,current=loadedStation;
 cancel();const own=revision,controller=new AbortController();request=controller;exporting=true;updatePdfButtons();$('saveLineOffline').disabled=true;
 $('pdfDownloadStatus').textContent=wholeLine?'Fahrplandaten aller Haltestellen werden für das PDF geladen …':'PDF wird auf deinem Gerät erstellt …';
 try{
  const result=wholeLine?await timetable.stationRows(chosen.stops.map(row=>({id:row.id,provider:'wl'})),{signal:controller.signal}):current.result;
  if(own!==revision||controller.signal.aborted||document.hidden)return;
  if(result.manifest?.version!==index.version)throw Error('Der Fahrplan wurde erneuert. Bitte die Seite neu öffnen.');
  $('pdfDownloadStatus').textContent='Haltestellenfolge und Kartenhintergrund werden für das PDF vorbereitet …';
  const routeMap=(await loadPdfLine(result.manifest,controller.signal)).data;
  const patterns=pdfRoutePatterns({manifest:result.manifest,line:chosen,routeMap,day,stopId:stop.id,towards,wholeLine});
  const mapBackground=patterns.length?await createPdfMapBackground(pdfMapViewport(patterns),{signal:controller.signal}):null;
  if(own!==revision||controller.signal.aborted||document.hidden)return;
  const bytes=createTimetablePdf({manifest:result.manifest,rows:result.rows,line:chosen,stops:wholeLine?chosen.stops:[stop],day,towards,wholeLine,routeMap,mapBackground,selectedStopId:stop.id});
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),link=document.createElement('a');link.href=url;link.download=timetablePdfName({route:chosen.route,day,wholeLine,stopName:stop.name});document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('pdfDownloadStatus').textContent='PDF-Download gestartet · '+(wholeLine?'alle Haltestellen und Richtungen':stop.name)+' · '+shortDate(day)+(patterns.length&&!mapBackground?' · geografischer Verlauf ohne Straßenkartenhintergrund.':' · mit Streckenführung und Haltestellen.');
 }catch(error){if(own===revision&&error.name!=='AbortError')$('pdfDownloadStatus').textContent='PDF konnte nicht erstellt werden: '+error.message;}
 finally{exporting=false;if(request===controller)request=null;$('saveLineOffline').disabled=false;updatePdfButtons();}
}
async function loadStation(){
 cancel();const own=revision,controller=new AbortController();request=controller;
 const stop=selectedStop(),day=$('timetableDay').value;if(!stop||!day)return;
 loadedStation=null;updatePdfButtons();
 $('dayTimetable').innerHTML='<p class="timetable-empty">Tagesfahrplan wird geladen …</p>';
 try{const result=await timetable.stationRows([{id:stop.id,provider:'wl'}],{signal:controller.signal});if(document.hidden||revision!==own||controller.signal.aborted)return;loadedStation={result,stop};renderDay(result,stop,$('timetableDay').value);}
 catch(error){if(revision===own&&error.name!=='AbortError'){status(error.message);$('dayTimetable').innerHTML='<p class="timetable-empty">Dieses Stationspaket konnte nicht geladen werden. Für die erste Nutzung wird eine Internetverbindung benötigt.</p>';}}
 finally{if(request===controller)request=null;}
}
async function saveLine(){
 cancel();const own=revision,controller=new AbortController();request=controller;$('saveLineOffline').disabled=true;$('lineOfflineStatus').textContent='Fahrplanpakete der Linie werden gespeichert …';
 try{const result=await timetable.stationRows(line.stops.map(stop=>({id:stop.id,provider:'wl'})),{signal:controller.signal});if(revision!==own||controller.signal.aborted||document.hidden)return;if(result.manifest?.version!==index.version)throw Error('Fahrplan erneuert. Bitte Seite neu öffnen.');const route=await loadPdfLine(result.manifest,controller.signal);if(revision!==own||controller.signal.aborted||document.hidden)return;const complete=line.stops.every(stop=>Array.isArray(result.rows[stop.id]));$('lineOfflineStatus').textContent=complete&&result.offline&&route.offline?'Fahrplan und Linienverlauf '+line.route+' sind für alle '+line.stops.length+' Haltestellen offline gespeichert · gültig bis '+shortDate(manifest.validThrough)+'.':'Die Linie konnte nicht vollständig auf diesem Gerät gespeichert werden. Bitte Verbindung und verfügbaren Gerätespeicher prüfen.';}
 catch(error){if(revision===own&&error.name!=='AbortError')$('lineOfflineStatus').textContent='Speichern nicht abgeschlossen. Bitte erneut versuchen.';}
 finally{if(request===controller)request=null;$('saveLineOffline').disabled=false;}
}
async function start(){
 const controller=new AbortController();request=controller;
 try{
  manifest=await timetable.metadata(controller.signal);if(!manifest)throw Error('Noch kein Fahrplan auf diesem Gerät verfügbar. Bitte mit Internetverbindung erneut öffnen.');
  const key='timetable:wien:lines';
  try{const response=await fetch('./data/timetables/wien/lines.json?v='+manifest.version,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('Linien fehlen');index=await response.json();if(index?.version!==manifest.version)throw Error('Fahrplan erneuert');await putCatalogue(key,index).catch(()=>{});}
  catch(error){if(controller.signal.aborted)throw error;index=await getCatalogue(key).catch(()=>null);}
  if(index?.format!==1||index.city!=='wien'||index.version!==manifest.version||!Array.isArray(index.lines)||index.lines.length>400)throw Error('Die Linienübersicht konnte nicht geladen werden. Bitte mit Internetverbindung erneut öffnen.');
  if(controller.signal.aborted||document.hidden)return;
  renderMetadata();
  const matchingLines=index.lines.filter(item=>item.route===params.get('linie'));
  line=matchingLines.find(item=>item.mode===params.get('verkehrsmittel'))||(matchingLines.length===1?matchingLines[0]:null);
  status((manifest.sourceCheck?.status==='changed'?'Geänderte Quelle verfügbar · ':timetableDate()>manifest.validThrough?'Fahrplan abgelaufen · ':'')+index.lines.length+' Linien · gültig '+shortDate(manifest.validFrom)+' bis '+shortDate(manifest.validThrough));
  if(!line){if(params.has('linie'))status('Diese Linie ist im importierten Wiener Fahrplan nicht enthalten. Bitte eine Linie auswählen.');renderLines();return;}
  $('linePicker').hidden=true;$('lineSchedule').hidden=false;$('timetableTitle').textContent='Fahrplan der Linie '+line.route;document.title='Linie '+line.route+' · Fahrplan · foama-wien';
  $('lineBadge').textContent=line.route;$('lineBadge').style.background=color(line);$('lineTitle').textContent=modes[line.mode]||'Linie';
  $('lineMapLink').href='./linienkarte.html?'+new URLSearchParams({linie:line.route,verkehrsmittel:line.mode});
  $('timetableStop').innerHTML=line.stops.slice().sort((a,b)=>a.name.localeCompare(b.name,'de-AT')).map(stop=>`<option value="${escape(stop.id)}">${escape(stop.name)}</option>`).join('');
  if(line.stops.some(stop=>stop.id===params.get('halt')))$('timetableStop').value=params.get('halt');directions(params.get('richtung')||'');
  renderDays();refreshClock();
  $('timetableSource').textContent='Gültig '+shortDate(manifest.validFrom)+'–'+shortDate(manifest.validThrough)+' · Datenquelle: Stadt Wien – data.wien.gv.at';
  await loadStation();
 }catch(error){if(error.name!=='AbortError')status(error.message);}finally{if(request===controller)request=null;}
}
$('lineSearch').addEventListener('input',()=>{if(index)renderLines();});
$('timetableStop').addEventListener('change',()=>{directions($('timetableDirection').value);void loadStation();});
$('timetableDirection').addEventListener('change',()=>void loadStation());$('timetableDay').addEventListener('change',()=>void loadStation());$('saveLineOffline').addEventListener('click',()=>void saveLine());
$('downloadDayPdf').addEventListener('click',()=>void exportPdf(false));$('downloadLinePdf').addEventListener('click',()=>void exportPdf(true));
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){stopClock();cancel();$('saveLineOffline').disabled=false;$('lineOfflineStatus').textContent='Geladene Pakete bleiben erhalten. Nach einer Unterbrechung bitte erneut speichern.';if(exporting)$('pdfDownloadStatus').textContent='PDF-Erstellung unterbrochen. Bitte erneut starten.';}
 else if(line){refreshClock();if(loadedStation?.stop.id===selectedStop()?.id)renderDay(loadedStation.result,loadedStation.stop,$('timetableDay').value);else void loadStation();}
 else void start();
});
window.addEventListener('pagehide',()=>{stopClock();cancel();});
window.addEventListener('pageshow',event=>{if(event.persisted)refreshClock();});void start();

if(location.protocol==='https:'&&'serviceWorker' in navigator)void navigator.serviceWorker.register('./sw.js').catch(()=>{});
