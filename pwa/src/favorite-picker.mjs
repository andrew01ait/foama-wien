import {searchStations} from './station-search.mjs?v=0.7.1';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function openStationFavoritePicker({dialog,root,stops,nearby=[],initialStop=null,getFavorites,onSave,loadConnections,routeBadge}){
  let selected=null,connections=[],generation=0,alive=true;
  const isSaved=connection=>getFavorites().some(f=>f.stopId===selected?.id&&(f.route||'')===(connection?.route||'')&&(f.towards||'')===(connection?.towards||''));
  root.innerHTML=`<div class="station-picker"><label for="favoriteSearch">Haltestelle suchen</label><input id="favoriteSearch" type="search" placeholder="z. B. Floridsdorf oder Siemensstraße" autocomplete="off"><p class="fineprint">Name eingeben und eine Haltestelle auswählen.</p><div id="favoriteSearchResults" class="station-results"></div><section id="favoriteSelection" hidden><h3 id="favoriteSelectedName"></h3><button id="saveWholeStation" class="primary-btn" type="button">☆ Ganze Haltestelle speichern</button><h4>Oder einzelne Verbindung speichern</h4><p id="favoriteConnectionStatus" class="fineprint" role="status"></p><div id="favoriteConnections" class="connection-options"></div><button id="reloadFavoriteConnections" class="outline-btn" type="button">Linien &amp; Richtungen laden</button><details class="manual-connection"><summary>Verbindung manuell eingeben</summary><label for="favoriteRoute">Linie</label><input id="favoriteRoute" placeholder="z. B. 29B"><label for="favoriteTowards">Richtung</label><input id="favoriteTowards" placeholder="z. B. Floridsdorf"><button id="saveManualConnection" type="button" class="outline-btn">Diese Verbindung speichern</button></details></section><p id="favoritePickerFeedback" class="fineprint" role="status"></p></div>`;
  const $=id=>root.querySelector('#'+id);
  function renderSearch(){
    const query=$('favoriteSearch').value.trim();
    const matches=query?searchStations(stops,query):nearby.slice(0,8);
    $('favoriteSearchResults').innerHTML=matches.map(stop=>`<button type="button" class="station-result" data-select-station="${escape(stop.id)}"><strong>${escape(stop.name)}</strong><span>${stop.provider==='rail'?'ÖBB':'Wiener Linien'} · auswählen →</span></button>`).join('')||`<p class="fineprint">${query?'Keine passende Haltestelle gefunden.':'Tippe einen Haltestellennamen ein.'}</p>`;
  }
  function renderConnections(){
    $('saveWholeStation').textContent=isSaved(null)?'✓ Haltestelle gespeichert':'☆ Ganze Haltestelle speichern';
    $('saveWholeStation').disabled=isSaved(null);
    $('favoriteConnections').innerHTML=connections.map((connection,index)=>`<button type="button" class="connection-option" data-save-connection="${index}" ${isSaved(connection)?'disabled':''}>${routeBadge(connection.route,connection.mode)}<span>→ ${escape(connection.towards)}</span><b>${isSaved(connection)?'✓':'☆'}</b></button>`).join('');
  }
  async function load(){
    if(!selected)return;
    const token=++generation,stop=selected;
    $('reloadFavoriteConnections').disabled=true;$('favoriteConnectionStatus').textContent='Verbindungen werden geladen …';
    try{
      const result=await loadConnections(stop);
      if(!alive||token!==generation)return;
      connections=result.connections;renderConnections();
      $('favoriteConnectionStatus').textContent=result.notice||(connections.length?'Tippe auf die gewünschte Linie und Richtung.':'Aktuell keine Verbindungen verfügbar. Du kannst die ganze Haltestelle speichern.');
    }catch(error){if(alive&&token===generation){$('favoriteConnectionStatus').textContent=error.message;}}
    finally{if(alive&&token===generation)$('reloadFavoriteConnections').disabled=false;}
  }
  function choose(stop){
    selected=stop;connections=[];generation++;$('favoriteSelection').hidden=false;
    $('favoriteSearch').value=stop.name;$('favoriteSearchResults').replaceChildren();
    $('favoriteSelectedName').textContent=stop.name;$('favoritePickerFeedback').textContent='';
    $('favoriteRoute').value='';$('favoriteTowards').value='';renderConnections();void load();
  }
  function save(connection){
    if(!selected||isSaved(connection))return;
    onSave({stopId:selected.id,stopName:selected.name,route:connection?.route||'',towards:connection?.towards||'',...(connection?.mode?{mode:connection.mode}:{})});
    renderConnections();$('favoritePickerFeedback').textContent=connection?'Verbindung gespeichert. Weitere Verbindungen kannst du direkt hinzufügen.':'Haltestelle gespeichert.';
  }
  root.oninput=event=>{if(event.target.id!=='favoriteSearch')return;selected=null;connections=[];generation++;$('favoriteSelection').hidden=true;renderSearch();};
  root.onclick=event=>{
    const button=event.target.closest('button');if(!button)return;
    const id=button.dataset.selectStation;
    if(id){const stop=stops.find(item=>item.id===id);if(stop)choose(stop);return;}
    if(button.dataset.saveConnection!==undefined)return save(connections[Number(button.dataset.saveConnection)]);
    if(button.id==='saveWholeStation')return save(null);
    if(button.id==='reloadFavoriteConnections')return void load();
    if(button.id==='saveManualConnection'){
      const route=$('favoriteRoute').value.trim(),towards=$('favoriteTowards').value.trim();
      if(!route||!towards){$('favoritePickerFeedback').textContent='Bitte Linie und Richtung eingeben oder oben eine Verbindung auswählen.';return;}
      save({route,towards});
    }
  };
  dialog.addEventListener('close',()=>{alive=false;generation++;},{once:true});
  renderSearch();dialog.showModal();
  if(initialStop)choose(initialStop);else $('favoriteSearch').focus();
}
