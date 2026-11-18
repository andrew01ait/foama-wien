import test from 'node:test';
import assert from 'node:assert/strict';
import {warningsForTargets,updateWarningPanel,stationNoticeSections} from '../pwa/src/warning-panel.mjs';
import {updateTrafficCache,noticeLines,affectedNoticeLines,parseTrafficInfos,noticePriorityGroups} from '../pwa/src/traffic-info.mjs';

const now=Date.parse('2026-11-08T08:00:00Z');
const station={provider:'wl',name:'Teststation',rbl:['10','11'],lines:[{route:'46'},{route:'49'}]};
const notice=(id,line,extra={})=>({name:id,refTrafficInfoCategoryId:2,title:line+': Umleitung',description:'Geänderte Haltestellen für Linie '+line,relatedLines:[line],...extra});
const raw={data:{trafficInfoCategories:[{id:2,name:'stoerunglang'},{id:3,name:'stoerungkurz'}],
 monitors:station.rbl.map(rbl=>({locationStop:{properties:{attributes:{rbl}}},lines:[{name:'46'},{name:'49'}]})),
 trafficInfos:[notice('46','46'),notice('49','49'),notice('foreign','46',{refTrafficInfoCategoryId:3,relatedStops:['999'],title:'Fremde Haltestelle'})]}};
const cache=updateTrafficCache({},raw,station.rbl,now);

const priorityFeed={data:{...raw.data,trafficInfoCategories:[...raw.data.trafficInfoCategories,{id:4,name:'aufzugsinfo'},{id:5,name:'fahrtreppeninfo'}],trafficInfos:[
 notice('lift','46',{refTrafficInfoCategoryId:4,title:'Aufzug gesperrt',relatedStops:['10']}),
 notice('planned-lift','46',{refTrafficInfoCategoryId:4,title:'Geplante Aufzugswartung',relatedStops:['10'],time:{start:new Date(now+3600000).toISOString()}}),
 notice('escalator','46',{refTrafficInfoCategoryId:5,title:'Fahrtreppe gesperrt',relatedStops:['10']}),
 notice('future-service','49',{title:'49: Geplante Umleitung',time:{start:new Date(now+1).toISOString()}}),
 notice('current-service','46',{title:'46: Unterbrechung',description:'Bahnverkehr unterbrochen; Zugang zum Aufzug bleibt möglich.'})
]}};

test('lift-only and future notices stay available as information and do not count as current warnings',()=>{
 const selected=updateTrafficCache({},priorityFeed,station.rbl,now);
 const warnings=warningsForTargets(selected,[{stop:station}],{now});
 assert.deepEqual(warnings.map(n=>n.id),['current-service']);
 assert.deepEqual(affectedNoticeLines(warnings).map(n=>n.route),['46']);
 const groups=noticePriorityGroups(parseTrafficInfos(priorityFeed,now),now);
 assert.equal(groups.information.length,4);assert.equal(groups.warnings.length,1);
 const secondaryOnly=updateTrafficCache({}, {data:{...priorityFeed.data,trafficInfos:priorityFeed.data.trafficInfos.slice(0,4)}},station.rbl,now);
 assert.deepEqual(warningsForTargets(secondaryOnly,[{stop:station}],{now}),[]);
});

test('planned service notices become current exactly at their start, without treating cached planned flags as permanent',()=>{
 const entries=parseTrafficInfos(priorityFeed,now),future=entries.find(n=>n.id==='future-service');
 assert.equal(noticePriorityGroups([future],now).warnings.length,0);
 assert.equal(noticePriorityGroups([future],now+1).warnings.length,1);
 assert.equal(noticePriorityGroups([{...future,end:new Date(now+2).toISOString()}],now+3).warnings.length,0);
});

test('station detail keeps lift and planned information in a neutral disclosure separate from warning badges and counts',()=>{
 const notices=parseTrafficInfos(priorityFeed,now),render=rows=>stationNoticeSections(rows,{key:'station:10',isOpen:key=>key==='station:10',escape:value=>String(value).replaceAll('&','&amp;'),renderNotice:n=>'<article>'+n.id+'</article>',renderLines:rows=>affectedNoticeLines(rows).map(n=>n.route).join(','),now});
 const onlyInformation=render(notices.filter(n=>n.id!=='current-service'));
 assert.match(onlyInformation,/secondary-notices/);assert.doesNotMatch(onlyInformation,/⚠|Betroffene Linien/);
 for(const id of ['lift','planned-lift','future-service'])assert.match(onlyInformation,new RegExp('<article>'+id+'</article>'));
 assert.doesNotMatch(onlyInformation,/ open>/);
 const mixed=render(notices);assert.equal((mixed.match(/<details /g)||[]).length,2);
 assert.match(mixed,/warning-title">Warnmeldungen/);assert.match(mixed,/aria-label="Betroffene Linien">46</);
 assert.doesNotMatch(mixed,/aria-label="Betroffene Linien">[^<]*49/);
});

test('warning section follows the selected favorite line and deduplicates shared platforms and favorites',()=>{
 const targets=[{stop:station,routes:['46']},{stop:station,routes:['46']},{stop:{...station,provider:'rail'},routes:['49']}];
 const warnings=warningsForTargets(cache,targets,{now});
 assert.deepEqual(warnings.map(n=>n.id),['46']);
 assert.deepEqual(warnings[0].stationNames,['Teststation']);
 assert.equal(warningsForTargets(cache,[{stop:station}],{now}).length,2);
});

test('no loaded data, removed targets, expired cache and resolved or ended notices leave no warnings',()=>{
 assert.deepEqual(warningsForTargets({},[{stop:station}],{now}),[]);
 assert.deepEqual(warningsForTargets(cache,[],{now}),[]);
 assert.deepEqual(warningsForTargets(cache,[{stop:station}],{now:now+16*60_000}),[]);
 const ended=Object.fromEntries(Object.entries(cache).map(([id,record])=>[id,{...record,notices:record.notices.map(n=>({...n,end:new Date(now-1000).toISOString()}))}]));
 assert.deepEqual(warningsForTargets(ended,[{stop:station}],{now}),[]);
 const resolved=Object.fromEntries(Object.entries(cache).map(([id,record])=>[id,{...record,notices:record.notices.map(n=>({...n,resolved:true}))}]));
 assert.deepEqual(warningsForTargets(resolved,[{stop:station}],{now}),[]);
});

test('still-valid cached warnings retain their age instead of implying a current all-clear',()=>{
 const warnings=warningsForTargets(cache,[{stop:station,routes:['46']}],{now:now+2*60_000});
 assert.equal(warnings.length,1);assert.equal(warnings[0].stale,true);assert.equal(warnings[0].checkedAt,now);
});

test('warning panel retains an opened disclosure on refresh and fully disappears after its last warning',()=>{
 const ui={panel:{hidden:true},count:{textContent:''},preview:{textContent:''},list:{innerHTML:''},details:{open:false}};
 const warnings=warningsForTargets(cache,[{stop:station,routes:['46']}],{now});
 const renderNotice=n=>'<article>'+n.title+'</article>';
 updateWarningPanel(ui,warnings,renderNotice);assert.equal(ui.panel.hidden,false);assert.equal(ui.count.textContent,'1');assert.equal(ui.preview.textContent,'Umleitung');
 ui.details.open=true;updateWarningPanel(ui,warnings,renderNotice);assert.equal(ui.details.open,true);
 updateWarningPanel(ui,[],renderNotice);assert.equal(ui.panel.hidden,true);assert.equal(ui.list.innerHTML,'');assert.equal(ui.details.open,false);
});
test('collapsed warnings show affected lines from every event, including explicit title references, without guessing numbers in prose',()=>{
 assert.deepEqual(noticeLines({title:'U6, 2 und 12: Unterbrechung'}),['U6','2','12']);
 assert.deepEqual(noticeLines({title:'Störung der Linien U1/U4'}),['U1','U4']);
 assert.deepEqual(noticeLines({title:'Fahrten alle 2 Minuten seit 12 Uhr'}),[]);
 assert.deepEqual(noticeLines({title:'2: Test',lines:['U6']}),['U6']);
 const parsed=parseTrafficInfos({data:{trafficInfos:[{name:'title-only',title:'U6: Fahrzeugstörung'}]}},now);assert.deepEqual(parsed[0].lines,['U6']);
 const events=[{title:'Fahrzeug',lines:['2'],lineModes:{'2':'tram'}},{title:'U6, 12: Unterbrechung'},{title:'Lift defekt',lines:[]}];
 const routes=affectedNoticeLines(events);assert.deepEqual(new Set(routes.map(line=>line.route)),new Set(['U6','2','12']));assert.equal(routes[0].route,'U6');
 const ui={panel:{hidden:true},count:{},preview:{},lines:{innerHTML:'',hidden:true},list:{innerHTML:''},details:{open:false}};
 updateWarningPanel(ui,events,n=>'<article>'+n.title+'</article>',list=>affectedNoticeLines(list).map(line=>line.route).join(' · '));
 assert.equal(ui.details.open,false);assert.equal(ui.lines.hidden,false);assert.match(ui.lines.innerHTML,/U6/);assert.match(ui.lines.innerHTML,/12/);
 updateWarningPanel(ui,[],()=>'',()=> '');assert.equal(ui.lines.hidden,true);assert.equal(ui.lines.innerHTML,'');assert.equal(ui.panel.hidden,true);
});
