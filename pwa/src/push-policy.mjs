// Shared, pure relevance and notification limits. Contains no subscription/GPS data.
import {isCurrentNotice} from './traffic-info.mjs?v=0.11.24';
export const PUSH_LIMITS=Object.freeze({gap:30*60_000,daily:6,expiry:90*86400_000,history:90*86400_000,batch:32,subscriptions:256});
// Keep the legacy field false for older clients; equipment never triggers a push.
export function pushPreferences(value={}){return {scope:value.scope==='all'?'all':'favorites',equipment:false,quiet:value.quiet===true};}
export function favoritePushTargets(favorites,stops,journeys=[]){
 const index=new Map(stops.filter(s=>s.provider==='wl').map(s=>[s.id,s])),out=new Map();
 function add(stopId,routes){const stop=index.get(stopId);if(!stop||!out.has(stopId)&&out.size>=100)return;
  const known=new Set((stop.lines||[]).map(line=>line.route)),safe=routes.filter(route=>typeof route==='string'&&known.has(route));if(!safe.length)return;
  const value=out.get(stopId)||{stopId:stop.id,routes:[],rbl:[...new Set((stop.rbl||[]).map(String))].sort()};value.routes=[...new Set([...value.routes,...safe])].sort();out.set(stopId,value);
 }
 for(const favorite of favorites){const stop=index.get(favorite.stopId);if(stop)add(stop.id,favorite.route?[favorite.route]:(stop.lines||[]).map(line=>line.route));}
 for(const journey of (Array.isArray(journeys)?journeys:[]).slice(0,30))for(const path of [journey,...(Array.isArray(journey?.alternatives)?journey.alternatives:[]).slice(0,15)])for(const leg of (Array.isArray(path?.legs)?path.legs:[]).slice(0,32)){
  if(!leg||leg.mode==='walk'||typeof leg.route!=='string')continue;add(leg.from?.stopId,[leg.route]);add(leg.to?.stopId,[leg.route]);
 }
 return [...out.values()];
}
export function pushNoticeMatches(notice,targets,preferences,now=Date.now()){
 if(!isCurrentNotice(notice,now))return false;
 if(!['stoerunglang','stoerungkurz'].includes(notice.category))return false;
 if(preferences.scope==='all')return true;
 const stops=[...(notice.stops||[]),...(notice.boundStops||[])].map(String),lines=notice.lines||[];
 return targets.some(target=>{
  const routeMatch=lines.some(line=>target.routes.includes(line));
  if(stops.length&&notice.category==='stoerungkurz')return target.rbl.some(id=>stops.includes(id))&&(!lines.length||routeMatch);
  return routeMatch||(!lines.length&&target.rbl.some(id=>stops.includes(id)));
 });
}
export function pushDay(now){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));}
export function pushIsQuiet(preferences,now){const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Vienna',hour:'2-digit',hourCycle:'h23'}).format(new Date(now)));return preferences.quiet&&(hour>=22||hour<7);}
export function pushCanSend(record,preferences,now){return !pushIsQuiet(preferences,now)&&now-Number(record.last_sent||0)>=PUSH_LIMITS.gap&&(record.day!==pushDay(now)||Number(record.day_count||0)<PUSH_LIMITS.daily);}
export function pushFingerprint(notice){
 // Ignore polling timestamps and changing supplier IDs for semantically identical messages.
 const clean=value=>String(value||'').normalize('NFKC').toLocaleLowerCase('de-AT').replace(/\s+/g,' ').trim();
 return JSON.stringify([notice.category,[...(notice.lines||[])].sort(),[...(notice.stops||[])].map(String).sort(),clean(notice.title),clean(notice.description),notice.start||'',notice.end||'']);
}
export function disruptionPushPayload(notices,scope='favorites'){
 const lines=[...new Set(notices.flatMap(n=>n.lines||[]))].slice(0,5).join(', ');
 const titles=notices.slice(0,2).map(n=>n.title).join(' · ');
 return {format:'foama-push-v1',title:scope==='favorites'?'Störungen bei deinen Favoriten':'Wiener Linien: Störungen',body:(lines?lines+': ':'')+titles.slice(0,190)+(notices.length>2?` · +${notices.length-2} weitere`:''),url:'/alerts.html',tag:'foama-wien-disruptions'};
}
