import {jsonExportName} from './export-file.mjs?v=0.9.0';
import {DEBUG_KEY,appendDebugEvent,debugReport} from './debug-core.mjs?v=0.9.0';

export function createDebugging({doc=document,storage=null,nav=navigator,win=window,version=()=> '0.9.0',schedule=setTimeout}={}){
 try{storage=storage||win.localStorage;}catch{}storage=storage||{getItem:()=>null,setItem(){},removeItem(){}};
 const $=id=>doc.getElementById(id);let events=[];
 try{events=JSON.parse(storage.getItem(DEBUG_KEY)||'[]');if(!Array.isArray(events))events=[];}catch{}
 const report=()=>debugReport(events,{secureContext:win.isSecureContext,online:nav.onLine,serviceWorkerControlled:!!nav.serviceWorker?.controller,pageProtocol:win.location?.protocol},version());
 function update(){const safe=report().events;events=safe;$('debugCount').textContent=`${safe.length} Ereignisse lokal gespeichert · ${safe.filter(e=>e.outcome==='error').length} Fehler`;
  $('debugEvents').textContent=safe.slice(-10).reverse().map(e=>`${new Date(e.timestamp).toLocaleString('de-AT',{timeZone:'Europe/Vienna'})} · ${e.kind} · ${e.outcome} · ${e.code}${e.httpStatus?' · HTTP '+e.httpStatus:''}${e.upstreamHttpStatus?' · Anbieter HTTP '+e.upstreamHttpStatus:''}`).join('\n')||'Noch keine Ereignisse.';
 }
 function record(event){events=appendDebugEvent(events,{...event,timestamp:new Date().toISOString()});try{storage.setItem(DEBUG_KEY,JSON.stringify(events));}catch{}update();}
 $('downloadDebug').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(report(),null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=doc.createElement('a');
  a.href=url;a.download=jsonExportName('debug');a.click();schedule(()=>URL.revokeObjectURL(url),2000);
  $('debugStatus').textContent='Protokoll als JSON gespeichert. Du kannst die Datei hier im Chat anhängen.';
 });
 $('copyDebug').addEventListener('click',async()=>{try{await nav.clipboard.writeText(JSON.stringify(report(),null,2));$('debugStatus').textContent='Protokoll kopiert.';}catch{$('debugStatus').textContent='Kopieren nicht verfügbar. Bitte als JSON speichern.';}});
 $('clearDebug').addEventListener('click',()=>{events=[];try{storage.removeItem(DEBUG_KEY);}catch{}update();$('debugStatus').textContent='Lokales Protokoll geleert.';});
 // Debugging stays collapsed every time Settings is opened; opening it does no work.
 $('settings').addEventListener('close',()=>{$('debugging').open=false;});update();return {record,report};
}
