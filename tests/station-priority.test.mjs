import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeSettings} from '../pwa/src/core.mjs';
import {nearbyMapStops,stationPriority,selectStopIds,stationQueryIncomplete} from '../pwa/src/station-catalog.mjs';

const position={lat:48.2,lon:16.37},settings=mergeSettings({radius:1000});
const stop=(id,mode,offset)=>({id,provider:'wl',lat:position.lat+offset,lon:position.lon,modes:[mode],lines:[{route:id,mode}]});

test('nearby cards prioritize metro, tram and bus before limiting, with distance within each mode',()=>{
 const bus=stop('bus','bus',.0001),tram=stop('tram','tram',.0002),far=stop('metro-far','metro',.002),near=stop('metro-near','metro',.001);
 const original=[bus,far,tram,near];
 assert.deepEqual(nearbyMapStops(original,position,settings).map(s=>s.id),['metro-near','metro-far','tram','bus']);
 assert.deepEqual(nearbyMapStops(original,position,settings,()=>[],2).map(s=>s.id),['metro-near','metro-far']);
 assert.deepEqual(original.map(s=>s.id),['bus','metro-far','tram','metro-near']);
});
test('disabled modes do not give a mixed station metro priority and names are not mode evidence',()=>{
 const mixed={...stop('mixed','bus',.0001),modes:['metro','bus'],lines:[{route:'U1',mode:'metro'},{route:'4A',mode:'bus'}]};
 const tram=stop('tram','tram',.001),noMetro=mergeSettings({radius:1000,modes:{metro:false}});
 assert.equal(stationPriority(mixed,settings),0);assert.equal(stationPriority(mixed,noMetro),2);
 assert.deepEqual(nearbyMapStops([mixed,tram],position,noMetro).map(s=>s.id),['tram','mixed']);
 assert.equal(stationPriority({...stop('Karlsplatz U','bus',0)},settings),2);
 assert.equal(stationPriority({modes:['metro']},settings),0);
});
test('real Karlsplatz U is ahead of nearby tram and bus groups with all modes enabled',async()=>{
 const {stops}=JSON.parse(await readFile(new URL('../pwa/data/stops.json',import.meta.url),'utf8'));
 const karlsplatz=stops.find(s=>s.id==='wl:60200657');
 const ordered=nearbyMapStops(stops,karlsplatz,mergeSettings({radius:600}));
 assert.equal(ordered[0].id,karlsplatz.id);
 let previous=-1;for(const s of ordered){const rank=stationPriority(s,settings);assert.ok(rank>=previous);previous=rank;}
 assert.deepEqual(karlsplatz.lines.filter(l=>l.mode==='metro').map(l=>l.route),['U1','U2','U4']);
});
test('opening Josefstädter Straße loads both U6 directions and its other platforms in one bounded batch',async()=>{
 const {stops}=JSON.parse(await readFile(new URL('../pwa/data/stops.json',import.meta.url),'utf8'));
 const station=stops.find(s=>s.id==='wl:60200615');
 const others=Array.from({length:35},(_,i)=>({id:'other'+i,provider:'wl',rbl:[''+(900000+i)],platforms:[{id:''+(900000+i),modes:['tram']}]}));
 const selected=selectStopIds([...others,station],settings,24,0,new Set([station.id]));
 assert.equal(selected.length,24);assert.equal(new Set(selected).size,24);
 for(const id of station.rbl)assert.ok(selected.includes(id),id);
 assert.deepEqual(selected.slice(0,2),['4607','4622']);
 const seen=new Set(selected);for(let i=1;i<20;i++)for(const id of selectStopIds([...others,station],settings,24,i,new Set([station.id])))seen.add(id);
 for(const s of others)assert.ok(seen.has(s.rbl[0]));
 const checks=new Map([['249',1000],['273',1000]]);assert.equal(stationQueryIncomplete(station,settings,checks,1001),true);
 for(const id of station.rbl)checks.set(id,1000);assert.equal(stationQueryIncomplete(station,settings,checks,1001),false);assert.equal(stationQueryIncomplete(station,settings,checks,92000),true);
});
