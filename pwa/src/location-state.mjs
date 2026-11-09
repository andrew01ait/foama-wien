import {haversineMeters} from './core.mjs?v=0.7.0';

export const LOCATION_STALE_MS=90_000;
// State is session-only: neither positions nor movement history are persisted.
export function updateLocation(previous={},fix,now=Date.now()){
  if(!Number.isFinite(fix?.lat)||!Number.isFinite(fix?.lon)||Math.abs(fix.lat)>90||Math.abs(fix.lon)>180)return previous;
  const accuracy=Number.isFinite(fix.accuracy)&&fix.accuracy>=0?fix.accuracy:Infinity;
  const timestamp=Number.isFinite(fix.timestamp)?Math.min(now,fix.timestamp):now;
  if(previous.latest&&timestamp<previous.latest.timestamp)return previous;
  const latest={...fix,accuracy,timestamp};
  const old=previous.motionFix;
  const seconds=old?(timestamp-old.timestamp)/1000:0;
  const distance=old?haversineMeters(old,latest):0;
  const measuredSpeed=accuracy<=100&&Number.isFinite(fix.speed)&&fix.speed>=0?fix.speed:null;
  const displacementSpeed=old&&old.accuracy<=100&&accuracy<=100&&seconds>=5&&seconds<=90?
    Math.max(0,distance-old.accuracy-accuracy)/seconds:null;
  const fast=(measuredSpeed!==null&&measuredSpeed>=3.5)||(displacementSpeed!==null&&displacementSpeed>=3.5);
  const slow=accuracy<=100&&((measuredSpeed!==null&&measuredSpeed<=2)||(seconds>=10&&distance<=Math.max(40,old.accuracy+accuracy)));
  let movingUntil=previous.movingUntil||0,slowSince=previous.slowSince||0;
  if(fast){movingUntil=now+90_000;slowSince=0;}
  else if(slow){slowSince=slowSince||now;if(now-slowSince>=45_000)movingUntil=0;}
  else slowSince=0;
  const precise=accuracy<=150?latest:previous.precise;
  // A coarse fix that overlaps a very recent good fix adds uncertainty, not a false jump.
  const retain=accuracy>150&&precise&&now-precise.timestamp<=LOCATION_STALE_MS&&haversineMeters(precise,latest)<=accuracy;
  const position=retain?precise:latest;
  return {latest,precise,position,movingUntil,slowSince,
    motionFix:!old||seconds>=5?latest:old,coarseReceived:accuracy>150};
}
export function locationSnapshot(location={},now=Date.now(),manual=false){
  const position=location.position;
  if(!position)return {position:null,age:Infinity,stale:true,approximate:true,moving:false,reliable:false};
  const age=Math.max(0,now-position.timestamp),stale=!manual&&age>LOCATION_STALE_MS;
  const moving=!manual&&(location.movingUntil||0)>now;
  const approximate=!manual&&(position.accuracy>150||location.coarseReceived===true);
  return {position,age,stale,approximate,moving,reliable:!manual&&!stale&&!approximate&&!moving&&position.accuracy<=100};
}
export function positionAgeText(age){
  if(age<10_000)return 'gerade eben';
  if(age<60_000)return `vor ${Math.floor(age/1000)} s`;
  return `vor ${Math.floor(age/60_000)} Min.`;
}
