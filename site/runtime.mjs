import {serveNativeRelease,nativeReleaseApi} from './native-releases.mjs';
import {createWearApproach} from './wear-approach.mjs';
// Serves the retained PWA and its fixed-endpoint API relay from one HTTPS origin.
export function createSiteWorker(apiWorker,assets){
  let pushCatalog=null,regionalCatalog=null;
  let wearApproach;
  const regional=()=>regionalCatalog??=['graz','linz','salzburg'].flatMap(city=>{const asset=assets['/data/cities/'+city+'.json'];return asset?JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0)))).stops:[];});
  const catalogue=()=>pushCatalog??=(assets['/data/stops.json']?JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(assets['/data/stops.json'].base64),character=>character.charCodeAt(0)))).stops:[]);
  return {scheduled(controller,env,ctx){return apiWorker.scheduled?.(controller,env,ctx);},async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/api/wear/approach'){
      wearApproach??=createWearApproach({assets});
      return wearApproach(request,internal=>apiWorker.fetch(internal,{...env,LINE_STOPS:catalogue()},ctx));
    }
    const native=await nativeReleaseApi(request,env,assets,ctx)||await serveNativeRelease(request,env,assets,ctx);if(native)return native;
    const bundledCatalogue=url.pathname==='/api/stops-index'&&['GET','HEAD'].includes(request.method)&&assets['/data/stops.json'];
    if((url.pathname.startsWith('/api/')&&!bundledCatalogue)||url.pathname==='/mcp'){
      if(url.pathname.startsWith('/api/push/')){
        return apiWorker.fetch(request,{...env,PUSH_STOPS:catalogue()},ctx);
      }
      if(url.pathname==='/api/monitor')return apiWorker.fetch(request,{...env,LINE_STOPS:catalogue()},ctx);
      if(url.pathname==='/api/regional/board')return apiWorker.fetch(request,{...env,REGIONAL_STOPS:regional()},ctx);
      if(url.pathname.startsWith('/api/journeys/'))return apiWorker.fetch(request,{...env,JOURNEY_STOPS:[...catalogue(),...regional()]},ctx);
      return apiWorker.fetch(request,env,ctx);
    }
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
    let path=bundledCatalogue?'/data/stops.json':url.pathname;
    if(path==='/')path='/index.html';
    if(path==='/diagnose'||path==='/diagnose/')path='/diagnose.html';
    const asset=assets[path];
    if(!asset)return new Response('Not found',{status:404,headers:{'content-type':'text/plain;charset=utf-8'}});
    const body=request.method==='HEAD'?null:Uint8Array.from(atob(asset.base64),character=>character.charCodeAt(0));
    const headers={'content-type':asset.type,'cache-control':'no-cache',
      'permissions-policy':'geolocation=(self), accelerometer=(self)','x-content-type-options':'nosniff'};
    if(path==='/transfer.html'){headers['referrer-policy']='no-referrer';headers['cache-control']='no-store';}
    if(path.startsWith('/apk/')&&path.endsWith('.apk'))headers['content-disposition']='attachment; filename="'+path.split('/').pop()+'"';
    return new Response(body,{headers});
  }};
}
