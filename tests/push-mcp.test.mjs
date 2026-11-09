import test from 'node:test';
import assert from 'node:assert/strict';
import {pushMcp} from '../cloudflare/src/push-mcp.mjs';
import {createSiteWorker} from '../site/runtime.mjs';
import api from '../cloudflare/src/index.js';
import {localD1} from '../site/local-d1.mjs';
const request=(method,params={})=>new Request('https://foama.example/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
test('site-hosted tools expose only a fixed check and public readiness, with no device data or arbitrary inputs',async()=>{
 const db=localD1();try{
  const discovery=await (await pushMcp(request('server/discover'),{DB:db})).json();assert.ok(discovery.result.supportedVersions.includes('2026-07-28'));
  const listed=await (await pushMcp(request('tools/list'),{DB:db})).json();assert.deepEqual(listed.result.tools.map(t=>t.name),['foama_push_status','foama_check_disruptions']);for(const tool of listed.result.tools)assert.equal(tool.inputSchema.additionalProperties,false);
  const refused=await (await pushMcp(request('tools/call',{name:'foama_check_disruptions',arguments:{recipient:'arbitrary'}}),{DB:db})).json();assert.equal(refused.result.isError,true);
  const status=await (await pushMcp(request('tools/call',{name:'foama_push_status',arguments:{}}),{DB:db})).json();const value=JSON.parse(status.result.content[0].text);assert.equal(value.available,false);assert.equal(value.nativeAvailable,false);assert.equal(value.devices,undefined);assert.equal(value.result,undefined);
 }finally{db.close();}
});
test('scheduled-tool preflight can validate the official source while sending remains disabled',async()=>{
 let called='';const feed={data:{trafficInfoCategories:[],trafficInfos:[]}};
 const result=await (await pushMcp(request('tools/call',{name:'foama_check_disruptions',arguments:{}}),{},{now:1000,fetcher:async url=>{called=url;return Response.json(feed);}})).json();
 const value=JSON.parse(result.result.content[0].text);assert.equal(value.sendingEnabled,false);assert.equal(value.state,'setup-source-only');assert.equal(called,'https://www.wienerlinien.at/ogd_realtime/trafficInfoList');
});
test('the retained Worker forwards MCP requests without serving assets and rejects malformed RPC',async()=>{
 const db=localD1();try{
  const worker=createSiteWorker(api,{}),response=await worker.fetch(request('tools/list'),{DB:db},{waitUntil(){}});assert.equal(response.status,200);assert.equal((await response.json()).result.tools.length,2);
  const invalid=await (await pushMcp(new Request('https://foama.example/mcp',{method:'POST',body:'null'}),{})).json();assert.equal(invalid.error.code,-32600);
 }finally{db.close();}
});
