import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {decodeJourneyPolyline,journeyLegPath,coordinate} from '../pwa/src/journey-geometry.mjs';
import {normalizeJourneys,motisPlanUrl,journeyStation,uniqueJourneyPlaces} from '../pwa/src/journey-planning.mjs';
import {saveJourneyFavorite,transferableJourneys,mergeJourneyFavorites,savedJourney} from '../pwa/src/journey-favorites.mjs';
import {transferBundle,mergeTransferBundle,encryptTransfer,decryptTransfer,b64urlEncode} from '../pwa/src/transfer.mjs';
import {journeyStationMarkup} from '../pwa/src/journey-station.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/journey-westbahnhof-karlsplatz.json',import.meta.url)));
const stops=JSON.parse(readFileSync(new URL('../pwa/data/stops.json',import.meta.url))).stops;
const journey=normalizeJourneys(fixture,{stops})[0];
const fixed={name:'Westbahnhof',lat:48.1966,lon:16.3375},goal={name:'Karlsplatz',lat:48.2,lon:16.3695};
function encoded(points){let a=0,b=0,out='';const number=n=>{n=n<0?~(n<<1):n<<1;let s='';while(n>=32){s+=String.fromCharCode((32|(n&31))+63);n>>>=5;}return s+String.fromCharCode(n+63);};for(const [lat,lon]of points){let c=Math.round(lat*1e6),d=Math.round(lon*1e6);out+=number(c-a)+number(d-b);a=c;b=d;}return out;}
const points=[[48.1966,16.3375],[48.195401,16.340123],[48.2,16.3695]],geometry=encoded(points);
const saved=(extra={})=>saveJourneyFavorite([],{from:fixed,to:goal,journey,id:'route-test',now:123,...extra}).favorite;
test('MOTIS precision-six geometry is decoded fully, with malformed, truncated, excessive or invalid coordinates rejected',()=>{
 assert.deepEqual(decodeJourneyPolyline(geometry),points);assert.deepEqual(decodeJourneyPolyline(geometry,{limit:2}),[]);assert.deepEqual(decodeJourneyPolyline(geometry.slice(0,-1)),[]);assert.deepEqual(decodeJourneyPolyline('~'.repeat(40)),[]);assert.deepEqual(decodeJourneyPolyline(encoded([[91,16],[92,17]])),[]);assert.equal(coordinate({lat:'48',lon:16}),null);
});
test('plans request actual ride and transfer geometries, preserve valid paths and join only exact official parent IDs',()=>{
 const url=motisPlanUrl({from:fixed,to:goal,time:'2026-11-09T07:00:00Z',modes:{metro:true}},'https://api.transitous.org');assert.equal(url.searchParams.get('detailedLegs'),'true');assert.equal(url.searchParams.get('detailedTransfers'),'true');
 const data=structuredClone(fixture);data.itineraries[0].legs[1].legGeometry={points:geometry};assert.equal(normalizeJourneys(data,{stops})[0].legs[1].geometry,geometry);assert.deepEqual(journeyLegPath({geometry}),{points,schematic:false});
 assert.equal(journeyStation('provider_Pat:49:657',stops)?.id,'wl:60200657');assert.equal(journeyStation('provider_Pat:13:657',stops),null);
 assert.deepEqual(journeyLegPath({from:{stopId:'missing'},to:goal},stops).points,[]);assert.equal(journeyLegPath({from:fixed,to:goal},stops).schematic,true);
});
test('saving a GPS route strips its initial geometry and position while preserving public transit paths; QR strips all geometry',()=>{
 const data=structuredClone(journey);data.legs[0].geometry=geometry;data.legs[0].from={...data.legs[0].from,lat:48.123456,lon:16.123456};data.legs[1].geometry=geometry;
 const route=saved({from:{kind:'current',lat:48.123456,lon:16.123456,name:'GPS'},journey:data});assert.equal(route.legs[0].geometry,undefined);assert.equal(route.legs[0].from.lat,undefined);assert.equal(route.legs[1].geometry,geometry);assert.ok(!JSON.stringify(route).includes('48.123456'));
 const wire=transferableJourneys([route]);assert.ok(!JSON.stringify(wire).includes('geometry'));assert.equal(wire[0].legs[1].from.lat,undefined);assert.equal(savedJourney(saved()).legs[0].from.lat,fixed.lat);
});
test('mixed route and station transfer is encrypted, timeless, deduplicated by path and preserves existing custom names',async()=>{
 const route=saved();route.name='Zur Arbeit';const value=transferBundle({format:'foama-favorites-v2',favorites:[{stopId:'wl:60201468'}],journeys:[route]});const key=b64urlEncode(crypto.getRandomValues(new Uint8Array(32)));const packet=await encryptTransfer(value,key),decoded=await decryptTransfer(packet,key);assert.deepEqual(decoded,value);assert.ok(!JSON.stringify(decoded).includes('startTime'));
 const first=mergeTransferBundle({favorites:[{stopId:'wl:existing'}],journeys:[]},decoded);assert.equal(first.added,1);assert.equal(first.addedJourneys,1);
 const second=mergeTransferBundle(first,{...decoded,journeys:[{...route,id:'other',name:'Other name'}]});assert.equal(second.addedJourneys,0);assert.equal(second.journeys[0].name,'Zur Arbeit');assert.equal(second.favorites[0].stopId,'wl:existing');
 assert.equal(transferBundle({format:'foama-favorites-v1',favorites:[]}).format,'foama-favorites-v1');
});
test('route merging rejects an entire malformed collection, limits capacity and repairs unrelated route ID collisions',()=>{
 const route=saved(),different=saved({to:{...goal,name:'Other',lat:48.3}});different.id=route.id;const merged=mergeJourneyFavorites([route],[different]);assert.equal(merged.added,1);assert.notEqual(merged.favorites[0].id,merged.favorites[1].id);
 assert.throws(()=>transferBundle({format:'foama-favorites-v2',favorites:[],journeys:[route,{...route,legs:[]}]}),/Route/);assert.throws(()=>mergeJourneyFavorites([],Array(31).fill(route)),/30/);assert.throws(()=>transferBundle({format:'wrong',favorites:[]}),/Datei/);
});
test('station detail includes all modes and directions, keeps scheduled data distinct, and removes LIVE on retrieval failure',()=>{
 const now=Date.now(),stop={id:'wl:s',provider:'wl',rbl:['a','b']},base={provider:'wl',rbl:'a',route:'U6',mode:'metro',towards:'Floridsdorf',actual:new Date(now+240000).toISOString(),fetchedAt:new Date(now).toISOString(),quality:'live'};
 const rows=[base,{...base,rbl:'b',route:'2',mode:'tram',towards:'Dornbach',quality:'schedule'},{...base,towards:'Siebenhirten'}],options={now,escape:String,badge:g=>g.route};
 const html=journeyStationMarkup(stop,rows,options);for(const text of ['Floridsdorf','Siebenhirten','Dornbach','Fahrplan','LIVE'])assert.ok(html.includes(text),text);assert.ok(!journeyStationMarkup(stop,rows,{...options,error:'Offline'}).includes('>LIVE<'));
});
test('address submission resolves a unique match while ambiguous addresses require explicit selection and stale searches never choose a point',async()=>{
 const source=readFileSync(new URL('../pwa/src/journey-page.mjs',import.meta.url),'utf8'),input={value:'Neumayrgasse 8 Wien',scrollIntoView(){}};let selected=null,offered=[],afterChoice=null,resumed=0;
 const state={revision:1,stops:[]},ctx=vm.createContext({state,uniqueJourneyPlaces,document:{hidden:false},$(){return input;},DOMException,selectPoint:(kind,p)=>selected=p,choices:(kind,p,label,after)=>{offered=p;afterChoice=after;},search:()=>resumed++,status(){},placeClient:{places:async()=>({places:[{name:'Neumayrgasse 8',lat:48.21,lon:16.33}]})}});vm.runInContext(source.slice(source.indexOf('async function lookupPlace('),source.indexOf('async function address(')),ctx);
 assert.equal(await ctx.lookupPlace('to',{automatic:true}),true);assert.equal(selected.name,'Neumayrgasse 8');selected=null;ctx.placeClient.places=async()=>({places:[{name:'A',lat:48.2,lon:16.3},{name:'B',lat:48.3,lon:16.4}]});assert.equal(await ctx.lookupPlace('to',{automatic:true}),false);assert.equal(selected,null);assert.equal(offered.length,2);afterChoice();assert.equal(resumed,1);state.revision++;afterChoice();assert.equal(resumed,1);
 ctx.document.hidden=true;await assert.rejects(ctx.lookupPlace('to',{automatic:true}),{name:'AbortError'});assert.equal(selected,null);
});
test('route QR fixture is a valid encrypted v2 payload for cross-runtime Android tests',async()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/transfer-routes-webcrypto.json',import.meta.url)));assert.deepEqual(await decryptTransfer(fixture.packet,fixture.key),fixture.value);assert.equal(fixture.value.journeys[0].from.kind,'current');assert.ok(!JSON.stringify(fixture.value).includes('48.123456'));
});
test('same postal address entrances collapse while different postal areas and distant namesakes stay distinct',()=>{
 const a={name:'Opernring 2',detail:'1010 Wien',kind:'address',lat:48.2,lon:16.36},near={...a,lat:48.2002},far={...a,lat:48.21},otherArea={...near,detail:'Other area'};
 assert.deepEqual(uniqueJourneyPlaces([a,near,far,otherArea]),[a,far,otherArea]);
});
