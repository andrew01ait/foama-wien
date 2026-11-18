const RATE_KEY='foama.wl.lastApiAttempt.v1',SOURCE_KEY='foama.wl.sourceGate.v1';
const key=ids=>[...new Set(ids.map(String))].sort().join(',');
const read=(storage,k)=>{try{return storage?.getItem(k);}catch{return null;}};
// Share only timestamps and the last public stop scope, never departures or locations.
export function recordMonitorSource(raw,ids,{storage=globalThis.localStorage,now=Date.now()}={}){
 const source=Date.parse(raw?.foamaMonitorAt),hint=Date.parse(raw?.foamaNextMonitorAt);
 if(!Number.isFinite(source)||source>now+30000||now-source>60000)return 0;
 const next=Number.isFinite(hint)&&hint>=source+30000&&hint<=source+35000?hint:source+31000;
 try{storage?.setItem(SOURCE_KEY,JSON.stringify({key:key(ids),next}));}catch{}
 return next;
}
export function monitorAllowedAt(ids,{lastAttempt=0,retryAt=0,storage=globalThis.localStorage,now=Date.now()}={}){
 const shared=Number(read(storage,RATE_KEY))||0;let source=0;
 try{const gate=JSON.parse(read(storage,SOURCE_KEY));if(gate?.key===key(ids)&&Number.isFinite(gate.next)&&gate.next<=now+65000)source=gate.next;}catch{}
 return Math.max(lastAttempt+30000,shared+30000,retryAt,source);
}
export async function claimMonitorAttempt(ids,{lastAttempt=0,retryAt=0,storage=globalThis.localStorage,now=()=>Date.now(),locks=globalThis.navigator?.locks}={}){
 const claim=()=>{const at=now(),allowed=monitorAllowedAt(ids,{lastAttempt,retryAt,storage,now:at});if(at<allowed)return {wait:allowed-at};try{storage?.setItem(RATE_KEY,String(at));}catch{}return {at,wait:0};};
 // Atomic across tabs where supported; never hold the lock over HTTP.
 return locks?.request?locks.request('foama.wl.monitor-attempt.v1',claim):claim();
}
