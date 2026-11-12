import {VEHICLE_FRESH_MS} from './vehicle-tracker.mjs?v=0.11.24';
export function vehicleArrival(track,direction,stopId,now=Date.now()){
 const target=direction.stops.findIndex(s=>s.id===stopId),p=track.position,times=track.schedule?.times,stop=times?.[target];
 if(target<0||!stop||!p||track.hits<2||track.blocked||track.retired||track.awaiting||p.stale||p.basis==='held'||p.progress>target+.01||now-track.lastSeen>VEHICLE_FRESH_MS)return null;
 const fresh=[...(track.anchors||[])].filter(([i,a])=>times[i]&&Number.isFinite(a.actual)&&now-a.at<=VEHICLE_FRESH_MS&&a.at<=now+30000);
 const live=fresh.find(([i])=>i===target)?.[1];let at,kind;
 if(live){at=live.actual-(stop[1]-stop[0]);kind='live-forecast';if(live.onStop||p.station===target)at=now;}
 else{const nearest=fresh.sort((a,b)=>Math.abs(a[0]-target)-Math.abs(b[0]-target))[0];if(!nearest)return null;const [index,anchor]=nearest;at=stop[0]+anchor.actual-times[index][1];kind='profile-estimate';}
 if(!Number.isFinite(at)||at<now-15000||at>now+7200000)return null;
 return {at:Math.max(now,at),minutes:Math.max(0,Math.ceil((at-now)/60000)),kind,station:direction.stops[target].name};
}
export function nextVehicleArrival(state,direction,stopId,now=Date.now()){
 const target=direction.stops.findIndex(s=>s.id===stopId);if(target<0||!state.at||state.problem||state.stale||now-state.at>VEHICLE_FRESH_MS)return null;
 const candidates=[];
 // A valid station board can provide its next countdown before two-source
 // vehicle identity is ready. This is a forecast, never a claimed map position.
 for(const row of state.rows||[]){
  if(row.index!==target||!Number.isFinite(row.actual)||now-row.at>VEHICLE_FRESH_MS||row.at>now+30000)continue;
  const onStop=row.onStop&&now-row.at<=10000;if(row.actual<now&&!onStop)continue;
  const matching=(state.tracks||[]).filter(t=>t.hits>=2&&!t.blocked&&t.anchors?.get(target)?.key===row.key&&now-t.lastSeen<=VEHICLE_FRESH_MS);
  if(matching.length===1&&matching[0].position?.progress>target+.01)continue;
  const time=matching.length===1?matching[0].schedule?.times?.[target]:null,at=onStop?now:row.actual-(time?time[1]-time[0]:0);
  if(at>now+7200000)continue;candidates.push({at:Math.max(now,at),minutes:Math.max(0,Math.ceil((at-now)/60000)),station:direction.stops[target].name,kind:'live-forecast'});
 }
 // Arrival-only termini and missing target forecasts may use a clearly marked
 // bounded estimate from a currently confirmed, approaching vehicle.
 if(!candidates.length)for(const track of state.tracks||[]){const arrival=vehicleArrival(track,direction,stopId,now);if(arrival)candidates.push(arrival);}
 return candidates.sort((a,b)=>a.at-b.at)[0]||null;
}
export function nextVehicleArrivalText(arrival){
 return arrival.minutes?'ca. '+arrival.minutes+' Min.':'ca. jetzt';
}
