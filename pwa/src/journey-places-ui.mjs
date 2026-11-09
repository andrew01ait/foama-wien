import {JOURNEY_PLACES_KEY,sanitizeJourneyPlaces,saveJourneyPlace,journeyPlacePoint,matchingJourneyPlace} from './journey-places.mjs?v=0.6.4';
import {uniqueJourneyPlaces} from './journey-planning.mjs?v=0.6.4';

export function mountJourneyPlaces({doc=document,storage=localStorage,client,escape,getPoint,onChoose,onOpen=()=>{},onChange=()=>{},confirm=message=>window.confirm(message)}={}){
 const $=id=>doc.getElementById(id),dialog=$('journeyPlacesDialog');let places=[],editingId=null,candidate=null,matches=[],revision=0;
 const read=()=>{try{return sanitizeJourneyPlaces(JSON.parse(storage.getItem(JOURNEY_PLACES_KEY)||'[]'));}catch{return [];}};
 const message=value=>$('journeyPlaceStatus').textContent=value;
 function renderChoices(){for(const kind of ['from','to']){
  const selected=matchingJourneyPlace(places,getPoint(kind));
  $(kind+'SavedPlaces').innerHTML=places.slice(0,4).map(p=>`<button type="button" class="journey-place-chip" data-place-choose="${kind}" data-place-id="${escape(p.id)}" aria-pressed="${p===selected}" title="${escape([p.address,p.detail].filter(Boolean).join(', '))}">${escape(p.label)}</button>`).join('')+(places.length>4?`<button type="button" class="journey-place-chip" data-places-more="${kind}">Weitere Orte</button>`:'');
 }}
 function render(){renderChoices();$('journeyPlacesList').innerHTML=places.map(p=>`<article class="journey-saved-place"><strong>${escape(p.label)}</strong><p>${escape(p.address)}${p.detail?'<br>'+escape(p.detail):''}</p><div class="journey-place-controls"><button type="button" class="small-btn" data-place-start="${escape(p.id)}">Als Start</button><button type="button" class="small-btn" data-place-goal="${escape(p.id)}">Als Ziel</button><button type="button" class="small-btn" data-place-edit="${escape(p.id)}">Bearbeiten</button><button type="button" class="small-btn" data-place-remove="${escape(p.id)}">Entfernen</button></div></article>`).join('')||'<p class="fineprint">Zum Beispiel Arbeit, Zu Hause oder dein Sportplatz.</p>';}
 function persist(next){try{storage.setItem(JOURNEY_PLACES_KEY,JSON.stringify(next));places=next;render();onChange();return true;}catch{message('Der Ort konnte auf diesem Gerät nicht gespeichert werden.');return false;}}
 function setCandidate(value){candidate=value;$('journeyPlaceSave').disabled=!value;}
 function edit(place=null){pause();editingId=place?.id||null;$('journeyPlaceForm').hidden=false;$('journeyPlaceLabel').value=place?.label||'';$('journeyPlaceAddress').value=place?[place.address,place.detail].filter(Boolean).join(', '):'';$('journeyPlaceMatches').replaceChildren();setCandidate(place);message('');$('journeyPlaceLabel').focus();}
 function open(){onOpen();dialog.showModal();render();if(!places.length)edit();}
 function pause(){revision++;client.abort();$('journeyPlaceSearch').disabled=false;}
 function choose(kind,place){onChoose(kind,journeyPlacePoint(place));if(dialog.open)dialog.close();renderChoices();}
 async function lookup(){
  pause();const current=revision,text=$('journeyPlaceAddress').value.trim();setCandidate(null);$('journeyPlaceMatches').replaceChildren();
  if(text.length<3){message('Bitte eine Adresse mit Hausnummer und Ort eingeben.');return;}
  $('journeyPlaceSearch').disabled=true;message('Adresse wird gesucht …');
  try{const result=await client.places(text);if(current!==revision||doc.hidden||!dialog.open)return;matches=uniqueJourneyPlaces(result.places);$('journeyPlaceMatches').innerHTML=matches.map((p,index)=>`<button type="button" data-place-match="${index}">${escape(p.name)}<small>${escape(p.detail||'')}</small></button>`).join('');message(matches.length?'Bitte die richtige Adresse auswählen.':'Keine passende Adresse gefunden.');}
  catch(error){if(current===revision)message(error.name==='AbortError'?'Ortssuche angehalten.':error.message);}
  finally{if(current===revision)$('journeyPlaceSearch').disabled=false;}
 }
 $('journeyPlacesOpen').addEventListener('click',open);$('journeyPlacesClose').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',pause);dialog.addEventListener('cancel',pause);
 $('journeyPlaceNew').addEventListener('click',()=>edit());$('journeyPlaceSearch').addEventListener('click',()=>void lookup());
 $('journeyPlaceAddress').addEventListener('input',()=>{pause();setCandidate(null);$('journeyPlaceMatches').replaceChildren();});
 $('journeyPlaceAddress').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();void lookup();}});
 $('journeyPlaceMatches').addEventListener('click',event=>{const button=event.target.closest('[data-place-match]'),p=button&&matches[Number(button.dataset.placeMatch)];if(!p)return;setCandidate({address:p.name,detail:p.detail||'',lat:p.lat,lon:p.lon});$('journeyPlaceAddress').value=[p.name,p.detail].filter(Boolean).join(', ');$('journeyPlaceMatches').replaceChildren();message('Adresse gewählt. Namen vergeben und Ort speichern.');});
 $('journeyPlaceForm').addEventListener('submit',event=>{event.preventDefault();try{if(!candidate)throw Error('Bitte zuerst eine Adresse suchen und auswählen.');const result=saveJourneyPlace(places,{...candidate,id:editingId,label:$('journeyPlaceLabel').value});if(persist(result.places)){editingId=null;setCandidate(null);$('journeyPlaceForm').hidden=true;message('Ort gespeichert. Du kannst ihn als Start oder Ziel verwenden.');}}catch(error){message(error.message);}});
 $('journeyPlacesList').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;const {placeStart,placeGoal,placeEdit,placeRemove}=button.dataset,p=places.find(p=>p.id===(placeStart||placeGoal||placeEdit||placeRemove));if(!p)return;
  if(placeStart||placeGoal)choose(placeStart?'from':'to',p);else if(placeEdit)edit(p);else if(placeRemove&&confirm('Ort „'+p.label+'“ entfernen? Deine Routen bleiben erhalten.')){if(persist(places.filter(row=>row.id!==p.id))){if(editingId===p.id){editingId=null;setCandidate(null);$('journeyPlaceForm').hidden=true;}message('Ort entfernt.');}}
 });
 for(const kind of ['from','to'])$(kind+'SavedPlaces').addEventListener('click',event=>{const button=event.target.closest('button');if(button?.dataset.placesMore){open();return;}const p=places.find(p=>p.id===button?.dataset.placeId);if(p)choose(kind,p);});
 function refresh(){const next=read();if(JSON.stringify(next)!==JSON.stringify(places)){places=next;render();onChange();}}
 places=read();render();
 return {renderChoices,pause,refresh,describe:point=>{const p=matchingJourneyPlace(places,point);return p?p.label+' · '+p.address:point?.name||'';}};
}
