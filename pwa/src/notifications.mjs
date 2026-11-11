import './push-storage.js?v=0.11.10';
import {pushPreferences,favoritePushTargets} from './push-policy.mjs?v=0.11.10';
const KEY='foama.push.v1';
const decode=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')),c=>c.charCodeAt(0));
const token=cryptoApi=>btoa(String.fromCharCode(...cryptoApi.getRandomValues(new Uint8Array(24)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function createNotifications({root=document,getFavorites,getStops,getJourneys=()=>[],storage=localStorage,environment=window,fetcher=fetch,pushStore=environment.foamaPushStore}){
 const $=id=>root.getElementById(id),nav=environment.navigator,NotificationApi=environment.Notification;
 let saved;try{saved=JSON.parse(storage.getItem(KEY)||'{}');}catch{saved={};}
 if(!saved||typeof saved!=='object')saved={};
 let preferences=pushPreferences(saved.preferences),config=null,busy=false,message='',initialized=false,lastSync=0,lastTargets='',syncQueued=false,debugMessage='';
 const supported=!!(environment.isSecureContext&&nav?.serviceWorker&&environment.PushManager&&NotificationApi);
 const persist=()=>{try{storage.setItem(KEY,JSON.stringify({...saved,preferences}));}catch{throw Error('Bitte lokalen Speicher für foama-wien erlauben.');}};
 async function syncStore(){if(!pushStore)throw Error('Benachrichtigungsspeicher ist hier nicht verfügbar.');await pushStore.setDevice({id:saved.id||'',secret:saved.secret||'',enabled:saved.enabled===true,expiresAt:saved.expiresAt||0,preferences});}
 const targets=()=>favoritePushTargets(getFavorites(),getStops(),getJourneys());
 const selectionStamp=()=>JSON.stringify(preferences.scope==='favorites'?targets():[]);
 const owned=()=>typeof saved.id==='string'&&typeof saved.secret==='string';
 const enabled=()=>saved.enabled===true&&owned();
 async function request(path,{method='GET',data,auth=false}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetcher(path,{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{...(data?{'Content-Type':'application/json'}:{}),...(auth?{'X-Push-Secret':saved.secret}:{})},body:data?JSON.stringify(data):undefined});
   const value=await response.json();if(!response.ok){const error=Error(value.error||'Benachrichtigungsdienst nicht erreichbar.');error.status=response.status;throw error;}return value;
  }finally{clearTimeout(timer);}
 }
 function render(){
  if(!$('pushStatus'))return;
  const denied=supported&&NotificationApi.permission==='denied',selection=targets(),routes=new Set(selection.flatMap(t=>t.routes));
  $('pushScopeFavorites').setAttribute('aria-pressed',String(preferences.scope==='favorites'));$('pushScopeAll').setAttribute('aria-pressed',String(preferences.scope==='all'));
  $('pushQuiet').checked=preferences.quiet;
  $('pushSelection').textContent=preferences.scope==='all'?'Störungen im gesamten Wiener-Linien-Netz.':selection.length?`${routes.size} Linien an ${selection.length} Haltestellen aus deinen Favoriten, einschließlich A nach B.`:'Speichere zuerst einen Wiener-Linien- oder Routenfavoriten oder wähle „Alle Linien“.';
  $('pushStatus').textContent=message||(!supported?'Push wird hier nicht unterstützt. Öffne die öffentliche App in einem unterstützten Browser; auf iPhone/iPad als installierte Web-App.':config&&!config.available?'Automatischer Versand noch nicht verfügbar. Die Aktivierung wird freigeschaltet, sobald der Hintergrunddienst verbunden ist.':denied?'Benachrichtigungen sind im Browser blockiert. Erlaube sie in den Website-Einstellungen und aktiviere sie hier erneut.':enabled()?'Aktiv · neue passende Störungen werden gebündelt gemeldet.':'Aus · Benachrichtigungen nur nach deiner Zustimmung.');
  $('pushDeliveryMode').textContent=config?.available?`Hintergrundprüfung alle ${config.intervalMinutes||5} Minuten; bei aktiver App gegebenenfalls häufiger.`:'Automatische Zustellung wird noch eingerichtet.';
  $('pushEnable').hidden=enabled()&&!denied;$('pushDisable').hidden=!owned();$('pushTest').hidden=!enabled()||denied;
  $('pushEnable').disabled=busy||!supported||denied||!config?.available||(preferences.scope==='favorites'&&!selection.length);
  $('pushDisable').disabled=busy;$('pushTest').disabled=busy||!config?.available;
  $('pushReceipt').hidden=!enabled();$('pushReceipt').disabled=busy||!config?.available;
  if($('pushLocalTest'))$('pushLocalTest').disabled=busy||!supported||NotificationApi.permission!=='granted';
  if($('pushDebugStatus'))$('pushDebugStatus').textContent=debugMessage;
  for(const id of ['pushScopeFavorites','pushScopeAll','pushQuiet'])$(id).disabled=busy;
  const checked=config?.lastSuccess;
  $('pushServiceStatus').textContent=config?.available?(checked?`Letzte erfolgreiche Prüfung ${new Date(checked).toLocaleString('de-AT',{timeZone:'Europe/Vienna',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}${Date.now()-checked>80*60000?' · zuletzt verzögert':''}.${config.state==='source-error'?' Der letzte Quellenabruf schlug fehl; keine veralteten Hinweise.':''}`:'Erste Dienstprüfung steht noch aus.'):'';
 }
 async function work(action,{debug=false}={}){if(busy)return;busy=true;if(debug)debugMessage='';else message='';render();try{await action();}catch(error){if(error.status===410&&owned()){saved.enabled=false;persist();await syncStore().catch(()=>{});}const text=error.name==='AbortError'?'Verbindung zu langsam. Bitte erneut versuchen.':error.message;if(debug)debugMessage=text;else message=text;}finally{busy=false;render();if(syncQueued){syncQueued=false;void sync();}}}
 async function registration(){
  let timer;try{return await Promise.race([nav.serviceWorker.ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('App wird noch aktualisiert. Bitte kurz warten und erneut versuchen.')),12000);})]);}finally{clearTimeout(timer);}
 }
 async function currentWorker(reg){
  if(!environment.MessageChannel||!reg.active)throw Error('Bitte zuerst die App mit „Jetzt aktualisieren“ aktualisieren.');
  return await new Promise((resolve,reject)=>{
   const channel=new environment.MessageChannel(),timer=setTimeout(()=>{channel.port1.close();channel.port2.close();reject(Error('Bitte zuerst die App mit „Jetzt aktualisieren“ aktualisieren.'));},1500);
   channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();channel.port2.close();event.data?.protocol===2?resolve(event.data):reject(Error('Bitte zuerst die App mit „Jetzt aktualisieren“ aktualisieren.'));};
   reg.active.postMessage({type:'FOAMA_PUSH_PROTOCOL'},[channel.port2]);
  });
 }
 async function localDisplayTest(){
  if(NotificationApi.permission!=='granted')throw Error('Bitte Benachrichtigungen zuerst erlauben.');
  debugMessage='Lokaler Anzeigetest läuft …';render();
  const reg=await registration(),worker=await currentWorker(reg);
  if(worker.localDisplayTest!==true)throw Error('Bitte zuerst die Offline-/Push-Komponenten mit „Jetzt aktualisieren“ übernehmen.');
  const result=await new Promise((resolve,reject)=>{
   const channel=new environment.MessageChannel(),timer=setTimeout(()=>{channel.port1.close();channel.port2.close();reject(Error('Keine Antwort vom lokalen Anzeigetest. Bitte die App aktualisieren und erneut versuchen.'));},12000);
   channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();channel.port2.close();resolve(event.data);};
   try{reg.active.postMessage({type:'FOAMA_LOCAL_NOTIFICATION_TEST'},[channel.port2]);}catch{clearTimeout(timer);channel.port1.close();channel.port2.close();reject(Error('Lokaler Anzeigetest konnte nicht gestartet werden. Bitte die App aktualisieren.'));}
  });
  if(!result?.ok){const reasons={permission:'Benachrichtigungen sind auf diesem Gerät nicht erlaubt.',client:'Lokaler Anzeigetest konnte dieser App nicht zugeordnet werden.', 'not-listed':'Der Browser führt die Testnachricht nach dem Anzeigeaufruf nicht auf. Prüfe die Android-/Browser-Benachrichtigungseinstellungen.'};throw Error(reasons[result?.code]||'Der Browser hat die lokale Testanzeige abgelehnt. Prüfe die Android-/Browser-Benachrichtigungseinstellungen.');}
  debugMessage=result.listed===true?'Lokale Testnachricht vom Browser übernommen. Öffne die Benachrichtigungsleiste; die Anzeige ist lautlos. Das ist kein Nachweis, dass sie sichtbar war.':'Lokale Anzeige vom Browser angefordert. Öffne die Benachrichtigungsleiste; die Anzeige ist lautlos. Der Browser bietet hier keine zusätzliche Bestätigung.';
 }
 async function cleanupPending(){if(!saved.pendingDelete||!owned())return;try{await request('/api/push/subscriptions/'+saved.id,{method:'DELETE',auth:true});saved={};persist();await syncStore();}catch(error){if(error.status===410){saved={};persist();await syncStore();}}}
 function body(subscription){return {protocol:2,subscription:subscription.toJSON(),targets:preferences.scope==='favorites'?targets():[],preferences};}
 async function sync(){
  if(!initialized||!enabled()||root.visibilityState==='hidden')return;
  if(busy){syncQueued=true;return;}
  await work(async()=>{
   if(NotificationApi.permission!=='granted'){await disable();message='Benachrichtigungen sind nicht mehr erlaubt und wurden deaktiviert.';return;}
   const reg=await registration();await currentWorker(reg);const subscription=await reg.pushManager.getSubscription();
   if(!subscription){saved.enabled=false;persist();await syncStore();message='Push-Verbindung abgelaufen. Bitte erneut aktivieren.';return;}
   if(preferences.scope==='favorites'&&!targets().length){await disable();message='Keine Wiener-Linien-Favoriten mehr vorhanden. Benachrichtigungen wurden deaktiviert.';return;}
   const input=body(subscription);
   try{const result=await request('/api/push/subscriptions/'+saved.id,{method:'PUT',auth:true,data:input});saved.expiresAt=result.expiresAt;await syncStore();lastSync=Date.now();lastTargets=JSON.stringify(input.targets);persist();}
   catch(error){if(error.status===410){saved.enabled=false;persist();}throw error;}
  });
 }
 async function enable(permission){
  if(await permission!=='granted'){message='Benachrichtigungen wurden nicht erlaubt. Du kannst sie später aktivieren.';return;}
  if(owned()&&!saved.enabled){try{await request('/api/push/subscriptions/'+saved.id,{method:'DELETE',auth:true});}catch(error){if(error.status!==410)throw error;}saved={};persist();}
  const reg=await registration();await currentWorker(reg);let subscription=await reg.pushManager.getSubscription();
  // Lost local management credentials must not take over an existing subscription.
  if(subscription&&!owned()){await subscription.unsubscribe();subscription=null;}
  subscription=subscription||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(config.publicKey)});
  if(!owned())saved={id:token(environment.crypto),secret:token(environment.crypto),enabled:false};
  persist();
  const input=body(subscription);
  try{const result=await request('/api/push/subscriptions'+(saved.enabled?'/'+saved.id:''),{method:saved.enabled?'PUT':'POST',auth:saved.enabled,data:{...input,id:saved.id,secret:saved.secret}});saved.enabled=true;saved.expiresAt=result.expiresAt;saved.pendingDelete=false;persist();await syncStore();lastSync=Date.now();lastTargets=JSON.stringify(input.targets);message='Aktiviert. Mit „Testnachricht“ kannst du die Zustellung auf diesem Gerät prüfen.';}
  catch(error){await subscription.unsubscribe().catch(()=>{});saved.enabled=false;saved.pendingDelete=owned();persist();await syncStore().catch(()=>{});await cleanupPending();throw error;}
 }
 async function disable(){
  saved.enabled=false;saved.pendingDelete=owned();persist();await syncStore().catch(()=>{});
  if(supported){const reg=await registration();const subscription=await reg.pushManager.getSubscription();if(subscription)await subscription.unsubscribe();}
  if(owned())try{await request('/api/push/subscriptions/'+saved.id,{method:'DELETE',auth:true});saved={};persist();}catch(error){if(error.status===410){saved={};persist();}else{message='Auf diesem Gerät deaktiviert. Die Abmeldung beim Dienst wird beim nächsten Online-Öffnen abgeschlossen.';return;}}
  message='Deaktiviert · die Gerätefreigabe wurde entfernt.';
 }
 async function refresh(){
  if(root.visibilityState==='hidden')return;
  if(!supported){render();return;}
  await cleanupPending();
  try{config=await request('/api/push/config');}catch{config=null;message='Benachrichtigungsdienst gerade nicht erreichbar.';}
  render();
  if(config?.available&&enabled()&&(Date.now()-lastSync>5*60000||selectionStamp()!==lastTargets))void sync();
 }
 function changePreferences(next){preferences=pushPreferences({...preferences,...next});try{persist();message='';}catch(error){message=error.message;}render();void syncStore().catch(()=>{});if(enabled())void sync();}
 const onEnable=()=>{
  if(busy||!supported||!config?.available)return;
  // Permission prompt must remain directly on the user's click, before any await.
  const permission=NotificationApi.permission==='granted'?Promise.resolve('granted'):NotificationApi.requestPermission();
  void work(()=>enable(permission));
 };
 async function workerDiagnostics(){
  if(!$('pushWorkerStatus'))return;
  const names={'received':'Push im Browser empfangen','device-or-expiry':'Gerätebindung oder Ablauf hat Anzeige verhindert','storage-error':'Lokaler Benachrichtigungsspeicher nicht lesbar','suppressed':'Anzeige nach Prüfung verworfen','duplicate-or-cooldown':'Doppelter Hinweis oder kurze Anzeigepause','shown':'Anzeige vom Browser angefordert','display-error':'Benachrichtigungsanzeige fehlgeschlagen'};
  const entries=await pushStore?.getDiagnostics?.().catch(()=>[])||[],last=entries.at(-1);
  $('pushWorkerStatus').textContent=last?`${names[last.stage]||'Browserprüfung'} · ${new Date(last.at).toLocaleString('de-AT',{timeZone:'Europe/Vienna',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'})}`:'Noch kein Push-Empfang auf diesem Gerät protokolliert.';
 }
 async function init(){if(initialized)return;initialized=true;
  $('pushEnable').addEventListener('click',onEnable);
  $('pushDisable').addEventListener('click',()=>void work(disable));
  $('pushTest').addEventListener('click',()=>void work(async()=>{await syncStore();await request('/api/push/subscriptions/'+saved.id+'/test',{method:'POST',auth:true});debugMessage='Vom Push-Anbieter angenommen. Die Anzeige auf deinem Gerät ist noch nicht bestätigt. Nach einem Moment „Zustellstatus prüfen“ antippen.';await workerDiagnostics();},{debug:true}));
  $('pushReceipt').addEventListener('click',()=>void work(async()=>{
   const result=await request('/api/push/subscriptions/'+saved.id,{auth:true}),test=result.lastTest;
   debugMessage=!test?'Noch keine Testnachricht vorhanden.':test.clickedAt?'Testnachricht wurde angetippt.':test.shownAt?'Der Browser hat die Anzeige der Testnachricht angefordert. Ob sie sichtbar war, entscheidet dein Gerät.':test.suppressedAt?'Die Testnachricht wurde vor der Anzeige verworfen. Bitte erneut testen.':test.acceptedAt?'Vom Push-Anbieter angenommen; keine Browserbestätigung. Das beweist noch keinen Empfang auf deinem Telefon.':test.status==='pending'||test.status==='sending'?'Testnachricht wartet auf Zustellung.':'Testnachricht konnte nicht zugestellt werden.';await workerDiagnostics();
  },{debug:true}));
  $('pushDebug')?.addEventListener('toggle',()=>{if($('pushDebug').open)void workerDiagnostics();});
  $('pushLocalTest')?.addEventListener('click',()=>void work(localDisplayTest,{debug:true}));
  $('pushScopeFavorites').addEventListener('click',()=>changePreferences({scope:'favorites'}));$('pushScopeAll').addEventListener('click',()=>changePreferences({scope:'all'}));
  $('pushQuiet').addEventListener('change',()=>changePreferences({quiet:$('pushQuiet').checked}));
  root.addEventListener('visibilitychange',()=>{if(root.visibilityState!=='hidden')void refresh();});
  if(supported)await syncStore().catch(()=>{message='Benachrichtigungsspeicher ist hier nicht verfügbar.';});
  render();await refresh();
 }
 return {init,refresh,favoritesChanged(){render();if(enabled())void sync();}};
}
