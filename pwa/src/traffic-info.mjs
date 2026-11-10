import {normalizeApiDate,modeFromWl} from './core.mjs?v=0.7.5';

export const TRAFFIC_CACHE_MS=15*60_000;
const list=value=>[...new Set((Array.isArray(value)?value:String(value??'').split(',')).map(x=>String(x).trim()).filter(Boolean))];
const text=(value,max=2200)=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|lt|gt|quot);/g,m=>({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"'}[m])).replace(/\s+/g,' ').trim().slice(0,max);
const categoryLabels={stoerunglang:'Betriebsstörung',stoerungkurz:'Betriebshinweis',aufzugsinfo:'Aufzug',fahrtreppeninfo:'Fahrtreppe',information:'Information'};
const normalized=value=>text(value).normalize('NFKC').toLocaleLowerCase('de-AT');
const minute=value=>value?Math.floor(Date.parse(value)/60_000):'';
export const isEquipmentNotice=notice=>['aufzugsinfo','fahrtreppeninfo'].includes(notice.category);
export function isPlannedNotice(notice,now=Date.now()){
 const start=Date.parse(notice.start);
 return Number.isFinite(start)?start>now:notice.planned===true;
}
export function isCurrentNotice(notice,now=Date.now()){
 return !notice.resolved&&!notice.expired&&(!notice.end||!(Date.parse(notice.end)<now))&&!isPlannedNotice(notice,now);
}
export function noticePriorityGroups(notices,now=Date.now()){
 const warnings=[],information=[];
 for(const notice of notices){
  if(notice.resolved||notice.expired||(notice.end&&Date.parse(notice.end)<now))continue;
  (isEquipmentNotice(notice)||isPlannedNotice(notice,now)?information:warnings).push(notice);
 }
 return {warnings,information};
}
// Trust explicit provider references first. Older WL notices sometimes put only
// a route list before the title's colon, or after an explicit "Linie(n)" label.
export function noticeLines(notice){
 const explicit=list(notice.lines).filter(Boolean);if(explicit.length)return explicit;
 const route='(?:U\\d{1,2}|N\\d{1,3}|S\\d{1,2}|\\d{1,3}[AB]?)';
 const group=route+'(?:\\s*(?:,|/|&|UND)\\s*'+route+')*';
 const title=text(notice.title,240).toUpperCase();
 const match=title.match(new RegExp('^('+group+')\\s*:'))||title.match(new RegExp('\\bLINIEN?\\s+('+group+')(?![A-Z0-9])'));
 return match?[...new Set(match[1].match(new RegExp(route,'g')))].slice(0,20):[];
}
export function affectedNoticeLines(notices){
 const lines=new Map();
 for(const notice of notices)for(const route of noticeLines(notice))if(!lines.has(route))lines.set(route,{route,mode:notice.lineModes?.[route]||modeFromWl('',route)});
 const rank={metro:0,tram:1,bus:2,sbahn:3,regional:4,long:5};
 return [...lines.values()].sort((a,b)=>(rank[a.mode]??6)-(rank[b.mode]??6)||a.route.localeCompare(b.route,'de-AT',{numeric:true}));
}
function appliesToStop(notice,id,lines){
 if(notice.boundStops.includes(id)||notice.stops.includes(id))return true;
 // Stop-bound short messages are not line-wide notices for every other station.
 if(['stoerungkurz','aufzugsinfo','fahrtreppeninfo','information'].includes(notice.category)&&(notice.stops.length||notice.boundStops.length))return false;
 return notice.lines.some(line=>lines.has(line));
}
function duplicateKey(notice){
 // Separate equipment failures and direction-specific text must remain separate.
 if(['aufzugsinfo','fahrtreppeninfo'].includes(notice.category))return notice.id;
 return JSON.stringify([notice.category,[...notice.lines].sort(),normalized(notice.title),normalized(notice.description),notice.location||'',minute(notice.start),minute(notice.end)]);
}
export function dedupeTrafficInfos(notices){
 const unique=new Map();
 for(const notice of notices){
  const key=duplicateKey(notice),old=unique.get(key);
  if(!old||(notice.checkedAt||0)>(old.checkedAt||0)||((notice.checkedAt||0)===(old.checkedAt||0)&&notice.scope==='stop'))unique.set(key,notice);
 }
 const values=[...unique.values()];
 return values.filter(short=>!values.some(long=>{
  if(short.category!=='stoerungkurz'||long.category!=='stoerunglang'||!long.reason||long.reason==='undefined')return false;
  if(!short.start||!long.start||Math.abs(Date.parse(short.start)-Date.parse(long.start))>90_000)return false;
  if(!short.lines.length||!short.lines.every(line=>long.lines.includes(line)))return false;
  if(long.stale&&!short.stale)return false;
  const summary=normalized(short.title),reason=normalized(long.reason);
  return (!short.description||normalized(short.description)===summary)&&
   [reason,'fahrtbehinderung wegen '+reason,'fahrtbehinderung durch '+reason,'verspätungen wegen '+reason,'unregelmäßige intervalle wegen '+reason].includes(summary);
 }));
}

export function parseTrafficInfos(raw,now=Date.now()){
 if(raw?.data?.trafficInfos!==undefined&&!Array.isArray(raw.data.trafficInfos))throw Error('Ungültiges Meldungsformat');
 const categories=new Map((raw?.data?.trafficInfoCategories||[]).map(c=>[String(c.id),c.name]));
 const references=new Map();
 for(const monitor of raw?.data?.monitors||[]){const id=String(monitor.locationStop?.properties?.attributes?.rbl??'');
  for(const name of list(monitor.refTrafficInfoNames)){if(!references.has(name))references.set(name,[]);references.get(name).push(id);}
 }
 return (Array.isArray(raw?.data?.trafficInfos)?raw.data.trafficInfos:[]).slice(0,200).map((item,index)=>{
  const de=(item.languages||[]).find?.(language=>language.de)?.de||{};
  const category=categories.get(String(item.refTrafficInfoCategoryId))||'information';
  const title=text(item.title||de.title,240),description=text(item.description||de.descriptionPlain||item.descriptionHTML||de.descriptionHtml);
  const details=Array.isArray(item.relatedLinesDetails)?item.relatedLinesDetails:[];
  const lines=noticeLines({lines:list([...(list(item.relatedLines||item.attributes?.relatedLines)),...details.map(d=>d.lineName)]),title});
  const lineModes=Object.fromEntries(lines.map(line=>[line,modeFromWl(details.find(d=>d.lineName===line)?.vehicleType||item.attributes?.relatedLineTypes?.[line],line)]));
  const stops=list([...(list(item.relatedStops||item.attributes?.relatedStops)),...details.flatMap(d=>list(d.relatedStops))]);
  const start=normalizeApiDate(item.time?.start),end=normalizeApiDate(item.time?.end);
  const resolved=String(item.status||'').toLowerCase()==='resolved';
  const id=String(item.name||`notice-${index}`).slice(0,160),parent=String(item.parentName||id).slice(0,160);
  const reason=text(item.reasonName||item.alertCause||item.attributes?.reason,200);
  return {id,parent,title:title||categoryLabels[category],description,category,reason,location:text(item.location,200),label:/bau|construction/i.test(reason+' '+title)?'Baustelle':categoryLabels[category],
   lines,lineModes,stops,boundStops:list([...(references.get(id)||[]),...(references.get(parent)||[])]),start,end,
   updated:normalizeApiDate(item.time?.lastUpdate||item.time?.lastupdate||item.time?.created),resolved,
   expired:!!end&&Date.parse(end)<now,planned:!!start&&Date.parse(start)>now};
 });
}
export function updateTrafficCache(previous={},raw,requestedIds,now=Date.now()){
 const parsed=parseTrafficInfos(raw,now),resolved=new Set(parsed.filter(n=>n.resolved).flatMap(n=>[n.id,n.parent]));
 const records={};
 for(const [id,record] of Object.entries(previous||{}))if(Number.isFinite(record?.checkedAt)&&now-record.checkedAt<TRAFFIC_CACHE_MS){
  records[id]={checkedAt:record.checkedAt,notices:(record.notices||[]).filter(n=>!resolved.has(n.id)&&!resolved.has(n.parent)&&(!n.end||Date.parse(n.end)>=now))};
 }
 const requested=new Set(requestedIds.map(String));
 for(const monitor of raw?.data?.monitors||[]){
  const id=String(monitor.locationStop?.properties?.attributes?.rbl??'');if(!requested.has(id))continue;
  const lines=new Set((monitor.lines||[]).map(line=>String(line.name)));
  const notices=dedupeTrafficInfos(parsed.filter(n=>!n.resolved&&!n.expired&&appliesToStop(n,id,lines))
   .map(n=>({...n,scope:n.boundStops.includes(id)||n.stops.includes(id)?'stop':'line'}))).slice(0,20);
  records[id]={checkedAt:now,notices};
 }
 return Object.fromEntries(Object.entries(records).sort((a,b)=>b[1].checkedAt-a[1].checkedAt).slice(0,128));
}
export function trafficAtStation(cache,stop,{routes=null,now=Date.now()}={}){
 const out=new Map(),allowed=routes?new Set(routes):null,stationLines=allowed||new Set((stop?.lines||[]).map(line=>line.route));
 for(const id of stop?.rbl||[]){const record=cache[id];if(!record||now-record.checkedAt>TRAFFIC_CACHE_MS)continue;
  for(const notice of record.notices||[]){
   if(notice.resolved||(notice.end&&Date.parse(notice.end)<now))continue;
   if(!appliesToStop(notice,String(id),stationLines))continue;
   if(allowed&&notice.lines.length&&!notice.lines.some(line=>allowed.has(line)))continue;
   const value={...notice,checkedAt:record.checkedAt,stale:now-record.checkedAt>90_000,planned:!!notice.start&&Date.parse(notice.start)>now};
   const old=out.get(notice.id);if(!old||value.checkedAt>old.checkedAt||(value.checkedAt===old.checkedAt&&value.scope==='stop'))out.set(notice.id,value);
  }
 }
 return dedupeTrafficInfos([...out.values()]).sort((a,b)=>Number(a.planned)-Number(b.planned)||Number(a.stale)-Number(b.stale)||a.title.localeCompare(b.title,'de-AT'));
}
