import {serviceDayStart,timetableDate} from './timetable.mjs?v=0.11.28';

const clockFormat=new Intl.DateTimeFormat('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'short'});
const dayFormat=new Intl.DateTimeFormat('de-AT',{timeZone:'Europe/Vienna',weekday:'short',day:'numeric',month:'numeric',year:'numeric'});
export function timetableHourKey(time=Date.now()){
 const parts=Object.fromEntries(clockFormat.formatToParts(time).map(part=>[part.type,part.value]));
 return timetableDate(time)+'|'+parts.hour+'|'+parts.timeZoneName;
}
export function timetableDayOptions(manifest,now=Date.now()){
 const today=timetableDate(now),out=[{value:today,label:'Heute · '+dayFormat.format(Date.parse(today+'T12:00Z'))}];
 for(let at=Date.parse(today+'T12:00Z')+86400000;Number.isFinite(at);at+=86400000){
  const day=new Date(at).toISOString().slice(0,10);if(!manifest?.validThrough||day>manifest.validThrough)break;
  if(day>=manifest.validFrom)out.push({value:day,label:dayFormat.format(at)});
 }
 return out;
}
export function lineDayDepartures(manifest,stationRows,{route,mode,stopId,towards='',day}={}){
 const parsed=Date.parse(day+'T12:00Z');
 if(!Number.isFinite(parsed)||!/^\d{4}-\d{2}-\d{2}$/.test(day||'')||new Date(parsed).toISOString().slice(0,10)!==day||manifest?.format!==1||manifest.timezone!=='Europe/Vienna'||day<manifest.validFrom||day>manifest.validThrough)return [];
 const noon=Date.parse(day+'T12:00Z'),days=[-2,-1,0,1].map(shift=>new Date(noon+shift*86400000).toISOString().slice(0,10)),seen=new Set(),out=[];
 for(const group of stationRows?.[stopId]||[]){
  const [name,destination,kind,platform,direction,service,seconds]=group;
  if(name!==route||kind!==mode||towards&&destination!==towards||!Array.isArray(seconds)||!Array.isArray(manifest.services?.[service]))continue;
  for(const serviceDay of days){if(!manifest.services[service].includes(serviceDay))continue;const start=serviceDayStart(serviceDay);
   for(const second of seconds){if(!Number.isInteger(second)||second<0||second>=172800)continue;const time=start+second*1000;if(timetableDate(time)!==day)continue;
    const key=JSON.stringify([time,destination]);if(seen.has(key))continue;seen.add(key);
    const parts=Object.fromEntries(clockFormat.formatToParts(time).map(part=>[part.type,part.value]));
    out.push({time,clock:parts.hour+':'+parts.minute,hour:parts.hour,minute:parts.minute,zone:parts.timeZoneName,towards:destination,serviceDay,platform,direction});
   }
  }
 }
 return out.sort((a,b)=>a.time-b.time||a.towards.localeCompare(b.towards,'de-AT'));
}
export function hourlyTimetable(departures){
 const zones=new Map();for(const d of departures){if(!zones.has(d.hour))zones.set(d.hour,new Set());zones.get(d.hour).add(d.zone);}
 const groups=new Map();for(const departure of departures){const key=timetableHourKey(departure.time);if(!groups.has(key))groups.set(key,{key,label:departure.hour+' Uhr'+(zones.get(departure.hour).size>1?' · '+departure.zone:''),departures:[]});groups.get(key).departures.push(departure);}
 return [...groups.values()];
}
