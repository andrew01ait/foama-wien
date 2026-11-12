import {directionEquivalent,directionKey} from './core.mjs?v=0.11.17';
import {departureIsFresh} from './departure-cache.mjs?v=0.11.17';

export function departureAtStation(stop,departure){
 return !!stop&&(departure.source==='gtfs'?departure.stopId===stop.id:departure.provider==='wl'?stop.provider==='wl'&&(stop.rbl||[]).map(String).includes(String(departure.rbl)):departure.provider==='transitous'?stop.provider==='transitous'&&departure.stopId===stop.id:departure.provider==='rail'&&stop.provider==='rail'&&(stop.platformIds||[stop.id.slice(5)]).includes(departure.stopId));
}
export function connectionDepartures(stop,target,departures,now=Date.now()){
 const seen=new Set();
 return departures.filter(d=>departureAtStation(stop,d)&&d.route===target.route&&(!target.mode||d.mode===target.mode)&&(!target.towards||directionKey(d.towards)===directionKey(target.towards)||(['gtfs','transitous','linz-efa'].includes(d.source)&&directionEquivalent(target.towards,d.towards)))&&Date.parse(d.actual)>=now-30_000)
  .sort((a,b)=>Date.parse(a.actual)-Date.parse(b.actual)).filter(d=>{const key=[d.route,d.towards,d.actual].join('|');if(seen.has(key))return false;seen.add(key);return true;});
}
// The operator accepts platform IDs, not a route/destination query. Reuse the
// IDs that actually reported this connection; only fall back within its station.
export function connectionRequestIds(stop,target,departures,limit=24){
 if(stop?.provider!=='wl')return [];
 const valid=new Set((stop.rbl||[]).map(String)),route=departures.filter(d=>departureAtStation(stop,d)&&d.route===target.route);
 const exact=route.filter(d=>!target.towards||directionKey(d.towards)===directionKey(target.towards));
 const known=exact.length?exact:route;
 let ids=known.map(d=>String(d.rbl));
 if(!ids.length&&target.mode)ids=(stop.platforms||[]).filter(p=>p.modes?.includes(target.mode)).map(p=>String(p.id));
 if(!ids.length)ids=[...valid];
 return [...new Set(ids)].filter(id=>valid.has(id)&&/^\d+$/.test(id)).slice(0,Math.max(1,Math.min(24,limit)));
}
export function lineHasCurrentDeparture(stop,line,departures,{now=Date.now(),hasError=false}={}){
 return connectionDepartures(stop,line,departures,now).some(d=>Date.parse(d.actual)<=now+2*3600000&&(d.source==='gtfs'||d.provider==='rail'||(!hasError&&departureIsFresh(d,now))));
}
export function connectionTarget(value){
 if(!value||typeof value.stopId!=='string'||!value.stopId||value.stopId.length>100||typeof value.route!=='string'||!value.route||value.route.length>30)return null;
 const towards=typeof value.towards==='string'?value.towards:'';
 if(towards.length>160)return null;
 return {stopId:value.stopId,route:value.route,towards,mode:['metro','tram','bus','sbahn','regional','long'].includes(value.mode)?value.mode:''};
}
function monitoredConnection(value,stops){
 const target=connectionTarget(value),stop=target&&stops.find(s=>s.id===target.stopId);
 return stop?.provider==='wl'&&Array.isArray(stop.rbl)&&stop.rbl.some(id=>/^\d+$/.test(String(id)))?target:null;
}
export function connectionMonitorUrl(value,stops){
 const target=monitoredConnection(value,stops);if(!target)return null;
 return './?'+new URLSearchParams({halt:target.stopId,linie:target.route,verkehrsmittel:target.mode,richtung:target.towards})+'#verbindung';
}
export function connectionUrlTarget(search,stops){
 const params=new URLSearchParams(search);
 return monitoredConnection({stopId:params.get('halt'),route:params.get('linie'),mode:params.get('verkehrsmittel'),towards:params.get('richtung')||''},stops);
}
export function createConnectionNavigation({window,onChange}){
 if('scrollRestoration' in window.history)window.history.scrollRestoration='manual';
 const key='foamaConnection';
 const sync=()=>onChange(connectionTarget(window.history.state?.[key]));
 window.addEventListener('popstate',sync);
 return {
  sync,
  open(value,{replace=false}={}){const target=connectionTarget(value);if(!target)return;const method=replace||window.history.state?.[key]?'replaceState':'pushState';window.history[method]({...window.history.state,[key]:target},'','#verbindung');onChange(target);},
  back(){if(window.history.state?.[key]&&window.history.length===1){window.history.replaceState({...window.history.state,[key]:null},'',(window.location?.pathname||'./')+'#naehe');onChange(null);}else if(window.history.state?.[key])window.history.back();else onChange(null);},
  stop(){window.removeEventListener('popstate',sync);}
 };
}
