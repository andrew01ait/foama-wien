/** IndexedDB for GTFS data (too large for localStorage). In-memory fallback on failure. */
const DB='foama-wien-data',STORE='catalogues';
function openDb(){return new Promise((resolve,reject)=>{
  if(!('indexedDB'in globalThis))return reject(Error('IndexedDB nicht verfügbar'));
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('DB öffnen fehlgeschlagen'));
});}
export async function getCatalogue(id){const db=await openDb();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).get(id);
  r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();
});}
export async function putCatalogue(id,value){const db=await openDb();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,id);
  tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=()=>{db.close();reject(tx.error);};
});}
