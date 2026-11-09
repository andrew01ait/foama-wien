import test from 'node:test';import assert from 'node:assert/strict';import {nativeReleaseApi,serveNativeRelease} from '../site/native-releases.mjs';
const bytes=Uint8Array.from([0x50,0x4b,0,255,128,12]);
const hash=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(v=>v.toString(16).padStart(2,'0')).join('');
async function setup(){const release={filename:'foama-wien-wear-test.apk',version:'test',bytes:bytes.length,sha256:await hash(bytes)},assets={__nativeReleases:[release]},objects=new Map();let puts=0;const bucket={head:async key=>objects.get(key)||null,get:async key=>objects.get(key)||null,put:async(key,data,options)=>{puts++;objects.set(key,{size:data.length,customMetadata:options.customMetadata,body:data});}};return {release,assets,bucket,objects,get puts(){return puts;}};}
test('signed public release bytes survive immutable storage and download with correct HEAD size and attachment headers',async()=>{
 const s=await setup(),url='https://example.test/api/native-releases/import/'+s.release.filename;assert.equal((await nativeReleaseApi(new Request(url,{method:'POST',body:bytes}),{BUCKET:s.bucket},s.assets)).status,201);assert.equal(s.puts,1);
 assert.equal((await nativeReleaseApi(new Request(url,{method:'POST',body:bytes}),{BUCKET:s.bucket},s.assets)).status,200);assert.equal(s.puts,1);
 const response=await serveNativeRelease(new Request('https://example.test/apk/'+s.release.filename),{BUCKET:s.bucket},s.assets,{});assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);assert.equal(response.headers.get('content-length'),String(bytes.length));assert.ok(response.headers.get('content-disposition').includes(s.release.filename));
 const head=await serveNativeRelease(new Request('https://example.test/apk/'+s.release.filename,{method:'HEAD'}),{BUCKET:s.bucket},s.assets,{});assert.equal((await head.arrayBuffer()).byteLength,0);assert.equal(head.headers.get('content-length'),String(bytes.length));
});
test('release import rejects arbitrary paths, wrong bytes, size violations and missing storage without writing an object',async()=>{
 const s=await setup(),url='https://example.test/api/native-releases/import/'+s.release.filename,env={BUCKET:s.bucket};
 assert.equal((await nativeReleaseApi(new Request('https://example.test/api/native-releases/import/unknown.apk',{method:'POST',body:bytes}),env,s.assets)).status,404);
 const changed=bytes.slice();changed[3]=0;assert.equal((await nativeReleaseApi(new Request(url,{method:'POST',body:changed}),env,s.assets)).status,400);assert.equal((await nativeReleaseApi(new Request(url,{method:'POST',body:new Uint8Array(1)}),env,s.assets)).status,400);
 assert.equal((await nativeReleaseApi(new Request(url,{method:'POST',headers:{'content-length':String(9*1024*1024)},body:bytes}),env,s.assets)).status,413);assert.equal(s.puts,0);assert.equal((await nativeReleaseApi(new Request(url,{method:'POST',body:bytes}),{},s.assets)).status,503);
});
test('current embedded release is a valid fallback and seeds storage while an older release can remain external',async()=>{
 const s=await setup();s.assets['/apk/'+s.release.filename]={base64:Buffer.from(bytes).toString('base64')};const tasks=[];
 const response=await serveNativeRelease(new Request('https://example.test/apk/'+s.release.filename),{BUCKET:s.bucket},s.assets,{waitUntil:p=>tasks.push(p)});assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);await Promise.all(tasks);assert.equal(s.puts,1);
 delete s.assets['/apk/'+s.release.filename];assert.equal((await serveNativeRelease(new Request('https://example.test/apk/'+s.release.filename),{BUCKET:s.bucket},s.assets,{})).status,200);
 const status=await nativeReleaseApi(new Request('https://example.test/api/native-releases'),{BUCKET:s.bucket},s.assets);assert.equal((await status.json()).releases[0].stored,true);
});
