// Bounded event verification and receipts only. Never GPS or departure polling.
function installPushHandlers(scope){
 const store=scope.foamaPushStore,fetcher=(...args)=>scope.fetch(...args),clock=()=>Date.now();
 const sameOrigin=client=>{try{return new URL(client.url).origin===scope.location.origin;}catch{return false;}};
 scope.addEventListener('message',event=>{
  if(event.data?.type==='FOAMA_PUSH_PROTOCOL'){event.ports?.[0]?.postMessage({protocol:2,localDisplayTest:true});return;}
  if(event.data?.type!=='FOAMA_LOCAL_NOTIFICATION_TEST'||!event.ports?.[0])return;
  const reply=value=>{try{event.ports[0].postMessage(value);}catch{}};
  event.waitUntil((async()=>{
   if(!sameOrigin(event.source)){reply({ok:false,code:'client'});return;}
   if(scope.Notification?.permission!=='granted'){reply({ok:false,code:'permission'});return;}
   const tag='foama-wien-local-test',listing=typeof scope.registration.getNotifications==='function';
   // Replace only our own local test. Do not touch disruption notifications.
   if(listing)try{for(const notice of await scope.registration.getNotifications({tag}))notice.close();}catch{}
   await scope.registration.showNotification('foama-wien: Anzeigetest',{body:'Lokale Testanzeige · '+new Date(clock()).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna'})+' · ohne Push-Transport. Öffne bei Bedarf die Benachrichtigungsleiste.',tag,silent:true,renotify:false,icon:'/icons/icon-192-v0.1.4.png',badge:'/icons/icon-192-v0.1.4.png',data:{kind:'local-test'}});
   let listed=null;if(listing)try{listed=(await scope.registration.getNotifications({tag})).length>0;}catch{}
   reply(listed===false?{ok:false,code:'not-listed'}:{ok:true,listed});
  })().catch(()=>reply({ok:false,code:'display-failed'})));
 });
 async function visible(){return (await scope.clients.matchAll({type:'window',includeUncontrolled:true})).some(client=>sameOrigin(client)&&client.visibilityState==='visible');}
 async function api(device,eventId,suffix='',body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
  try{const response=await fetcher(new URL(`/api/push/subscriptions/${device.id}/events/${eventId}${suffix}`,scope.location.origin).href,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal,headers:{'X-Push-Secret':device.secret,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
   if(!response.ok)return null;return await response.json();
  }finally{clearTimeout(timer);}
 }
 async function diagnostic(stage){try{await store.diagnostic?.(stage,clock());}catch{}}
 async function receipt(device,id,status){try{await api(device,id,'/receipt',{status});}catch{}}
 function valid(value,device,now){return value?.format==='foama-push-v2'&&device?.enabled===true&&device.expiresAt>now&&/^[A-Za-z0-9_-]{32}$/.test(device.id)&&/^[A-Za-z0-9_-]{32}$/.test(device.secret)&&value.deviceId===device.id&&/^[A-Za-z0-9_-]{32}$/.test(value.eventId)&&['foama-wien-test','foama-wien-disruptions'].includes(value.tag)&&Number.isFinite(value.sentAt)&&value.sentAt<=now+60000&&Number.isFinite(value.expiresAt)&&value.expiresAt>now&&value.expiresAt<=value.sentAt+300000;}
 function quiet(device,now){const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Vienna',hour:'2-digit',hourCycle:'h23'}).format(new Date(now)));return device.preferences?.quiet&&(hour>=22||hour<7);}
 scope.addEventListener('push',event=>{
  let value;try{value=event.data?.json();}catch{}
  event.waitUntil((async()=>{
   await diagnostic('received');
   let device;try{device=await store.getDevice();}catch{await diagnostic('storage-error');return;}if(!valid(value,device,clock())){await diagnostic('device-or-expiry');return;}
   const test=value.tag==='foama-wien-test';
   if(!test&&(quiet(device,clock())||await visible())){await diagnostic('suppressed');await receipt(device,value.eventId,'suppressed');return;}
   let verified;try{verified=await api(device,value.eventId);}catch{}
   const notice=verified?.notification;
   if(!verified?.relevant||!valid(notice,device,clock())||notice.eventId!==value.eventId||notice.tag!==value.tag){await diagnostic('suppressed');await receipt(device,value.eventId,'suppressed');return;}
   // Opt-out, quiet time or a visible app may have changed during verification.
   try{device=await store.getDevice();}catch{return;}
   if(!valid(notice,device,clock())||!test&&(quiet(device,clock())||await visible())){await diagnostic('suppressed');await receipt(device,value.eventId,'suppressed');return;}
   let claimed;try{claimed=await store.claim(value.eventId,clock(),notice.expiresAt,test);}catch{return;}
   if(!claimed){await diagnostic('duplicate-or-cooldown');return;}
   let shown=false;try{
    await scope.registration.showNotification(String(notice.title||'foama-wien').slice(0,100),{body:String(notice.body||'').slice(0,350),icon:'/icons/icon-192-v0.1.4.png',badge:'/icons/icon-192-v0.1.4.png',tag:notice.tag,renotify:false,silent:true,data:{url:'/alerts.html',eventId:value.eventId,deviceId:device.id},actions:[{action:'view',title:'Ansehen'}]});shown=true;await diagnostic('shown');
   }finally{if(!shown)await diagnostic('display-error');await store.finish(value.eventId,shown,clock()).catch(()=>{});await receipt(device,value.eventId,shown?'shown':'suppressed');}
  })().catch(()=>{}));
 });
 scope.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
   const data=event.notification.data,local=data?.kind==='local-test',device=local?null:await store.getDevice().catch(()=>null);
   if(device?.enabled&&device.id===data?.deviceId&&/^[A-Za-z0-9_-]{32}$/.test(data?.eventId))await receipt(device,data.eventId,'clicked');
   const url=new URL(local?'/?settings=1':'/alerts.html',scope.location.origin).href;
   const windows=await scope.clients.matchAll({type:'window',includeUncontrolled:true}),existing=windows.find(sameOrigin);
   if(existing){await existing.navigate(url);await existing.focus();}else await scope.clients.openWindow(url);
  })());
 });
}
if(typeof self!=='undefined'&&self.registration)installPushHandlers(self);
