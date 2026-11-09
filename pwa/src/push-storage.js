// Shared between page and classic service worker; open IndexedDB only on use.
(function(global){
 function createStore(indexedDB){
  let connection;
  async function db(){
   if(!indexedDB)throw Error('Benachrichtigungsspeicher ist nicht verfügbar.');
   if(!connection)connection=new Promise((resolve,reject)=>{
    const request=indexedDB.open('foama-push-v2',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('state');
    request.onerror=()=>{connection=null;reject(request.error);};
    request.onblocked=()=>{connection=null;reject(Error('Benachrichtigungsspeicher ist blockiert.'));};
    request.onsuccess=()=>{const value=request.result;value.onversionchange=()=>{value.close();connection=null;};resolve(value);};
   });return connection;
  }
  async function run(mode,action){const connection=await db();return new Promise((resolve,reject)=>{
   const tx=connection.transaction('state',mode);let result;
   tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Benachrichtigungsspeicher wurde unterbrochen.'));
   try{action(tx.objectStore('state'),value=>result=value);}catch(error){tx.abort();reject(error);}
  });}
  return {
   getDiagnostics:()=>run('readonly',(store,done)=>{const r=store.get('diagnostics');r.onsuccess=()=>done(r.result||[]);}),
   diagnostic:(stage,now)=>run('readwrite',store=>{const r=store.get('diagnostics');r.onsuccess=()=>{const entries=(r.result||[]).filter(e=>now-e.at<86400000).slice(-7);entries.push({stage,at:now});store.put(entries,'diagnostics');};}),
   getDevice:()=>run('readonly',(store,done)=>{const r=store.get('device');r.onsuccess=()=>done(r.result||null);}),
   setDevice:value=>run('readwrite',store=>{store.put(value,'device');}),
   claim:(id,now,until,test=false)=>run('readwrite',(store,done)=>{const r=store.get('display');r.onsuccess=()=>{
    const state=r.result||{lastShown:0,busyUntil:0,events:[]};state.events=state.events.filter(e=>e.until>now).slice(-63);
    if(state.events.some(e=>e.id===id)||state.busyUntil>now||!test&&state.lastShown&&now-state.lastShown<60000){done(false);return;}
    state.events.push({id,until,at:now});state.busyUntil=now+15000;store.put(state,'display');done(true);
   };}),
   finish:(id,shown,now)=>run('readwrite',store=>{const r=store.get('display');r.onsuccess=()=>{
    const state=r.result;if(!state)return;const event=state.events.find(e=>e.id===id);if(!event)return;
    event.shown=shown;state.busyUntil=0;if(shown)state.lastShown=now;store.put(state,'display');
   };})
  };
 }
 global.createFoamaPushStore=createStore;
 global.foamaPushStore=createStore(global.indexedDB);
})(globalThis);
