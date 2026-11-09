import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWlStopsCsv,parseWlMonitors,modeFromWl,walkingMinutes,reachability,availableDeparts,mergeSettings,railDepartures,parseCsv,dedupeFavorites,haversineMeters,withinRadius} from '../pwa/src/core.mjs';

const at='2026-11-07T12:00:00.000+0100';
const mon={data:{monitors:[{locationStop:{properties:{title:'Testplatz',attributes:{rbl:4116}}},lines:[
 {name:'U1',towards:'Leopoldau',type:'ptMetro',departures:{departure:[
   {departureTime:{timePlanned:'2026-11-07T12:01:00.000+0100',timeReal:'2026-11-07T12:02:00.000+0100'}},
   {departureTime:{timePlanned:'2026-11-07T12:08:00.000+0100'}}]}},
 {name:'N49',towards:'Hütteldorf',type:'ptBusNight',departures:{departure:[{departureTime:{timePlanned:'2026-11-07T12:04:00.000+0100'}}]}}
]}]}};

test('CSV parser handles quotes and grouping by DIVA',()=>{
 const csv='StopID;DIVA;StopText;Municipality;MunicipalityID;Longitude;Latitude\r\n4116;60201035;"Test;platz";Wien;9;16.37;48.2\r\n4117;60201035;"Test;platz";Wien;9;16.371;48.201\r\n';
 assert.equal(parseCsv(csv)[1][2],'Test;platz');
 const stops=parseWlStopsCsv(csv);assert.equal(stops.length,1);assert.deepEqual(stops[0].rbl,['4116','4117']);assert.equal(stops[0].id,'wl:60201035');
});
test('WL API parser treats Plan and Live separately and exposes both departures',()=>{
 const ds=parseWlMonitors(mon,'2026-11-07T10:00:00Z');
 assert.equal(ds.length,3);assert.equal(ds[0].quality,'live');assert.equal(ds[1].quality,'schedule');
 const grp=availableDeparts(ds,mergeSettings({}),Date.parse('2026-11-07T11:00:00Z'));
 assert.equal(grp.length,2);assert.equal(grp.find(x=>x.route==='U1').departures.length,2);
 assert.equal(ds[0].actual,'2026-11-07T11:02:00.000Z');
});
test('route types recognized accurately',()=>{
 assert.equal(modeFromWl('ptTrainS','S1'),'sbahn');assert.equal(modeFromWl('ptMetro','U6'),'metro');
 assert.equal(modeFromWl('ptTram','31'),'tram');assert.equal(modeFromWl('ptBusCity','29B'),'bus');
});
test('reachability threshold uses walking + safety reserve',()=>{
 const now=Date.parse('2026-11-07T11:00:00Z');
 assert.equal(walkingMinutes(450,4.5),6);
 assert.equal(reachability('2026-11-07T11:11:00Z',6,1,now).status,'good');
 assert.equal(reachability('2026-11-07T11:08:00Z',6,1,now).status,'tight');
 assert.equal(reachability('2026-11-07T11:06:00Z',6,1,now).status,'missed');
 assert.equal(reachability('2026-11-07T11:08:00Z',6,1,now,false).status,'unknown');
});
test('radius is a geodesic preselection and favorites do not duplicate',()=>{
 const base={lat:48.2,lon:16.37};
 assert.ok(haversineMeters(base,{lat:48.201,lon:16.37})>100);
 const got=withinRadius([{id:'1',lat:48.2,lon:16.37},{id:'2',lat:48.22,lon:16.37}],base,300);
 assert.deepEqual(got.map(x=>x.id),['1']);
 assert.equal(dedupeFavorites([{stopId:'1',route:'U6'},{stopId:'1',route:'U6'}]).length,1);
});
test('rail GTFS adapter recognizes dates, stop ids and planned quality',()=>{
 const now=new Date('2026-11-07T12:00:00+01:00');
 const feed={validThrough:'2026-11-30',services:{WD:['2026-11-07']},departures:[{stop:'s',trip:'t',service:'WD',seconds:12*3600+5*60,station:'Test',route:'S1',towards:'Wien',mode:'sbahn'}]};
 const ds=railDepartures(feed,['s'],now);assert.equal(ds.length,1);assert.equal(ds[0].quality,'schedule');
 assert.equal(ds[0].actual,'2026-11-07T11:05:00.000Z');
 assert.equal(railDepartures({...feed,validThrough:'2026-10-01'},['s'],now).length,0);
});
