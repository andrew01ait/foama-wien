import {jsonExportName} from './export-file.mjs?v=0.11.13';
import {DIRECT_CATALOGUE_URL, API_RATE_LIMIT_MS, monitorUrl, proxyMonitorUrl,
  summarizeMonitor,summarizeCsv,classifyFetchError,appendDiagnostic,buildReport,validateRbl} from './diagnostic-core.mjs?v=0.11.13';
const $=id=>document.getElementById(id);
const LOG_KEY='foama.diagnostics.events.v1', RATE_KEY='foama.wl.lastApiAttempt.v1';
const HTML_ESCAPE=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let events=[],lastRaw=null,busy=false;
function safeLoad(){try{const value=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');return Array.isArray(value)?value.slice(-30):[];}catch{return [];}}
function safeSave(){try{localStorage.setItem(LOG_KEY,JSON.stringify(events));}catch{}}
function environment(){return {secureContext:window.isSecureContext,online:navigator.onLine,serviceWorkerControlled:!!navigator.serviceWorker?.controller,pageProtocol:location.protocol};}
function environmentUI(){const env=environment();$('environment').innerHTML=[['Sichere Seite',env.secureContext?'Ja (HTTPS/localhost)':'Nein'],['Online',env.online?'Ja':'Nein / nicht erkannt'],['PWA-Service-Worker',env.serviceWorkerControlled?'Aktiv':'Noch nicht aktiv'],['Website-Protokoll',env.pageProtocol]].map(([k,v])=>`<div class="env-item"><b>${HTML_ESCAPE(k)}</b><span>${HTML_ESCAPE(v)}</span></div>`).join('');}
function displaySummary(s){if(!s)return '';if(s.valid===true)return `${s.monitorCount} Monitore · ${s.lineCount} Linien · ${s.departureCount} Abfahrten. ${s.examples?.slice(0,2).map(e=>`${e.station} ${e.line} → ${e.direction}`).join(' | ')||''}`;if(s.approxRows!==undefined)return `CSV: ${s.approxRows} Zeilen, Header: ${s.header||'fehlt'}`;if(s.valid===false)return `${s.reason} ${s.message||''}`;return JSON.stringify(s).slice(0,250);}
function renderEvents(){ $('eventsCount').textContent=String(events.length);$('results').innerHTML=[...events].reverse().slice(0,10).map(e=>`<article class="diag-result"><div class="diag-result-top"><h4 class="${e.outcome==='ok'?'diag-success':'diag-fail'}">${e.outcome==='ok'?'✓':'!'} ${HTML_ESCAPE(({monitor:'Monitor direkt',proxy:'Monitor via Proxy',catalogue:'Haltestellen-CSV',hosting:'Website / Hosting'})[e.kind]||e.kind)}</h4><time>${HTML_ESCAPE(new Date(e.timestamp).toLocaleString('de-AT'))}</time></div><p>${HTML_ESCAPE(e.message)}</p><p class="diag-meta">${e.httpStatus!==null?`HTTP ${e.httpStatus} · `:''}${HTML_ESCAPE(e.category)} · ${e.elapsedMs??'—'} ms ${e.contentType?`· ${HTML_ESCAPE(e.contentType)}`:''}</p>${e.summary?`<p>${HTML_ESCAPE(displaySummary(e.summary))}</p>`:''}</article>`).join('')||'<p class="fineprint">Noch keine gespeicherten Ergebnisse.</p>';}
function saveEvent(event){events=appendDiagnostic(events,event);safeSave();renderEvents();}
function setActivity(message,category=''){const el=$('activity');el.textContent=message;el.className='diag-activity'+(category?' '+category:'');}
function download(filename,content){const url=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function report(){return buildReport({events,environment:environment(),rawIncluded:$('includeRaw').checked,raw:lastRaw});}
function unlock(){busy=false;for(const id of ['testMonitor','testCatalogue','testHosting','testProxy'])$(id).disabled=false;}
function lock(){busy=true;for(const id of ['testMonitor','testCatalogue','testHosting','testProxy'])$(id).disabled=true;}
function recentCallBlock(kind){
 if(!['monitor','catalogue','proxy'].includes(kind))return;
 const last=Number(localStorage.getItem(RATE_KEY)||0);
 const remain=API_RATE_LIMIT_MS-(Date.now()-last);
 if(remain>0)throw Error(`Bitte ${Math.ceil(remain/1000)} Sekunden bis zur nächsten offiziellen API-Anfrage warten (Fair Use).`);
 // Reserving before fetch also rate-limits failed calls, including CORS/network errors.
 try{localStorage.setItem(RATE_KEY,String(Date.now()));}catch{}
}
async function run(kind){if(busy)return;let url,stopId='';
 try{
  if(kind==='monitor'){stopId=validateRbl($('stopId').value);url=monitorUrl(stopId);}
  else if(kind==='proxy'){stopId=validateRbl($('stopId').value);url=proxyMonitorUrl($('proxyBase').value,stopId);}
  else if(kind==='catalogue')url=DIRECT_CATALOGUE_URL;
  else url='./config.json?diagnostic=hosting';
  recentCallBlock(kind);
 }catch(err){setActivity(err.message,'error');return;}
 lock();setActivity('Anfrage läuft … Keine GPS-Daten werden übertragen.');
 const start=performance.now(),ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
 let data=null,body='';const event={timestamp:new Date().toISOString(),kind,stopId,outcome:'error',category:'',httpStatus:null,responseType:'',contentType:'',elapsedMs:null,message:'',summary:null};
 try{
  const response=await fetch(url,{method:'GET',cache:'no-store',signal:ctrl.signal,credentials:'omit',redirect:'follow'});
  event.httpStatus=response.status;event.responseType=response.type;event.contentType=response.headers.get('Content-Type')||'';
  // A usable HTTP status is only visible after the browser's CORS checks pass.
  body=await response.text();
  if(response.ok){
   if(kind==='catalogue'){event.summary=summarizeCsv(body);event.category=event.summary.looksLikeStopCsv?'csv-ok':'csv-format-uncertain';}
   else {try{data=JSON.parse(body);}catch{event.category='invalid-json';throw Error('Antwort ist kein gültiges JSON.');}
     if(kind==='hosting'){event.summary={configFields:Object.keys(data).sort()};event.category='hosting-ok';}
     else {event.summary=summarizeMonitor(data);event.category=event.summary.valid?'api-json-ok':'api-schema-different';}
   }
   event.outcome='ok';event.message=kind==='hosting'?'Website-Dateien direkt erreichbar.':kind==='catalogue'?'CSV-Antwort erhalten.':'HTTP-Antwort im Browser lesbar.';
   if(kind!=='hosting'){
     lastRaw={kind,body:body.slice(0,30000),truncated:body.length>30000};
     $('rawPreview').textContent=body.slice(0,3000)+(body.length>3000?'\n… (Vorschau gekürzt)':'');
   }
   setActivity(`${event.message} HTTP ${response.status} · ${Math.round(performance.now()-start)} ms`,'success');
  }else{
   if(kind!=='hosting'){lastRaw={kind,body:body.slice(0,30000),truncated:body.length>30000};$('rawPreview').textContent=body.slice(0,3000)+(body.length>3000?'\n… (Vorschau gekürzt)':'');}
   event.category='http-error';event.message=`HTTP ${response.status}: Antwort war für den Browser lesbar, aber der Server meldet einen Fehler.`;if(kind==='proxy'){try{const detail=JSON.parse(body);event.summary={error:String(detail.error||'').slice(0,250),upstreamHttpStatus:detail.upstreamHttpStatus??null};event.message+=' '+String(detail.error||'').slice(0,250);}catch{}}
   setActivity(event.message,'error');
  }
 }catch(err){
   if(!event.category){const classification=classifyFetchError(err,ctrl.signal.aborted);event.category=classification.category;event.message=classification.message;}
   else event.message+=` ${String(err?.message||'').slice(0,160)}`;
   setActivity(event.message,'error');
 }finally{clearTimeout(timer);event.elapsedMs=performance.now()-start;saveEvent(event);unlock();}
}
function init(){events=safeLoad();environmentUI();renderEvents();$('proxyBase').value=location.origin||'';
 $('testMonitor').addEventListener('click',()=>void run('monitor'));
 $('testCatalogue').addEventListener('click',()=>void run('catalogue'));
 $('testHosting').addEventListener('click',()=>void run('hosting'));
 $('testProxy').addEventListener('click',()=>void run('proxy'));
 $('downloadLog').addEventListener('click',()=>download(jsonExportName('api-diagnose'),JSON.stringify(report(),null,2)));
 $('copyLog').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify(report(),null,2));setActivity('Diagnose in die Zwischenablage kopiert.','success');}catch{setActivity('Kopieren im Browser nicht erlaubt. Bitte „Diagnose als JSON speichern“ verwenden.','error');}});
 $('clearLog').addEventListener('click',()=>{if(!confirm('Alle gespeicherten Diagnoseeinträge löschen?'))return;events=[];lastRaw=null;safeSave();$('rawPreview').textContent='Keine API-Rohantwort gespeichert.';renderEvents();setActivity('Lokales Diagnoseprotokoll gelöscht.','success');});
 window.addEventListener('online',environmentUI);window.addEventListener('offline',environmentUI);
 navigator.serviceWorker?.addEventListener('controllerchange',environmentUI);
 if('serviceWorker'in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js').then(()=>environmentUI()).catch(()=>{});
}
init();
