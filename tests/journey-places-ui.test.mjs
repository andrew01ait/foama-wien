import test from 'node:test';
import assert from 'node:assert/strict';
import {mountJourneyPlaces} from '../pwa/src/journey-places-ui.mjs';
import {JOURNEY_PLACES_KEY} from '../pwa/src/journey-places.mjs';

const work={id:'work',label:'Rathaus',address:'Friedrich-Schmidt-Platz 1',detail:'1010 Wien',lat:48.2108,lon:16.3571};
const goal={id:'goal',label:'Oper',address:'Opernring 2',detail:'1010 Wien',lat:48.2027,lon:16.3697};
function harness({places=[work,goal],lookup=async()=>({places:[]}),confirm=()=>false}={}){
 const nodes=new Map(),values=new Map([[JOURNEY_PLACES_KEY,JSON.stringify(places)]]),writes=[],choices=[],doc={hidden:false,activeElement:null};let aborts=0;
 function events(node={}){const handlers=new Map();return Object.assign(node,{addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push(fn);},removeEventListener(type,fn){handlers.set(type,(handlers.get(type)||[]).filter(f=>f!==fn));},emit(type,event={}){return Promise.all((handlers.get(type)||[]).map(fn=>fn({preventDefault(){},...event})));}});}
 events(doc);
 function $(id){if(!nodes.has(id)){const node=events({id,value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,open:false,scrollTop:0,querySelectorAll:()=>[],contains:()=>false,querySelector:()=>null,replaceChildren(){this.innerHTML='';},focus(){doc.activeElement=this;},showModal(){this.open=true;},close(){this.open=false;void this.emit('close');}});nodes.set(id,node);}return nodes.get(id);}
 doc.getElementById=$;
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{writes.push({key,value});values.set(key,value);}};
 mountJourneyPlaces({doc,storage,client:{abort(){aborts++;},places:lookup},escape:String,getPoint:()=>null,onChoose:(kind,point)=>choices.push({kind,point}),confirm});
 const action=dataset=>$('journeyPlacesList').emit('click',{target:{closest:selector=>selector==='button'?{dataset}:null}});
 return {$,doc,writes,choices,action,open:()=>$('journeyPlacesOpen').emit('click'),stored:()=>JSON.parse(values.get(JOURNEY_PLACES_KEY)),get aborts(){return aborts;}};
}

test('cancelling a place edit preserves storage and rejects a late address response',async()=>{
 let resolve;const h=harness({lookup:()=>new Promise(done=>resolve=done)});await h.open();await h.action({placeEdit:'work'});
 assert.equal(h.$('journeyPlacesList').hidden,true);assert.equal(h.$('journeyPlaceForm').hidden,false);
 h.$('journeyPlaceLabel').value='Unsaved name';h.$('journeyPlaceAddress').value='Other public address';await h.$('journeyPlaceAddress').emit('input');
 await h.$('journeyPlaceSearch').emit('click');const before=h.aborts;await h.$('journeyPlaceCancel').emit('click');assert.ok(h.aborts>before);
 resolve({places:[{name:'Late result',lat:48.2,lon:16.3}]});await new Promise(setImmediate);
 assert.equal(h.$('journeyPlaceForm').hidden,true);assert.equal(h.$('journeyPlacesList').hidden,false);assert.equal(h.$('journeyPlaceMatches').innerHTML,'');assert.equal(h.$('journeyPlaceStatus').textContent,'');assert.equal(h.writes.length,0);assert.deepEqual(h.stored(),[work,goal]);
});

test('an empty collection opens the editor and cancellation returns to the empty list without creating a place',async()=>{
 const h=harness({places:[]});await h.open();assert.equal(h.$('journeyPlaceForm').hidden,false);assert.equal(h.$('journeyPlacesList').hidden,true);assert.equal(h.$('journeyPlaceFormTitle').textContent,'Neuer Ort');assert.equal(h.$('journeyPlaceSave').disabled,true);
 await h.$('journeyPlaceCancel').emit('click');assert.equal(h.$('journeyPlaceForm').hidden,true);assert.equal(h.$('journeyPlacesList').hidden,false);assert.equal(h.$('journeyPlaceNew').hidden,false);assert.deepEqual(h.stored(),[]);assert.equal(h.writes.length,0);
});

test('saving a renamed place keeps its address, coordinates and identity, then returns to the list',async()=>{
 const h=harness();await h.open();await h.action({placeEdit:'work'});assert.equal(h.$('journeyPlaceAddress').value,'Friedrich-Schmidt-Platz 1, 1010 Wien');
 h.$('journeyPlaceLabel').value='Neuer Rathaus-Name';await h.$('journeyPlaceForm').emit('submit');
 assert.deepEqual(h.stored(),[{...work,label:'Neuer Rathaus-Name'},goal]);assert.equal(h.writes.length,1);assert.equal(h.$('journeyPlaceForm').hidden,true);assert.equal(h.$('journeyPlacesList').hidden,false);assert.equal(h.$('journeyPlacesCount').textContent,'2');assert.match(h.$('journeyPlaceStatus').textContent,/gespeichert/);
});

test('card actions choose physical endpoints; removal remains explicit and targets the selected place',async()=>{
 let approved=false;const h=harness({confirm:()=>approved});await h.open();await h.action({placeStart:'work'});await h.open();await h.action({placeGoal:'goal'});
 assert.deepEqual(h.choices,[{kind:'from',point:{kind:'point',name:work.address,lat:work.lat,lon:work.lon,placeId:'work'}},{kind:'to',point:{kind:'point',name:goal.address,lat:goal.lat,lon:goal.lon,placeId:'goal'}}]);assert.equal(h.writes.length,0);
 await h.open();await h.action({placeRemove:'work'});assert.deepEqual(h.stored(),[work,goal]);approved=true;await h.action({placeRemove:'work'});assert.deepEqual(h.stored(),[goal]);assert.equal(h.$('journeyPlacesCount').textContent,'1');assert.equal(h.$('journeyPlaceNew').hidden,false);
});
