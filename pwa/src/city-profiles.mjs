import {haversineMeters} from './core.mjs?v=0.11.28';

export const CITY_PREFERENCE='foama.cityPreference.v1';
export const CITY_PROFILES=Object.freeze({
 wien:{id:'wien',name:'Wien',brand:'foama-wien',center:{lat:48.2082,lon:16.3738},radius:16000,departures:'live',source:'Wiener Linien · Sollfahrplan'},
 graz:{id:'graz',name:'Graz',brand:'foama-graz',center:{lat:47.0707,lon:15.4395},radius:12000,departures:'live',source:'Transitous · Verbund Linie / Graz Linien'},
 linz:{id:'linz',name:'Linz',brand:'foama-linz',center:{lat:48.3069,lon:14.2858},radius:12000,departures:'live',source:'LINZ AG EFA · Transitous-Fahrplan'},
 salzburg:{id:'salzburg',name:'Salzburg',brand:'foama-salzburg',center:{lat:47.8095,lon:13.055},radius:10000,departures:'schedule',source:'Transitous · Fahrplan, keine Live-Prognose'}
});
export const cityPreference=value=>value==='auto'||Object.hasOwn(CITY_PROFILES,value)?value:'auto';
export const stopCity=stop=>stop?.city||(['graz','linz','salzburg'].find(city=>String(stop?.id||stop?.stopId||'').startsWith(city+':'))||'wien');
export function detectedCity(fix,{now=Date.now(),margin=0}={}){
 if(!Number.isFinite(fix?.lat)||!Number.isFinite(fix?.lon)||!Number.isFinite(fix.accuracy)||fix.accuracy<0||fix.accuracy>250||!Number.isFinite(fix.timestamp)||now-fix.timestamp>90000||fix.timestamp>now+1000)return null;
 const profile=Object.values(CITY_PROFILES).find(city=>haversineMeters(fix,city.center)+fix.accuracy<=city.radius-margin);
 return profile?.id||'wien';
}
// Session-only candidates contain city IDs/timestamps, never a GPS history.
export function createCityController({preference='auto',initialCity='wien',onChange=()=>{},now=()=>Date.now()}={}){
 let selected=cityPreference(preference),automatic=Object.hasOwn(CITY_PROFILES,initialCity)?initialCity:'wien',candidate=null,candidateAt=0,lastFix=null;
 const current=()=>selected==='auto'?automatic:selected;
 function emit(before){if(current()!==before)onChange(CITY_PROFILES[current()]);}
 function observe(fix,{visible=true,manual=false}={}){
  if(!visible||manual)return current();
  let target=detectedCity(fix,{now:now()});if(!target)return current();
  const before=current();lastFix=fix;
  if(target==='wien'&&automatic!=='wien'&&haversineMeters(fix,CITY_PROFILES[automatic].center)<=CITY_PROFILES[automatic].radius+fix.accuracy+1000)target=automatic;
  if(target===automatic){candidate=null;return current();}
  // A precise fix well inside another city's area can switch immediately.
  const strong=fix.accuracy<=50&&haversineMeters(fix,CITY_PROFILES[target].center)<CITY_PROFILES[target].radius-1000&&detectedCity(fix,{now:now(),margin:1000})===target;
  if(strong||candidate===target&&fix.timestamp-candidateAt>=5000){automatic=target;candidate=null;emit(before);}
  else if(candidate!==target){candidate=target;candidateAt=fix.timestamp;}
  return current();
 }
 return {current:()=>CITY_PROFILES[current()],automatic:()=>CITY_PROFILES[automatic],preference:()=>selected,observe,
  select(value){const before=current();selected=cityPreference(value);if(selected==='auto'&&lastFix&&detectedCity(lastFix,{now:now()})===null)automatic='wien';emit(before);return CITY_PROFILES[current()];}};
}
export function renderCityBrand(root,profile){
 for(const element of root.querySelectorAll('[data-city-suffix]'))element.textContent='-'+profile.id;
 for(const element of root.querySelectorAll('[data-city-brand]'))element.textContent=profile.brand;
 for(const element of root.querySelectorAll('[data-city-source]'))element.textContent=profile.source;
 if(root.title)root.title=root.title.replace(/foama-(?:wien|graz|linz|salzburg)/g,profile.brand);
 root.documentElement?.setAttribute('data-city',profile.id);
}
export async function loadCityCatalogue(city,{fetch=globalThis.fetch}={}){
 if(city==='wien'||!Object.hasOwn(CITY_PROFILES,city))return [];
 const response=await fetch(`./data/cities/${city}.json?v=0.11.28`,{credentials:'omit'});
 if(!response.ok)throw Error('Stadt-Haltestellen derzeit nicht verfügbar.');
 const data=await response.json();if(data?.city!==city||!Array.isArray(data.stops)||data.stops.length>3000)throw Error('Ungültiger Stadtkatalog');return data.stops;
}

export function recentDetectedCity(session=globalThis.sessionStorage,now=Date.now()){try{const entry=JSON.parse(session.getItem('foama.detectedCity.v1'));return entry&&now-entry.at>=0&&now-entry.at<=90000&&Object.hasOwn(CITY_PROFILES,entry.city)?entry.city:'wien';}catch{return 'wien';}}
