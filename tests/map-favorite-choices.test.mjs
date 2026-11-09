import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {addStationFavorite} from '../pwa/src/favorite-state.mjs';
const source=readFileSync(new URL('../pwa/src/app.mjs',import.meta.url),'utf8'),stop={id:'station-123',name:'Floridsdorf S U'};
test('station map popups and the matching station list offer distinct whole-station and line/direction favorite actions',()=>{
 const context=vm.createContext({state:{settings:{modes:{}},addressLookup:()=>null},stationLines:()=>[{route:'U6',mode:'metro'}],learnedFor:()=>({}),routeBadge:route=>route,stationAddressMarkup:()=>'',escape:value=>String(value)});
 vm.runInContext(source.slice(source.indexOf('function mapStationPopup('),source.indexOf('async function drawPositionMap(')),context);
 const markup=context.mapStationPopup(stop);assert.match(markup,/Ganze Haltestelle merken/);assert.match(markup,/Linien &amp; Richtungen wählen/);assert.match(markup,/data-map-favorite="station-123"/);assert.match(markup,/data-map-lines="station-123"/);
 const map=source.slice(source.indexOf('async function drawPositionMap('),source.indexOf('function syncMapFavorites('));assert.match(map,/mapStationPopup\(stop\)/);assert.match(map,/bindPopup\(mapStationPopup\(stop\)\)/);
});
test('choosing lines opens the preselected station picker while retaining the map; saving the whole station preserves existing connection favorites',()=>{
 let chosen=null,closed=0,saved=0;const feedback={},state={favorites:[{stopId:stop.id,route:'U6',towards:'Floridsdorf'}]},context=vm.createContext({state,findStop:id=>id===stop.id?stop:null,openFavoritePicker:id=>chosen=id,addStationFavorite,saveFavorites:()=>saved++,render(){},syncMapFavorites(){},$:id=>id==='locationMapDialog'?{close:()=>closed++}:feedback,openRoute(){}});
 const start=source.indexOf('const stationMapClick=e=>'),end=source.indexOf("};$('positionMapHolder')",start);vm.runInContext(source.slice(start,end+1)+';globalThis.click=stationMapClick;',context);
 const click=dataset=>context.click({target:{closest:()=>({dataset})}});
 click({mapLines:stop.id});assert.equal(chosen,stop.id);assert.equal(closed,0);assert.equal(saved,0);assert.equal(state.favorites.length,1);
 click({mapFavorite:stop.id});assert.equal(state.favorites.length,2);assert.equal(state.favorites[0].route,'U6');assert.equal(state.favorites[1].route,'');assert.equal(saved,1);assert.match(feedback.textContent,/Floridsdorf/);
 click({mapFavorite:stop.id});assert.equal(state.favorites.length,2);assert.equal(saved,1);click({mapLines:'unknown'});assert.equal(chosen,stop.id);assert.equal(closed,0);
});
