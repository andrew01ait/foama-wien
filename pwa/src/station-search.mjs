export function normalizedStationName(value){
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLocaleLowerCase('de-AT').replace(/[^a-z0-9]+/g,' ').trim();
}
export function searchStations(stops,query,limit=12){
  const q=normalizedStationName(query);if(!q)return [];
  const words=q.split(' ');
  return stops.map(stop=>({stop,name:normalizedStationName(stop.name)}))
    .filter(item=>words.every(word=>item.name.includes(word)))
    .sort((a,b)=>Number(!a.name.startsWith(q))-Number(!b.name.startsWith(q))||a.stop.name.localeCompare(b.stop.name,'de-AT'))
    .slice(0,limit).map(item=>item.stop);
}
export function connectionsAtStation(departures,stop,now=Date.now()){
  const groups=new Map();
  for(const departure of departures){
    const belongs=departure.provider==='wl'?stop.provider==='wl'&&stop.rbl.includes(departure.rbl):
      stop.provider==='rail'&&(stop.platformIds||[stop.id.slice(5)]).includes(departure.stopId);
    const departureAt=Date.parse(departure.actual);
    if(!belongs||!departure.route||!Number.isFinite(departureAt)||departureAt<now-30_000)continue;
    const key=departure.route+'|'+departure.towards;
    if(!groups.has(key))groups.set(key,{route:departure.route,towards:departure.towards,mode:departure.mode});
  }
  return [...groups.values()].sort((a,b)=>a.route.localeCompare(b.route,'de-AT',{numeric:true})||a.towards.localeCompare(b.towards,'de-AT'));
}
