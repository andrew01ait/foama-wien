const text=(value,max=160)=>String(value??'').trim().slice(0,max);
export const transitMode=value=>({SUBWAY:'metro',TRAM:'tram',BUS:'bus',COACH:'bus',ODM:'bus',SUBURBAN:'sbahn',REGIONAL_RAIL:'regional',LONG_DISTANCE:'long',HIGHSPEED_RAIL:'long',NIGHT_RAIL:'long'})[value]||null;
export function providerStationIdentity(value){return String(value||'').match(/(?:^|_)P?(at:\d+:\d+)(?::|$)/)?.[1]||null;}
const iso=value=>typeof value==='string'&&/(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;

export function normalizeRegionalBoard(payload,stop,now=Date.now()){
 if(!Array.isArray(payload?.stopTimes))throw Error('Ungültige Abfahrtsantwort');
 const result=[],seen=new Set();
 for(const row of payload.stopTimes.slice(0,200)){
  const place=row.place||{},identity=providerStationIdentity(place.stopId)||providerStationIdentity(place.parentId);
  // Exact IFOPT identity, never a similarly named neighboring station.
  if(identity!==stop.ifopt||row.cancelled===true||row.tripCancelled===true||place.cancelled===true)continue;
  const mode=transitMode(row.mode),route=text(row.routeShortName||row.displayName,30),towards=text(row.headsign);
  const scheduled=iso(place.scheduledDeparture)||iso(place.departure),real=stop.city!=='salzburg'&&row.realTime===true?iso(place.departure):null;
  if(!mode||!route||!towards||!scheduled)continue;const actual=real||scheduled;
  if(Date.parse(actual)<now-30000||Date.parse(actual)>now+24*3600000)continue;
  const key=JSON.stringify([stop.id,route,towards,mode,scheduled,text(row.tripId,256)]);if(seen.has(key))continue;seen.add(key);
  result.push({id:'transitous:'+key,provider:'transitous',source:'transitous',stopId:stop.id,providerStopId:text(place.stopId,256),station:stop.name,route,towards,mode,scheduled,realtime:real,actual,quality:real?'live':'schedule',fetchedAt:new Date(now).toISOString(),platform:text(place.track||place.scheduledTrack,30),barrierFree:row.wheelchairAccessible==='ACCESSIBLE'?true:null,barrierFreeSource:row.wheelchairAccessible==='ACCESSIBLE'?'vehicle':null});
 }
 return result.sort((a,b)=>Date.parse(a.actual)-Date.parse(b.actual));
}
export function efaDate(value){
 if(!value)return null;
 const pad=n=>String(n).padStart(2,'0'),label=`${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}`;
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(label))return null;
 const at=Date.parse(label+'Z');if(!Number.isFinite(at))return null;
 const format=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 for(const offset of [120,60]){const date=new Date(at-offset*60000);if(format.format(date).replace(' ','T')===label)return date.toISOString();}
 return null;
}
export function normalizeLinzBoard(payload,stop,now=Date.now()){
 const point=payload?.dm?.points?.point;
 if(!point||Array.isArray(point)||point.ref?.gid!==stop.ifopt||!Array.isArray(payload.departureList))throw Error('Linzer Haltestellenkennung nicht bestätigt');
 const seen=new Set(),out=[];
 for(const row of payload.departureList.slice(0,200)){
  if(String(row.stopID)!==String(point.ref.id))continue;
  const line=row.servingLine||{},route=text(line.number||line.symbol,30),towards=text(line.direction),scheduled=efaDate(row.dateTime);
  const real=line.realtime==='1'&&row.realtimeTripStatus!=='CANCELLED'?efaDate(row.realDateTime):null;
  if(row.realtimeTripStatus==='CANCELLED'||line.realtime==='0'&&String(line.delay)==='-9999')continue;
  const mode=({'0':'regional','1':'sbahn','2':'metro','3':'metro','4':'tram','5':'bus','6':'bus','7':'bus','10':'bus'})[String(line.motType)]||'bus';
  if(!route||!towards||towards==='0'||!scheduled||Date.parse(real||scheduled)<now-30000||Date.parse(real||scheduled)>now+24*3600000)continue;
  const key=JSON.stringify([stop.id,route,towards,scheduled]);if(seen.has(key))continue;seen.add(key);
  out.push({id:'efa:'+key,provider:'transitous',source:'linz-efa',stopId:stop.id,providerStopId:stop.ifopt,station:stop.name,route,towards,mode,scheduled,realtime:real,actual:real||scheduled,quality:real?'live':'schedule',fetchedAt:new Date(now).toISOString(),platform:text(row.platformName,30),barrierFree:null});
 }
 return out.sort((a,b)=>Date.parse(a.actual)-Date.parse(b.actual));
}
export function regionalRequestStops(stops,{visible=new Set(),expanded=new Set(),cycle=0,limit=3}={}){
 const rows=[...new Map(stops.filter(stop=>stop?.provider==='transitous').map(stop=>[stop.id,stop])).values()];
 rows.sort((a,b)=>Number(visible.has(b.id))-Number(visible.has(a.id))||Number(expanded.has(b.id))-Number(expanded.has(a.id)));
 if(rows.length<=limit)return rows;
 const pinned=Math.max(1,limit-1),tail=rows.slice(pinned);return [...rows.slice(0,pinned),tail[Math.max(0,cycle)%tail.length]];
}
export async function fetchRegionalBoards(stops,{fetch=globalThis.fetch,signal}={}){
 if(!stops.length)return {departures:[],stations:[]};
 const params=new URLSearchParams();stops.slice(0,3).forEach(stop=>params.append('station',stop.id));
 const response=await fetch('./api/regional/board?'+params,{signal,credentials:'omit',cache:'no-store'});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Regionale Abfahrten derzeit nicht verfügbar.');
 if(!Array.isArray(data.departures)||!Array.isArray(data.stations))throw Error('Ungültige regionale Abfahrtsantwort');return data;
}
