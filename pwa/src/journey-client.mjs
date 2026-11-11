import {CITY_PREFERENCE,cityPreference,recentDetectedCity} from './city-profiles.mjs?v=0.11.3';
import {connectionRequestIds} from './connection-detail.mjs?v=0.11.3';
import {journeyBoardingTargets} from './journey-planning.mjs?v=0.11.3';
import {mergeJourneyResults} from './journey-options.mjs?v=0.11.3';

export const viennaInput=(date=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date).replace(' ','T');
export function viennaTime(value){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Bitte Datum und Uhrzeit wählen.');
 const utc=Date.parse(value+'Z');
 // Explicit Vienna time, independent of the phone/browser timezone. Reject
 // nonexistent spring DST times; use the earlier occurrence in autumn.
 for(const offset of [120,60]){const date=new Date(utc-offset*60000);if(viennaInput(date)===value)return date.toISOString();}
 throw Error('Diese Uhrzeit gibt es in Wien an diesem Tag nicht. Bitte eine andere Zeit wählen.');
}
export function createJourneyClient({fetch=globalThis.fetch,timeoutMs=23000}={}){
 let controller=null,revision=0;const cache=new Map();
 function abort(){revision++;controller?.abort();controller=null;}
 async function request(kind,body){
  abort();const current=revision,own=new AbortController();controller=own;
  const key=kind+JSON.stringify(body),old=cache.get(key);if(old&&Date.now()-old.at<60000){controller=null;return old.data;}
  const timer=setTimeout(()=>own.abort(),timeoutMs);
  try{
   const response=await fetch('./api/journeys/'+kind,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),signal:own.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
   const raw=await response.text();if(raw.length>1000000)throw Error('Antwort zu groß. Bitte erneut versuchen.');
   const data=JSON.parse(raw);if(!response.ok)throw Error(data.error||'Verbindungssuche derzeit nicht verfügbar.');
   if(own.signal.aborted||revision!==current)throw new DOMException('Suche beendet','AbortError');
   if(kind==='walk'?!Number.isFinite(data.walk?.durationSeconds):!Array.isArray(kind==='plan'?data.journeys:data.places))throw Error('Unvollständige Antwort des Planungsdienstes.');
   cache.set(key,{data,at:Date.now()});while(cache.size>4)cache.delete(cache.keys().next().value);return data;
  }finally{clearTimeout(timer);if(controller===own)controller=null;}
 }
 return {abort,plan:body=>request('plan',body),places:(text,city)=>request('places',{text,city:city||(()=>{try{const manual=cityPreference(JSON.parse(localStorage.getItem(CITY_PREFERENCE)));return manual==='auto'?recentDetectedCity():manual;}catch{return 'wien';}})()}),walk:body=>request('walk',body)};
}
export function createJourneyComparisonClient(options={}){
 const timetable=createJourneyClient(options),transfers=createJourneyClient(options);let revision=0;
 function abort(){revision++;timetable.abort();transfers.abort();}
 async function plan(body){
  abort();const current=revision;
  const responses=await Promise.allSettled([timetable.plan({...body,profile:'timetable'}),transfers.plan({...body,profile:'transfers'})]);
  if(current!==revision)throw new DOMException('Suche beendet','AbortError');
  const valid=responses.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(!valid.length)throw responses[0].reason;
  return {journeys:mergeJourneyResults(valid),plannedAt:valid[0].plannedAt,comparisonComplete:valid.length===2};
 }
 return {abort,plan};
}
export function upcomingBoardings(journey,now=Date.now()){
 if(!journey)return [];
 if(journey.savedPath)return journeyBoardingTargets(journey,{limit:2});
 return journeyBoardingTargets({...journey,legs:journey.legs.filter(leg=>Date.parse(leg.endTime)>=now)},{limit:2});
}
export function focusedJourneyBoardings(journey,index,now=Date.now()){
 if(!journey)return [];
 return Number.isInteger(index)&&index>=0&&index<journey.legs.length?journeyBoardingTargets({...journey,legs:journey.legs.slice(index)},{limit:2}):upcomingBoardings(journey,now);
}
export function journeyMonitorIds(targets,stops,departures=[]){
 const groups=targets.map(target=>connectionRequestIds(stops.find(stop=>stop.id===target.stopId),target,departures)),ids=[];
 for(let i=0;i<24&&ids.length<24;i++)for(const group of groups){if(group[i]&&!ids.includes(group[i]))ids.push(group[i]);if(ids.length===24)break;}
 return ids;
}
