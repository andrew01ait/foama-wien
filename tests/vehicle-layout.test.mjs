import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {stationVehicleTracks} from '../pwa/src/vehicle-data.mjs';

function hosts(primaryId,liveId,vehicleId){
 const stats={refreshes:0,disconnects:0,mounts:0,focusCalls:0};
 const focused={dataset:{},focus(){stats.focusCalls++;}};
 const panel={open:true,selected:'chosen-variant',contains:node=>node===focused};
 const ui=new Map([
  [primaryId,{contains:()=>true,set innerHTML(value){stats.disconnects++;panel.open=false;}}],
  [liveId,{set innerHTML(value){stats.refreshes++;}}],
  [vehicleId,{append(){stats.mounts++;}}],
  ['connectionNotices',{set innerHTML(value){}}],
  ['connectionHeading',{set innerHTML(value){}}]
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

function vehiclePage(){
 const source=readFileSync(new URL('../pwa/src/vehicle-page.mjs',import.meta.url),'utf8'),nodes=new Map(),stats={maps:0,stops:0,readiness:0,strips:0};
 const node=()=>({children:[],dataset:{},style:{},classList:{toggle(){}},parentElement:{dataset:{}},setAttribute(){},addEventListener(){},append(child){this.children.push(child);},remove(){},textContent:''});
 const ui=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 const direction={stops:Array.from({length:8},(_,i)=>({name:'Halt '+i}))},state={at:Date.now(),tracks:[],rows:[],events:[],coverage:[],expected:8};
 const map={stop(){stats.stops++;}},context=vm.createContext({$ :ui,document:{hidden:false,createElement:node},tracker:{view:()=>state},Date,focusStop:null,paused:false,frozenAt:0,reduced:{matches:false},view:'schema',localRange:{start:0,end:2},stationVehicleTracks,readiness:{render(){stats.readiness++;}},readinessStage:'ready',started:true,requesting:false,waitingUntil:0,repeated:false,map,mapShown:false,mapRevision:0,mapDirection:null,showMap(){stats.maps++;},direction,line:{route:'U6',mode:'metro'},clock:String,selected:'U6-T001',follow:false,localStrip:{setSelected(){},render(){stats.strips++;}},mapVehicles:new Map(),short:String,escape:String,vehicleSymbolMarkup:()=>'',markerMarkup:()=>'',rowY:i=>i*100,lastMarkup:'',lastStationMarkup:'',lastDetailsMarkup:'',lastRender:0});
 vm.runInContext(source.slice(source.indexOf('function syncPresentation('),source.indexOf('function animate(')),context);
 return {context,state,stats,ui,map,position:{id:'U6-T001',hits:2,status:'Bestätigt',schedule:{},position:{progress:1,next:2,basis:'interpolated'}}};
}

test('full vehicle page replaces empty visuals and station information with startup progress, retaining gray positions',()=>{
 const h=vehiclePage(),{context:c,state,stats,ui}=h;c.render(true);
 for(const id of ['pilotSchema','pilotMap','pilotLocal','pilotResults','pilotStationsDetails','pilotEventsDetails','pilotLiveSummary','pilotCoverage','pilotLegend'])assert.equal(ui(id).hidden,true,id);
 assert.equal(ui('pilotReadiness').hidden,false);assert.equal(stats.readiness,1);
 state.tracks=[h.position];c.render(true);assert.equal(ui('pilotReadiness').hidden,true);assert.equal(ui('pilotSchema').hidden,false);assert.equal(ui('pilotStationsDetails').hidden,false);assert.equal(ui('pilotSelection').hidden,false);
 h.position.hits=1;h.position.position.basis='held';h.position.position.uncertain=true;c.render(true);assert.equal(ui('pilotSchema').hidden,false);assert.equal(stats.readiness,1,'a held marker does not reopen the large status panel');
 h.position.position=null;c.render(true);assert.equal(ui('pilotReadiness').hidden,false);assert.equal(ui('pilotSchema').hidden,true);assert.equal(ui('pilotSelection').hidden,true);assert.equal(c.selected,'U6-T001','presentation changes do not clear the tracker selection');
});

test('full-page station range controls the placeholder and map transitions initialize once without remounting',()=>{
 const h=vehiclePage(),{context:c,state,stats,ui}=h;c.view='station';state.tracks=[{...h.position,position:{...h.position.position,progress:5}}];c.render(true);
 assert.equal(ui('pilotReadiness').hidden,false);assert.equal(ui('pilotLocal').hidden,true,'a vehicle outside the station excerpt leaves the placeholder visible');
 state.tracks=[h.position];c.render(true);assert.equal(ui('pilotLocal').hidden,false);assert.equal(ui('pilotReadiness').hidden,true);
 c.view='map';c.render(true);c.render(true);assert.equal(stats.maps,1);assert.equal(ui('pilotMap').hidden,false);assert.equal(c.map,h.map);
 c.view='schema';c.render(true);assert.equal(ui('pilotMap').hidden,true);assert.equal(stats.stops,1);c.view='map';c.render(true);assert.equal(stats.maps,2);assert.equal(c.map,h.map,'switching views retains the map object');
 state.tracks=[];c.render(true);assert.equal(ui('pilotReadiness').hidden,false);assert.equal(ui('pilotMap').hidden,true);assert.equal(c.map,h.map);assert.equal(stats.stops,2);
});
