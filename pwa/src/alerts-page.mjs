import {createThemeController} from './theme.mjs?v=0.11.3';
let preference='system';try{preference=JSON.parse(localStorage.getItem('foama.settings.v1')||'{}').theme;}catch{}
createThemeController({preference});
const $=id=>document.getElementById(id),escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=value=>value?new Date(value).toLocaleString('de-AT',{timeZone:'Europe/Vienna',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
let lastAttempt=0;
async function load(){
 if(Date.now()-lastAttempt<30000){$('alertsStatus').textContent='Bitte kurz bis zur nächsten Aktualisierung warten.';return;}lastAttempt=Date.now();$('refreshAlerts').disabled=true;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
 try{const response=await fetch('./api/disruptions',{cache:'no-store',signal:controller.signal});const value=await response.json();if(!response.ok)throw Error(value.error||'Meldungen nicht erreichbar.');
  $('alertsList').innerHTML=value.notices.slice().sort((a,b)=>Number(a.planned)-Number(b.planned)||Number(['aufzugsinfo','fahrtreppeninfo'].includes(a.category))-Number(['aufzugsinfo','fahrtreppeninfo'].includes(b.category))).map(notice=>`<details class="alert-message"><summary><span class="alert-lines">${escape(notice.lines.join(' · ')||notice.label)}</span><strong>${escape(notice.title)}</strong>${notice.planned?'<span class="fineprint">Geplant</span>':''}</summary><p>${escape(notice.description)}</p><p class="fineprint">${notice.start?'Ab '+escape(date(notice.start)):''}${notice.end?' · Bis '+escape(date(notice.end)):''} · Wiener Linien</p></details>`).join('');
  $('alertsStatus').textContent=`Abruf ${date(value.checkedAt)} · ${value.notices.length} Meldungen.${value.notices.length?'':' Der Anbieter meldet derzeit keine Einträge; lokale Hinweise vor Ort beachten.'}`;
 }catch(error){$('alertsStatus').textContent=(error.name==='AbortError'?'Abruf dauert zu lange.':error.message)+' Keine Entwarnung bei fehlenden Daten.';}
 finally{clearTimeout(timer);$('refreshAlerts').disabled=false;}
}
$('refreshAlerts').addEventListener('click',()=>void load());void load();
