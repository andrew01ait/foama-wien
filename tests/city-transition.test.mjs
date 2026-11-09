import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {CITY_PROFILES} from '../pwa/src/city-profiles.mjs';
import {lineHasCurrentDeparture} from '../pwa/src/connection-detail.mjs';
const app=await readFile(new URL('../pwa/src/app.mjs',import.meta.url),'utf8');

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
