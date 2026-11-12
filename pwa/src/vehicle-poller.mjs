import {monitorAllowedAt,claimMonitorAttempt,recordMonitorSource} from './monitor-timing.mjs?v=0.11.25';
import {createVehiclePositionOwner} from './vehicle-position-owner.mjs?v=0.11.25';
export function createVehiclePoller({ids,onData,onError,onWaiting=()=>{},onRequest=()=>{},notBefore=()=>0,fetch=globalThis.fetch,storage=globalThis.localStorage,locks=globalThis.navigator?.locks,now=()=>Date.now(),visible=()=>!document.hidden,schedule=setTimeout,cancel=clearTimeout}={}){
 let enabled=false,timer=null,request=null,last=0,retry=0,generation=0;
 const owner=createVehiclePositionOwner(stop);
 function stop(){enabled=false;generation++;cancel(timer);timer=null;request?.abort();request=null;owner.release();}
 const later=ms=>{cancel(timer);if(enabled&&visible())timer=schedule(run,Math.max(100,ms));};
 async function run(){
  if(!enabled||!visible()||request)return;
  const stops=[...new Set(ids().map(String))];if(!stops.length||stops.length>24||stops.some(id=>!/^\d{1,7}$/.test(id))){stop();onError('Für diesen Abschnitt sind keine gültigen maximal 24 Haltepunkte gewählt.');return;}
  const own=generation,controller=new AbortController();request=controller;
  const claim=await claimMonitorAttempt(stops,{lastAttempt:last,retryAt:Math.max(retry,notBefore()),storage,locks,now});if(own!==generation||!enabled||!visible()){if(request===controller)request=null;return;}if(claim.wait){request=null;onWaiting(claim.wait);later(claim.wait+100);return;}last=claim.at;onRequest(last,stops);
  const timeout=schedule(()=>controller.abort(),12_000);
  try{const params=new URLSearchParams();stops.forEach(id=>params.append('stopId',id));const response=await fetch('./api/monitor?'+params,{signal:controller.signal,cache:'no-store',credentials:'omit'});if(!response.ok){const seconds=Math.max(30,Math.min(300,Number(response.headers?.get('retry-after'))||60));retry=now()+seconds*1000;throw Error('Live-Daten vorübergehend nicht erreichbar.');}const raw=await response.json();if(controller.signal.aborted||own!==generation||!enabled||!visible())return;recordMonitorSource(raw,stops,{storage,now:now()});onData(raw,stops);retry=0;}
  catch(error){if(own===generation&&enabled&&visible()){retry=Math.max(retry,now()+60_000);onError(controller.signal.aborted?'Live-Abfrage dauert zu lange.':error.message,stops);}}
  finally{cancel(timeout);if(request===controller)request=null;if(own===generation){const remaining=monitorAllowedAt(stops,{lastAttempt:last,retryAt:Math.max(retry,notBefore()),storage,now:now()})-now();onWaiting(Math.max(0,remaining));later(remaining+100);}}
 }
 return {start(){if(!visible())return;owner.claim();enabled=true;void run();},stop,running:()=>enabled};
}
