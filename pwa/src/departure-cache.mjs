const MAX_AGE=10*60_000,MAX_RECORDS=3000;
const observed=new WeakSet(),corrections=new WeakMap(),CORRECTION_AGE=120_000,MIN_CORRECTION=30_000;
function predictionKey(d){
  const planned=Date.parse(d?.scheduled);
  return d?.provider==='wl'&&/^\d+$/.test(String(d.rbl??''))&&d.route&&d.towards&&Number.isFinite(planned)?JSON.stringify([d.provider,d.stopId||String(d.rbl),d.route,d.towards,d.mode||'',planned]):null;
}
function freshPrediction(d,now){
  const fetched=Date.parse(d?.fetchedAt);
  return d?.quality==='live'&&Number.isFinite(Date.parse(d.realtime))&&Number.isFinite(Date.parse(d.actual))&&Number.isFinite(fetched)&&fetched<=now+30_000&&now-fetched<=90_000;
}
function observeCorrections(previous,incoming,now){
  const before=new Map(),counts=new Map();
  for(const d of previous){const key=predictionKey(d);if(key)before.set(key,before.has(key)?null:d);}
  for(const d of incoming){const key=predictionKey(d);if(key)counts.set(key,(counts.get(key)||0)+1);}
  for(const d of incoming){
    const key=predictionKey(d);if(!key||!freshPrediction(d,now))continue;
    const old=before.get(key);
    if(old&&observed.has(old)&&freshPrediction(old,now)&&counts.get(key)===1){
      const newer=Date.parse(d.fetchedAt)-Date.parse(old.fetchedAt),shift=Date.parse(d.actual)-Date.parse(old.actual),note=corrections.get(old);
      if(newer>0&&shift>=MIN_CORRECTION)corrections.set(d,{previousActual:old.actual,changedAt:now});
      else if(newer>=0&&shift>=0&&note&&now-note.changedAt>=0&&now-note.changedAt<CORRECTION_AGE)corrections.set(d,note);
    }
    if(counts.get(key)===1)observed.add(d);
  }
}
export function retainDepartures(previous=[],incoming=[],replacedIds=[],now=Date.now()){
  observeCorrections(previous,incoming,now);
  const replaced=new Set(replacedIds),all=[...previous.filter(d=>!replaced.has(d.rbl)&&!replaced.has(d.stopId)),...incoming];
  const unique=new Map();
  for(const d of all){const fetched=Date.parse(d.fetchedAt),actual=Date.parse(d.actual);
    if(d.source==='linz-efa'&&d.towards==='0'||!['wl','transitous'].includes(d.provider)||!Number.isFinite(fetched)||fetched>now+30_000||now-fetched>MAX_AGE||!Number.isFinite(actual)||actual<now-30_000)continue;
    unique.set(d.id,d);
  }
  return [...unique.values()].sort((a,b)=>Date.parse(b.fetchedAt)-Date.parse(a.fetchedAt)).slice(0,MAX_RECORDS);
}
// Weak metadata never enters the JSON cache, exports, backend or debug logs.
export function departureCorrection(departure,now=Date.now()){
  const note=departure&&corrections.get(departure);
  if(!note||!freshPrediction(departure,now)||now-note.changedAt<0||now-note.changedAt>=CORRECTION_AGE)return null;
  const delta=Date.parse(departure.actual)-Date.parse(note.previousActual);
  return delta>=MIN_CORRECTION?{previousActual:note.previousActual,actual:departure.actual,changedAt:note.changedAt,deltaMilliseconds:delta}:null;
}
export function departureIsFresh(departure,now=Date.now()){
  const fetched=Date.parse(departure?.fetchedAt);return Number.isFinite(fetched)&&fetched<=now+30_000&&now-fetched<=90_000;
}
export function retryDelay(failures,status=0){
  return Math.min(5*60_000,(status===403||status===429?60_000:30_000)*2**Math.min(4,Math.max(0,failures-1)));
}
