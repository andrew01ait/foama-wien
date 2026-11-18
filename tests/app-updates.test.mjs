import test from 'node:test';
import assert from 'node:assert/strict';
import {createAppUpdates,isNewerVersion} from '../pwa/src/app-updates.mjs';

const events=target=>Object.assign(target,{listeners:new Map(),addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);},removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);},emit(type){for(const fn of this.listeners.get(type)||[])fn();}});
function harness({latest='0.1.30',fetcher}={}){
 const elements=new Map(),timers=new Map(),requests=[];let time=0,reloads=0,next=0;
 const get=id=>{if(!elements.has(id))elements.set(id,events({hidden:true,disabled:false,textContent:''}));return elements.get(id);};
 const document=events({hidden:false,getElementById:get}),window=events({location:{reload(){reloads++;}}}),serviceWorker=events({controller:{}}),navigator={onLine:true,serviceWorker};
 const updates=createAppUpdates({version:'0.1.29',document,window,navigator,now:()=>time,schedule(fn,ms){const id=++next;timers.set(id,{fn,ms});return id;},unschedule:id=>timers.delete(id),fetch:async(url,options)=>{requests.push({url,options});return fetcher?fetcher(url,options):{ok:true,json:async()=>({version:latest,wearVersion:'99.0.0'})};}});
 return {get,document,window,navigator,serviceWorker,updates,timers,requests,get reloads(){return reloads;},advance(ms){time+=ms;},async flush(){for(let i=0;i<6;i++)await Promise.resolve();},click(){return [...get('appUpdateNow').listeners.get('click')][0]();}};
}

test('version comparison handles numeric releases and ignores unchanged, old, malformed and watch-only updates',async()=>{
 assert.equal(isNewerVersion('0.1.100','0.1.29'),true);assert.equal(isNewerVersion('0.2.0','0.1.29'),true);
 for(const version of ['0.1.29','0.1.9','1.2','nonsense','0.1.29<script>'])assert.equal(isNewerVersion(version,'0.1.29'),false);
 const h=harness({latest:'0.1.29'});h.updates.start();await h.flush();assert.equal(h.get('appUpdate').hidden,true);h.updates.destroy();
});

test('a newer PWA release shows its update action and never reloads without the user clicking',async()=>{
 const h=harness();h.updates.start();await h.flush();
 assert.equal(h.requests[0].options.cache,'no-store');assert.equal(h.requests[0].url,'./update.json');
 assert.equal(h.get('appUpdate').hidden,false);assert.match(h.get('appUpdateText').textContent,/0\.1\.30/);assert.equal(h.reloads,0);
 await h.click();assert.equal(h.reloads,1);h.updates.destroy();
});

test('checks pause while hidden, abort late responses, and resume within the active-only interval',async()=>{
 let release;const h=harness({fetcher:()=>new Promise(resolve=>release=resolve)});h.updates.start();assert.equal(h.requests.length,1);
 h.document.hidden=true;h.document.emit('visibilitychange');assert.equal(h.requests[0].options.signal.aborted,true);
 release({ok:true,json:async()=>({version:'0.1.30'})});await h.flush();assert.equal(h.get('appUpdate').hidden,true);assert.equal(h.timers.size,0);
 h.advance(5*60_000);h.document.hidden=false;h.document.emit('visibilitychange');assert.equal(h.requests.length,2);h.updates.destroy();
});

test('a waiting worker activates only after update now and reload follows controller handover',async()=>{
 const h=harness({latest:'0.1.29'});let messages=0,updateCalls=0;
 const worker={postMessage(message){messages++;assert.deepEqual(message,{type:'FOAMA_ACTIVATE_UPDATE'});h.serviceWorker.controller={new:true};h.serviceWorker.emit('controllerchange');}};
 const registration=events({waiting:worker,installing:null,async update(){updateCalls++;}});
 h.updates.setRegistration(registration);h.updates.start();await h.flush();assert.equal(messages,0);assert.equal(h.reloads,0);
 assert.equal(h.get('appUpdateText').textContent,'Offline und Push aktualisieren');assert.equal(h.get('appUpdateVersion').textContent,'App 0.1.29');assert.doesNotMatch(h.get('appUpdateText').textContent,/Neue Version/);
 await h.click();assert.equal(updateCalls,1);assert.equal(messages,1);assert.equal(h.reloads,1);h.updates.destroy();
});
test('a waiting offline worker never overwrites a known newer app version with an unversioned update notice',async()=>{
 const h=harness();h.updates.start();await h.flush();
 h.updates.setRegistration(events({waiting:{},installing:null}));
 assert.match(h.get('appUpdateText').textContent,/Neue Version 0\.1\.30/);assert.equal(h.get('appUpdateVersion').textContent,'Installiert: 0.1.29');h.updates.destroy();
});

test('a worker already installing at registration is detected, and failed/offline updates remain retryable',async()=>{
 const h=harness({latest:'0.1.29'}),worker=events({state:'installing'});
 const registration=events({waiting:null,installing:worker,async update(){throw Error('network');}});
 h.updates.setRegistration(registration);h.updates.start();await h.flush();worker.state='installed';worker.emit('statechange');assert.equal(h.get('appUpdate').hidden,false);
 await h.click();assert.equal(h.reloads,0);assert.equal(h.get('appUpdateNow').disabled,false);assert.match(h.get('appUpdateStatus').textContent,/erneut versuchen/);
 h.navigator.onLine=false;await h.click();assert.equal(h.reloads,0);h.updates.destroy();
});
