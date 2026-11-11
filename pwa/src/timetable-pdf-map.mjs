import {decodeJourneyPolyline} from './journey-geometry.mjs?v=0.11.3';

export function pdfRoutePatterns({manifest,line,routeMap,day,stopId,towards='',wholeLine=false}){
 if(routeMap.version!==manifest.version||routeMap.sourceSha256!==manifest.sourceSha256||routeMap.route!==line.route||routeMap.mode!==line.mode)throw Error('Linienverlauf und Fahrplan passen nicht zusammen.');
 return routeMap.patterns.filter(p=>p.services.some(n=>manifest.services[n]?.includes(day))&&(wholeLine||(!towards||p.towards===towards)&&p.stops.some(s=>s.id===stopId)))
  .sort((a,b)=>a.direction.localeCompare(b.direction)||b.stops.length-a.stops.length||b.tripCount-a.tripCount)
  .map(p=>({...p,points:p.geometry?decodeJourneyPolyline(routeMap.shapes[p.geometry]):[]}));
}
const mercator=([lat,lon])=>({x:(lon+180)/360,y:(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2});
export function pdfMapViewport(patterns,{width=600,height=1070,padding=32}={}){
 const points=patterns.flatMap(p=>[...p.points,...p.stops.map(s=>[s.lat,s.lon])]).map(mercator);
 if(!points.length||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('Für die Karte fehlen gültige Koordinaten.');
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const p of points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
 const zoom=Math.max(8,Math.min(17,Math.floor(Math.log2(Math.min((width-2*padding)/(256*Math.max(maxX-minX,1e-8)),(height-2*padding)/(256*Math.max(maxY-minY,1e-8)))))));
 const scale=256*2**zoom;
 return {zoom,width,height,left:(minX+maxX)/2*scale-width/2,top:(minY+maxY)/2*scale-height/2};
}
export function pdfMapPoint(viewport,point){const p=mercator(point),scale=256*2**viewport.zoom;return {x:p.x*scale-viewport.left,y:p.y*scale-viewport.top};}
export function pdfMapTiles(viewport){
 const tiles=[],last=2**viewport.zoom-1;
 for(let y=Math.max(0,Math.floor(viewport.top/256));y<=Math.min(last,Math.floor((viewport.top+viewport.height-1)/256));y++){
  for(let x=Math.max(0,Math.floor(viewport.left/256));x<=Math.min(last,Math.floor((viewport.left+viewport.width-1)/256));x++)tiles.push({x:x*256-viewport.left,y:y*256-viewport.top,url:`https://mapsneu.wien.gv.at/basemap/geolandbasemap/normal/google3857/${viewport.zoom}/${y}/${x}.png`});
 }
 if(tiles.length>32)throw Error('Kartenausschnitt zu groß.');return tiles;
}
// One bounded background per deliberate export, shared by all variant pages.
// basemap.at permits print/offline use. Never download OSM community tiles here.
export async function createPdfMapBackground(viewport,{signal,fetch=globalThis.fetch,document=globalThis.document,bitmap=globalThis.createImageBitmap,online=globalThis.navigator?.onLine!==false,timeout=15000}={}){
 if(signal?.aborted)throw new DOMException('Beendet','AbortError');
 if(!online||!document||!bitmap)return null;
 const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(abort,timeout);
 try{
  const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;const context=canvas.getContext('2d');if(!context)return null;
  context.fillStyle='#f2f5f2';context.fillRect(0,0,canvas.width,canvas.height);
  const tiles=pdfMapTiles(viewport);let next=0;
  await Promise.all(Array.from({length:Math.min(4,tiles.length)},async()=>{
   while(next<tiles.length){const tile=tiles[next++];const response=await fetch(tile.url,{signal:controller.signal,credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin'});
    if(!response.ok)throw Error('Kartenhintergrund nicht verfügbar');const blob=await response.blob();if(blob.size>2_000_000)throw Error('Kartenkachel zu groß');
    const image=await bitmap(blob);try{if(controller.signal.aborted)throw new DOMException('Beendet','AbortError');context.drawImage(image,tile.x,tile.y,256,256);}finally{image.close?.();}
   }
  }));
  if(signal?.aborted)throw new DOMException('Beendet','AbortError');
  const data=atob(canvas.toDataURL('image/jpeg',.88).split(',')[1]);
  if(data.length>2_000_000)throw Error('Kartenbild zu groß');
  return {viewport,width:canvas.width,height:canvas.height,hex:Array.from(data,ch=>ch.charCodeAt(0).toString(16).padStart(2,'0')).join('')};
 }catch(error){controller.abort();if(signal?.aborted)throw new DOMException('Beendet','AbortError');return null;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
