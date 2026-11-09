import {pushB64,pushBytes} from './web-push.mjs';
const bytes=new TextEncoder();
export const pushHash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export async function sealPush(value,id,secret){
 const key=await crypto.subtle.importKey('raw',pushBytes(secret),'AES-GCM',false,['encrypt']),iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:bytes.encode(id)},key,bytes.encode(JSON.stringify(value)));
 return pushB64(iv)+'.'+pushB64(cipher);
}
export async function openPush(value,id,secret){
 const [iv,cipher]=value.split('.'),key=await crypto.subtle.importKey('raw',pushBytes(secret),'AES-GCM',false,['decrypt']);
 return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:pushBytes(iv),additionalData:bytes.encode(id)},key,pushBytes(cipher))));
}
