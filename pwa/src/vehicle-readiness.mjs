export function vehicleReadiness({stage='ready',state=null,range=null,running=true,paused=false,requesting=false,waitingUntil=0,repeated=false,error='',now=Date.now()}={}){
 const dataReady=stage==='ready',fresh=state?.at&&!state.stale,tracks=fresh?state.tracks||[]:[],candidates=tracks.filter(t=>t.hits>0&&!t.blocked&&!t.retired&&!t.awaiting&&(!Number.isFinite(t.lastSeen)||(state.fullLine?now-t.lastSeen<=60_000:t.lastSeen===state.at))),confirmed=candidates.filter(t=>t.hits>=2),placed=confirmed.filter(t=>t.position&&t.position.basis!=='held'),future=confirmed.filter(t=>!t.position&&t.schedule?.times?.[t.schedule.start]?.[0]>now),visible=placed.filter(t=>!range||t.position.progress>=range.start&&t.position.progress<=range.end),wait=Math.max(0,Math.ceil((waitingUntil-now)/1000)),problem=error||state?.problem||'';
 const steps=[
  {label:'Strecke laden',status:dataReady?'done':'active'},
  {label:'Abfahrten laden',status:fresh?'done':dataReady?'active':'pending'},
  {label:'Fahrzeuge finden',status:candidates.length?'done':fresh?'active':'pending'},
  {label:'Positionen prüfen',status:confirmed.length?'done':candidates.length?'active':'pending'}
 ];
 if(dataReady&&!running)for(const step of steps)if(step.status==='active')step.status='pending';
 let title,detail;
 if(paused){title='Anzeige pausiert';detail='Sobald du zurückkehrst, geht es weiter.';}
 else if(problem){title='Live-Daten gerade nicht verfügbar';detail=dataReady?'Wir versuchen es automatisch erneut.':problem;}
 else if(!dataReady){title='Strecke wird geladen';detail='Die Fahrzeuganzeige startet automatisch.';}
 else if(!running){title='Fahrzeuganzeige bereit';detail='Die Anzeige startet, sobald sie geöffnet ist.';}
 else if(visible.length){title=visible.length+' Fahrzeug'+(visible.length===1?'':'e')+' sichtbar';detail='Position aus aktuellen Abfahrten geschätzt.';}
 else if(confirmed.length){title=range&&placed.length?'Noch kein Fahrzeug in deinem Ausschnitt':future.length===confirmed.length?'Nächste Fahrzeuge starten später':'Fahrzeugpositionen noch offen';detail=range&&placed.length?'Auf anderen Abschnitten sind bereits Fahrzeuge sichtbar.':future.length===confirmed.length?'Aktuell ist noch kein Fahrzeug auf der Strecke darstellbar.':'Wir warten auf passende Live-Daten.';}
 else if(candidates.length){title='Fahrzeugpositionen werden geprüft';detail=repeated?'Wir warten auf neue Live-Daten.':'Ein weiterer Live-Abgleich hilft, die Positionen zu prüfen.';}
 else if(fresh){title='Fahrzeuge werden gesucht';detail=state.rows.length?'Die Positionen sind noch nicht eindeutig.':'Für diese Richtung sind gerade keine Live-Abfahrten verfügbar.';}
 else if(state?.at){title='Fahrzeugdaten werden aktualisiert';detail='Die bisherigen Meldungen sind nicht mehr aktuell.';}
 else{title='Abfahrten werden geladen';detail='Wir suchen Fahrzeuge auf deiner Linie.';}
 const next=paused||!running?'':requesting?'Live-Daten werden abgerufen …':wait?'Nächste Aktualisierung in '+wait+' s':'';
 return {steps,title,detail,next,complete:steps.filter(s=>s.status==='done').length,paused,problem:!!problem};
}
export function createVehicleReadiness({doc=globalThis.document}={}){
 const element=doc.createElement('section');element.className='vehicle-readiness';element.setAttribute('aria-label','Fahrzeuganzeige wird vorbereitet');let previous='';
 element.innerHTML='<strong class="vehicle-readiness-title" role="status"></strong><div class="vehicle-readiness-progress" role="progressbar" aria-label="Fortschritt der Fahrzeuganzeige" aria-valuemin="0" aria-valuemax="4"></div><p class="vehicle-readiness-detail"></p><p class="vehicle-readiness-next" aria-live="off"></p>';
 const nodes=Object.fromEntries(['title','progress','detail','next'].map(key=>[key,element.querySelector('.vehicle-readiness-'+key)]));
 const set=(key,value)=>{if(nodes[key].textContent!==value)nodes[key].textContent=value;};
 function render(options){
  const model=vehicleReadiness(options),current=model.steps.find(step=>step.status==='active')||model.steps.find(step=>step.status==='pending')||model.steps.at(-1),progress=model.steps.map(step=>'<span data-state="'+step.status+'" aria-hidden="true"></span>').join('');
  element.dataset.state=model.paused?'paused':model.problem?'error':model.complete===4?'ready':'loading';set('title',model.title);set('detail',model.detail);set('next',model.next);nodes.progress.setAttribute('aria-valuenow',String(model.complete));nodes.progress.setAttribute('aria-valuetext',model.complete===4?'Fahrzeugdaten bereit':model.title+' · '+current.label);if(progress!==previous){nodes.progress.innerHTML=progress;previous=progress;}
 }
 render({stage:'catalogue'});return {element,render};
}
