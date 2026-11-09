// Native watch delivery through the fixed FCM HTTP v1 endpoint. No Firebase Admin dependency.
import {pushB64,pushBytes} from './web-push.mjs';
const encode=new TextEncoder(),oauth='https://oauth2.googleapis.com/token';
const scope='https://www.googleapis.com/auth/firebase.messaging';
let cachedAccess=null;
export function nativeFirebaseOptions(env){
 const value={projectId:env.FIREBASE_PROJECT_ID,applicationId:env.FIREBASE_ANDROID_APP_ID,apiKey:env.FIREBASE_API_KEY,senderId:env.FIREBASE_SENDER_ID};
 return /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(value.projectId||'')&&/^\d{6,20}$/.test(value.senderId||'')&&
  new RegExp('^1:'+value.senderId+':android:[a-f0-9]{8,64}$','i').test(value.applicationId||'')&&/^[A-Za-z0-9_-]{20,200}$/.test(value.apiKey||'')?value:null;
}
function account(env){
 const options=nativeFirebaseOptions(env);if(!options)throw Error('Firebase client configuration missing');
 const service=JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON||'{}');
 if(service.type!=='service_account'||service.project_id!==options.projectId||!new RegExp('^[a-zA-Z0-9._-]+@'+options.projectId.replaceAll('-','\\-')+'\\.iam\\.gserviceaccount\\.com$').test(service.client_email||'')||!/^-----BEGIN PRIVATE KEY-----\s/.test(service.private_key||''))throw Error('FCM service configuration missing');
 return service;
}
export function nativeFcmConfigured(env){try{account(env);return true;}catch{return false;}}
export function validateFcmToken(token){if(typeof token!=='string'||!/^[A-Za-z0-9:_-]{40,4096}$/.test(token))throw Error('Invalid FCM registration');return token;}
export async function fcmAssertion(env,now=Date.now()){
 const service=account(env),pem=service.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
 const key=await crypto.subtle.importKey('pkcs8',pushBytes(pem.replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const header=pushB64(encode.encode(JSON.stringify({alg:'RS256',typ:'JWT'}))),claim=pushB64(encode.encode(JSON.stringify({iss:service.client_email,scope,aud:oauth,iat:Math.floor(now/1000)-30,exp:Math.floor(now/1000)+3540})));
 const input=header+'.'+claim;return input+'.'+pushB64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,encode.encode(input)));
}
async function responseJson(response,limit=64000){
 const reader=response.body?.getReader();if(!reader)return {};let result='',count=0;const decode=new TextDecoder();
 try{while(true){const part=await reader.read();if(part.done)break;count+=part.value.length;if(count>limit){await reader.cancel();throw Error('FCM response too large');}result+=decode.decode(part.value,{stream:true});}result+=decode.decode();return JSON.parse(result||'{}');}finally{reader.releaseLock();}
}
async function accessToken(env,{now,fetcher,signal}){
 const service=account(env),key=service.client_email+'|'+service.private_key;
 if(cachedAccess?.key===key&&cachedAccess.until>now+60000)return cachedAccess.token;
 const assertion=await fcmAssertion(env,now),body=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion});
 const response=await fetcher(oauth,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString(),redirect:'manual',signal});
 const data=await responseJson(response);if(!response.ok||typeof data.access_token!=='string'||data.access_token.length>8192||!(Number(data.expires_in)>0))throw Error('FCM authorization failed');
 cachedAccess={key,token:data.access_token,until:now+Math.min(3600,Number(data.expires_in))*1000};return data.access_token;
}
export async function sendFcmPush(token,payload,env,{now=Date.now(),fetcher=fetch}={}){
 validateFcmToken(token);const service=account(env);
 const data={format:'foama-push-v1',title:String(payload.title||'foama-wien').slice(0,100),body:String(payload.body||'').slice(0,1000),sentAt:String(now),tag:payload.tag==='foama-wien-test'?'foama-wien-test':'foama-wien-disruptions'};
 const message={token,data,android:{priority:'high',ttl:'300s',collapse_key:data.tag}};
 if(encode.encode(JSON.stringify(message)).length>12000||encode.encode(JSON.stringify(data)).length>3000)throw Error('FCM payload too large');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const access=await accessToken(env,{now,fetcher,signal:controller.signal});
  const response=await fetcher('https://fcm.googleapis.com/v1/projects/'+service.project_id+'/messages:send',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+access},body:JSON.stringify({message}),redirect:'manual',signal:controller.signal});
  const reply=await responseJson(response),gone=reply.error?.details?.some(item=>item.errorCode==='UNREGISTERED')===true;
  if(response.status===401)cachedAccess=null;
  return {ok:response.ok,status:response.status,gone};
 }finally{clearTimeout(timer);}
}
