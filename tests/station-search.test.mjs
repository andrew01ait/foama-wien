import test from 'node:test';
import assert from 'node:assert/strict';
import {searchStations,connectionsAtStation} from '../pwa/src/station-search.mjs';
const stops=[{id:'1',name:'Siemensstraße',provider:'wl',rbl:['101']},{id:'2',name:'Nußdorfer Straße U',provider:'wl',rbl:['102']},{id:'3',name:'Alte Siemensstraße',provider:'wl',rbl:['103']}];
test('station search accepts common spellings and ranks station-name prefixes first',()=>{
 assert.deepEqual(searchStations(stops,'siemensstrasse').map(s=>s.id),['1','3']);
 assert.equal(searchStations(stops,'nussdorfer strasse')[0].id,'2');
 assert.equal(searchStations(stops,'strasse nussdorfer')[0].id,'2');
 assert.equal(searchStations(stops,'').length,0);
 assert.equal(searchStations(stops,'strasse',1).length,1);
});
test('connection picker keeps each real line/direction and ignores unrelated or expired data',()=>{
 const now=Date.parse('2026-11-07T13:00:00Z');
 const base={provider:'wl',rbl:'101',route:'U1',towards:'Leopoldau',mode:'metro',actual:'2026-11-07T13:05:00Z'};
 const result=connectionsAtStation([base,{...base,actual:'2026-11-07T13:10:00Z'},
  {...base,towards:'Oberlaa'},{...base,rbl:'102',route:'U2'},
  {...base,route:'U3',actual:'2026-11-07T12:00:00Z'},{...base,route:'U4',actual:'not-a-date'}],stops[0],now);
 assert.deepEqual(result.map(r=>r.route+' → '+r.towards),['U1 → Leopoldau','U1 → Oberlaa']);
});
