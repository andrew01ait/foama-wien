const CHECK_INTERVAL=5*60_000;
export function isNewerVersion(candidate,current){
 const parse=value=>typeof value==='string'&&/^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(value)?value.split('.').map(Number):null;
 const a=parse(candidate),b=parse(current);if(!a||!b)return false;
 for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;
}

export function createAppUpdates({version,document=globalThis.document,window=globalThis.window,navigator=globalThis.navigator,fetch=globalThis.fetch,now=Date.now,schedule=globalThis.setTimeout,unschedule=globalThis.clearTimeout}={}){
 const $=id=>document.getElementById(id),banner=$('appUpdate'),button=$('appUpdateNow'),status=$('appUpdateStatus');
 let registration=null,started=false,timer=null,request=null,lastCheck=-Infinity,busy=false,latestVersion=null;
 const offer=latest=>{
  if(isNewerVersion(latest,version))latestVersion=latest;
  $('appUpdateText').textContent=latestVersion?`Neue Version ${latestVersion} verfügbar`:'Offline und Push aktualisieren';
  const detail=$('appUpdateVersion');if(detail)detail.textContent=latestVersion?`Installiert: ${version}`:`App ${version}`;
  banner.hidden=false;
 };
 const clearTimer=()=>{if(timer!==null)unschedule(timer);timer=null;};
 const plan=()=>{clearTimer();if(started&&!document.hidden)timer=schedule(()=>{timer=null;void check().finally(plan);},CHECK_INTERVAL);};
 async function check(){
  if(document.hidden||navigator.onLine===false||request||now()-lastCheck<CHECK_INTERVAL)return;
  lastCheck=now();const controller=new AbortController();request=controller;
  const timeout=schedule(()=>controller.abort(),12_000);
  try{
   const response=await fetch('./update.json',{cache:'no-store',signal:controller.signal});
   if(!response.ok)return;
   const latest=await response.json();
   if(!controller.signal.aborted&&!document.hidden&&isNewerVersion(latest?.version,version)){
    offer(latest.version);void registration?.update?.().catch(()=>{});
   }
  }catch{/* Offline checks remain quiet; the installed app keeps working. */}
  finally{unschedule(timeout);if(request===controller)request=null;}
 }
 function setRegistration(next){
  registration=next;
  const inspect=()=>{if(next.waiting)offer();};inspect();
  const watch=worker=>{if(!worker)return;const changed=()=>{if(worker.state==='installed'&&navigator.serviceWorker?.controller)offer();};worker.addEventListener('statechange',changed);changed();};
  next.addEventListener('updatefound',()=>watch(next.installing));watch(next.installing);
 }
 function waitForWorker(worker){
  return new Promise((resolve,reject)=>{
   let timeout;
   const finish=error=>{unschedule(timeout);worker.removeEventListener('statechange',changed);error?reject(error):resolve();};
   const changed=()=>{if(['installed','activated'].includes(worker.state))finish();else if(worker.state==='redundant')finish(Error('installation failed'));};
   timeout=schedule(()=>finish(Error('installation timed out')),30_000);worker.addEventListener('statechange',changed);changed();
  });
 }
 function activateWaiting(worker){
  return new Promise((resolve,reject)=>{
   const service=navigator.serviceWorker;
   const finish=error=>{unschedule(timeout);service.removeEventListener('controllerchange',changed);error?reject(error):resolve();};
   const changed=()=>finish();
   const timeout=schedule(()=>finish(Error('activation timed out')),30_000);
   service.addEventListener('controllerchange',changed);
   try{worker.postMessage({type:'FOAMA_ACTIVATE_UPDATE'});}catch(error){finish(error);}
  });
 }
 async function updateNow(){
  if(busy)return;busy=true;button.disabled=true;button.textContent='Wird aktualisiert …';status.textContent='';
  try{
   if(navigator.onLine===false)throw Error('offline');
   if(registration){
    let deadline;
    try{await Promise.race([registration.update(),new Promise((_,reject)=>{deadline=schedule(()=>reject(Error('update timed out')),30_000);})]);}finally{unschedule(deadline);}
    if(registration.installing)await waitForWorker(registration.installing);
    if(registration.waiting)await activateWaiting(registration.waiting);
   }
   window.location.reload();
  }catch{status.textContent='Aktualisierung gerade nicht möglich. Bitte erneut versuchen.';}
  finally{busy=false;button.disabled=false;button.textContent='Jetzt aktualisieren';}
 }
 const resumed=()=>{if(document.hidden){clearTimer();request?.abort();}else{void check();plan();}};
 function start(){if(started)return;started=true;button.addEventListener('click',updateNow);document.addEventListener('visibilitychange',resumed);window.addEventListener('online',resumed);window.addEventListener('focus',resumed);void check();plan();}
 function destroy(){started=false;clearTimer();request?.abort();button.removeEventListener('click',updateNow);document.removeEventListener('visibilitychange',resumed);window.removeEventListener('online',resumed);window.removeEventListener('focus',resumed);}
 return {start,check,setRegistration,destroy};
}
