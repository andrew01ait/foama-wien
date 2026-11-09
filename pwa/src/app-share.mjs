// Share the public app only. Never use the current URL, which may carry a
// connection, debugging parameters or a private transfer fragment.
export const APP_INVITATION=Object.freeze({
 title:'foama-wien',
 text:'foama-wien – Öffis, die du noch erreichst. Schau dir die App an!',
 url:'https://foama-wien.endruuu.chatgpt.site/'
});

export function bindAppShare({document=globalThis.document,navigator=globalThis.navigator}={}){
 const $=id=>document.getElementById(id),button=$('shareApp'),dialog=$('appShareDialog'),field=$('appShareUrl'),status=$('appShareStatus');
 field.value=APP_INVITATION.url;
 $('appShareWhatsApp').href='https://wa.me/?text='+encodeURIComponent(APP_INVITATION.text+'\n'+APP_INVITATION.url);
 let busy=false;
 button.addEventListener('click',async()=>{
  if(busy)return;busy=true;button.disabled=true;
  try{
   if(typeof navigator.share==='function'){
    try{await navigator.share({...APP_INVITATION});return;}
    catch(error){if(error?.name==='AbortError')return;}
   }
   status.textContent='';dialog.showModal();
  }finally{busy=false;button.disabled=false;}
 });
 $('closeAppShare').addEventListener('click',()=>dialog.close());
 $('copyAppLink').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(APP_INVITATION.url);status.textContent='App-Link kopiert.';}
  catch{field.focus();field.select();status.textContent='Bitte den markierten App-Link kopieren.';}
 });
}
