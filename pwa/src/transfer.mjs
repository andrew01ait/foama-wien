/* AES-GCM for short-lived, end-to-end-encrypted favourites transfer. Key stays in fragment. */
import {transferableJourneys,mergeJourneyFavorites} from './journey-favorites.mjs?v=0.9.0';
const enc=new TextEncoder(), dec=new TextDecoder();
export function b64urlEncode(bytes){let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function b64urlDecode(s){if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Ungültiger QR-Schlüssel');const str=atob(s.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(str,c=>c.charCodeAt(0));}
export function getTransferHash(hash){const params=new URLSearchParams((hash||'').replace(/^#/,''));const session=params.get('session'),key=params.get('key');if(!session||!key)return null;if(!/^[A-Za-z0-9_-]{16,64}$/.test(session)||b64urlDecode(key).length!==32)throw Error('Transferlink ungültig');return {session,key};}
export async function encryptTransfer(data,key){const raw=b64urlDecode(key);if(raw.length!==32)throw Error('Schlüssel muss 256 Bit haben');const aes=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt']);const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},aes,enc.encode(JSON.stringify(data))));return {iv:b64urlEncode(iv),ciphertext:b64urlEncode(ciphertext)};}
export async function decryptTransfer(data,key){const aes=await crypto.subtle.importKey('raw',b64urlDecode(key),{name:'AES-GCM'},false,['decrypt']);const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64urlDecode(data.iv)},aes,b64urlDecode(data.ciphertext));return JSON.parse(dec.decode(plaintext));}

export function transferLink(hash){
 const base=getTransferHash(hash),params=new URLSearchParams((hash||'').replace(/^#/,''));
 if(!base||base.session.length!==32||!/^[A-Za-z0-9_-]{32}$/.test(params.get('auth')||'')||!['upload','download'].includes(params.get('action')))throw Error('Scanne einen neuen QR-Code auf deiner Uhr.');
 return {...base,auth:params.get('auth'),action:params.get('action')};
}
export function transferFavorites(value,{limit=500}={}){
 if(value?.format&&!['foama-favorites-v1','foama-favorites-v2'].includes(value.format))throw Error('Keine foama-wien-Favoriten-Datei.');
 if(!Array.isArray(value?.favorites)||value.favorites.length>limit)throw Error('Höchstens 500 Favoriten pro Übertragung.');
 const out=[],seen=new Set();
 for(const row of value.favorites){
  if(!row||typeof row.stopId!=='string'||!row.stopId||row.stopId.length>100||/[\x00-\x1f]/.test(row.stopId)||typeof(row.route??'')!=='string'||typeof(row.towards??'')!=='string')throw Error('Ungültiger Favorit in der Datei.');
  const favorite={stopId:row.stopId,stopName:String(row.stopName||'').slice(0,120),route:(row.route||'').slice(0,30),towards:(row.towards||'').slice(0,160)};
  if(['metro','tram','bus','sbahn','regional','long'].includes(row.mode))favorite.mode=row.mode;
  const id=JSON.stringify([favorite.stopId,favorite.route,favorite.towards]);if(!seen.has(id)){out.push(favorite);seen.add(id);}
 }
 return out;
}
export function mergeTransferFavorites(existing,incoming){
 const first=transferFavorites({favorites:existing},{limit:1000}),seen=new Set(first.map(f=>JSON.stringify([f.stopId,f.route,f.towards]))),added=[];
 for(const f of transferFavorites({favorites:incoming})){const id=JSON.stringify([f.stopId,f.route,f.towards]);if(!seen.has(id)){seen.add(id);added.push(f);}}
 if(first.length+added.length>1000)throw Error('Auf diesem Gerät sind höchstens 1.000 Favoriten möglich.');
 return {favorites:[...first,...added],added:added.length};
}
export function transferBundle(value){
 const favorites=transferFavorites({...value,favorites:value?.favorites??[]});
 const rows=value?.format==='foama-favorites-v2'?(value.journeys??[]):[];
 if(!Array.isArray(rows)||rows.length>30)throw Error('Höchstens 30 Routen pro Übertragung.');
 const journeys=transferableJourneys(rows);if(journeys.length!==rows.length)throw Error('Ungültige Route in der Übertragung.');
 return {format:journeys.length?'foama-favorites-v2':'foama-favorites-v1',favorites,journeys};
}
export function mergeTransferBundle(existing,incoming){
 const safe=transferBundle(incoming),stations=mergeTransferFavorites(existing.favorites||[],safe.favorites),routes=mergeJourneyFavorites(existing.journeys||[],safe.journeys);
 return {favorites:stations.favorites,journeys:routes.favorites,added:stations.added,addedJourneys:routes.added,updatedJourneys:routes.updated};
}
