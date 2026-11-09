// Local adapter used only by the managed Sites preview daemon.
import {createServer} from 'node:http';
import worker from '../dist/server/index.js';
import {localD1} from '../site/local-d1.mjs';
const DB=localD1();
const entries=new Map();
const previewCache={async match(request){const value=entries.get(request.url);return value&&value.expires>Date.now()?value.response.clone():undefined;},async put(request,response){const maxAge=Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]||0);entries.set(request.url,{response,expires:Date.now()+maxAge*1000});}};
globalThis.caches={open:async()=>previewCache};
createServer(async(incoming,outgoing)=>{
 try{
  const origin='http://'+(incoming.headers.host||'localhost');
  const chunks=[];let size=0;for await(const chunk of incoming){size+=chunk.length;if(size>60000)throw Error('Request too large');chunks.push(chunk);}
  const request=new Request(new URL(incoming.url,origin),{method:incoming.method,headers:incoming.headers,body:['GET','HEAD'].includes(incoming.method)?undefined:Buffer.concat(chunks)});
  const response=await worker.fetch(request,{DB}, {waitUntil:promise=>promise.catch(console.error)});
  outgoing.writeHead(response.status,Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
 }catch{outgoing.writeHead(500);outgoing.end('Preview error');}
}).listen(Number(process.env.PORT||4173),process.env.HOST||'0.0.0.0');
