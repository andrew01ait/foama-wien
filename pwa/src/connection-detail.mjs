import {departureIsFresh} from './departure-cache.mjs?v=0.6.6';

export function departureAtStation(stop,departure){
 return !!stop&&(departure.provider==='wl'?stop.provider==='wl'&&(stop.rbl||[]).map(String).includes(String(departure.rbl)):departure.provider==='rail'&&stop.provider==='rail'&&(stop.platformIds||[stop.id.slice(5)]).includes(departure.stopId));
}
export function connectionDepartures(stop,target,departures,now=Date.now()){
 const seen=new Set();
 return departures.filter(d=>departureAtStation(stop,d)&&d.route===target.route&&(!target.towards||d.towards===target.towards)&&Date.parse(d.actual)>=now-30_000)
  .sort((a,b)=>Date.parse(a.actual)-Date.parse(b.actual)).filter(d=>{const key=[d.route,d.towards,d.actual].join('|');if(seen.has(key))return false;seen.add(key);return true;});
}
// The operator accepts platform IDs, not a route/destination query. Reuse the
// IDs that actually reported this connection; only fall back within its station.
export function connectionRequestIds(stop,target,departures,limit=24){
 if(stop?.provider!=='wl')return [];
 const valid=new Set((stop.rbl||[]).map(String)),route=departures.filter(d=>departureAtStation(stop,d)&&d.route===target.route);
 const exact=route.filter(d=>!target.towards||d.towards===target.towards);
 const known=exact.length?exact:route;
 let ids=known.map(d=>String(d.rbl));
 if(!ids.length&&target.mode)ids=(stop.platforms||[]).filter(p=>p.modes?.includes(target.mode)).map(p=>String(p.id));
 if(!ids.length)ids=[...valid];
 return [...new Set(ids)].filter(id=>valid.has(id)&&/^\d+$/.test(id)).slice(0,Math.max(1,Math.min(24,limit)));
}
export function lineHasCurrentDeparture(stop,line,departures,{now=Date.now(),hasError=false}={}){
 return connectionDepartures(stop,line,departures,now).some(d=>d.provider!=='wl'||(!hasError&&departureIsFresh(d,now)));
}
export function connectionTarget(value){
 if(!value||typeof value.stopId!=='string'||!value.stopId||value.stopId.length>100||typeof value.route!=='string'||!value.route||value.route.length>30)return null;
 const towards=typeof value.towards==='string'?value.towards:'';
 if(towards.length>160)return null;
 return {stopId:value.stopId,route:value.route,towards,mode:['metro','tram','bus','sbahn','regional','long'].includes(value.mode)?value.mode:''};
}
export function createConnectionNavigation({window,onChange}){
 if('scrollRestoration' in window.history)window.history.scrollRestoration='manual';
 const key='foamaConnection';
 const sync=()=>onChange(connectionTarget(window.history.state?.[key]));
 window.addEventListener('popstate',sync);
 return {
  sync,
  open(value){const target=connectionTarget(value);if(!target)return;const method=window.history.state?.[key]?'replaceState':'pushState';window.history[method]({...window.history.state,[key]:target},'','#verbindung');onChange(target);},
  back(){if(window.history.state?.[key])window.history.back();else onChange(null);},
  stop(){window.removeEventListener('popstate',sync);}
 };
}
