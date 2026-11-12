export function createWalkingMap({holder,stop,from=null,manual=false,loadMap,loadRoute=null,isCurrent=()=>true,onRoute=()=>{},onStatus=()=>{}}){
 let disposed=false,map=null;const controller=new AbortController(),current=()=>!disposed&&!controller.signal.aborted&&isCurrent();
 holder.innerHTML='<p>Stationskarte wird geladen …</p>';
 // Routing must never keep the map blank.
 const route=from&&loadRoute?Promise.resolve().then(()=>current()?loadRoute(controller.signal):null).then(result=>({result}),()=>({failed:true})):Promise.resolve(null);
 const ready=(async()=>{
  try{
   const L=await loadMap();if(!current())return;
   holder.innerHTML='';map=L.map(holder,{zoomControl:true,attributionControl:true}).setView([stop.lat,stop.lon],16);
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',attribution:'© OpenStreetMap-Mitwirkende'}).addTo(map).on('tileerror',()=>{if(current())onStatus('Kartenhintergrund gerade nicht verfügbar. Station und Fußweg bleiben nutzbar.');});
   L.marker([stop.lat,stop.lon]).addTo(map).bindPopup(stop.name);
   if(from){L.circleMarker([from.lat,from.lon],{radius:7,color:'#13806b',fillColor:'#55e4ba',fillOpacity:.95}).addTo(map).bindPopup(manual?'Manueller Routenstart':'Startpunkt der Fußwegroute');map.fitBounds([[from.lat,from.lon],[stop.lat,stop.lon]],{padding:[24,24],maxZoom:17});onStatus('Stationskarte bereit · Fußweg wird geladen …');}
   else onStatus('Stationskarte · Für einen Fußweg fehlt eine Startposition.');
   map.invalidateSize();
   const answer=await route;if(!current()||!from)return;
   const result=answer?.result,geometry=result?.routes?.[0]?.geometry,coordinates=geometry?.coordinates;
   if(geometry?.type!=='LineString'||!Array.isArray(coordinates)||coordinates.length<2||coordinates.length>50000||coordinates.some(p=>!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>90)){
    onStatus('Fußweg gerade nicht verfügbar. Die Stationskarte und die externen Routenlinks bleiben nutzbar.');return;
   }
   const points=coordinates.map(([lon,lat])=>[lat,lon]);L.polyline(points,{color:'#1e9d7f',weight:5,opacity:.94}).addTo(map);map.fitBounds(L.latLngBounds(points).pad(.25),{maxZoom:18});onRoute(result.routes[0]);
  }catch{if(current()){map?.remove();map=null;holder.textContent='Karte gerade nicht verfügbar. Du kannst die externen Kartenlinks verwenden.';onStatus('Die eingebettete Karte konnte nicht geladen werden.');}}
 })();
 return {ready,dispose(){disposed=true;controller.abort();map?.remove();map=null;}};
}
