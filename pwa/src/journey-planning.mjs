import {providerStationIdentity} from './regional-departures.mjs?v=0.11.2';
// Provider-independent journey model and fixed-service MOTIS adapter.
// Production UI uses the bounded, same-origin journey-service endpoint.
import {coordinate} from './journey-geometry.mjs?v=0.11.2';
const MODES={SUBWAY:'metro',TRAM:'tram',BUS:'bus',ODM:'bus',SUBURBAN:'sbahn',REGIONAL_RAIL:'regional',LONG_DISTANCE:'long',HIGHSPEED_RAIL:'long',WALK:'walk'};
const PROVIDER_MODES={metro:'SUBWAY',tram:'TRAM',bus:'BUS',sbahn:'SUBURBAN',regional:'REGIONAL_RAIL',long:'LONG_DISTANCE,HIGHSPEED_RAIL'};
const text=(value,length=160)=>String(value??'').trim().slice(0,length);
const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;
const abortError=()=>new DOMException('Verbindungssuche abgebrochen','AbortError');

// A geocoder can return several entrances for the same postal address. Keep
// genuinely different places separate, including same names in other areas.
export function uniqueJourneyPlaces(places=[]){
 const out=[];
 for(const p of places){if(!coordinate(p))continue;const duplicate=out.some(q=>q.name===p.name&&(q.kind==='address'&&p.kind==='address'&&q.detail===p.detail?Math.hypot((p.lat-q.lat)*111195,(p.lon-q.lon)*111195*Math.cos(p.lat*Math.PI/180))<=150:Math.abs(p.lat-q.lat)<.00005&&Math.abs(p.lon-q.lon)<.00005));if(!duplicate)out.push(p);}
 return out;
}

export function journeyStation(providerId,stops){
 const regional=providerStationIdentity(providerId);if(regional){const match=stops.find(stop=>stop.provider==='transitous'&&stop.ifopt===regional);if(match)return match;}
 const number=String(providerId||'').match(/(?:^|_)P?at:49:(\d{1,5})(?::|$)/)?.[1];
 if(!number)return null;
 const id='wl:'+String(60200000+Number(number));
 return stops.find(stop=>stop.provider==='wl'&&stop.id===id)||null;
}

export function motisPlanUrl(request,baseUrl){
 const base=new URL(baseUrl);
 if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw Error('Ungültiger Planungsdienst');
 const point=value=>{
  if(!Number.isFinite(value?.lat)||!Number.isFinite(value?.lon)||Math.abs(value.lat)>90||Math.abs(value.lon)>180)throw Error('Start und Ziel ausdrücklich auswählen');
  return value.lat.toFixed(6)+','+value.lon.toFixed(6);
 };
 const time=request.time instanceof Date?request.time.toISOString():request.time;
 if(typeof time!=='string'||!/(?:Z|[+-]\d{2}:\d{2})$/.test(time)||!iso(time))throw Error('Reisezeit mit Zeitzone erforderlich');
 const speed=Number(request.speed??4.5),buffer=Number(request.buffer??1);
 if(!Number.isFinite(speed)||speed<2.5||speed>7||!Number.isInteger(buffer)||buffer<0||buffer>5)throw Error('Ungültige Geh- oder Reserveeinstellung');
 const modes=Object.keys(PROVIDER_MODES).filter(mode=>request.modes?.[mode]===true).flatMap(mode=>PROVIDER_MODES[mode].split(','));
 if(!modes.length)throw Error('Mindestens ein Verkehrsmittel auswählen');
 const profile=request.profile??'timetable';if(!['timetable','transfers'].includes(profile))throw Error('Ungültige Routenpräferenz');
 const url=new URL('api/v6/plan',base.href.endsWith('/')?base:base.href+'/');
 url.search=new URLSearchParams({fromPlace:point(request.from),toPlace:point(request.to),time:iso(time),arriveBy:String(request.arriveBy===true),transitModes:modes.join(','),directModes:'WALK',preTransitModes:'WALK',postTransitModes:'WALK',pedestrianSpeed:String(speed/3.6),additionalTransferTime:String(buffer),useRoutedTransfers:'true',detailedLegs:'true',detailedTransfers:'true',timetableView:String(profile!=='transfers'),numItineraries:'8',maxItineraries:'8',language:'de'}).toString();
 return url;
}

function place(source,stops){
 if(!source||!text(source.name))throw Error('Haltestellenangabe fehlt');
 const stop=journeyStation(source.stopId,stops);
 return {name:text(source.name),providerStopId:text(source.stopId,256),stopId:stop?.id||null,platform:text(source.track||source.scheduledTrack,30),...(coordinate(source)||coordinate(stop)||{})};
}

export function normalizeJourneys(payload,{stops=[]}={}){
 if(!Array.isArray(payload?.itineraries))throw Error('Ungültige Antwort des Planungsdienstes');
 const journeys=[];
 for(const candidate of payload.itineraries.slice(0,12)){
  try{
   if(!Array.isArray(candidate.legs)||!candidate.legs.length||candidate.legs.length>32)continue;
   let previous=-Infinity;
   const legs=candidate.legs.map(source=>{
    const mode=MODES[source.mode],startTime=iso(source.startTime),endTime=iso(source.endTime);
    if(!mode||!startTime||!endTime||Date.parse(endTime)<Date.parse(startTime)||Date.parse(startTime)<previous||source.cancelled===true||source.from?.cancelled===true||source.to?.cancelled===true)throw Error('Unbrauchbarer Reiseabschnitt');
    previous=Date.parse(endTime);
    const route=mode==='walk'?'':text(source.routeShortName||source.displayName,40);
    if(mode!=='walk'&&!route)throw Error('Linie fehlt');
    const from=place(source.from,stops),to=place(source.to,stops),known=stops.find(stop=>stop.id===from.stopId);
    const canonical=route==='BB'&&mode==='tram'&&known?.lines?.some(line=>line.route==='LB'&&line.mode==='tram')?'LB':mode==='bus'&&!/R$/.test(route)&&!known?.lines?.some(line=>line.route===route&&line.mode===mode)&&known?.lines?.some(line=>line.route===route+'R'&&line.mode===mode)?route+'R':route;
    const geometry=typeof source.legGeometry?.points==='string'&&source.legGeometry.points.length<=100000?source.legGeometry.points:'';
    return {mode,route:canonical,towards:text(source.headsign),from,to,startTime,endTime,scheduledStartTime:iso(source.scheduledStartTime)||startTime,scheduledEndTime:iso(source.scheduledEndTime)||endTime,durationSeconds:(Date.parse(endTime)-Date.parse(startTime))/1000,distanceMeters:Number.isFinite(source.distance)&&source.distance>=0?source.distance:null,quality:mode==='walk'?'estimate':source.realTime===true?'live':'schedule',tripId:text(source.tripId,512),staySeated:source.interlineWithPreviousLeg===true,...(geometry?{geometry}:{})};
   });
   const startTime=legs[0].startTime,endTime=legs.at(-1).endTime,durationSeconds=(Date.parse(endTime)-Date.parse(startTime))/1000;
   if(durationSeconds>48*3600)continue;
   const rides=legs.filter(leg=>leg.mode!=='walk');
   journeys.push({startTime,endTime,durationSeconds,walkSeconds:legs.filter(leg=>leg.mode==='walk').reduce((sum,leg)=>sum+leg.durationSeconds,0),transfers:Math.max(0,rides.filter((leg,index)=>index>0&&!leg.staySeated).length),legs});
  }catch{/* An unusable alternative cannot corrupt valid alternatives. */}
  if(journeys.length===8)break;
 }
 if(payload.itineraries.length&&!journeys.length)throw Error('Keine nutzbare Verbindung in der Antwort');
 return journeys;
}

export function journeyBoardingTargets(journey,{limit=2}={}){
 return journey.legs.filter(leg=>leg.mode!=='walk').slice(0,Math.max(0,Math.min(8,limit))).map(leg=>({stopId:leg.from.stopId,route:leg.route,mode:leg.mode,towards:leg.towards,plannedDeparture:leg.scheduledStartTime,platform:leg.from.platform}));
}

// MOTIS omits station service suffixes and sometimes the monitor's via text.
// Match complete terminal names only; an explicit planned via must be proved.
export function journeyDirectionMatches(expected,actual){
 const parts=value=>{const label=text(value).replace(/^(?:Wien|Graz|Salzburg|Linz(?:\/Donau)?)\s+/i,'').trim().toLocaleLowerCase('de-AT'),via=label.match(/\s+\((?:über|üb\.?|via)\s+(.+)\)$/u);return {name:(via?label.slice(0,via.index):label).replace(/\s+(?:s\s+u|u\s+s|s|u)$/u,'').trim(),via:via?.[1]||''};};
 const wanted=parts(expected),found=parts(actual);return !!wanted.name&&wanted.name===found.name&&(!wanted.via||wanted.via===found.via);
}

// These are alternative departures of the same line/direction. A monitor match
// is not proof that it is the exact planned vehicle/trip or a safe connection.
export function journeyLineDepartures(target,departures,stops,{earliest,now=Date.now()}={}){
 const stop=stops.find(item=>item.id===target.stopId);if(!stop||!target.towards||!Number.isFinite(earliest))return [];
 const ids=new Set((stop.rbl||[]).map(String));
 return departures.filter(d=>{const fetched=typeof d.fetchedAt==='number'?d.fetchedAt:Date.parse(d.fetchedAt);return (d.stopId===stop.id||ids.has(String(d.rbl)))&&d.route===target.route&&d.mode===target.mode&&journeyDirectionMatches(target.towards,d.towards)&&Date.parse(d.actual)>=earliest&&(d.source==='gtfs'||Number.isFinite(fetched)&&now-fetched<=90_000&&fetched<=now+30_000);}).sort((a,b)=>Date.parse(a.actual)-Date.parse(b.actual)).slice(0,3);
}

export function createMotisPlanner({baseUrl,fetch=globalThis.fetch,stops=[],timeoutMs=20_000}={}){
 let pending=null,revision=0;
 function abort(){revision++;if(pending){clearTimeout(pending.timeout);pending.controller.abort();}pending=null;}
 async function plan(request){
  abort();const current=revision,controller=new AbortController();let timedOut=false;
  const timeout=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);pending={controller,timeout};
  try{
   const response=await fetch(motisPlanUrl(request,baseUrl),{signal:controller.signal,credentials:'omit',headers:{Accept:'application/json'}});
   if(!response.ok)throw Error(response.status===429?'Planungsdienst ausgelastet. Bitte später erneut versuchen.':'Planungsdienst derzeit nicht verfügbar.');
   const body=await response.text();if(body.length>2_000_000)throw Error('Antwort des Planungsdienstes zu groß');
   if(controller.signal.aborted||current!==revision)throw abortError();
   return normalizeJourneys(JSON.parse(body),{stops});
  }catch(error){if(timedOut)throw Error('Verbindungssuche dauert zu lange. Bitte erneut versuchen.');if(controller.signal.aborted||current!==revision)throw abortError();throw error;}
  finally{clearTimeout(timeout);if(pending?.controller===controller)pending=null;}
 }
 return {plan,abort};
}
