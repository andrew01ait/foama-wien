import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {localD1} from '../site/local-d1.mjs';
import {stationLineRegistry,shouldSuppressLine} from '../cloudflare/src/line-registry.mjs';
import {mergeObservedLines,evidenceForStation,CONFIRMATION_MS} from '../pwa/src/line-evidence.mjs';
import {stationLines,enrichStops} from '../pwa/src/station-catalog.mjs';

const start=Date.parse('2026-11-08T08:00:00Z'),day=86400000;
const station={id:'wl:42',provider:'wl',rbl:['1','2'],platforms:[{id:'1',modes:['metro']},{id:'2',modes:['tram']}],lines:[{route:'U6',mode:'metro'},{route:'N8',mode:'bus'}],candidateLines:[{route:'2',mode:'tram'},{route:'N99',mode:'bus'},{route:'N54R',mode:'bus'}]};
const line=(route,mode='tram')=>({route,mode});
function payload(names=['U6'],now=start,rbl='1'){
 return {message:{messageCode:1,serverTime:new Date(now).toISOString()},data:{monitors:[{locationStop:{properties:{attributes:{rbl},geometry:{coordinates:['PRIVATE_LOCATION']}}},lines:names.map(name=>({name,type:name.startsWith('U')?'ptMetro':name.startsWith('N')?'ptBusNight':'ptTram'}))}]},privateDevice:'PRIVATE_DEVICE'};
}
const call=(db,names,now=start,ids=['1','2'],options={})=>stationLineRegistry(payload(names,now),ids,[station],db,{fresh:true,now,...options});
test('each operator-reported line gets its own 30-day confirmation and only that line renews',async()=>{
 const db=localD1();try{
  await call(db,['U6','2']);await call(db,['U6'],start+day);
  const rows=(await db.prepare('SELECT * FROM foama_station_lines ORDER BY route').all()).results;
  assert.equal(rows.find(row=>row.route==='2').last_seen,start);assert.equal(rows.find(row=>row.route==='U6').last_seen,start+day);
  const meta=await call(db,['U6'],start+2*day);assert.equal(meta.status,'available');assert.equal(meta.stations[0].lines.find(row=>row.route==='2').lastSeen,start);
  assert.ok(!JSON.stringify(meta).includes('PRIVATE_'));assert.ok(!JSON.stringify(rows).includes('PRIVATE_'));
 }finally{db.close();}
});
test('cache hits and stale upstream timestamps never renew confirmations or check-day evidence',async()=>{
 const db=localD1();try{
  await call(db,['2']);await call(db,['2'],start+day,['1','2'],{fresh:false});
  const stale=payload(['2'],start);stale.foamaMonitorAt=new Date(start+day).toISOString();
  await stationLineRegistry(stale,['1','2'],[station],db,{fresh:true,now:start+day});
  assert.equal((await db.prepare('SELECT last_seen FROM foama_station_lines WHERE route=?').bind('2').first()).last_seen,start);
  assert.equal((await db.prepare('SELECT count(*) n FROM foama_station_check_days').first()).n,1);
 }finally{db.close();}
});
test('partial, filtered and connection-only batches confirm positives without counting a complete station check',async()=>{
 const db=localD1();try{
  await call(db,['2'],start,['1']);assert.equal((await db.prepare('SELECT count(*) n FROM foama_station_lines').first()).n,1);
  assert.equal((await db.prepare('SELECT count(*) n FROM foama_station_check_days').first()).n,0);
  const p=payload(['U6'],start+day);p.data.partial=true;await stationLineRegistry(p,['1','2'],[station],db,{fresh:true,now:start+day});
  const bad=payload(['U6'],start+day);bad.message.messageCode=312;await stationLineRegistry(bad,['1','2'],[station],db,{fresh:true,now:start+day});
  assert.equal((await db.prepare('SELECT count(*) n FROM foama_station_check_days').first()).n,0);
 }finally{db.close();}
});
test('an unplanned old line is suppressed only after 30 days and multiple complete dates/time bands; reappearance restores it',async()=>{
 const db=localD1();try{
  await call(db,['2','U6']);await call(db,['U6'],start+10*day+7*3600000);await call(db,['U6'],start+31*day);
  let meta=await call(db,['U6'],start+32*day+10*3600000);assert.ok(meta.stations[0].suppressed.some(row=>row.route==='2'));
  meta=await call(db,['U6','2'],start+33*day);assert.ok(!meta.stations[0].suppressed.some(row=>row.route==='2'));assert.equal(meta.stations[0].lines.find(row=>row.route==='2').confirmed,true);
 }finally{db.close();}
});
test('timetable evidence, night lines during daytime and Rufbus are protected from absence-based removal',()=>{
 const now=start+40*day,history=[1,15,35].map((d,i)=>({day:String(d),band:i+1,first_checked:start+d*day,last_checked:start+d*day}));
 assert.equal(shouldSuppressLine(line('N99','bus'),null,history,[],now),false);
 assert.equal(shouldSuppressLine(line('N54R','bus'),null,history.map(c=>({...c,band:0})),[],now),false);
 assert.equal(shouldSuppressLine(line('2'),null,history,[line('2')],now),false);
 assert.equal(shouldSuppressLine(line('N99','bus'),null,history.map(c=>({...c,band:0})),[],now),true);
});
test('unqueried stations remain untouched, and out-of-scope monitors cannot teach another station',async()=>{
 const db=localD1();try{
  const extra={...station,id:'wl:99',rbl:['99']};
  const meta=await stationLineRegistry(payload(['1'],start,'99'),['1'],[station,extra],db,{fresh:true,now:start});
  assert.deepEqual(meta.stations.map(s=>s.stopId),[station.id]);assert.equal((await db.prepare('SELECT count(*) n FROM foama_station_lines').first()).n,0);
 }finally{db.close();}
});
test('concurrent updates preserve earliest and latest sightings; retention cleanup removes only public stale evidence',async()=>{
 const db=localD1();try{
  await Promise.all([call(db,['2'],start),call(db,['2','U6'],start+day)]);
  const row=await db.prepare('SELECT first_seen,last_seen FROM foama_station_lines WHERE route=?').bind('2').first();assert.equal(row.first_seen,start);assert.equal(row.last_seen,start+day);
  await call(db,['U6'],start+92*day);assert.equal((await db.prepare('SELECT count(*) n FROM foama_station_lines WHERE route=?').bind('2').first()).n,0);
 }finally{db.close();}
});
test('storage failure remains explicitly unavailable and cannot break departures or claim negative evidence',async()=>{
 const broken={prepare(){throw Error('offline');}};
 assert.deepEqual(await call(broken,['U6']),{version:1,status:'unavailable',stations:[]});
});
test('PWA per-line local fallback does not revive old lines when a different line is seen',()=>{
 const before=mergeObservedLines([], [line('2'),line('46')],start);
 const after=mergeObservedLines(before,[line('46')],start+29*day);
 assert.equal(after.find(l=>l.route==='2').lastSeen,start);
 assert.deepEqual(mergeObservedLines(after,[],start+CONFIRMATION_MS+1).map(l=>l.route),['46']);
});
test('PWA applies central suppression across catalog and learned data, while preserving explicit favorites and local station identity',()=>{
 const entry={checkedAt:start,lines:[{...line('9'),lastSeen:start}],suppressed:[line('2')]};
 const learned=evidenceForStation(entry,start),base={...station,lines:[line('2'),line('U6','metro')]};
 assert.deepEqual(stationLines(base,learned).map(l=>l.route),['U6','9']);
 const current={...station,lineMapping:'gtfs-service-week-v1',lines:[line('U6','metro')]};
 const enriched=enrichStops([{...base,lines:[line('1'),line('2')],rbl:['1']}],[current])[0];
 assert.deepEqual(enriched.lines,current.lines);assert.deepEqual(enriched.rbl,['1']);assert.equal(enriched.lineMapping,current.lineMapping);
});
test('corrected production catalog excludes Westbahnhof route variants 1/2 and preserves real metro/night service and separate neighboring stations',async()=>{
 const data=JSON.parse(await readFile(new URL('../pwa/data/stops.json',import.meta.url)));
 const west=data.stops.find(s=>s.id==='wl:60201468'),thalia=data.stops.find(s=>s.name==='Thaliastraße U');
 assert.equal(data.lineMapping.kind,'gtfs-service-week-v1');assert.ok(!west.lines.some(l=>['1','2','10','12','46','57A','62'].includes(l.route)));
 for(const route of ['U3','U6','5','6','9','18','52','60','N8'])assert.ok(west.lines.some(l=>l.route===route),route);
 assert.ok(west.candidateLines.some(l=>l.route==='1'));assert.ok(!thalia.lines.some(l=>l.route==='2'));assert.ok(thalia.lines.some(l=>l.route==='46'));
 assert.notEqual(data.stops.find(s=>s.name.includes('Gerstner')).id,west.id);
});
