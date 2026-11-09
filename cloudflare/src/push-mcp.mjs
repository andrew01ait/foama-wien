import {readBounded,pushApi,pushStatus,getDisruptions,purgePush} from './push-service.mjs';
import {purgeTransfers} from './transfer-relay.mjs';

const tools=[
 {name:'foama_push_status',description:'Read public foama-wien disruption-service readiness and last-check timestamps. No device data.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}},
 {name:'foama_check_disruptions',description:'Check the fixed official Wiener Linien disruption feed once. When sending is enabled, the existing service sends only relevant deduplicated alerts to opted-in devices under its limits. While setup is incomplete, check the source only without sending. No GPS, departure polling, arbitrary recipients or message inputs.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:true}}
];
const reply=value=>Response.json(value,{headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function pushMcp(request,env,{now=Date.now(),fetcher=fetch}={}){
 if(request.method!=='POST')return new Response('POST required',{status:405,headers:{Allow:'POST'}});
 let rpc;try{rpc=await readBounded(request);}catch{return reply({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON-RPC request'}});}
 if(!rpc||typeof rpc!=='object'||Array.isArray(rpc)||rpc.jsonrpc!=='2.0'||typeof rpc.method!=='string')return reply({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Invalid JSON-RPC request'}});
 const id=typeof rpc?.id==='string'||typeof rpc?.id==='number'?rpc.id:null;
 const result=value=>reply({jsonrpc:'2.0',id,result:value});
 if(rpc.method==='server/discover')return result({supportedVersions:['2026-07-28'],capabilities:{tools:{}}});
 if(rpc.method==='initialize')return result({protocolVersion:['2024-11-05','2025-03-26','2025-06-18','2026-07-28'].includes(rpc.params?.protocolVersion)?rpc.params.protocolVersion:'2026-07-28',capabilities:{tools:{}},serverInfo:{name:'foama-wien',version:'1.0'}});
 if(rpc.method?.startsWith('notifications/'))return new Response(null,{status:202});
 if(rpc.method==='tools/list')return result({tools});
 if(rpc.method!=='tools/call')return reply({jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}});
 const fail=text=>result({isError:true,content:[{type:'text',text}]});
 const args=rpc.params?.arguments||{};if(typeof args!=='object'||Array.isArray(args)||Object.keys(args).length)return fail('This operation accepts no arguments.');
 try{
  if(rpc.params?.name==='foama_push_status')return result({content:[{type:'text',text:JSON.stringify(await pushStatus(env))}]});
  if(rpc.params?.name!=='foama_check_disruptions')return fail('Unknown tool.');
  const status=await pushStatus(env),origin=new URL(request.url).origin;
  if(env.DB)await Promise.all([purgePush(env.DB,now),purgeTransfers(env.DB,now)]);
  if(!status.available&&!status.nativeAvailable){
   const feed=await getDisruptions(origin,{now,fetcher});
   if(env.DB){await env.DB.prepare("INSERT OR IGNORE INTO foama_push_runtime (id) VALUES ('main')").run();await env.DB.prepare("UPDATE foama_push_runtime SET last_check=?,last_success=?,status='setup-source-only' WHERE id='main' AND lease_until<=?").bind(now,feed.checkedAt,now).run();}
   return result({content:[{type:'text',text:JSON.stringify({checked:true,sendingEnabled:false,sourceCheckedAt:feed.checkedAt,state:'setup-source-only'})}]});
  }
  const response=await pushApi(new Request(origin+'/api/push/check',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),env,now,{fetcher});
  const value=await response.json();return result({isError:!response.ok,content:[{type:'text',text:JSON.stringify(value)}]});
 }catch{return fail('Official disruption source unavailable. No stale notification or all-clear sent.');}
}
