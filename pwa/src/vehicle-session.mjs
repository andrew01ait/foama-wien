import {createVehicleTracker,VEHICLE_EXPIRE_MS} from './vehicle-tracker.mjs?v=0.11.31';

const KEY='foama.vehicle.sessions.v1',LIMIT=4,MAX_BYTES=1_500_000;
const tabStorage=()=>{try{return globalThis.sessionStorage;}catch{return null;}};
// Short-lived public transit evidence in this tab only. No location, favorites
// or background work. All views use the same canonical, unfiltered direction.
export function createVehicleSession(direction,manifest,{storage=tabStorage(),now=()=>Date.now()}={}){
 const key=JSON.stringify([manifest.version,manifest.sourceSha256,direction.route,direction.mode,direction.id,direction.monitorDirection,direction.monitorDirectionId]);
 const raw=createVehicleTracker(direction,manifest,{fullLine:true,prefix:direction.route+'-'+direction.monitorDirection+'s'+Math.random().toString(36).slice(2,9)});
 let revision='',waitingUntil=0;
 function entries(){try{const text=storage?.getItem(KEY);if(!text||text.length>MAX_BYTES)return [];const saved=JSON.parse(text);return Array.isArray(saved)?saved.filter(e=>e&&typeof e.key==='string'&&Number.isFinite(e.savedAt)&&e.savedAt<=now()+30000&&now()-e.savedAt<=300000).slice(-LIMIT):[];}catch{return [];}}
 function refresh(){
  const saved=entries().find(e=>e.key===key);if(!saved||saved.revision===revision)return false;
  const restored=raw.restore(saved.tracker,now());
  if(!restored&&saved.tracker?.lastAt&&now()-saved.tracker.lastAt<=VEHICLE_EXPIRE_MS)return false;
  waitingUntil=Number.isFinite(saved.waitingUntil)&&saved.waitingUntil<=now()+300000?Math.max(0,saved.waitingUntil):0;revision=saved.revision;return restored;
 }
 function save(){
  if(!storage)return;revision=now()+':'+Math.random().toString(36).slice(2);
  const saved={key,revision,savedAt:now(),waitingUntil,tracker:raw.checkpoint()},list=[...entries().filter(e=>e.key!==key),saved].slice(-LIMIT);
  try{let text=JSON.stringify(list);while(text.length>MAX_BYTES&&list.length>1){list.shift();text=JSON.stringify(list);}if(text.length<=MAX_BYTES)storage.setItem(KEY,text);}catch{}
 }
 refresh();
 const tracker={view:raw.view,checkpoint:raw.checkpoint,ingest(snapshot){refresh();const result=raw.ingest(snapshot);if(result.accepted)save();return result;},fail(message){refresh();raw.fail(message);save();},clear(){raw.clear();save();}};
 return {tracker,refresh,get waitingUntil(){return waitingUntil;},waiting(ms){refresh();waitingUntil=now()+Math.max(0,Math.min(300000,ms));save();},checkpoint(){save();}};
}
