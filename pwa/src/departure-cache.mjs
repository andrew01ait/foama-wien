const MAX_AGE=10*60_000,MAX_RECORDS=3000;
export function retainDepartures(previous=[],incoming=[],replacedIds=[],now=Date.now()){
  const replaced=new Set(replacedIds),all=[...previous.filter(d=>!replaced.has(d.rbl)),...incoming];
  const unique=new Map();
  for(const d of all){const fetched=Date.parse(d.fetchedAt),actual=Date.parse(d.actual);
    if(d.provider!=='wl'||!Number.isFinite(fetched)||fetched>now+30_000||now-fetched>MAX_AGE||!Number.isFinite(actual)||actual<now-30_000)continue;
    unique.set(d.id,d);
  }
  return [...unique.values()].sort((a,b)=>Date.parse(b.fetchedAt)-Date.parse(a.fetchedAt)).slice(0,MAX_RECORDS);
}
export function departureIsFresh(departure,now=Date.now()){
  const fetched=Date.parse(departure?.fetchedAt);return Number.isFinite(fetched)&&now-fetched<=90_000;
}
export function retryDelay(failures,status=0){
  return Math.min(5*60_000,(status===403||status===429?60_000:30_000)*2**Math.min(4,Math.max(0,failures-1)));
}
