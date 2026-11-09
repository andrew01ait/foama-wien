import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {CITY_PROFILES,CITY_PREFERENCE,cityPreference,createCityController} from '../pwa/src/city-profiles.mjs';
import {lineHasCurrentDeparture,connectionDepartures} from '../pwa/src/connection-detail.mjs';
import {availableDeparts,favoriteMatches,haversineMeters} from '../pwa/src/core.mjs';
import {connectionsAtStation} from '../pwa/src/station-search.mjs';
const app=await readFile(new URL('../pwa/src/app.mjs',import.meta.url),'utf8');

function preferenceFixture(preference='auto'){
 const waits=new Map(),positions=[],calls={init:0,stop:0,refresh:0},favorites=[{stopId:'wl:60201468',route:'U6'}];
 const state={manual:preference!=='auto',position:preference==='auto'?null:CITY_PROFILES[preference].center,locationData:{old:true},nearby:[{id:'old'}],favorites};
 const cityControl=createCityController({preference});
 const context=vm.createContext({state,cityControl,CITY_PREFERENCE,cityPreference,haversineMeters,localStorage:{setItem(){}},renderCity(){},
  ensureCityStops:city=>new Promise(resolve=>waits.set(city,resolve)),locationControl:{init:()=>calls.init++,stop:()=>calls.stop++},
  setPosition(position,manual){state.position=position;state.manual=manual;positions.push(position);},refreshNearby:()=>calls.refresh++});
 vm.runInContext(app.slice(app.indexOf('async function chooseCityPreference('),app.indexOf('function learnedFor(')),context);
 return {context,state,waits,positions,calls,favorites,cityControl};
}
test('returning from a manual city to automatic rechecks existing GPS permission and removes only the manual position',async()=>{
 const f=preferenceFixture('linz'),choice=f.context.chooseCityPreference('auto');f.waits.get('wien')();await choice;
 assert.equal(f.calls.init,1);assert.equal(f.state.manual,false);assert.equal(f.state.position,null);assert.equal(f.state.nearby.length,0);assert.equal(f.state.favorites,f.favorites);assert.equal(f.cityControl.current().id,'wien');
});
test('a late earlier manual choice cannot move the map or position away from the newer selected city',async()=>{
 const f=preferenceFixture(),graz=f.context.chooseCityPreference('graz'),linz=f.context.chooseCityPreference('linz');
 f.waits.get('linz')();await linz;f.waits.get('graz')();await graz;
 assert.equal(f.cityControl.current().id,'linz');assert.deepEqual(f.positions,[CITY_PROFILES.linz.center]);assert.equal(f.calls.stop,1);assert.equal(f.state.favorites,f.favorites);
});

test('a city switch clears prior cards and timestamps immediately; a late catalogue cannot overwrite a newer city or its favorites',async()=>{
 const waits=new Map(),renders=[],favorites=[{stopId:'wl:60201468',route:'U6'}];let refreshes=0,cancelled=0;
 const state={cityProfile:CITY_PROFILES.wien,nearby:[{id:'wl:60201468'}],lastRefresh:'old',routes:new Map(),expanded:new Set(['old']),favorites};
 const context=vm.createContext({state,cancelMonitor:()=>cancelled++,favoriteMenus:{close(){}},connectionNavigation:{back(){}},renderCity(){},render:()=>renders.push({loading:state.cityLoading,cards:state.nearby.length}),refreshNearby(){},refreshDepartures:async()=>refreshes++,ensureCityStops:city=>new Promise(resolve=>waits.set(city,resolve))});
 vm.runInContext(app.slice(app.indexOf('async function switchCity('),app.indexOf('function learnedFor(')),context);
 const graz=context.switchCity(CITY_PROFILES.graz);assert.equal(state.cityLoading,true);assert.equal(state.nearby.length,0);assert.equal(state.lastRefresh,null);assert.deepEqual(renders,[{loading:true,cards:0}]);
 const linz=context.switchCity(CITY_PROFILES.linz);waits.get('graz')();await graz;assert.equal(state.cityProfile.id,'linz');assert.equal(state.cityLoading,true);assert.equal(refreshes,0);
 waits.get('linz')();await linz;assert.equal(state.cityLoading,false);assert.equal(refreshes,1);assert.equal(cancelled,2);assert.equal(state.favorites,favorites);
});
test('tomorrow-only regional schedules remain available but do not make a currently inactive line look confirmed nearby',()=>{
 const now=Date.parse('2026-11-09T22:00Z'),stop={id:'graz:at:46:4046',provider:'transitous'},line={route:'7',mode:'tram'};
 const row={...line,provider:'transitous',stopId:stop.id,towards:'LKH',actual:new Date(now+6*3600000).toISOString(),fetchedAt:new Date(now).toISOString(),quality:'schedule'};
 assert.equal(lineHasCurrentDeparture(stop,line,[row],{now}),false);
 assert.equal(lineHasCurrentDeparture(stop,line,[{...row,actual:new Date(now+300000).toISOString()}],{now}),true);
});
test('same numeric route and destination on bus and suburban rail remain separate, including focused details and known favorite modes',()=>{
 const now=Date.parse('2026-11-09T22:00Z'),stop={id:'salzburg:at:45:50002',provider:'transitous'},base={provider:'transitous',stopId:stop.id,route:'3',towards:'Hauptbahnhof',actual:new Date(now+300000).toISOString(),fetchedAt:new Date(now).toISOString(),quality:'schedule'};
 const rows=[{...base,id:'bus',mode:'bus'},{...base,id:'rail',mode:'sbahn'}];
 assert.equal(availableDeparts(rows,{modes:{}},now).length,2);assert.equal(connectionsAtStation(rows,stop,now).length,2);
 assert.deepEqual(connectionDepartures(stop,{route:'3',towards:'Hauptbahnhof',mode:'bus'},rows,now).map(d=>d.id),['bus']);
 assert.equal(favoriteMatches({route:'3',mode:'bus'},rows[1]),false);assert.equal(lineHasCurrentDeparture(stop,{route:'3',mode:'sbahn'},[rows[0]],{now}),false);
});
