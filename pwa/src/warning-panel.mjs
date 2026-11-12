import {trafficAtStation,dedupeTrafficInfos,noticePriorityGroups,isEquipmentNotice,isPlannedNotice,noticeLines,affectedNoticeLines} from './traffic-info.mjs?v=0.11.23';

const noticeDate=iso=>iso?new Date(iso).toLocaleString('de-AT',{timeZone:'Europe/Vienna',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
const warningIcon='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></svg>';
const infoIcon='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/></svg>';
const chevron='<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="m5 8 5 5 5-5"/></svg>';
export function noticeTitle(notice){
 const title=String(notice.title||notice.label||'Betriebsmeldung'),colon=title.indexOf(':'),routes=noticeLines(notice);
 if(colon>0){const prefix=title.slice(0,colon).trim().split(/\s*(?:,|\/|&|\bund\b)\s*/i);if(prefix.length&&prefix.every(route=>routes.includes(route))&&title.slice(colon+1).trim())return title.slice(colon+1).trim();}
 return title;
}
export function trafficNoticeMarkup(notice,{escape,renderBadge,hasError=false}={}){
 const routes=noticeLines(notice),old=notice.stale||hasError,validity=[notice.start?'Ab '+noticeDate(notice.start):'',notice.end?'Bis '+noticeDate(notice.end):''].filter(Boolean).join(' · ');
 return `<article class="traffic-notice"><div class="notice-title-row">${routes.length?`<span class="notice-route-badges" aria-label="Betroffene Linien">${routes.map(route=>renderBadge(route,notice.lineModes?.[route]||'bus')).join('')}</span>`:''}<strong>${escape(noticeTitle(notice))}</strong>${notice.planned?'<span class="notice-state">Geplant</span>':''}</div>${notice.scope==='stop'&&notice.stationNames?.length?`<p class="notice-stations">${escape(notice.stationNames.join(' · '))}</p>`:''}${notice.description&&notice.description!==notice.title?`<p class="notice-description">${escape(notice.description)}</p>`:''}${validity?`<p class="notice-validity">${escape(validity)}</p>`:''}${notice.scope==='line'?'<p class="notice-scope">Betrifft die Linie, nicht zwingend diese Haltestelle.</p>':''}<p class="notice-updated">${old?'<span class="notice-state" title="Nicht aktuell bestätigt">Älterer Stand</span>':''}<span>Wiener Linien · Stand ${escape(noticeDate(new Date(notice.checkedAt).toISOString()))}</span></p></article>`;
}
export function trafficNoticeBadges(notices,{renderBadge}={}){
 return affectedNoticeLines(notices).map(line=>renderBadge(line.route,line.mode)).join('');
}

export function warningsForTargets(cache,targets,{now=Date.now()}={}){
 const entries=targets.filter(({stop})=>stop?.provider==='wl').flatMap(({stop,routes=null})=>
  noticePriorityGroups(trafficAtStation(cache,stop,{routes,now}),now).warnings.map(notice=>({notice,stop})));
 return dedupeTrafficInfos(entries.map(({notice})=>notice)).map(notice=>({...notice,
  stationNames:[...new Set(entries.filter(entry=>entry.notice.id===notice.id).map(({stop})=>stop.name).filter(Boolean))]
 })).sort((a,b)=>Number(a.planned)-Number(b.planned)||Number(a.stale)-Number(b.stale)||a.title.localeCompare(b.title,'de-AT'));
}
function disclosure({rows=[],key='',label='Warnmeldungen',secondary=false,open=false,escape,renderNotice=()=>'',renderLines=()=>''}){
 const lines=secondary?'':renderLines(rows),preview=rows.length?noticeTitle(rows[0]):'';
 return `<details class="station-notices warning-disclosure${secondary?' secondary-notices':''}" data-persist-key="${escape(key)}" ${open?'open':''}><summary class="warning-heading"><span class="warning-symbol" aria-hidden="true">${secondary?infoIcon:warningIcon}</span><span class="warning-label"><strong class="warning-title">${escape(label)}</strong>${secondary?'':`<span class="notice-summary-lines" aria-label="Betroffene Linien"${lines?'':' hidden'}>${lines}</span>`}<span class="warning-preview">${escape(preview)}</span></span><span class="warning-count" aria-label="Anzahl Meldungen">${rows.length||''}</span><span class="warning-chevron" aria-hidden="true">${chevron}</span></summary><div class="warning-content"><div class="notice-list">${rows.map(renderNotice).join('')}</div><a href="https://www.wienerlinien.at/betriebsinfo" target="_blank" rel="noopener noreferrer" class="notice-source">Wiener Linien Betriebsinfo ↗</a></div></details>`;
}
export function stationNoticeSections(notices,{key,isOpen,escape,renderNotice,renderLines,now=Date.now()}){
 const {warnings,information}=noticePriorityGroups(notices,now);
 const section=(rows,secondary)=>{
  if(!rows.length)return '';
  const id=key+(secondary?':information':''),planned=rows.filter(n=>isPlannedNotice(n,now)).length;
  const label=secondary?(rows.every(isEquipmentNotice)?'Aufzüge & Fahrtreppen':planned===rows.length?'Geplante Hinweise':'Weitere Hinweise'):'Warnmeldungen';
  return disclosure({rows,key:id,label,secondary,open:isOpen(id),escape,renderNotice,renderLines});
 };
 return section(warnings,false)+section(information,true);
}
export function createWarningPanel(panel){
 panel.innerHTML=disclosure({key:'notices:overview',escape:String});
 const details=panel.querySelector('details'),title=panel.querySelector('.warning-title');title.id='warningTitle';panel.setAttribute('aria-labelledby',title.id);
 return {panel,details,count:panel.querySelector('.warning-count'),preview:panel.querySelector('.warning-preview'),list:panel.querySelector('.notice-list'),lines:panel.querySelector('.notice-summary-lines')};
}
export function updateWarningPanel({panel,count,preview,list,details,lines},notices,renderNotice,renderLines=()=> ''){
 panel.hidden=notices.length===0;
 if(lines){lines.innerHTML=renderLines(notices);lines.hidden=!lines.innerHTML;}
 if(!notices.length){list.innerHTML='';count.textContent='';preview.textContent='';details.open=false;return;}
 count.textContent=String(notices.length);preview.textContent=noticeTitle(notices[0]);
 const markup=notices.map(renderNotice).join('');
 if(list.innerHTML!==markup)list.innerHTML=markup;
}
