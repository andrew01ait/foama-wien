import {haversineMeters} from './core.mjs?v=0.11.1';

export const QUIET_MS=60_000;
export const SENSOR_GAP_MS=3_000;
export const POSITION_CHECK_MS=60_000;
export const FRESH_FIX_MS=15_000;

// A quiet accelerometer is only a hint: constant-speed travel can also be quiet.
// Keep just the last vector and two fixes in session memory, never a sensor log.
export function motionSample(previous={},vector,now=Date.now()){
 if(!['x','y','z'].every(key=>Number.isFinite(vector?.[key])))return {};
 const gap=previous.at==null||now-previous.at>SENSOR_GAP_MS||now<previous.at;
 const change=previous.vector?Math.hypot(vector.x-previous.vector.x,vector.y-previous.vector.y,vector.z-previous.vector.z):0;
 const disturbed=change>0.45||Math.abs(Math.hypot(vector.x,vector.y,vector.z)-9.81)>0.9;
 return {vector:{x:vector.x,y:vector.y,z:vector.z},at:now,
  quietSince:gap||disturbed?now:previous.quietSince,
  samples:gap||disturbed?1:(previous.samples||0)+1,disturbed};
}
export function motionQuiet(sample={},now=Date.now()){
 return sample.at!=null&&now>=sample.at&&now-sample.at<=SENSOR_GAP_MS&&
  sample.samples>=60&&now-sample.quietSince>=QUIET_MS;
}
export function stillPosition(previous={},fix,now=Date.now()){
 const valid=Number.isFinite(fix?.lat)&&Math.abs(fix.lat)<=90&&Number.isFinite(fix?.lon)&&Math.abs(fix.lon)<=180;
 const fresh=Number.isFinite(fix?.timestamp)&&fix.timestamp<=now&&now-fix.timestamp<=FRESH_FIX_MS;
 const precise=Number.isFinite(fix?.accuracy)&&fix.accuracy>=0&&fix.accuracy<=50;
 const speed=Number.isFinite(fix?.speed)&&fix.speed>=0?fix.speed:null;
 let blockedUntil=previous.blockedUntil||0;
 if(precise&&speed!==null&&speed>=2)blockedUntil=now+90_000;
 if(!valid||!fresh||!precise||(speed!==null&&speed>0.8))return {blockedUntil};
 // Repeated cached fixes must not build stationary evidence or postpone checks.
 if(previous.last&&fix.timestamp<=previous.last.timestamp)return previous;
 const moved=previous.anchor&&haversineMeters(previous.anchor,fix)>20;
 if(moved)blockedUntil=Math.max(blockedUntil,now+90_000);
 const anchor=!previous.anchor||moved||fix.timestamp-previous.last.timestamp>90_000?fix:previous.anchor;
 return {anchor,last:fix,blockedUntil};
}
export function mayRest(motion,position,now=Date.now()){
 return motionQuiet(motion,now)&&!!position?.anchor&&!!position.last&&
  now>=(position.blockedUntil||0)&&now-position.anchor.timestamp>=QUIET_MS&&
  now-position.last.timestamp<=FRESH_FIX_MS;
}
