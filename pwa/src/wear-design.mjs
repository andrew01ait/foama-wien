// Reviewable interaction sketch only: no GPS, network, storage or real favourites.
const $=id=>document.getElementById(id);
const examples=[
 {id:'u1',route:'U1',towards:'Leopoldau',station:'Karlsplatz',minutes:7,next:11,walk:2,reach:'good'},
 {id:'u4',route:'U4',towards:'Hütteldorf',station:'Karlsplatz',minutes:5,next:9,walk:2,reach:'tight'},
 {id:'u3',route:'U3',towards:'Ottakring',station:'Stephansplatz',minutes:8,next:13,walk:4,reach:'good'}
];
const state={screen:'main',view:'near',scenario:'normal',selected:'u1',favorites:new Set(['u4','u3']),history:[]};
function route(item){return `<span class="watch-route" data-route="${item.route}">${item.route}</span>`;}
function reach(item){const uncertain=state.scenario!=='normal';return `<span class="watch-status ${uncertain?'unknown':item.reach==='tight'?'tight':''}">${uncertain?'○ Ungewiss':item.reach==='tight'?'● Knapp':'● Erreichbar'}</span>`;}
function warning(){return state.scenario==='tunnel'?'<p class="watch-warning">Standort nur ungefähr<br>Geh-Erreichbarkeit ungewiss</p>':state.scenario==='offline'?'<p class="watch-warning">Offline · letzter Stand<br>Keine aktuellen Abfahrten bestätigt</p>':'';}
function change(screen){state.history.push(state.screen);state.screen=screen;render();}
function render(){
 const selected=examples.find(item=>item.id===state.selected),old=state.scenario==='offline';let html='';
 if(state.screen==='main'){
  const items=state.view==='near'?examples.slice(0,2):examples.filter(item=>state.favorites.has(item.id));
  html=`<nav class="watch-tabs" aria-label="Uhrenansicht"><button data-view="near" class="${state.view==='near'?'active':''}">⌖ Nähe</button><button data-view="fav" class="${state.view==='fav'?'active':''}">★ Favoriten</button></nav>${state.view==='near'?'<p class="watch-place">Karlsplatz</p><p class="watch-meta">ca. 2 Min. Fußweg</p>':'<p class="watch-place">Deine Verbindungen</p>'}${warning()}${items.map(item=>`<button class="watch-row" data-open="${item.id}" aria-label="${item.route} Richtung ${item.towards} öffnen">${route(item)}<span class="watch-destination">${item.towards}<small>${state.view==='fav'?item.station:reach(item)}</small></span><span class="watch-minutes">${old?'~':''}${item.minutes}′<small>${item.next}′ danach</small></span></button>`).join('')||'<p class="watch-meta">Noch keine Favoriten.<br>Über „Mehr“ vom Handy übernehmen.</p>'}<button class="watch-action" data-screen="more">Mehr ⋯</button><p class="watch-footnote">Beispieldaten</p>`;
 }else if(state.screen==='detail'){
  html=`<div class="watch-detail">${route(selected)}<h2>${selected.towards}</h2><p class="watch-meta">${selected.station}${old?' · älterer Stand':''}</p><div class="watch-big-time">${old?'~':''}${selected.minutes}′</div><p class="next-time">danach ${selected.next} Min.</p>${reach(selected)}${warning()}<p class="watch-meta">ca. ${selected.walk} Min. Gehzeit<br>1 Min. Reserve berücksichtigt</p><button class="watch-action ${state.favorites.has(selected.id)?'':'primary'}" data-favorite="${selected.id}">${state.favorites.has(selected.id)?'★ Favorit gespeichert':'☆ Als Favorit speichern'}</button><button class="watch-back" data-back>‹ Zurück</button><p class="watch-footnote">${old?'Letzter Stand · Beispiel':'Beispielabfahrt'}</p></div>`;
 }else if(state.screen==='more'){
  html='<button class="watch-back" data-back>‹ Zurück</button><h2 class="watch-menu-title">Mehr</h2><button class="watch-action" data-screen="transfer">Favoriten übertragen</button><button class="watch-action" data-screen="walking">Geh-Einstellungen</button><button class="watch-action" data-refresh>Jetzt aktualisieren</button><p class="watch-footnote">foama-wien · Design 0.1</p>';
 }else if(state.screen==='transfer'){
  html='<button class="watch-back" data-back>‹ Zurück</button><p class="watch-place">Favoriten übertragen</p><div class="qr-placeholder">QR-Platzhalter<br>kein aktiver Code</div><p class="watch-meta">Später mit dem Handy scannen.<br>10 Minuten gültig.</p><p class="watch-footnote">Geplanter Ablauf – noch kein Transferdienst verbunden.</p>';
 }else{
  html='<button class="watch-back" data-back>‹ Zurück</button><h2 class="watch-menu-title">Geh-Einstellungen</h2><p class="watch-setting">Gehgeschwindigkeit<strong>4,5 km/h</strong></p><p class="watch-setting">Reserve<strong>1 Minute</strong></p><p class="watch-meta">Große Auswahlfelder/Schritte für die native Umsetzung vorgesehen.</p>';
 }
 $('watchScreen').innerHTML=html;$('watchScreen').scrollTop=0;
 $('scenarioExplanation').textContent={normal:'Normal: nächste Abfahrten und eine Geh-Einschätzung je Verbindung.',tunnel:'Tunnel/grober Standort: Abfahrten bleiben sichtbar, die Geh-Einschätzung wird ungewiss.',offline:'Offline: letzter Stand ist klar gekennzeichnet. Keine grüne Erreichbarkeit aufgrund alter Daten.'}[state.scenario];
}
function back(){state.screen=state.history.pop()||'main';render();}
$('watchScreen').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;
 if(button.dataset.view){state.view=button.dataset.view;state.screen='main';state.history=[];render();}
 else if(button.dataset.open){state.selected=button.dataset.open;change('detail');}
 else if(button.hasAttribute('data-back'))back();
 else if(button.dataset.screen)change(button.dataset.screen);
 else if(button.dataset.favorite){state.favorites.has(button.dataset.favorite)?state.favorites.delete(button.dataset.favorite):state.favorites.add(button.dataset.favorite);render();}
 else if(button.hasAttribute('data-refresh')){state.screen='main';state.history=[];render();}
});
for(const button of document.querySelectorAll('[data-scenario]'))button.addEventListener('click',()=>{state.scenario=button.dataset.scenario;for(const item of document.querySelectorAll('[data-scenario]'))item.setAttribute('aria-pressed',String(item===button));render();});
$('previewBack').addEventListener('click',back);$('previewHome').addEventListener('click',()=>{state.screen='main';state.history=[];render();});
$('largeFont').addEventListener('change',event=>$('watchNative').classList.toggle('large-text',event.target.checked));
new ResizeObserver(()=>{$('watchNative').style.setProperty('--watch-scale',String($('watchFace').clientWidth/227));}).observe($('watchFace'));
render();
