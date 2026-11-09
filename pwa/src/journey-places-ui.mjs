import {JOURNEY_PLACES_KEY,sanitizeJourneyPlaces,saveJourneyPlace,journeyPlacePoint,matchingJourneyPlace,journeyEndpointLabel} from './journey-places.mjs?v=0.7.2';
import {uniqueJourneyPlaces} from './journey-planning.mjs?v=0.7.2';
import {createFavoriteMenuController} from './favorite-menu.mjs?v=0.7.2';

export function mountJourneyPlaces({doc=document,storage=localStorage,client,escape,getPoint,onChoose,onOpen=()=>{},onChange=()=>{},confirm=message=>window.confirm(message)}={}){
 const $=id=>doc.getElementById(id),dialog=$('journeyPlacesDialog');let places=[],editingId=null,candidate=null,matches=[],revision=0;
 const menus=createFavoriteMenuController({root:$('journeyPlacesList'),document:doc});
 const read=()=>{try{return sanitizeJourneyPlaces(JSON.parse(storage.getItem(JOURNEY_PLACES_KEY)||'[]'));}catch{return [];}};
 const message=value=>$('journeyPlaceStatus').textContent=value;
 function renderChoices(){for(const kind of ['from','to']){
  const selected=matchingJourneyPlace(places,getPoint(kind));
  $(kind+'SavedPlaces').innerHTML=places.slice(0,4).map(p=>`<button type="button" class="journey-place-chip" data-place-choose="${kind}" data-place-id="${escape(p.id)}" aria-pressed="${p===selected}" title="${escape([p.address,p.detail].filter(Boolean).join(', '))}">${escape(p.label)}</button>`).join('')+(places.length>4?`<button type="button" class="journey-place-chip" data-places-more="${kind}">Weitere Orte</button>`:'');
 }}
 function render(){
  renderChoices();$('journeyPlacesCount').textContent=String(places.length);$('journeyPlaceNew').disabled=places.length>=30;
  $('journeyPlacesList').innerHTML=places.map(p=>`<article class="journey-saved-place"><div class="journey-place-head"><div class="journey-place-info"><strong>${escape(p.label)}</strong><p>${escape(p.address)}${p.detail?'<span class="journey-place-detail">'+escape(p.detail)+'</span>':''}</p></div><details class="favorite-menu journey-favorite-menu journey-place-menu" id="journeyPlaceMenu-${escape(p.id)}" data-favorite-menu="place:${escape(p.id)}" ${menus.isOpen('place:'+p.id)?'open':''}><summary aria-label="${escape(p.label)} verwalten">⋯</summary><div><button type="button" data-place-edit="${escape(p.id)}">Bearbeiten</button><button type="button" data-place-remove="${escape(p.id)}">Entfernen</button></div></details></div><div class="journey-place-controls"><button type="button" class="small-btn" data-place-start="${escape(p.id)}" aria-label="${escape(p.label)} als Start verwenden"><span class="journey-place-action-letter" aria-hidden="true">A</span>Als Start</button><button type="button" class="small-btn" data-place-goal="${escape(p.id)}" aria-label="${escape(p.label)} als Ziel verwenden"><span class="journey-place-action-letter" aria-hidden="true">B</span>Als Ziel</button></div></article>`).join('')||'<div class="journey-places-empty"><strong>Noch keine Orte gespeichert</strong><p>Zum Beispiel Arbeit, Zu Hause oder ein Treffpunkt.</p></div>';
 }
 function persist(next){try{storage.setItem(JOURNEY_PLACES_KEY,JSON.stringify(next));places=next;render();onChange();return true;}catch{message('Der Ort konnte auf diesem Gerät nicht gespeichert werden.');return false;}}
 function setCandidate(value){candidate=value;$('journeyPlaceSave').disabled=!value;}
 function showList({focus=false}={}){
  const prior=editingId;pause();editingId=null;setCandidate(null);$('journeyPlaceForm').hidden=true;$('journeyPlacesList').hidden=false;$('journeyPlaceNew').hidden=false;message('');
  if(focus)(prior&&$('journeyPlaceMenu-'+prior)?.querySelector('summary')||$('journeyPlaceNew')).focus();
 }
 function edit(place=null){pause();editingId=place?.id||null;$('journeyPlacesList').hidden=true;$('journeyPlaceNew').hidden=true;$('journeyPlaceForm').hidden=false;$('journeyPlaceFormTitle').textContent=place?'Ort bearbeiten':'Neuer Ort';$('journeyPlaceLabel').value=place?.label||'';$('journeyPlaceAddress').value=place?[place.address,place.detail].filter(Boolean).join(', '):'';$('journeyPlaceMatches').replaceChildren();setCandidate(place);message('');dialog.scrollTop=0;$('journeyPlaceLabel').focus();}
 function open(){onOpen();showList();render();dialog.showModal();if(!places.length)edit();}
 function pause(){revision++;client.abort();menus.close();$('journeyPlaceSearch').disabled=false;}
 function choose(kind,place){menus.close();onChoose(kind,journeyPlacePoint(place));if(dialog.open)dialog.close();renderChoices();}
 async function lookup(){
  pause();const current=revision,text=$('journeyPlaceAddress').value.trim();setCandidate(null);$('journeyPlaceMatches').replaceChildren();
  if(text.length<3){message('Bitte eine Adresse mit Hausnummer und Ort eingeben.');return;}
  $('journeyPlaceSearch').disabled=true;message('Adresse wird gesucht …');
  try{const result=await client.places(text);if(current!==revision||doc.hidden||!dialog.open)return;matches=uniqueJourneyPlaces(result.places);$('journeyPlaceMatches').innerHTML=matches.map((p,index)=>`<button type="button" data-place-match="${index}">${escape(p.name)}<small>${escape(p.detail||'')}</small></button>`).join('');message(matches.length?'Bitte die richtige Adresse auswählen.':'Keine passende Adresse gefunden.');}
  catch(error){if(current===revision)message(error.name==='AbortError'?'Ortssuche angehalten.':error.message);}
  finally{if(current===revision)$('journeyPlaceSearch').disabled=false;}
 }
 $('journeyPlacesOpen').addEventListener('click',open);$('journeyPlacesClose').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',pause);dialog.addEventListener('cancel',pause);
 $('journeyPlaceNew').addEventListener('click',()=>edit());$('journeyPlaceCancel').addEventListener('click',()=>showList({focus:true}));$('journeyPlaceSearch').addEventListener('click',()=>void lookup());
 $('journeyPlaceAddress').addEventListener('input',()=>{pause();setCandidate(null);$('journeyPlaceMatches').replaceChildren();});
 $('journeyPlaceAddress').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();void lookup();}});
 $('journeyPlaceMatches').addEventListener('click',event=>{const button=event.target.closest('[data-place-match]'),p=button&&matches[Number(button.dataset.placeMatch)];if(!p)return;setCandidate({address:p.name,detail:p.detail||'',lat:p.lat,lon:p.lon});$('journeyPlaceAddress').value=[p.name,p.detail].filter(Boolean).join(', ');$('journeyPlaceMatches').replaceChildren();message('Adresse gewählt. Namen vergeben und Ort speichern.');});
 $('journeyPlaceForm').addEventListener('submit',event=>{event.preventDefault();try{if(!candidate)throw Error('Bitte zuerst eine Adresse suchen und auswählen.');const result=saveJourneyPlace(places,{...candidate,id:editingId,label:$('journeyPlaceLabel').value});if(persist(result.places)){showList({focus:true});message('Ort gespeichert. Du kannst ihn als Start oder Ziel verwenden.');}}catch(error){message(error.message);}});
 $('journeyPlacesList').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;const {placeStart,placeGoal,placeEdit,placeRemove}=button.dataset,p=places.find(p=>p.id===(placeStart||placeGoal||placeEdit||placeRemove));if(!p)return;
  if(placeStart||placeGoal)choose(placeStart?'from':'to',p);else if(placeEdit)edit(p);else if(placeRemove){menus.close();if(confirm('Ort „'+p.label+'“ entfernen? Deine Routen bleiben erhalten.')&&persist(places.filter(row=>row.id!==p.id))){if(editingId===p.id)showList();message('Ort entfernt.');$('journeyPlaceNew').focus();}}
 });
 for(const kind of ['from','to'])$(kind+'SavedPlaces').addEventListener('click',event=>{const button=event.target.closest('button');if(button?.dataset.placesMore){open();return;}const p=places.find(p=>p.id===button?.dataset.placeId);if(p)choose(kind,p);});
 function refresh(){const next=read();if(JSON.stringify(next)!==JSON.stringify(places)){places=next;render();onChange();}}
 places=read();render();
 return {renderChoices,pause,refresh,describeParts:point=>journeyEndpointLabel(places,point),describe:point=>{const p=matchingJourneyPlace(places,point);return p?p.label+' · '+p.address:point?.name||'';}};
}
