import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {jsonExportName} from '../pwa/src/export-file.mjs';
import * as diagnosticCore from '../pwa/src/diagnostic-core.mjs';

const pwa=new URL('../pwa/',import.meta.url);
const source=name=>readFile(new URL(name,pwa),'utf8');

test('diagnostics controls export valid JSON after hosting success and network failure',async()=>{
  const elements=new Map(),downloads=[],requests=[],timers=new Set();
  const element=id=>{
    if(!elements.has(id))elements.set(id,{value:id==='stopId'?'4111':'',checked:false,
      textContent:'',innerHTML:'',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}});
    return elements.get(id);
  };
  const storage=new Map([
    ['foama.settings.v1','PRIVATE_SETTINGS_SENTINEL'],
    ['foama.favorites.v1','PRIVATE_FAVORITES_SENTINEL'],
    ['position','PRIVATE_LOCATION_SENTINEL']
  ]);
  const config=await source('config.json');
  const context=vm.createContext({diagnosticCore,jsonExportName,TypeError,Date,JSON,URL,Blob,
    AbortController,performance,console,confirm:()=>true,
    setTimeout(fn,ms){const timer=setTimeout(fn,ms);timers.add(timer);return timer;},
    clearTimeout,
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
    location:{protocol:'https:'},
    window:{isSecureContext:true,addEventListener(){}},
    navigator:{onLine:true,serviceWorker:{controller:{},addEventListener(){},register:async()=>({})}},
    document:{getElementById:element,body:{append(){}},createElement(){return {
      click(){downloads.push({url:this.href,filename:this.download});},remove(){}
    };}},
    fetch:async url=>{
      requests.push(String(url));
      if(String(url).startsWith('./config.json'))return new Response(config,{status:200,headers:{'Content-Type':'application/json'}});
      throw new TypeError('Simulated browser network failure');
    }
  });
  const diagnosticSource=(await source('src/diagnostics.mjs')).replace(/import \{jsonExportName\} from '[^']+';\n/,'').replace(
    /import\s*\{([\s\S]*?)\}\s*from '\.\/diagnostic-core\.mjs(?:\?v=[0-9.]+)?';/,
    'const {$1}=diagnosticCore;');
  try{
    new vm.Script(diagnosticSource).runInContext(context);
    assert.equal(requests.length,0,'opening diagnostics must not query the transport API');
    const waitForCount=async count=>{
      for(let i=0;i<30&&element('eventsCount').textContent!==String(count);i++)await new Promise(setImmediate);
      assert.equal(element('eventsCount').textContent,String(count));
    };
    element('testHosting').handlers.click();await waitForCount(1);
    element('testMonitor').handlers.click();await waitForCount(2);
    element('testMonitor').handlers.click();
    assert.equal(requests.length,2,'rate limit must also cover failed network calls');
    element('downloadLog').handlers.click();
    assert.equal(downloads.length,1);
    assert.match(downloads[0].filename,/^\d{8}_foama-wien-api-diagnose\.json$/);
    const text=await (await fetch(downloads[0].url)).text();
    const report=JSON.parse(text);
    assert.equal(report.format,'foama-wien-api-diagnose-v1');
    assert.equal(report.version,'0.11.1');
    assert.equal(report.events[0].category,'hosting-ok');
    assert.equal(report.events[0].httpStatus,200);
    assert.equal(report.events[1].category,'browser-network');
    assert.equal(report.events[1].httpStatus,null);
    assert.equal(report.optionalPublicTransportResponse,undefined);
    assert.equal(report.environment.secureContext,true);
    assert.ok(!text.includes('PRIVATE_'),'export must exclude unrelated local data');
    URL.revokeObjectURL(downloads[0].url);
  }finally{for(const timer of timers)clearTimeout(timer);}
});

test('service worker installs the complete shell and serves app and diagnostics offline',async()=>{
  const origin='https://foama-wien.endruuu.chatgpt.site';
  const handlers={},stores=new Map([['foama-old-shell',new Map()]]);
  let claimed=false,skipped=false,networkCalls=0;
  const absolute=path=>new URL(typeof path==='string'?path:path.url,origin+'/').href;
  const caches={
    async open(name){
      if(!stores.has(name))stores.set(name,new Map());
      const store=stores.get(name);
      return {async addAll(paths){for(const path of paths){
        const url=new URL(absolute(path));
        const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
        store.set(url.href,new Response(await readFile(new URL(name,pwa))));
      }},async put(req,res){store.set(absolute(req),res);}};
    },
    async match(req){for(const store of stores.values()){
      const response=store.get(absolute(req));if(response)return response.clone();
    }},
    async keys(){return [...stores.keys()];},
    async delete(key){return stores.delete(key);}
  };
  const pushSource=await source('src/push-worker.js');
  let context;
  context=vm.createContext({caches,URL,Promise,location:{origin},importScripts(){new vm.Script(pushSource).runInContext(context);},
    self:{addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:async()=>{skipped=true;},clients:{claim:async()=>{claimed=true;}}},
    fetch:async()=>{networkCalls++;throw Error('offline');}
  });
  new vm.Script(await source('sw.js')).runInContext(context);
  for(const type of ['install','activate']){
    let pending;handlers[type]({waitUntil:promise=>pending=promise});await pending;
  }
  assert.equal(claimed,true);
  assert.equal(skipped,false,'installing an update must not activate it without the user action');
  let activation;handlers.message({data:{type:'FOAMA_ACTIVATE_UPDATE'},waitUntil:promise=>activation=promise});await activation;
  assert.equal(skipped,true,'the update action explicitly activates the waiting worker');
  assert.equal(stores.has('foama-old-shell'),false);
  for(const path of ['/','/diagnose.html','/staedte.html','/willkommen.html','/fahrplan.html','/linienkarte.html','/src/line-map-page.mjs?v=0.11.1','/src/timetable-pdf.mjs?v=0.11.1','/src/install.mjs','/manifest.webmanifest']){
    let pending;handlers.fetch({request:new Request(origin+path),respondWith:promise=>pending=promise});
    const response=await pending;assert.equal(response.status,200);assert.ok((await response.text()).length>0);
  }
  let intercepted=false;
  handlers.fetch({request:new Request(origin+'/config.json?diagnostic=hosting'),respondWith(){intercepted=true;}});
  assert.equal(intercepted,false,'hosting diagnosis must measure the network');
  assert.equal(networkCalls,1,'manifest revalidates once, then uses the offline fallback');
  let navigation;handlers.fetch({request:{url:origin+'/linienkarte.html?linie=U1',method:'GET',mode:'navigate'},respondWith:promise=>navigation=promise});
  assert.match(await (await navigation).text(),/Geografische Linienkarte/,'offline navigation returns the map page, not the monitor');
  let mapDataIntercepted=false;handlers.fetch({request:new Request(origin+'/data/line-maps/wien/index.json'),respondWith(){mapDataIntercepted=true;}});
  assert.equal(mapDataIntercepted,false,'map packages use the versioned data cache, not unversioned shell caching');
});
