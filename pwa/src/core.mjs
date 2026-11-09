/* foama-wien - pure, platform-agnostic departure/geo logic; deliberately no tracking */
export const DEFAULTS = Object.freeze({radius:300,speed:4.5,buffer:1,refreshSeconds:30,view:'near',theme:'system',favoriteSort:'manual',filtersCollapsed:false,motionBatterySaving:false,modes:{metro:true,tram:true,bus:true,sbahn:true,regional:false,long:false},proxyBase:'',routingBase:'https://valhalla1.openstreetmap.de',movementMeters:40});
export const LIVE_STALE_MS=90_000;
export const ACTIVITY_REFRESH_MS=30_000;
export const MAX_STOP_IDS=24;
export const shortId = value => String(value ?? '').trim();
export function parseCsv(text, delimiter=';') {
  const rows=[];let current=[],part='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){part+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){current.push(part);part='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;current.push(part);if(current.some(s=>s.length))rows.push(current);current=[];part='';}else part+=c;}if(part||current.length){current.push(part);rows.push(current);}return rows;
}
function normalizedHeader(s){return String(s).trim().replace(/^\uFEFF/,'').toLowerCase().replace(/[_\s]/g,'');}
function extract(row,headers,names){for(const k of names){const idx=headers.indexOf(normalizedHeader(k));if(idx!==-1)return row[idx]??'';}return '';}
export function parseWlStopsCsv(csv){
  const rows=parseCsv(csv);if(!rows.length)return [];
  const header=rows[0].map(normalizedHeader);
  const rblIndex=header.some(h=>['stopid','rblnummer','rbl'].includes(h));
  if(!rblIndex)throw Error('Haltepunkte-Datei: Spalte StopID/RBL fehlt. Bitte wienerlinien-ogd-haltepunkte.csv verwenden.');
  const out=new Map();
  for(const r of rows.slice(1)){
    const id=extract(r,header,['StopID','RBL_NUMMER','rbl']);
    const name=extract(r,header,['StopText','PlatformText','NAME']);
    const lat=Number(String(extract(r,header,['Latitude','WGS84_LAT','lat'])).replace(',','.'));
    const lon=Number(String(extract(r,header,['Longitude','WGS84_LON','lon'])).replace(',','.'));
    if(!/^\d+$/.test(id)||!name||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<47||lat>49||lon<15||lon>18)continue;
    const diva=extract(r,header,['DIVA']);
    // Group by DIVA, but never throw away platform RBL IDs. Coordinates are platform-based.
    const key=diva?`wl:${diva}`:`wl:rbl:${id}`;
    let stop=out.get(key);
    if(!stop){stop={id:key,name,lat,lon,provider:'wl',rbl:[],diva};out.set(key,stop);}
    if(!stop.rbl.includes(id))stop.rbl.push(id);
  }
  return [...out.values()];
}
export function haversineMeters(a,b){if(!a||!b)return Infinity;const R=6371000,rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad,h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));}
export function normalizeApiDate(v){if(!v)return null;const s=String(v).replace(/([+-]\d{2})(\d{2})$/,'$1:$2');const d=new Date(s);return Number.isFinite(+d)?d.toISOString():null;}
export function modeFromWl(type,name){const t=String(type||'').toLowerCase(),l=String(name||'');if(t.includes('metro')||/^U[1-9]$/i.test(l))return 'metro';if(t.includes('trains')||/^S\d/i.test(l))return 'sbahn';if(t.includes('train'))return /^(?:R\d*|REX|CJX)/i.test(l)?'regional':'long';if(t.includes('tram')||t.includes('wlb'))return 'tram';return 'bus';}
export function parseWlMonitors(raw,fetchedAt=new Date().toISOString()){
  if(raw?.message?.messageCode && Number(raw.message.messageCode)>1)throw new Error(raw.message.value||'Wiener-Linien-API meldet einen Fehler');
  const monitors=raw?.data?.monitors;if(!Array.isArray(monitors))throw Error('Unbekanntes Format der Wiener-Linien-API');
  const out=[];const unique=new Set();
  for(const m of monitors){const loc=m.locationStop||{};const p=loc.properties||{};const id=String(p.attributes?.rbl??'');const station=String(p.title||p.name||'Haltestelle');
    for(const line of m.lines||[]){
      for(const d of line.departures?.departure||[]){const vehicle=d.vehicle||{},route=String(vehicle.name||line.name||'?'),towards=String(vehicle.towards||line.towards||line.towardsDirection||'Richtung unbekannt'),mode=modeFromWl(vehicle.type||line.type||m.type,route);const time=d.departureTime||{};const plan=normalizeApiDate(time.timePlanned),real=normalizeApiDate(time.timeReal);if(!plan&&!real)continue;const key=[station,route,towards,plan||real].join('|');if(unique.has(key))continue;unique.add(key);
        const access=Object.hasOwn(vehicle,'barrierFree')?vehicle.barrierFree:line.barrierFree;
        out.push({id:`wl:${key}`,provider:'wl',rbl:id,station,route,towards,mode,scheduled:plan,realtime:real,actual:real||plan,quality:real?'live':'schedule',fetchedAt,platform:String(line.platform||''),barrierFree:typeof access==='boolean'?access:null,barrierFreeSource:typeof access==='boolean'?(Object.hasOwn(vehicle,'barrierFree')?'vehicle':'line'):null});
      }
    }
  }
  return out;
}
export function isEnabled(mode,settings){return settings.modes?.[mode]!==false;}
export function availableDeparts(departs,settings,now=Date.now()){
  const m=typeof now==='number'?now:+now;
  const by=new Map();
  for(const d of departs){if(!isEnabled(d.mode,settings))continue;const when=Date.parse(d.actual);if(!Number.isFinite(when)||when<m-30_000)continue;const key=`${d.route}|${d.towards}`;if(!by.has(key))by.set(key,[]);by.get(key).push(d);}
  return [...by.entries()].map(([id,values])=>({id,route:values[0].route,towards:values[0].towards,mode:values[0].mode,departures:values.sort((a,b)=>Date.parse(a.actual)-Date.parse(b.actual)).slice(0,2)})).sort((a,b)=>Date.parse(a.departures[0].actual)-Date.parse(b.departures[0].actual));
}
export function countdownMinutes(iso,now=Date.now()){const delta=Date.parse(iso)-(typeof now==='number'?now:+now);return Number.isFinite(delta)?Math.max(0,Math.ceil(delta/60000)):null;}
export function walkingMinutes(meters,speed=4.5){return Number.isFinite(meters)&&speed>0?meters/1000/speed*60:null;}
export function reachability(departureIso,walkingMin,buffer=1,now=Date.now(),reliable=true){const when=Date.parse(departureIso);if(!Number.isFinite(when)||walkingMin==null||!Number.isFinite(walkingMin)||!reliable)return {status:'unknown',remaining:null};const remaining=(when-(typeof now==='number'?now:+now))/60000-walkingMin-buffer;return {status:remaining>=3?'good':remaining>=0?'tight':'missed',remaining};}
export function mergeSettings(value){return {...DEFAULTS,...(value||{}),modes:{...DEFAULTS.modes,...(value?.modes||{})},favoriteSort:value?.favoriteSort==='distance'?'distance':'manual',theme:['system','dark','light'].includes(value?.theme)?value.theme:'system',radius:Math.min(2000,Math.max(100,Number(value?.radius)||DEFAULTS.radius)),speed:Math.min(7,Math.max(2.5,Number(value?.speed)||DEFAULTS.speed)),buffer:Math.min(5,Math.max(0,Number.isFinite(Number(value?.buffer))?Number(value.buffer):DEFAULTS.buffer))};}
export function withinRadius(stops,location,radius){return stops.map(s=>({...s,airMeters:haversineMeters(location,s)})).filter(s=>s.airMeters<=radius).sort((a,b)=>a.airMeters-b.airMeters);}
export function favoriteKey(f){return `${f.stopId}|${f.route||''}|${f.towards||''}`;}
export function dedupeFavorites(favs){if(!Array.isArray(favs))return [];const keys=new Set();return favs.filter(f=>{const k=favoriteKey(f);if(keys.has(k))return false;keys.add(k);return true;});}
export function directionEquivalent(expected,actual){const parts=value=>{const label=String(value||'').replace(/^(?:Wien|Graz|Salzburg|Linz(?:\/Donau)?)\s+/i,'').trim().toLocaleLowerCase('de-AT'),via=label.match(/\s+\((?:über|üb\.?|via)\s+(.+)\)$/u);return {name:(via?label.slice(0,via.index):label).replace(/\s+(?:s\s+u|u\s+s|s|u)$/u,'').trim(),via:via?.[1]||''};};const a=parts(expected),b=parts(actual);return !!a.name&&a.name===b.name&&(!a.via||a.via===b.via);}
export function favoriteMatches(f,d){return (!f.route||f.route===d.route)&&(!f.towards||f.towards===d.towards||(['gtfs','transitous','linz-efa'].includes(d.source)&&directionEquivalent(f.towards,d.towards)));}
export function isActivePage(doc=globalThis.document){return !!doc&&!doc.hidden;}
// Rail GTFS records retain explicit date validity. Only scheduled departures are emitted.
export function railDepartures(feed,stopIds,now=new Date()){
  if(!feed?.services||!Array.isArray(feed.departures))return [];
  const tz='Europe/Vienna';const dtf=new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const parts=Object.fromEntries(dtf.formatToParts(now).map(p=>[p.type,p.value]));const date=`${parts.year}-${parts.month}-${parts.day}`;
  const tNow=(Number(parts.hour)*60+Number(parts.minute))*60+Number(parts.second);const ids=new Set(stopIds);
  const nextDay=new Date(`${date}T12:00:00Z`);nextDay.setUTCDate(nextDay.getUTCDate()+1);const dateTomorrow=nextDay.toISOString().slice(0,10);nextDay.setUTCDate(nextDay.getUTCDate()-2);const dateYesterday=nextDay.toISOString().slice(0,10);if(feed.validThrough&&feed.validThrough<date)return [];
  const out=[];
  for(const r of feed.departures){if(!ids.has(r.stop))continue;for(const [day,shift] of [[dateYesterday,-86400],[date,0],[dateTomorrow,86400]]){
    const dates=feed.services[r.service]||[];if(!dates.includes(day))continue;
    const seconds=r.seconds+shift,remaining=seconds-tNow;if(remaining<-30||remaining>7200)continue;
    const at=new Date(+now+remaining*1000).toISOString();out.push({id:`rail:${r.stop}:${r.trip}:${day}`,provider:'rail',stopId:r.stop,station:r.station||'',route:r.route,towards:r.towards,mode:r.mode||'regional',actual:at,scheduled:at,realtime:null,quality:'schedule',fetchedAt:null,platform:r.platform||''});
  }}return out;
}
export function groupDeparturesByStop(ds){const map=new Map();for(const d of ds){const k=d.stopId||d.rbl||d.station;if(!map.has(k))map.set(k,[]);map.get(k).push(d);}return map;}
