export function coordinate(value){
 return Number.isFinite(value?.lat)&&Number.isFinite(value?.lon)&&Math.abs(value.lat)<=90&&Math.abs(value.lon)<=180?{lat:value.lat,lon:value.lon}:null;
}
// MOTIS v6 uses encoded polylines with precision 6. Reject malformed data
// rather than drawing a partially decoded or invented route.
export function decodeJourneyPolyline(encoded,{limit=10000}={}){
 if(typeof encoded!=='string'||encoded.length>100000)return [];
 const points=[];let index=0,lat=0,lon=0;
 const next=()=>{let result=0,shift=0,byte;do{if(index>=encoded.length||shift>30)throw Error();byte=encoded.charCodeAt(index++)-63;if(byte<0||byte>63)throw Error();result|=(byte&31)<<shift;shift+=5;}while(byte>=32);return result&1?~(result>>>1):result>>>1;};
 try{while(index<encoded.length){lat+=next();lon+=next();const point={lat:lat/1e6,lon:lon/1e6};if(!coordinate(point)||points.length>=limit)return [];points.push([point.lat,point.lon]);}}catch{return [];}
 return points.length>1?points:[];
}
export function journeyLegPath(leg,stops=[]){
 const routed=decodeJourneyPolyline(leg.geometry);if(routed.length)return {points:routed,schematic:false};
 const place=p=>coordinate(p)||coordinate(stops.find(stop=>stop.id===p?.stopId));
 const from=place(leg.from),to=place(leg.to);
 return {points:from&&to?[[from.lat,from.lon],[to.lat,to.lon]]:[],schematic:true};
}
export function routeColor(route,mode){
 return ({U1:'#ed1c24',U2:'#a762a3',U3:'#f58220',U4:'#00a650',U6:'#a87e48'})[String(route).replace(/\s+/g,'').toUpperCase()]||(/^N\d/i.test(route)?'#315578':mode==='tram'?'#c94f48':mode==='walk'?'#758b98':mode==='sbahn'?'#278f80':'#3b799b');
}
