// Bounded event verification and receipts only. Never GPS or departure polling.
function installPushHandlers(scope){
 scope.addEventListener('message',event=>{if(event.data?.type==='FOAMA_PUSH_PROTOCOL')event.ports?.[0]?.postMessage({protocol:2});});
 const store=scope.foamaPushStore,fetcher=(...args)=>scope.fetch(...args),clock=()=>Date.now();
 const sameOrigin=client=>{try{return new URL(client.url).origin===scope.location.origin;}catch{return false;}};
 async function visible(){return (await scope.clients.matchAll({type:'window',includeUncontrolled:true})).some(client=>sameOrigin(client)&&client.visibilityState==='visible');}
 async function api(device,eventId,suffix='',body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
  try{const response=await fetcher(new URL(`/api/push/subscriptions/${device.id}/events/${eventId}${suffix}`,scope.location.origin).href,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal,headers:{'X-Push-Secret':device.secret,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
   if(!response.ok)return null;return await response.json();
  }finally{clearTimeout(timer);}
 }
 async function receipt(device,id,status){try{await api(device,id,'/receipt',{status});}catch{}}
 function valid(value,device,now){return value?.format==='foama-push-v2'&&device?.enabled===true&&device.expiresAt>now&&/^[A-Za-z0-9_-]{32}$/.test(device.id)&&/^[A-Za-z0-9_-]{32}$/.test(device.secret)&&value.deviceId===device.id&&/^[A-Za-z0-9_-]{32}$/.test(value.eventId)&&['foama-wien-test','foama-wien-disruptions'].includes(value.tag)&&Number.isFinite(value.sentAt)&&value.sentAt<=now+60000&&Number.isFinite(value.expiresAt)&&value.expiresAt>now&&value.expiresAt<=value.sentAt+300000;}
 function quiet(device,now){const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Vienna',hour:'2-digit',hourCycle:'h23'}).format(new Date(now)));return device.preferences?.quiet&&(hour>=22||hour<7);}
 scope.addEventListener('push',event=>{
  let value;try{value=event.data?.json();}catch{}
  event.waitUntil((async()=>{
   let device;try{device=await store.getDevice();}catch{return;}if(!valid(value,device,clock()))return;
   const test=value.tag==='foama-wien-test';
   if(!test&&(quiet(device,clock())||await visible())){await receipt(device,value.eventId,'suppressed');return;}
   let verified;try{verified=await api(device,value.eventId);}catch{}
   const notice=verified?.notification;
   if(!verified?.relevant||!valid(notice,device,clock())||notice.eventId!==value.eventId||notice.tag!==value.tag){await receipt(device,value.eventId,'suppressed');return;}
   // Opt-out, quiet time or a visible app may have changed during verification.
   try{device=await store.getDevice();}catch{return;}
   if(!valid(notice,device,clock())||!test&&(quiet(device,clock())||await visible())){await receipt(device,value.eventId,'suppressed');return;}
   let claimed;try{claimed=await store.claim(value.eventId,clock(),notice.expiresAt,test);}catch{return;}
   if(!claimed)return;
   let shown=false;try{
    await scope.registration.showNotification(String(notice.title||'foama-wien').slice(0,100),{body:String(notice.body||'').slice(0,350),icon:'/icons/icon-192-v0.1.4.png',badge:'/icons/icon-192-v0.1.4.png',tag:notice.tag,renotify:false,silent:true,data:{url:'/alerts.html',eventId:value.eventId,deviceId:device.id},actions:[{action:'view',title:'Ansehen'}]});shown=true;
   }finally{await store.finish(value.eventId,shown,clock()).catch(()=>{});await receipt(device,value.eventId,shown?'shown':'suppressed');}
  })().catch(()=>{}));
 });
 scope.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
   const data=event.notification.data,device=await store.getDevice().catch(()=>null);
   if(device?.enabled&&device.id===data?.deviceId&&/^[A-Za-z0-9_-]{32}$/.test(data?.eventId))await receipt(device,data.eventId,'clicked');
   const url=new URL('/alerts.html',scope.location.origin).href;
   const windows=await scope.clients.matchAll({type:'window',includeUncontrolled:true}),existing=windows.find(sameOrigin);
   if(existing){await existing.navigate(url);await existing.focus();}else await scope.clients.openWindow(url);
  })());
 });
}
if(typeof self!=='undefined'&&self.registration)installPushHandlers(self);
