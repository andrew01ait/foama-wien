import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
import {setImmediate as tick} from 'node:timers/promises';
import {parseLocationShare,googleMapsShortUrl} from '../pwa/src/share-location.mjs';
import {takeLocationShare,mountJourneyShare} from '../pwa/src/journey-share.mjs';
import {createSiteWorker} from '../site/runtime.mjs';
import api from '../cloudflare/src/index.js';
import {journeyApi} from '../cloudflare/src/journey-service.mjs';
import {coordinate,inJourneyArea} from '../pwa/src/journey-geometry.mjs';
import {localD1} from '../site/local-d1.mjs';

const read = path => readFileSync(new URL('../pwa/'+path, import.meta.url), 'utf8');
const stop = {name:'Stephansplatz U',provider:'wl',lat:48.20813,lon:16.37172};
const coords = {lat:48.21,lon:16.37};
const origin = 'https://foama.example';
const short = 'https://maps.app.goo.gl/Example123';
const full = 'https://www.google.at/maps/place/Museum/@48.3,16.5,13z/data=!8m2!3d48.21!4d16.37!16sExample';

test('every app entry advertises the same install identity and explicit Android text and URI share types', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.id,'./');
  assert.equal(manifest.start_url,'./');
  assert.equal(manifest.scope,'./');
  assert.deepEqual(manifest.share_target,{
    action:'./share-location',method:'POST',enctype:'multipart/form-data',
    params:{title:'title',text:'text',url:'url',files:[{name:'location',accept:['text/plain','text/uri-list']}]}
  });
  const pages = readdirSync(new URL('../pwa/',import.meta.url)).filter(path=>path.endsWith('.html'));
  for (const path of pages) {
    assert.deepEqual(read(path).match(/<link[^>]*rel="manifest"[^>]*>/g),['<link rel="manifest" href="./manifest.webmanifest">'],path);
  }
});

function installedReceiver() {
  const handlers={};
  const scope=vm.createContext({URL,URLSearchParams,TextDecoder,Response,location:{origin},self:{addEventListener:(type,fn)=>handlers[type]=fn},
    importScripts(...files){for(const file of files){if(file.includes('share-intake'))vm.runInContext(read(file.split('?')[0]),scope);}},
    fetch(){assert.fail('share POST must work offline');}});
  vm.runInContext(read('sw.js'),scope);
  return request=>{
    let response;
    handlers.fetch({request,respondWith:value=>{response=value;}});
    return response;
  };
}
async function checkReceivers(path, body, expected) {
  const server=createSiteWorker(api,{});
  const request=new Request(origin+path,{method:'POST',body});
  for(const receive of [installedReceiver(), candidate=>server.fetch(candidate,{},{})]){
    const redirect=await receive(request.clone());
    assert.equal(redirect.status,303);
    assert.equal(redirect.headers.get('cache-control'),'no-store');
    const location=new URL(redirect.headers.get('location'));
    assert.equal(location.origin,origin);
    assert.equal(location.pathname,'/journey.html');
    assert.equal(location.search,'');
    let cleaned;
    assert.deepEqual(takeLocationShare(location,{replaceState(...args){cleaned=args;}}),{title:'',text:'',url:'',...expected});
    assert.deepEqual(cleaned,[null,'','/journey.html']);
  }
}
test('cold server and installed offline worker receive both new and previously installed Android share targets', async () => {
  const share={title:'Museum & Park',text:'Wien\n1010 Österreich',url:short+'?g_st=abc'};
  await checkReceivers('/share-target',new URLSearchParams(share),share);
  const form=new FormData();
  for(const [key,value] of Object.entries(share))form.set(key,value);
  await checkReceivers('/share-location',form,share);
  const maps=new FormData();maps.set('text',short);
  await checkReceivers('/share-location',maps,{text:short});
  assert.equal(takeLocationShare(new URL(origin+'/journey.html#routen'),{}),null);
});

test('one small plain text or URI list attachment can supply a destination without overwriting explicit share text', async () => {
  const address='Opernring 2\n1010 Wien';
  const form=new FormData();
  form.set('location',new Blob([address],{type:'text/plain'}),'adresse.txt');
  await checkReceivers('/share-location',form,{text:address});
  form.set('location',new Blob(['# Markierung\r\n'+short+'\r\n'],{type:'text/uri-list'}),'ort.uri');
  await checkReceivers('/share-location',form,{url:short});
  form.set('text',address);
  await checkReceivers('/share-location',form,{text:address});
});
test('malformed forms, unsupported files and ambiguous or oversized attachments leave the destination editable', async () => {
  const empty={};
  for(const [mime,content] of [
    ['text/uri-list',short+'\n'+full],['text/plain','x'.repeat(35000)],['text/plain','a\u0000b'],['text/html','<b>Wien</b>']
  ]){
    const form=new FormData();form.set('location',new Blob([content],{type:mime}),'location');
    await checkReceivers('/share-location',form,empty);
  }
  const multiple=new FormData();
  for(const text of ['Wien','Graz'])multiple.append('location',new Blob([text],{type:'text/plain'}),'ort.txt');
  await checkReceivers('/share-location',multiple,empty);
  const broken=new Request(origin+'/share-location',{method:'POST',headers:{'content-type':'multipart/form-data; boundary=missing'},body:'incomplete'});
  assert.equal(new URL((await installedReceiver()(broken)).headers.get('location')).hash,'#share?');
});
test('oversized or empty form inputs open the editable empty state',async()=>{
  const worker=createSiteWorker(api,{});
  for(const body of [new URLSearchParams({text:'x'.repeat(34000)}),new URLSearchParams(),new URLSearchParams({unknown:'keep-private'})]){
    const res=await worker.fetch(new Request(origin+'/share-target',{method:'POST',body}),{},{});
    assert.equal(res.status,303);assert.equal(new URL(res.headers.get('location')).hash,'#share?');
  }
});

test('pasting a whole destination preserves the chosen origin, while partial pastes remain normal text edits', () => {
  const source=read('src/journey-page.mjs');
  const events={}, opened=[], messages=[];
  const input={value:'',maxLength:4096,addEventListener(type,fn){events[type]=fn;}};
  const start={kind:'point',name:'Karlsplatz U',lat:48.201,lon:16.369};
  const state={from:start,share:{open(payload){opened.push(payload.text);}}};
  const context=vm.createContext({state,$:()=>input,initialShare:null,location:{protocol:'http:'},window:{addEventListener(){}},
    status:text=>messages.push(text),setOverviewMode(){},invalidateResults(){},selectPoint(kind,point){state[kind]=point;}});
  vm.runInContext(source.slice(source.indexOf('function openDestination(')),context);
  function paste(text) {
    let handled=false;
    events.paste({clipboardData:{getData:()=>text},preventDefault(){handled=true;}});
    return handled;
  }
  const address='Opernring 2\n1010 Wien';
  const longLink=full+'?source='+'a'.repeat(250);
  assert.equal(paste(address),true);
  input.value='Altes Ziel';input.selectionStart=0;input.selectionEnd=input.value.length;
  assert.equal(paste(longLink),true);
  input.selectionStart=2;
  assert.equal(paste('Straße'),false);
  input.value='';
  assert.equal(paste('x'.repeat(4097)),true);assert.match(messages.pop(),/zu lang/);
  assert.deepEqual(opened,[address,longLink]);assert.equal(state.from,start);
  context.openDestination({text:short},{resetStart:true});
  assert.equal(state.from.kind,'current');
  assert.match(read('journey.html'),/<input id="journeyTo"[^>]+maxlength="4096"/);
});

test('a Maps link inserted by a keyboard without a paste event uses the destination receiver on search',async()=>{
  const source=read('src/journey-page.mjs'),opened=[];
  const longLink=full+'?source='+'a'.repeat(250);
  const context=vm.createContext({state:{revision:1},$:()=>({value:longLink}),openDestination:payload=>opened.push(payload.text)});
  vm.runInContext(source.slice(source.indexOf('async function lookupPlace('),source.indexOf('async function address(')),context);
  assert.equal(await context.lookupPlace('to'),false);
  assert.deepEqual(opened,[longLink]);
});

test('coordinates, German decimal commas, geo URIs and pins distinguish actual destinations from the camera',()=>{
  for(const payload of [{text:'48.21, 16.37'}, {text:'48,21; 16,37'}, {text:'48.21 16.37'}, {url:'geo:48.21,16.37'},
    {text:'Meine Markierung\ngeo:0,0?q=48.21,16.37(Museum)'},{text:'Museum\n'+full},{url:short,text:full},
    {url:'https://www.openstreetmap.org/?mlat=48.21&mlon=16.37#map=12/50/17'},
    {url:'https://maps.apple.com/?ll=48.21,16.37&q=Museum'},
    {url:'https://www.google.com/maps/dir/?api=1&origin=47,12&destination=48.21%2C16.37'}]){
    const item=parseLocationShare(payload);assert.equal(item.kind,'point');assert.equal(item.point.lat,coords.lat);assert.equal(item.point.lon,coords.lon);
  }
  assert.equal(parseLocationShare({url:full}).point.name,'Museum');
  assert.deepEqual(parseLocationShare({url:'geo:0,0?q=Opernring%201%2C%201010%20Wien'}),{kind:'query',query:'Opernring 1, 1010 Wien'});
  assert.deepEqual(parseLocationShare({url:'https://www.google.com/maps/dir/Graz/Karlsplatz+Wien/@47,15,7z'}),{kind:'query',query:'Karlsplatz Wien'});
  assert.deepEqual(parseLocationShare({url:'https://maps.google.at/maps/place/Museum/@48.3,16.5,17z'}),{kind:'query',query:'Museum'});
  assert.equal(parseLocationShare({url:'https://www.google.com/maps/dir/Graz//@47,15,7z'}).kind,'empty');
  assert.equal(parseLocationShare({text:'95.999, 16.5'}).kind,'empty');
  assert.equal(parseLocationShare({text:'https://example.com/?q=48.21,16.37'}).kind,'empty');
  assert.deepEqual(parseLocationShare({title:'Google Maps',text:'Museum Wien\n'+short+'?g_st=123'}),{kind:'short',url:short,fallback:'Museum Wien'});
  assert.deepEqual(parseLocationShare({text:'Opernring 2\n1010 Wien'}),{kind:'query',query:'Opernring 2, 1010 Wien'});
});

test('only fixed Google Maps short codes trigger outbound resolution, within the existing budget',async()=>{
  const db=localD1(),calls=[];
  const request=url=>new Request(origin+'/api/journeys/map-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
  let redirect=full;
  const fetch=async(url,options)=>{calls.push(url);assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{location:redirect}});};
  try{
    for(const invalid of ['https://other.example/maps/abc123','https://goo.gl/abc123','https://maps.app.goo.gl:8443/abc123','https://name@maps.app.goo.gl/abc123','https://maps.app.goo.gl/one/two','http://maps.app.goo.gl/abc123']){
      assert.equal(googleMapsShortUrl(invalid),null);
      const result=await journeyApi(request(invalid),{DB:db},{fetch});assert.equal(result.status,400);
    }
    assert.equal(calls.length,0);
    const result=await journeyApi(request(short+'?tracking=yes'),{DB:db},{fetch});
    assert.deepEqual((await result.json()).destination,{kind:'point',point:{...coords,name:'Museum'}});
    for(redirect of ['https://other.example/unrelated',short]){
      assert.equal((await journeyApi(request(short),{DB:db},{fetch})).status,422);
    }
    assert.deepEqual(calls,[short,short,short]);
  }finally{db.close();}
});

function harness({stops=[],places=async()=>({places:[]}),pinAddress=async()=>({places:[]}),mapLink=async()=>{throw Error();}}={}){
  const nodes=new Map(),maps=[],queries=[],plans=[],pinQueries=[];
  const node=()=>({textContent:'',hidden:false,handlers:{},children:[],addEventListener(type,fn){this.handlers[type]=fn;},
    append(child){this.children.push(child);},replaceChildren(){this.children=[];},focus(){this.focused=true;},select(){},scrollIntoView(){this.scrolled=true;}});
  const el=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
  const document={hidden:false,getElementById:el,createElement:node};
  let selected=null,from={kind:'current',name:'Dein Standort'};
  const controller=mountJourneyShare({document,client:{abort(){},places:query=>{queries.push(query);return places(query);},mapLink,
    pinAddress:pin=>{pinQueries.push([pin.lat,pin.lon]);return pinAddress(pin);}},
    loadStops:async()=>stops,choose:point=>{selected=point;controller.pointChanged('to',point);},writeQuery:value=>{el('journeyTo').value=value;selected=null;},
    refreshFields:()=>{el('journeyToContext').textContent=selected.detail;},
    getStart:()=>from,plan:async()=>plans.push({from,to:selected}),createMap:async({destination,center})=>{assert.deepEqual(center,destination);const map={destination,destroy(){this.destroyed=true;}};maps.push(map);return map;}});
  return {controller,el,maps,queries,plans,pinQueries,document,get selected(){return selected;},setStart(point){from=point;controller.pointChanged('from',point);}};
}
test('a shared station opens its own marked map locally and uses either selected start without launching a plan on receipt',async()=>{
  const h=harness({stops:[stop]});h.controller.open({text:'Stephansplatz'});await tick();
  assert.deepEqual(h.selected,stop);assert.equal(h.maps.length,1);assert.equal(h.queries.length,0);assert.equal(h.plans.length,0);
  await h.el('sharedRoute').handlers.click();assert.equal(h.plans[0].from.kind,'current');
  h.el('sharedStart').handlers.click();assert.equal(h.el('journeyFrom').focused,true);
  const from={kind:'point',name:'Karlsplatz U',lat:48.201,lon:16.369};h.setStart(from);await h.el('sharedRoute').handlers.click();
  assert.equal(h.plans[1].from,from);assert.equal(h.plans[1].to,stop);assert.equal(h.el('sharedRoute').textContent,'Route ab Karlsplatz U');
  h.controller.pointChanged('to',null);assert.equal(h.maps[0].destroyed,true);assert.equal(h.el('sharedRoute').hidden,true);
});
test('ambiguous address matches wait for selection, preserve full locality and do not trigger GPS',async()=>{
  const rows=[{name:'Hauptplatz 1',detail:'Wien',...coords},{name:'Hauptplatz 1',detail:'Graz',lat:47.07,lon:15.44}];
  const h=harness({places:async()=>({places:rows})});h.controller.open({text:'Hauptplatz 1'});await tick();
  assert.deepEqual(h.queries,['Hauptplatz 1']);assert.equal(h.selected,null);assert.equal(h.maps.length,0);assert.equal(h.plans.length,0);
  assert.equal(h.el('sharedChoices').children.length,2);h.el('sharedChoices').children[1].handlers.click();
  assert.deepEqual(h.selected,rows[1]);assert.equal(h.el('sharedAddress').textContent,'Graz');
});
test('new shares and manual edits invalidate late results; a suspended lookup resumes while visible',async()=>{
  const waits=[];const h=harness({places:()=>new Promise(resolve=>waits.push(resolve))});
  h.controller.open({text:'Opernring 1'});await tick();
  h.controller.open({url:'geo:48.21,16.37'});await tick();waits.shift()({places:[stop]});await tick();assert.equal(h.selected.lon,16.37);
  h.controller.open({text:'Opernring 2'});await tick();h.controller.pointChanged('to',null);waits.shift()({places:[stop]});await tick();assert.equal(h.maps.length,1);
  h.controller.open({text:'Opernring 3'});await tick();h.document.hidden=true;h.controller.visibility();waits.shift()({places:[stop]});await tick();assert.equal(h.selected,null);
  h.document.hidden=false;h.controller.visibility();await tick();waits.shift()({places:[stop]});await tick();assert.equal(h.selected,stop);
});
test('link-only errors can be retried or edited; accompanying text still resolves an offline station',async()=>{
  let attempt=0;const h=harness({stops:[stop],mapLink:async()=>{if(!attempt++)throw Error();return {destination:{kind:'point',point:{...coords,name:'Museum'}}};}});
  h.controller.open({url:short});await tick();assert.equal(h.el('sharedRetry').hidden,false);assert.equal(h.maps.length,0);
  h.el('sharedRetry').handlers.click();await tick();assert.equal(h.selected.name,'Museum');
  h.el('sharedEdit').handlers.click();assert.equal(h.el('journeyTo').focused,true);
  const offline=harness({stops:[stop]});offline.controller.open({text:'Stephansplatz\n'+short});await tick();assert.equal(offline.selected,stop);
  const foreign=harness();foreign.controller.open({url:'geo:51,-1'});await tick();assert.equal(foreign.maps.length,1);assert.equal(foreign.el('sharedRoute').hidden,true);assert.match(foreign.el('sharedStatus').textContent,/außerhalb/);
});

test('a matching house number and locality win over fuzzy neighbours; two exact places still need a choice',async()=>{
  const row={kind:'address',name:'Opernring 2',detail:'1010 Wien',...coords};
  const neighbour={...row,name:'Opernring 21',lat:48.202};
  const other={...row,detail:'8010 Graz',lat:47.07};
  const h=harness({places:async()=>({places:[neighbour,row,other]})});
  h.controller.open({text:'Opernring 2, 1010 Wien'});await tick();assert.deepEqual(h.selected,row);assert.equal(h.maps.length,1);
  h.controller.open({text:'Opernring 2'});await tick();assert.equal(h.selected,null);assert.equal(h.el('sharedChoices').children.length,2);
});

test('full Google links, short redirects, geo and Apple pins retain the supplied postal address and never need a nearby lookup',async()=>{
  const detail='Opernring 2A/3, 1010 Wien',text='Opernring 2A/3\n1010 Wien';
  const payloads=[
    {url:full,title:'Museum',text},
    {url:short,title:'Museum',text},
    {url:'geo:48.21,16.37',text:'Museum\n'+text},
    {url:'https://maps.apple.com/?ll=48.21,16.37&name=Museum&address='+encodeURIComponent(detail)},
    {url:full.replace('Museum','Opernring+2A%2F3,+1010+Wien,+Austria'),title:'Museum'},
    {url:full.replace('Museum','Opernring'),text:'Museum\n'+text},
  ];
  for(const payload of payloads){
    const h=harness({mapLink:async()=>({destination:{kind:'point',point:{...coords,name:'Museum'}}})});
    h.controller.open(payload);await tick();
    assert.equal(h.selected.name,'Museum');assert.equal(h.selected.detail,detail);
    assert.equal(h.el('sharedAddress').textContent,detail);assert.deepEqual(h.pinQueries,[]);
    assert.deepEqual(h.maps.map(map=>[map.destination.lat,map.destination.lon]),[[coords.lat,coords.lon]]);
  }
  const plain=harness();plain.controller.open({url:full.replace('Museum','Opernring+2-4,+1010+Wien,+Austria')});await tick();
  assert.equal(plain.selected.name,'Opernring 2-4');assert.equal(plain.selected.detail,'1010 Wien');assert.deepEqual(plain.pinQueries,[]);
});

test('a coordinate-only pin opens immediately, receives a visibly approximate address and keeps its routing coordinates',async()=>{
  let finish;const h=harness({pinAddress:()=>new Promise(resolve=>{finish=resolve;})});
  h.controller.open({url:'geo:48.21,16.37'});await tick();
  assert.deepEqual(h.pinQueries,[[coords.lat,coords.lon]]);assert.equal(h.maps.length,1);assert.equal(h.el('sharedRoute').hidden,false);
  const nearby={kind:'address',name:'Opernring 2',detail:'1010 Wien',lat:48.2102,lon:16.3702};
  finish({places:[nearby]});await tick();
  assert.equal(h.el('sharedAddress').textContent,'Adresse in der Nähe: Opernring 2, 1010 Wien');
  assert.equal(h.el('journeyToContext').textContent,h.el('sharedAddress').textContent);
  assert.equal(h.maps.length,1);assert.equal(h.plans.length,0);
  await h.el('sharedRoute').handlers.click();assert.equal(h.plans[0].to.lat,coords.lat);assert.equal(h.plans[0].to.lon,coords.lon);
});

test('only a compatible address can fill missing information, and a lookup failure or stale result cannot displace a pin',async()=>{
  const other={name:'Opernring 21',detail:'1010 Wien'}, right={name:'Opernring 2',detail:'1010 Wien'};
  const h=harness({pinAddress:async()=>({places:[other,right]})});
  h.controller.open({url:full,text:'Opernring 2'});await tick();assert.equal(h.selected.detail,'Opernring 2, 1010 Wien');
  const missing=harness({pinAddress:async()=>({places:[other]})});
  missing.controller.open({url:full,text:'Opernring 2'});await tick();assert.equal(missing.selected.detail,'Opernring 2');
  const offline=harness({pinAddress:async()=>{throw Error('offline');}});
  offline.controller.open({url:full});await tick();assert.equal(offline.selected.name,'Museum');assert.equal(offline.el('sharedRoute').hidden,false);
  const replies=[];const delayed=harness({pinAddress:()=>new Promise(resolve=>replies.push(resolve))});
  delayed.controller.open({url:full});await tick();delayed.document.hidden=true;delayed.controller.visibility();
  replies.shift()({places:[right]});await tick();assert.equal(delayed.selected.detail,undefined);
  delayed.document.hidden=false;delayed.controller.visibility();await tick();
  delayed.controller.open({url:'geo:52,18'});await tick();replies.shift()({places:[right]});await tick();
  assert.equal(delayed.selected.lat,52);assert.equal(delayed.selected.detail,undefined);assert.equal(delayed.pinQueries.length,2);
});

test('plain shared websites restore missing query locality on a matching house and never apply it to a different city',async()=>{
  const row={kind:'address',name:'Hauptplatz 1',...coords};
  const h=harness({places:async()=>({places:[{...row,detail:'Wien'},{...row,detail:'Graz'}]})});
  h.controller.open({text:'Hauptplatz 1\n8010 Graz'});await tick();
  assert.deepEqual(h.selected,{...row,detail:'8010 Graz'});assert.deepEqual(h.pinQueries,[]);
});

test('journey search submits the real destination with a fresh GPS start or typed origin and preserves it after denial',async()=>{
  const source=read('src/journey-page.mjs');
  const search=source.slice(source.indexOf('async function search('),source.indexOf('function setTime('));
  const current={kind:'current',name:'Dein Standort'},manual={name:'Opernring 2',lat:48.201,lon:16.369};
  const state={from:current,to:stop,revision:0},requests=[],messages=[];let gps=0,deny=true,lookups=0;
  const ctx=vm.createContext({state,coordinate,inJourneyArea,document:{hidden:false},cancelSearch(){state.revision++;},busy(){},status:message=>messages.push(message),
    lookupPlace:async kind=>{lookups++;state[kind]=manual;return true;},getLocation:async()=>{gps++;if(deny)throw Error('Standort nicht verfügbar.');return {...current,...coords,fixedAt:Date.now()};},
    selectPoint:(kind,point)=>{state[kind]=point;},$:()=>({value:'now'}),settings:{modes:{metro:true},speed:4.5,buffer:1},invalidateResults(){},
    client:{plan:async body=>{requests.push(body);return {journeys:[]};}},ensureJourneyCities:async()=>{},journeyCities:()=>[],showResults(){}});
  vm.runInContext(search,ctx);
  await ctx.search();assert.equal(gps,1);assert.equal(requests.length,0);assert.equal(state.to,stop);assert.match(messages.at(-1),/Standort/);
  deny=false;await ctx.search();assert.deepEqual({...requests[0].from},coords);assert.deepEqual({...requests[0].to},{lat:stop.lat,lon:stop.lon});
  state.from=null;await ctx.search();assert.equal(lookups,1);assert.deepEqual({...requests[1].from},{lat:manual.lat,lon:manual.lon});assert.equal(gps,2);
  state.from=current;state.to={name:'London',lat:51.51,lon:-0.13};await ctx.search();assert.equal(gps,2);assert.equal(requests.length,2);
});

test('the visible destination pin is centered on the exact endpoint and paints without a marker image',async()=>{
  const {createJourneyMap}=await import('../pwa/src/journey-map.mjs');
  const previousWindow=globalThis.window,previousDocument=globalThis.document;
  let markerOptions,pinned,alt;
  const element={setAttribute:(name,value)=>{if(name==='aria-label')alt=value;}};
  const layer={addTo(){return this;},bindTooltip(){return this;},getElement:()=>element};
  const map={setView(){return this;}},L={map:()=>map,tileLayer:()=>layer,layerGroup:()=>layer,divIcon:options=>options,
    marker:(position,options)=>{pinned=position;markerOptions=options;return layer;}};
  try{
    globalThis.window={L};globalThis.document={createElement:()=>({})};
    const point={...coords,name:'Museum'};
    await createJourneyMap({holder:{isConnected:true,getClientRects:()=>[{}]},stops:[],destination:point,center:point});
    assert.deepEqual(pinned,[coords.lat,coords.lon]);
    assert.equal(markerOptions.icon.className,'shared-destination-pin');assert.equal(markerOptions.icon.html,'');
    const [width,height]=markerOptions.icon.iconSize;assert.deepEqual(markerOptions.icon.iconAnchor,[width/2,height]);
    assert.equal(alt,'Ziel: Museum');assert.match(read('journey.css'),/\.shared-destination-pin::before/);
  }finally{globalThis.window=previousWindow;globalThis.document=previousDocument;}
});
