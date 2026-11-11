const RATE_KEY='foama.wl.lastApiAttempt.v1';
export function createVehiclePoller({ids,onData,onError,onWaiting=()=>{},fetch=globalThis.fetch,storage=globalThis.localStorage,now=()=>Date.now(),visible=()=>!document.hidden,schedule=setTimeout,cancel=clearTimeout}={}){
 let enabled=false,timer=null,request=null,last=0,retry=0,generation=0;
 const later=ms=>{cancel(timer);if(enabled&&visible())timer=schedule(run,Math.max(100,ms));};
 async function run(){
  if(!enabled||!visible()||request)return;let shared=0;try{shared=Number(storage.getItem(RATE_KEY))||0;}catch{}
  const remaining=Math.max(last+30_000,shared+30_000,retry)-now();if(remaining>0){onWaiting(remaining);later(remaining+100);return;}
  const stops=[...new Set(ids().map(String))];if(!stops.length||stops.length>24||stops.some(id=>!/^\d{1,7}$/.test(id))){enabled=false;onError('Für diesen Abschnitt sind keine gültigen maximal 24 Haltepunkte gewählt.');return;}
  const own=generation,controller=new AbortController();request=controller;last=now();try{storage.setItem(RATE_KEY,String(last));}catch{}
  const timeout=schedule(()=>controller.abort(),12_000);
  try{const params=new URLSearchParams();stops.forEach(id=>params.append('stopId',id));const response=await fetch('./api/monitor?'+params,{signal:controller.signal,cache:'no-store',credentials:'omit'});if(!response.ok){const seconds=Math.max(30,Math.min(300,Number(response.headers?.get('retry-after'))||60));retry=now()+seconds*1000;throw Error('Live-Daten vorübergehend nicht erreichbar.');}const raw=await response.json();if(controller.signal.aborted||own!==generation||!enabled||!visible())return;onData(raw);retry=0;}
  catch(error){if(own===generation&&enabled&&visible()){retry=Math.max(retry,now()+60_000);onError(controller.signal.aborted?'Live-Abfrage dauert zu lange.':error.message);}}
  finally{cancel(timeout);if(request===controller)request=null;if(own===generation){const remaining=Math.max(last+30_000,retry)-now();onWaiting(Math.max(0,remaining));later(remaining+100);}}
 }
 return {start(){enabled=true;void run();},stop(){enabled=false;generation++;cancel(timer);timer=null;request?.abort();request=null;},running:()=>enabled};
}
