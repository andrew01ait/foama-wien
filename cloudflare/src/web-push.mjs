// RFC 8291 aes128gcm and RFC 8292 VAPID. Runs in Workers and Node WebCrypto.
const utf8=new TextEncoder();
export const pushB64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function pushBytes(value){
 if(typeof value!=='string'||!/^[A-Za-z0-9_-]+$/.test(value))throw Error('Invalid base64url');
 return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')),c=>c.charCodeAt(0));
}
const join=(...arrays)=>{const out=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let at=0;for(const a of arrays){out.set(a,at);at+=a.length;}return out;};
export function validatePushSubscription(input){
 const endpoint=String(input?.endpoint||'');if(endpoint.length>2048)throw Error('Invalid push address');
 const url=new URL(endpoint),host=url.hostname;
 const allowed=(host==='fcm.googleapis.com'&&/^\/(fcm\/send|wp)\//.test(url.pathname))||
  (host==='updates.push.services.mozilla.com'&&/^\/wpush\/v[12]\//.test(url.pathname))||
  (host==='web.push.apple.com'&&url.pathname.length>1)||
  (/^[a-z0-9-]+\.notify\.windows\.com$/.test(host)&&url.pathname.startsWith('/w/'));
 if(!allowed||url.protocol!=='https:'||url.port||url.username||url.password||url.hash)throw Error('Unsupported push service');
 const publicKey=pushBytes(input?.keys?.p256dh),auth=pushBytes(input?.keys?.auth);
 if(publicKey.length!==65||publicKey[0]!==4||auth.length!==16)throw Error('Invalid push keys');
 const expiry=input.expirationTime==null?null:Number(input.expirationTime);
 if(expiry!==null&&(!Number.isFinite(expiry)||expiry<=0))throw Error('Invalid expiry');
 return {endpoint,expirationTime:expiry,keys:{p256dh:pushB64(publicKey),auth:pushB64(auth)}};
}
async function hkdf(input,salt,info,length){
 const key=await crypto.subtle.importKey('raw',input,'HKDF',false,['deriveBits']);
 return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},key,length*8));
}
export async function encryptPush(subscription,message,{salt=crypto.getRandomValues(new Uint8Array(16)),serverKey=null}={}){
 const sub=validatePushSubscription(subscription),ua=pushBytes(sub.keys.p256dh);
 const pair=serverKey||await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
 const pub=new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey));
 const peer=await crypto.subtle.importKey('raw',ua,{name:'ECDH',namedCurve:'P-256'},false,[]);
 const shared=await crypto.subtle.deriveBits({name:'ECDH',public:peer},pair.privateKey,256);
 const ikm=await hkdf(shared,pushBytes(sub.keys.auth),join(utf8.encode('WebPush: info\0'),ua,pub),32);
 const cek=await hkdf(ikm,salt,utf8.encode('Content-Encoding: aes128gcm\0'),16);
 const nonce=await hkdf(ikm,salt,utf8.encode('Content-Encoding: nonce\0'),12);
 const plain=typeof message==='string'?utf8.encode(message):new Uint8Array(message);
 if(plain.length>3000)throw Error('Push payload too large');
 const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,join(plain,new Uint8Array([2])));
 const header=join(salt,new Uint8Array([0,0,16,0,65]),pub);
 return join(header,new Uint8Array(cipher));
}
export async function vapidAuthorization(endpoint,privateJwk,publicKey,subject,now=Date.now()){
 const header=pushB64(utf8.encode(JSON.stringify({typ:'JWT',alg:'ES256'})));
 const claims=pushB64(utf8.encode(JSON.stringify({aud:new URL(endpoint).origin,exp:Math.floor(now/1000)+12*3600,sub:subject})));
 const value=header+'.'+claims,key=await crypto.subtle.importKey('jwk',typeof privateJwk==='string'?JSON.parse(privateJwk):privateJwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,utf8.encode(value));
 return `vapid t=${value}.${pushB64(signature)},k=${publicKey}`;
}
export async function sendWebPush(subscription,payload,env,{fetcher=fetch,now=Date.now()}={}){
 const sub=validatePushSubscription(subscription),body=await encryptPush(sub,JSON.stringify(payload));
 const authorization=await vapidAuthorization(sub.endpoint,env.PUSH_VAPID_PRIVATE_JWK,env.PUSH_VAPID_PUBLIC_KEY,env.PUSH_VAPID_SUBJECT,now);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetcher(sub.endpoint,{method:'POST',redirect:'manual',signal:controller.signal,headers:{Authorization:authorization,TTL:'300',Urgency:'normal',Topic:'foama-wien-alerts','Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream'},body});
  // Never log provider bodies or endpoints; both can contain subscription credentials.
  await response.body?.cancel();
  return {ok:response.status===201||response.status===202,status:response.status,gone:response.status===404||response.status===410};
 }finally{clearTimeout(timer);}
}
