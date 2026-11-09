import test from 'node:test';
import assert from 'node:assert/strict';
import {favoriteEntries,groupFavoriteEntries,moveFavoriteStation,removeFavoriteStation,addStationFavorite,favoriteStopIds} from '../pwa/src/favorite-state.mjs';
import {mergeSettings} from '../pwa/src/core.mjs';

const stops=Array.from({length:30},(_,i)=>({id:'station-'+i,name:'Station '+i,provider:'wl',lat:48.2+i*.001,lon:16.3,rbl:[String(1000+i*2),String(1001+i*2)]}));
const favorites=stops.map(stop=>({stopId:stop.id,stopName:stop.name,route:'',towards:''}));
const position={lat:48.2,lon:16.3};
test('interleaved connection favorites form one station card without changing saved JSON or selected connections',()=>{
 const saved=[{...favorites[0],route:'U1',towards:'North'},favorites[1],{...favorites[0],route:'U3',towards:'West'},favorites[2]],before=JSON.stringify(saved);
 const groups=groupFavoriteEntries(favoriteEntries(saved,stops,position));
 assert.deepEqual(groups.map(group=>group.stopId),['station-0','station-1','station-2']);
 assert.deepEqual(groups[0].entries.map(entry=>entry.index),[0,2]);assert.equal(groups[0].stop.name,'Station 0');assert.equal(JSON.stringify(saved),before);
 const sorted=groupFavoriteEntries(favoriteEntries(saved,stops,{lat:stops[2].lat,lon:stops[2].lon},'distance'));
 assert.equal(sorted[0].stopId,'station-2');assert.equal(JSON.stringify(saved),before);
 const moved=moveFavoriteStation(saved,'station-0',1);assert.equal(moved.moved,true);assert.deepEqual(moved.favorites,[saved[1],saved[0],saved[2],saved[3]]);
 assert.deepEqual(removeFavoriteStation(moved.favorites,'station-0'),[saved[1],saved[3]]);assert.equal(JSON.stringify(saved),before);
 for(const [id,delta] of [['station-0',-1],['station-2',1],['missing',1],['station-1',0]])assert.equal(moveFavoriteStation(saved,id,delta).favorites,saved);
});
test('favorite distance sorting keeps saved indices, equal-distance order and unknown stations last',()=>{
 const saved=[favorites[20],favorites[0],{...favorites[0],route:'25',towards:'Test'},favorites[10],{stopId:'unknown'}],snapshot=JSON.stringify(saved);
 const rows=favoriteEntries(saved,stops,position,'distance');
 assert.deepEqual(rows.map(row=>row.index),[1,2,3,0,4]);assert.equal(rows[0].distance,0);assert.equal(rows.at(-1).distance,Infinity);
 assert.equal(JSON.stringify(saved),snapshot);assert.deepEqual(favoriteEntries(saved,stops,position).map(row=>row.index),[0,1,2,3,4]);
 assert.deepEqual(favoriteEntries(saved,stops,null,'distance').map(row=>row.index),[0,1,2,3,4]);
 assert.equal(mergeSettings({favoriteSort:'distance'}).favoriteSort,'distance');assert.equal(mergeSettings({favoriteSort:'other'}).favoriteSort,'manual');
});
test('adding a station from the map preserves connection favorites and never creates duplicates',()=>{
 const initial=[{...favorites[0],route:'25',towards:'Test'}];
 const first=addStationFavorite(initial,stops[0]);assert.equal(first.added,true);assert.equal(first.favorites.length,2);assert.equal(initial.length,1);
 assert.equal(first.favorites[1].stopName,stops[0].name);assert.equal(first.favorites[1].route,'');
 const duplicate=addStationFavorite(first.favorites,stops[0]);assert.equal(duplicate.added,false);assert.equal(duplicate.favorites,first.favorites);
 assert.equal(addStationFavorite(initial,null).added,false);
});
test('large favorite batches always refresh leading RBLs and rotate lower-priority RBLs without starvation',()=>{
 const head=stops.slice(0,8).flatMap(s=>s.rbl),seen=new Set();
 for(let cycle=0;cycle<6;cycle++){
  const ids=favoriteStopIds(stops,24,cycle);assert.equal(ids.length,24);assert.equal(new Set(ids).size,24);
  assert.deepEqual(ids.slice(0,16),head);ids.forEach(id=>seen.add(id));
 }
 assert.equal(seen.size,60);
});
test('the selected manual or distance order also determines the leading live-data allocation',()=>{
 const manual=favorites.slice().reverse();
 const ordered=sort=>favoriteEntries(manual,stops,position,sort).map(row=>row.stop);
 assert.deepEqual(favoriteStopIds(ordered('manual')).slice(0,4),[...stops[29].rbl,...stops[28].rbl]);
 assert.deepEqual(favoriteStopIds(ordered('distance')).slice(0,4),[...stops[0].rbl,...stops[1].rbl]);
 const moved={lat:stops[29].lat,lon:stops[29].lon};
 assert.deepEqual(favoriteStopIds(favoriteEntries(manual,stops,moved,'distance').map(row=>row.stop)).slice(0,2),stops[29].rbl);
});
test('small lists refresh every stop; duplicate connection favorites and rail stops consume no extra IDs',()=>{
 const selected=[stops[0],stops[0],stops[1],{...stops[2],provider:'rail'}];
 assert.deepEqual(favoriteStopIds(selected,24,90),[...stops[0].rbl,...stops[1].rbl]);
 assert.equal(favoriteStopIds(stops,100).length,24);
});
