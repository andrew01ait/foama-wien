import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {coordinate} from '../pwa/src/journey-geometry.mjs';
import {journeyPlacePoint,journeyEndpointLabel} from '../pwa/src/journey-places.mjs';
import {sanitizeJourneyFavorites,saveJourneyFavorite,transferableJourneys} from '../pwa/src/journey-favorites.mjs';
import {reverseJourneyEndpoints} from '../pwa/src/journey-options.mjs';

const page=readFileSync(new URL('../pwa/src/journey-page.mjs',import.meta.url),'utf8');
const address={name:'Giefinggasse 4',kind:'address',detail:'1210 Wien · Floridsdorf',lat:48.267,lon:16.427};
const work={id:'work',label:'Arbeit',address:address.name,detail:address.detail,lat:address.lat,lon:address.lon};
function form(places=[]){
 const nodes=new Map(),state={from:{kind:'current',name:'Dein Standort'},to:null,stops:[]};
 const $=id=>{if(!nodes.has(id))nodes.set(id,{value:'',title:'',textContent:'',hidden:true,disabled:false,dataset:{},setAttribute(){},replaceChildren(){}});return nodes.get(id);};
 const context=vm.createContext({state,$,coordinate,placesUI:{describeParts:point=>journeyEndpointLabel(places,point),renderChoices(){}},status(){},cancelSearch(){},invalidateResults(){},choices(){}});
 vm.runInContext(page.slice(page.indexOf('function pointControls('),page.indexOf('function choices(')),context);
 return {state,$,select:context.selectPoint,edit:context.localChoices,refresh:context.pointControls};
}

test('actual address selection retains locality and exposes it separately from the single-line input',()=>{
 const h=form();h.select('to',address);
 assert.equal(h.state.to.name,address.name);assert.equal(h.state.to.detail,address.detail);assert.equal(h.state.to.lat,address.lat);assert.equal(h.state.to.lon,address.lon);
 assert.equal(h.$('journeyTo').value,address.name);assert.equal(h.$('journeyToContext').textContent,address.detail);assert.equal(h.$('journeyToContext').hidden,false);assert.match(h.$('journeyTo').title,/Giefinggasse 4.*1210 Wien/);assert.equal(h.$('toAddress').disabled,true);
});

test('selected saved place shows its personal label with full street and locality beneath it',()=>{
 const h=form([work]);h.select('from',journeyPlacePoint(work));
 assert.equal(h.state.from.name,address.name,'display label does not replace the physical endpoint');assert.equal(h.$('journeyFrom').value,'Arbeit');assert.equal(h.$('journeyFromContext').textContent,address.name+', '+address.detail);assert.match(h.$('journeyFrom').title,/Arbeit.*Giefinggasse.*1210 Wien/);
 const places=[{...work,label:work.address}];assert.deepEqual(journeyEndpointLabel(places,journeyPlacePoint(work)),{name:work.address,detail:work.detail},'the locality remains visible even when the saved name equals its street');
});

test('editing an endpoint and changing back to GPS clear the previous selected address context',()=>{
 const h=form();h.select('to',address);h.$('journeyTo').value='Andere Adresse';h.edit('to');
 assert.equal(h.state.to,null);assert.equal(h.$('journeyTo').value,'Andere Adresse');assert.equal(h.$('journeyTo').title,'');assert.equal(h.$('journeyToContext').textContent,'');assert.equal(h.$('journeyToContext').hidden,true);
 h.select('from',address);h.select('from',{kind:'current',name:'Dein Standort',detail:'OLD_ADDRESS_CONTEXT'});assert.equal(h.state.from.detail,undefined);assert.equal(h.$('journeyFromContext').hidden,true);assert.equal(h.$('journeyFrom').title,'Dein Standort');
});

test('renaming a selected saved place updates its input label without moving the physical endpoint',()=>{
 const places=[{...work}],h=form(places);h.select('from',journeyPlacePoint(work));places[0].label='Büro';h.refresh();assert.equal(h.$('journeyFrom').value,'Büro');assert.equal(h.state.from.name,address.name);assert.equal(h.state.from.lat,address.lat);assert.equal(h.$('journeyFromContext').textContent,address.name+', '+address.detail);
});

const start={kind:'point',name:address.name,lat:address.lat,lon:address.lon},goal={kind:'point',name:'Opernring 2',lat:48.2027,lon:16.3697};
const journey={legs:[{mode:'metro',route:'U1',towards:'Leopoldau',durationSeconds:120,from:{name:'Karlsplatz U',stopId:'wl:60200657'},to:{name:'Stephansplatz U',stopId:'wl:60201320'}}]};
test('address context survives a saved-route reload and does not duplicate or rename an existing route',()=>{
 const initial=saveJourneyFavorite([],{from:start,to:goal,journey,id:'existing',now:1}).favorites;initial[0].name='Meine Fahrt';
 const result=saveJourneyFavorite(initial,{from:{...start,detail:address.detail},to:{...goal,detail:'1010 Wien'},journey,id:'different',now:2});
 assert.equal(result.favorites.length,1);assert.equal(result.favorite.id,'existing');assert.equal(result.favorite.name,'Meine Fahrt');
 const reopened=sanitizeJourneyFavorites(JSON.parse(JSON.stringify(result.favorites)))[0];assert.equal(reopened.from.detail,address.detail);assert.equal(reopened.to.detail,'1010 Wien');assert.equal(transferableJourneys([reopened])[0].from.detail,address.detail);
 const reverse=reverseJourneyEndpoints(reopened.from,reopened.to);assert.equal(reverse.from.detail,'1010 Wien');assert.equal(reverse.to.detail,address.detail);
});

test('dynamic GPS never retains address context or coordinates and fixed context stays bounded',()=>{
 const [saved]=sanitizeJourneyFavorites([{id:'gps',savedAt:1,from:{kind:'current',name:'GPS',detail:'PRIVATE_OLD_ADDRESS',lat:48.2,lon:16.3},to:{...goal,detail:'W'.repeat(300)},legs:journey.legs}]);
 assert.deepEqual(saved.from,{kind:'current',name:'Dein Standort'});assert.equal(saved.to.detail.length,160);assert.ok(!JSON.stringify(saved).includes('PRIVATE_OLD_ADDRESS'));
});
