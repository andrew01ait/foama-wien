import {haversineMeters,favoriteKey} from './core.mjs?v=0.11.2';

const validPoint=p=>Number.isFinite(p?.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p?.lon)&&Math.abs(p.lon)<=180;
// Display sorting never mutates the saved order; actions retain the original index.
export function favoriteEntries(favorites,stops,position,sort='manual'){
 const catalogue=new Map(stops.map(stop=>[stop.id,stop]));
 const entries=favorites.map((favorite,index)=>{
  const stop=catalogue.get(favorite.stopId),distance=validPoint(position)&&validPoint(stop)?haversineMeters(position,stop):Infinity;
  return {favorite,index,stop,distance};
 });
 return sort==='distance'&&validPoint(position)?entries.sort((a,b)=>a.distance-b.distance||a.index-b.index):entries;
}
// Group only the view. Keep each original favorite and its saved identity intact.
export function groupFavoriteEntries(entries){
 const groups=new Map();
 for(const entry of entries){
  const id=entry.favorite.stopId;
  if(!groups.has(id))groups.set(id,{stopId:id,stop:entry.stop,distance:entry.distance,entries:[]});
  groups.get(id).entries.push(entry);
 }
 return [...groups.values()];
}
export function moveFavoriteStation(favorites,stopId,delta){
 const groups=groupFavoriteEntries(favorites.map((favorite,index)=>({favorite,index}))),index=groups.findIndex(group=>group.stopId===stopId),next=index+delta;
 if(![-1,1].includes(delta)||index<0||next<0||next>=groups.length)return {favorites,moved:false};
 [groups[index],groups[next]]=[groups[next],groups[index]];
 return {favorites:groups.flatMap(group=>group.entries.map(entry=>entry.favorite)),moved:true};
}
export function removeFavoriteStation(favorites,stopId){return favorites.filter(favorite=>favorite.stopId!==stopId);}
export function addStationFavorite(favorites,stop){
 if(!stop?.id||favorites.some(f=>f.stopId===stop.id&&!f.route&&!f.towards))return {favorites,added:false};
 return {favorites:[...favorites,{stopId:stop.id,stopName:stop.name,route:'',towards:''}],added:true};
}
// Resolve the saved identity at click time; display indices may have changed.
export function moveFavorite(favorites,key,delta){
 const index=favorites.findIndex(favorite=>favoriteKey(favorite)===key),next=index+delta;
 if(![-1,1].includes(delta)||index<0||next<0||next>=favorites.length)return {favorites,moved:false};
 const ordered=favorites.slice();[ordered[index],ordered[next]]=[ordered[next],ordered[index]];
 return {favorites:ordered,moved:true};
}
export function favoriteDistanceText(meters){
 if(!Number.isFinite(meters))return 'Entfernung unbekannt';
 return `ca. ${meters<1000?Math.round(meters/10)*10+' m':(meters/1000).toFixed(1).replace('.',',')+' km'} Luftlinie`;
}
// One monitor request: keep the leading 2/3 of RBLs fresh every cycle,
// rotate the remainder so a long favorite list cannot starve later stations.
export function favoriteStopIds(orderedStops,limit=24,cycle=0){
 const ids=[...new Set(orderedStops.filter(stop=>stop?.provider==='wl').flatMap(stop=>stop.rbl||[]).map(String))];
 limit=Math.max(1,Math.min(24,Math.floor(limit)||24));
 if(ids.length<=limit)return ids;
 const priority=Math.max(0,Math.floor(limit*2/3)),head=ids.slice(0,priority),tail=ids.slice(priority),slots=limit-head.length;
 const start=(Math.max(0,Math.floor(cycle)||0)*slots)%tail.length;
 return [...head,...Array.from({length:Math.min(slots,tail.length)},(_,i)=>tail[(start+i)%tail.length])];
}
