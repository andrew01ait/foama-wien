// Keep every filtered catalogue line visible, including large interchanges.
export function stationMapMarker(lines,routeBadge){
 const columns=Math.min(4,Math.max(1,lines.length)),rows=Math.max(1,Math.ceil(lines.length/columns)),width=Math.max(44,columns*38+(columns-1)*2),height=Math.max(44,rows*24+(rows-1)*2+20);
 return {className:'station-map-marker',html:'<span class="station-map-lines" style="grid-template-columns:repeat('+columns+',38px)">'+(lines.length?lines.map(line=>routeBadge(line.route,line.mode)).join(''):'<span class="station-map-stop">H</span>')+'</span><span class="station-map-stem" aria-hidden="true"></span><span class="station-map-point" aria-hidden="true"></span>',iconSize:[width,height],iconAnchor:[width/2,height-6],popupAnchor:[0,6-height]};
}

// One representative physical platform per station, never a centroid between
// opposing stops. Catalogue coordinates remain the fallback and distance basis.
export function stationMapPosition(stop,data,lines,day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())){
 const fallback=[stop.lat,stop.lon];
 if(data?.format!==1||data.city!=='wien'||day<data.validFrom||day>data.validThrough||!Array.isArray(data.services))return fallback;
 const rows=data.stations?.[stop.id];if(!Array.isArray(rows))return fallback;
 let best=Infinity,result=fallback;
 for(const row of rows){
  if(!Number.isFinite(row.lat)||!Number.isFinite(row.lon)||row.lat<47||row.lat>50||row.lon<14||row.lon>18||!Array.isArray(row.services)||!row.services.some(i=>Array.isArray(data.services[i])&&data.services[i].includes(day))||!lines.some(line=>line.route===row.route&&line.mode===row.mode))continue;
  const distance=(row.lat-stop.lat)**2+((row.lon-stop.lon)*Math.cos(stop.lat*Math.PI/180))**2;
  if(distance<best){best=distance;result=[row.lat,row.lon];}
 }
 return result;
}
