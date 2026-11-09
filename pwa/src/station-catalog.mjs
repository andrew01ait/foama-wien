import {isEnabled,withinRadius} from './core.mjs?v=0.7.0';

export const MODE_LABELS={metro:'U-Bahn',tram:'Tram',bus:'Bus',sbahn:'S-Bahn',regional:'Regional',long:'Fernverkehr'};
export function stationPriority(stop,settings,learned=[]){
 const lines=stationLines(stop,learned),modes=lines.length?lines.map(line=>line.mode):(stop.modes||[stop.mode].filter(Boolean));
 const order=Object.keys(MODE_LABELS);
 return Math.min(order.length,...modes.filter(mode=>order.includes(mode)&&isEnabled(mode,settings)).map(mode=>order.indexOf(mode)));
}
export function stationLines(stop,learned=[]){
  const lines=new Map();
  const hidden=new Set(learned.filter(line=>line.suppressed).map(line=>line.mode+'|'+line.route));
  for(const line of [...(stop.lines||[]),...learned])if(line?.route&&MODE_LABELS[line.mode]&&!hidden.has(line.mode+'|'+line.route))lines.set(line.mode+'|'+line.route,{route:line.route,mode:line.mode});
  return [...lines.values()].sort((a,b)=>Object.keys(MODE_LABELS).indexOf(a.mode)-Object.keys(MODE_LABELS).indexOf(b.mode)||a.route.localeCompare(b.route,'de-AT',{numeric:true}));
}
export function stationMatchesModes(stop,settings,learned=[]){
  const lines=stationLines(stop,learned);
  const modes=lines.length?lines.map(line=>line.mode):(stop.modes||[stop.mode].filter(Boolean));
  return modes.some(mode=>MODE_LABELS[mode]&&isEnabled(mode,settings));
}
export function platformIdsFor(stop,settings){
  if(stop.provider!=='wl')return [];
  if(!settings)return stop.rbl||[];
  if(stop.platforms?.length)return stop.platforms.filter(p=>p.modes.some(mode=>isEnabled(mode,settings))).map(p=>p.id);
  return stationMatchesModes(stop,settings)?stop.rbl||[]:[];
}
export function stationQueryIncomplete(stop,settings,checks=new Map(),now=Date.now()){
 return platformIdsFor(stop,settings).some(id=>!checks.has(String(id))||now-checks.get(String(id))>90000);
}
// Open station details get a complete batch first; keep other stations and rotating coverage.
export function selectStopIds(stops,settings,limit=24,cycle=0,expanded=new Set(),visible=new Set()){
  limit=Math.max(1,Math.min(24,Math.floor(limit)||24));cycle=Math.max(0,Math.floor(cycle)||0);
  const order=Object.keys(MODE_LABELS),priorities=new Map();
  const groups=stops.filter(s=>s.provider==='wl').map(stop=>{
    const ids=platformIdsFor(stop,settings).map(String);
    for(const id of ids){const modes=stop.platforms?.find(p=>String(p.id)===id)?.modes||[];
      const rank=Math.min(order.length,...modes.filter(m=>!settings||isEnabled(m,settings)).map(m=>order.indexOf(m)).filter(n=>n>=0));priorities.set(id,Math.min(priorities.get(id)??order.length,rank));}
    return {stop,ids};
  }).filter(g=>g.ids.length);
  const roundRobin=rows=>{const out=new Set();for(let i=0;rows.some(g=>i<g.ids.length);i++)for(const g of rows)if(i<g.ids.length)out.add(g.ids[i]);return [...out].sort((a,b)=>priorities.get(a)-priorities.get(b));};
  const rotate=(ids,slots)=>{if(ids.length<=slots)return ids;const pinned=Math.floor(slots*2/3),tail=ids.slice(pinned),count=slots-pinned,start=cycle*count%tail.length;return [...ids.slice(0,pinned),...Array.from({length:count},(_,i)=>tail[(start+i)%tail.length])];};
  const tiers=visible.size?[groups.filter(g=>visible.has(g.stop.id)&&expanded.has(g.stop.id)),groups.filter(g=>visible.has(g.stop.id)&&!expanded.has(g.stop.id)),groups.filter(g=>!visible.has(g.stop.id))]:[groups.filter(g=>expanded.has(g.stop.id)),groups.filter(g=>!expanded.has(g.stop.id))];
  const selected=[],seen=new Set();
  for(const tier of tiers){const available=roundRobin(tier).filter(id=>!seen.has(id));for(const id of rotate(available,limit-selected.length)){seen.add(id);selected.push(id);}if(selected.length===limit)break;}
  return selected;
}
export function enrichStops(stops,bundled){
  const byId=new Map(bundled.map(s=>[s.id,s]));
  return stops.map(stop=>{const known=byId.get(stop.id);return known?{...known,...stop,lines:known.lines,modes:known.modes,candidateLines:known.candidateLines,lineMapping:known.lineMapping,platforms:known.platforms?.filter(p=>stop.rbl?.includes(p.id))}:stop;});
}
export function nearbyMapStops(stops,position,settings,learnedFor=()=>[],limit=60){
 if(!position)return [];
 return withinRadius(stops.filter(stop=>stationMatchesModes(stop,settings,learnedFor(stop))),position,settings.radius)
  .sort((a,b)=>stationPriority(a,settings,learnedFor(a))-stationPriority(b,settings,learnedFor(b))||a.airMeters-b.airMeters).slice(0,limit);
}
