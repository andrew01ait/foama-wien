import {trafficAtStation,dedupeTrafficInfos,noticePriorityGroups,isEquipmentNotice,isPlannedNotice} from './traffic-info.mjs?v=0.6.7';

// Use the same stop/route relevance and expiry rules as the station cards.
export function warningsForTargets(cache,targets,{now=Date.now()}={}){
 const entries=targets.filter(({stop})=>stop?.provider==='wl').flatMap(({stop,routes=null})=>
  noticePriorityGroups(trafficAtStation(cache,stop,{routes,now}),now).warnings.map(notice=>({notice,stop})));
 return dedupeTrafficInfos(entries.map(({notice})=>notice)).map(notice=>({...notice,
  stationNames:[...new Set(entries.filter(entry=>entry.notice.id===notice.id).map(({stop})=>stop.name).filter(Boolean))]
 })).sort((a,b)=>Number(a.planned)-Number(b.planned)||Number(a.stale)-Number(b.stale)||a.title.localeCompare(b.title,'de-AT'));
}

// Secondary notices remain accessible without inflating current service warnings.
export function stationNoticeSections(notices,{key,isOpen,escape,renderNotice,renderLines,now=Date.now()}){
 const {warnings,information}=noticePriorityGroups(notices,now);
 const section=(rows,secondary)=>{
  if(!rows.length)return '';
  const id=key+(secondary?':information':''),first=rows[0],planned=rows.filter(n=>isPlannedNotice(n,now)).length;
  const label=secondary?
   (rows.every(isEquipmentNotice)?'Aufzüge & Fahrtreppen':planned===rows.length?'Geplante Hinweise':'Weitere Hinweise')+' · '+rows.length+(planned?' · '+planned+' geplant':''):
   '⚠ '+(rows.length===1?first.label+': '+first.title:rows.length+' Betriebsmeldungen');
  const badges=secondary?'':renderLines(rows);
  return `<details class="station-notices${secondary?' secondary-notices':''}" data-persist-key="${escape(id)}" ${isOpen(id)?'open':''}><summary><span>${escape(label)}</span>${badges?`<span class="notice-summary-lines" aria-label="Betroffene Linien">${badges}</span>`:''}</summary><div class="notice-list">${rows.map(renderNotice).join('')}<a href="https://www.wienerlinien.at/betriebsinfo" target="_blank" rel="noopener noreferrer" class="notice-source">Wiener Linien Betriebsinfo ↗</a></div></details>`;
 };
 return section(warnings,false)+section(information,true);
}

export function updateWarningPanel({panel,count,preview,list,details,lines},notices,renderNotice,renderLines=()=> ''){
 panel.hidden=notices.length===0;
 if(lines){lines.innerHTML=renderLines(notices);lines.hidden=!lines.innerHTML;}
 if(!notices.length){list.innerHTML='';count.textContent='';preview.textContent='';details.open=false;return;}
 count.textContent=String(notices.length);preview.textContent=notices[0].title;
 const markup=notices.map(renderNotice).join('');
 if(list.innerHTML!==markup)list.innerHTML=markup;
}
