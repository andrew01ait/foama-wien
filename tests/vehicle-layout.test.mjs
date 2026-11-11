import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function hosts(primaryId,liveId,vehicleId){
 const stats={refreshes:0,disconnects:0,mounts:0,focusCalls:0};
 const focused={dataset:{},focus(){stats.focusCalls++;}};
 const panel={open:true,selected:'chosen-variant',contains:node=>node===focused};
 const ui=new Map([
  [primaryId,{contains:()=>true,set innerHTML(value){stats.disconnects++;panel.open=false;}}],
  [liveId,{set innerHTML(value){stats.refreshes++;}}],
  [vehicleId,{append(){stats.mounts++;}}],
  ['connectionNotices',{set innerHTML(value){}}]
 ]);
 return {stats,panel,focused,$:id=>{assert.ok(ui.has(id),id);return ui.get(id);}};
}

test('connection countdown and monitor refreshes never detach the open vehicle panel or refocus its controls',()=>{
 const source=readFileSync(new URL('../pwa/src/app.mjs',import.meta.url),'utf8');
 const h=hosts('connectionContent','connectionDepartures','connectionVehicles');
 const state={focusedConnection:{stopId:'wl:test',route:'U6',mode:'metro',towards:'Floridsdorf',ids:[]},vehicleStrip:{element:h.panel},favorites:[],position:null,settings:{buffer:1},platformChecks:new Map(),fetchError:''};
 const context=vm.createContext({state,$:h.$,document:{activeElement:h.focused},findStop:()=>({id:'wl:test',name:'Thaliastraße U',provider:'wl'}),MODE_LABELS:{metro:'U-Bahn'},connectionDepartures:()=>[],displayDepartures:()=>[],reachFor:()=>({}),escape:String,lineHasCurrentDeparture:()=>false,routeBadge:()=>'<b>U6</b>',connectionRefreshText:()=>'',stationNotices:()=>'',URLSearchParams,Date});
 vm.runInContext(source.slice(source.indexOf('function renderConnection('),source.indexOf('function renderFavoriteTools(')),context);
 for(let i=0;i<4;i++)context.renderConnection();
 assert.equal(h.stats.refreshes,4);assert.equal(h.stats.disconnects,0);assert.equal(h.stats.mounts,0);assert.equal(h.stats.focusCalls,0);assert.equal(h.panel.open,true);assert.equal(h.panel.selected,'chosen-variant');
});

test('A-to-B station refreshes update departures without remounting the vehicle panel',()=>{
 const source=readFileSync(new URL('../pwa/src/journey-page.mjs',import.meta.url),'utf8');
 const h=hosts('journeyStationContent','journeyStationDepartures','journeyStationVehicles');
 const state={station:{provider:'wl'},vehicleStrip:{element:h.panel},stationConnection:{route:'U6'}};
 const context=vm.createContext({state,$:h.$,document:{activeElement:h.focused},journeyStationMarkup:()=>'<p>Current departure</p>',displayDepartures:()=>[],escape:String,badge:()=>'',showSteps:()=>assert.fail('station remains selected')});
 vm.runInContext(source.slice(source.indexOf('function renderCurrent('),source.indexOf('async function loadRegional(')),context);
 for(let i=0;i<4;i++)context.renderCurrent();
 assert.equal(h.stats.refreshes,4);assert.equal(h.stats.disconnects,0);assert.equal(h.stats.mounts,0);assert.equal(h.stats.focusCalls,0);assert.equal(h.panel.open,true);
});

test('map, schema and vehicle-list selections toggle off on a second tap and stop following',()=>{
 const source=readFileSync(new URL('../pwa/src/vehicle-page.mjs',import.meta.url),'utf8');let rendered=0;const context=vm.createContext({selected:'',follow:false,render:()=>rendered++});
 vm.runInContext(source.slice(source.indexOf('function choose('),source.indexOf('async function showMap(')),context);
 context.choose('U6-T001');assert.equal(context.selected,'U6-T001');context.follow=true;context.choose('U6-T001');assert.equal(context.selected,'');assert.equal(context.follow,false);context.choose('U6-T002');assert.equal(context.selected,'U6-T002');assert.equal(rendered,3);
});
