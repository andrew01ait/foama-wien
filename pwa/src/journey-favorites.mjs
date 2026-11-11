import {journeyPathKey,journeyFamily} from './journey-variants.mjs?v=0.10.1';
import {coordinate} from './journey-geometry.mjs?v=0.10.1';
const MODES=new Set(['metro','tram','bus','sbahn','regional','long','walk']);
const text=(s,n=160)=>String(s??'').trim().slice(0,n);
function endpoint(p){
 if(p?.kind==='current'||p?.fixedAt)return {kind:'current',name:'Dein Standort'};
 if(!Number.isFinite(p?.lat)||!Number.isFinite(p?.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180)return null;
 return {kind:'point',name:text(p.name),lat:p.lat,lon:p.lon};
}
function place(p){return {name:text(p?.name),stopId:/^(wl|rail|graz|linz|salzburg):[\w:-]{1,100}$/.test(p?.stopId)?p.stopId:null,platform:text(p?.platform,30),...(coordinate(p)||{})};}
export function sanitizeJourneyFavorites(input){
 if(!Array.isArray(input))return [];
 return input.slice(0,30).flatMap(row=>{
  const from=endpoint(row?.from),to=endpoint(row?.to);
  if(!from||!to||typeof row.id!=='string'||!row.id.trim()||row.id.length>80||!Number.isFinite(row.savedAt)||row.savedAt<0||!Array.isArray(row.legs)||!row.legs.length||row.legs.length>32)return [];
  const legs=row.legs.map(leg=>({mode:leg?.mode,route:text(leg?.route,40),towards:text(leg?.towards),from:place(leg?.from),to:place(leg?.to),durationSeconds:leg?.durationSeconds,distanceMeters:Number.isFinite(leg?.distanceMeters)?Math.max(0,leg.distanceMeters):null,staySeated:leg?.staySeated===true,...(typeof leg?.geometry==='string'&&leg.geometry.length<=15000?{geometry:leg.geometry}:{})}));
  if(legs.some(leg=>!MODES.has(leg.mode)||!leg.from.name||!leg.to.name||!Number.isFinite(leg.durationSeconds)||leg.durationSeconds<0||leg.durationSeconds>172800||(leg.mode!=='walk'&&!leg.route)))return [];
  // A dynamic GPS endpoint must never be reconstructed from cached geometry.
  if(from.kind==='current'){delete legs[0].geometry;delete legs[0].from.lat;delete legs[0].from.lon;legs[0].from.name='Dein Standort';}
  if(to.kind==='current'){delete legs.at(-1).geometry;delete legs.at(-1).to.lat;delete legs.at(-1).to.lon;legs.at(-1).to.name='Dein Standort';}
  if(row.alternatives!==undefined&&(!Array.isArray(row.alternatives)||row.alternatives.length>15))return [];
  const alternatives=[],seen=new Set([journeyPathKey(legs)]);
  for(const alternative of row.alternatives||[]){const [safe]=sanitizeJourneyFavorites([{id:row.id,name:row.name,savedAt:row.savedAt,from:row.from,to:row.to,legs:alternative?.legs}]);if(!safe)return [];const key=journeyPathKey(safe.legs);if(!seen.has(key)){seen.add(key);alternatives.push({legs:safe.legs});}}
  return [{id:text(row.id,80),name:text(row.name)||from.name+' → '+to.name,savedAt:row.savedAt,from,to,legs,...(alternatives.length?{alternatives}:{})}];
 });
}
const endpointKey=f=>JSON.stringify([f.from,f.to]);
const paths=f=>[f,...(f.alternatives||[])];
const sharesPath=(a,b)=>endpointKey(a)===endpointKey(b)&&paths(a).some(x=>paths(b).some(y=>journeyPathKey(x)===journeyPathKey(y)));
function combined(base,others){const choices=journeyFamily(others.flatMap(paths),base,{limit:17});if(choices.length>16)throw Error('Höchstens 16 unterschiedliche Wege pro Route.');return {...base,...(choices.length>1?{alternatives:choices.slice(1).map(row=>({legs:row.legs}))}:{})};}
export function transferableJourneys(favorites){
 const strip=legs=>legs.map(({geometry,...leg})=>({...leg,from:{name:leg.from.name,stopId:leg.from.stopId,platform:leg.from.platform},to:{name:leg.to.name,stopId:leg.to.stopId,platform:leg.to.platform}}));
 return sanitizeJourneyFavorites(favorites).map(f=>({...f,legs:strip(f.legs),...(f.alternatives?.length?{alternatives:f.alternatives.map(a=>({legs:strip(a.legs)}))}:{})}));
}
export function mergeJourneyFavorites(existing,incoming){
 if(!Array.isArray(incoming)||incoming.length>30)throw Error('Höchstens 30 Routen pro Übertragung.');
 const additions=sanitizeJourneyFavorites(incoming);if(additions.length!==incoming.length)throw Error('Eine gespeicherte Route ist ungültig.');
 const next=sanitizeJourneyFavorites(existing);let added=0,updated=0;
 const ids=new Set(next.map(f=>f.id));
 for(const f of additions){const index=next.findIndex(row=>sharesPath(row,f));if(index>=0){const prior=next[index],merged=combined(prior,[prior,f]);if((merged.alternatives?.length||0)>(prior.alternatives?.length||0)){next[index]=merged;updated++;}continue;}if(next.length===30)throw Error('Auf diesem Gerät sind höchstens 30 Routen möglich.');if(ids.has(f.id))f.id=globalThis.crypto.randomUUID();next.push(f);ids.add(f.id);added++;}
 return {favorites:next,added,updated};
}
export function saveJourneyFavorite(favorites,{from,to,journey,alternatives=[],now=Date.now(),id=globalThis.crypto.randomUUID()}={}){
 const family=journeyFamily(alternatives,journey),[item]=sanitizeJourneyFavorites([{id,savedAt:now,from,to,legs:journey?.legs,alternatives:family.slice(1).map(row=>({legs:row.legs}))}]);
 if(!item)throw Error('Dieser Weg kann nicht gespeichert werden.');
 item.legs[0].from.name=item.from.name;item.legs.at(-1).to.name=item.to.name;
 const prior=sanitizeJourneyFavorites(favorites),same=prior.find(row=>sharesPath(row,item));let favorite=same?combined(item,[item,same]):item;if(same){favorite.id=same.id;favorite.name=same.name;}
 return {favorite,favorites:[favorite,...prior.filter(row=>row.id!==favorite.id)].slice(0,30)};
}
export function savedJourney(favorite){
 const [safe]=sanitizeJourneyFavorites([favorite]);if(!safe)return null;
 if(safe.from.kind==='point')Object.assign(safe.legs[0].from,coordinate(safe.from));
 if(safe.to.kind==='point')Object.assign(safe.legs.at(-1).to,coordinate(safe.to));
 return {savedPath:true,favoriteId:safe.id,savedAt:safe.savedAt,legs:safe.legs,walkSeconds:safe.legs.filter(leg=>leg.mode==='walk').reduce((n,leg)=>n+leg.durationSeconds,0),transfers:Math.max(0,safe.legs.filter(leg=>leg.mode!=='walk'&&!leg.staySeated).length-1)};
}
