import {coordinate} from './journey-geometry.mjs?v=0.11.7';
const clean=(value,n)=>typeof value==='string'?value.trim().slice(0,n):'';
const labelKey=value=>value.normalize('NFKC').toLocaleLowerCase('de-AT');
export const JOURNEY_PLACES_KEY='foama.journeyPlaces.v1';
export function sanitizeJourneyPlaces(input){
 if(!Array.isArray(input))return [];
 const names=new Set(),ids=new Set(),out=[];
 for(const row of input.slice(0,30)){
  const point=coordinate(row),label=clean(row?.label,80),address=clean(row?.address,160),detail=clean(row?.detail,160),id=clean(row?.id,80);
  if(!point||row.kind==='current'||row.fixedAt||point.lat<46||point.lat>50||point.lon<9||point.lon>18||!label||!address||!/^[\w-]{1,80}$/.test(id)||names.has(labelKey(label))||ids.has(id))continue;
  names.add(labelKey(label));ids.add(id);out.push({id,label,address,detail,...point});
 }
 return out;
}
export function saveJourneyPlace(existing,input,{id=globalThis.crypto.randomUUID()}={}){
 const places=sanitizeJourneyPlaces(existing),editing=input?.id?places.find(p=>p.id===input.id):null;
 if(input?.id&&!editing)throw Error('Dieser Ort ist nicht mehr gespeichert.');
 const [place]=sanitizeJourneyPlaces([{...input,id:editing?.id||id}]);if(!place)throw Error('Bitte einen Namen und eine gefundene Adresse wählen.');
 if(places.some(p=>p.id!==place.id&&labelKey(p.label)===labelKey(place.label)))throw Error('Diesen Ortsnamen gibt es bereits.');
 if(!editing&&places.length>=30)throw Error('Du kannst höchstens 30 Orte speichern.');
 return {place,places:editing?places.map(p=>p.id===place.id?place:p):[place,...places]};
}
export function journeyPlacePoint(place){return {kind:'point',name:place.address,lat:place.lat,lon:place.lon,placeId:place.id};}
export function matchingJourneyPlace(places,point){
 if(point?.kind==='current'||!coordinate(point))return null;
 const same=p=>Math.abs(p.lat-point.lat)<.000001&&Math.abs(p.lon-point.lon)<.000001;
 return places.find(p=>p.id===point.placeId&&same(p))||places.find(p=>p.address===point.name&&same(p))||null;
}
export function journeyEndpointLabel(places,point){
 const place=matchingJourneyPlace(places,point);
 return place?{name:place.label,detail:place.label===place.address?'':place.address}:{name:point?.name||'',detail:''};
}
