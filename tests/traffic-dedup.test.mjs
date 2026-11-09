import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTrafficInfos,updateTrafficCache,trafficAtStation,dedupeTrafficInfos} from '../pwa/src/traffic-info.mjs';
const t=Date.parse('2026-11-07T16:40:00+01:00');
const station={rbl:['1380','1391'],lines:[{route:'46',mode:'tram'}]};
const long={name:'I-test-F01',parentName:'I-test',refTrafficInfoCategoryId:2,title:'46: Polizeieinsatz',reasonName:'Polizeieinsatz',description:'Linie 46: Unregelmäßige Intervalle.',relatedLines:['46'],relatedStops:[1381],time:{start:'2026-11-07T16:33:00+0100',end:'2026-11-07T16:57:00+0100'}};
const short=id=>({name:'R'+id+'-146',parentName:'R'+id+'-146',refTrafficInfoCategoryId:3,title:'Fahrtbehinderung\nwegen Polizeieinsatz',description:'Fahrtbehinderung\nwegen Polizeieinsatz',relatedLines:['46'],relatedStops:[id],time:{start:'2026-11-07T16:33:52+0100',end:'2026-11-07T17:33:00+0100'}});
const response=(notices,ids=station.rbl)=>({data:{trafficInfoCategories:[{id:2,name:'stoerunglang'},{id:3,name:'stoerungkurz'}],monitors:ids.map(id=>({locationStop:{properties:{attributes:{rbl:id}}},lines:[{name:'46'}],refTrafficInfoNames:[long.name]})),trafficInfos:notices}});
test('the reported seven-notice case displays one line-wide event, not foreign stop summaries',()=>{
 const raw=response([long,...[1382,1385,1384,1383,1381,564].map(short)]);
 const cache=updateTrafficCache({},raw,station.rbl,t),shown=trafficAtStation(cache,station,{now:t});
 assert.equal(shown.length,1);assert.equal(shown[0].id,long.name);assert.equal(shown[0].description,long.description);
 // Repair already-cached previously stored records too, without requiring storage deletion.
 const legacy={1380:{checkedAt:t,notices:parseTrafficInfos(raw,t).map(n=>({...n,scope:'line'}))}};
 assert.equal(trafficAtStation(legacy,station,{now:t}).length,1);
});
test('a matching short summary at the affected stop yields to the richer long event without its generic end time',()=>{
 const ids=['1381'],cache=updateTrafficCache({},response([long,short(1381)],ids),ids,t);
 const shown=trafficAtStation(cache,{...station,rbl:ids},{now:t});assert.equal(shown.length,1);assert.equal(shown[0].scope,'stop');
 assert.equal(shown[0].end,'2026-11-07T15:57:00.000Z');
});
test('identical platform summaries merge but distinct directions, lines, equipment and later incidents survive',()=>{
 const a=short(1380),b=short(1391),ids=station.rbl;
 const cache=updateTrafficCache({},response([a,b],ids),ids,t);assert.equal(trafficAtStation(cache,station,{now:t}).length,1);
 const parsed=parseTrafficInfos(response([long,{...long,name:'direction-2',description:'Linie 46: Umleitung Richtung A.'},{...long,name:'later',time:{...long.time,start:'2026-11-07T16:39:00+0100'}},{...long,name:'other-line',relatedLines:['49']}]),t);
 assert.equal(dedupeTrafficInfos(parsed).length,4);
 const lift={...parsed[0],category:'aufzugsinfo',title:'Lift gesperrt',id:'lift-1'};
 assert.equal(dedupeTrafficInfos([lift,{...lift,id:'lift-2'}]).length,2);
});
test('short messages with extra directions or a different incident time are not hidden by a generic long notice',()=>{
 const described={...short(1381),description:'Fahrtbehinderung wegen Polizeieinsatz. Umleitung Richtung A.'};
 const later={...short(1381),name:'later-short',time:{...short(1381).time,start:'2026-11-07T16:39:00+0100'}};
 assert.equal(dedupeTrafficInfos(parseTrafficInfos(response([long,described,later]),t)).length,3);
});
