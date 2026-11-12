// Keep every filtered catalogue line visible, including large interchanges.
export function stationMapMarker(lines,routeBadge){
 const columns=Math.min(4,Math.max(1,lines.length)),rows=Math.max(1,Math.ceil(lines.length/columns)),width=Math.max(44,columns*38+(columns-1)*2),height=Math.max(44,rows*24+(rows-1)*2);
 return {className:'station-map-marker',html:'<span class="station-map-lines" style="grid-template-columns:repeat('+columns+',38px)">'+(lines.length?lines.map(line=>routeBadge(line.route,line.mode)).join(''):'<span class="station-map-stop">H</span>')+'</span>',iconSize:[width,height],iconAnchor:[width/2,height+10],popupAnchor:[0,-height-10]};
}
