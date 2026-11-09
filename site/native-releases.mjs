// Only immutable, already-signed public app releases may enter this bucket.
const MIME='application/vnd.android.package-archive',MAX=8*1024*1024;
const key=release=>'native-releases/'+release.filename;
const releases=assets=>Array.isArray(assets.__nativeReleases)?assets.__nativeReleases:[];
const embedded=(assets,release)=>assets['/apk/'+release.filename];
const decode=asset=>Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store'}});
const matches=(object,release)=>object?.size===release.bytes&&object?.customMetadata?.sha256===release.sha256;
async function store(bucket,release,data){
 const prior=await bucket.head(key(release));if(prior){if(!matches(prior,release))throw Error('Release conflict');return;}
 await bucket.put(key(release),data,{httpMetadata:{contentType:MIME,contentDisposition:'attachment; filename="'+release.filename+'"'},customMetadata:{sha256:release.sha256}});
}
async function limitedBody(request){
 if(Number(request.headers.get('content-length'))>MAX)throw Error('too-large');const reader=request.body?.getReader();if(!reader)throw Error('empty');const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX){await reader.cancel();throw Error('too-large');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const value of chunks){bytes.set(value,offset);offset+=value.length;}return bytes;
}
export async function nativeReleaseApi(request,env,assets){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/native-releases'))return null;const bucket=env.BUCKET;if(!bucket)return json({error:'Dateispeicher nicht bereit.'},503);
 try{
  const rows=releases(assets);
  if(url.pathname==='/api/native-releases'&&request.method==='GET')return json({releases:await Promise.all(rows.map(async row=>{const object=await bucket.head(key(row));return {...row,stored:matches(object,row),available:matches(object,row)||!!embedded(assets,row)};}))});
  if(url.pathname==='/api/native-releases/seed'&&request.method==='POST'){
   for(const row of rows){const asset=embedded(assets,row);if(asset)await store(bucket,row,decode(asset));}return json({ready:true});
  }
  const match=url.pathname.match(/^\/api\/native-releases\/import\/([^/]+)$/),release=match&&rows.find(row=>row.filename===match[1]);
  if(!release||request.method!=='POST')return json({error:'Nicht freigegeben.'},404);
  const prior=await bucket.head(key(release));if(prior)return matches(prior,release)?json({ready:true}):json({error:'Dateikonflikt.'},409);
  const body=await limitedBody(request);if(body.length!==release.bytes)return json({error:'Dateigröße stimmt nicht.'},400);
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',body))].map(v=>v.toString(16).padStart(2,'0')).join('');if(hash!==release.sha256)return json({error:'Prüfsumme stimmt nicht.'},400);
  await store(bucket,release,body);return json({ready:true},201);
 }catch(error){return json({error:error.message==='too-large'?'Datei zu groß.':'Dateispeicher vorübergehend nicht verfügbar.'},error.message==='too-large'?413:503);}
}
export async function serveNativeRelease(request,env,assets,ctx){
 const path=new URL(request.url).pathname;if(!path.startsWith('/apk/')||!path.endsWith('.apk')||!releases(assets).length)return null;
 const release=releases(assets).find(row=>path==='/apk/'+row.filename);if(!release)return new Response('Not found',{status:404});if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const headers={'content-type':MIME,'content-disposition':'attachment; filename="'+release.filename+'"','content-length':String(release.bytes),'cache-control':'public,max-age=31536000,immutable','x-content-type-options':'nosniff'};
 try{if(env.BUCKET){const object=await (request.method==='HEAD'?env.BUCKET.head(key(release)):env.BUCKET.get(key(release)));if(object&&matches(object,release))return new Response(request.method==='HEAD'?null:object.body,{headers});}}catch{}
 const asset=embedded(assets,release);if(!asset)return new Response('Download temporarily unavailable',{status:503,headers:{'cache-control':'no-store'}});
 const body=request.method==='HEAD'?null:decode(asset);if(body&&env.BUCKET){const task=store(env.BUCKET,release,body).catch(()=>console.error('native-release-store-failed'));if(ctx?.waitUntil)ctx.waitUntil(task);else await task;}
 return new Response(body,{headers});
}
