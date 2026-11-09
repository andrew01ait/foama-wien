// Imported by the existing service worker; no GPS, timers or departure requests.
function installPushHandlers(scope){
 scope.addEventListener('push',event=>{
  let value;try{value=event.data?.json();}catch{}
  const valid=value?.format==='foama-push-v1';
  const title=valid?String(value.title||'foama-wien').slice(0,120):'foama-wien';
  event.waitUntil(scope.registration.showNotification(title,{body:valid?String(value.body||'Neue Meldung verfügbar.').slice(0,350):'Öffne die App, um deine Meldungen zu prüfen.',icon:'/icons/icon-192-v0.1.4.png',badge:'/icons/icon-192-v0.1.4.png',tag:valid&&value.tag==='foama-wien-test'?'foama-wien-test':'foama-wien-disruptions',renotify:false,data:{url:'/alerts.html'},actions:[{action:'view',title:'Ansehen'}]}));
 });
 scope.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
   const url=new URL('/alerts.html',scope.location.origin).href;
   const windows=await scope.clients.matchAll({type:'window',includeUncontrolled:true});
   const existing=windows.find(client=>{try{return new URL(client.url).origin===scope.location.origin;}catch{return false;}});
   if(existing){await existing.navigate(url);await existing.focus();}else await scope.clients.openWindow(url);
  })());
 });
}
if(typeof self!=='undefined'&&self.registration)installPushHandlers(self);
