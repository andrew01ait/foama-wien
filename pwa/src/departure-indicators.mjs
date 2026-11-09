import {departureCorrection,departureIsFresh} from './departure-cache.mjs?v=0.6.6';

function current(d,now,hasError){
 return !!d&&!hasError&&d.provider==='wl'&&departureIsFresh(d,now)&&Date.parse(d.fetchedAt)<=now+30_000;
}
export function vehicleAccessibilityMarkup(d,{now=Date.now(),hasError=false}={}){
 if(!current(d,now,hasError)||d.barrierFree!==true||!['vehicle','line'].includes(d.barrierFreeSource))return '';
 return '<span class="vehicle-access" role="img" aria-label="Barrierefreies Fahrzeug laut Wiener Linien" title="Fahrzeug laut Wiener Linien barrierefrei. Das bestätigt nicht die Barrierefreiheit der Station oder des gesamten Wegs."><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="4" r="2"/><path d="M9 8h3l3 6h5M9 8l-1 7h8l3 6M7 11a6 6 0 1 0 7.5 8"/></svg></span>';
}
export function departureCorrectionMarkup(d,{now=Date.now(),hasError=false,compact=false}={}){
 if(!current(d,now,hasError))return '';
 const change=departureCorrection(d,now);if(!change)return '';
 const minutes=Math.max(1,Math.round(change.deltaMilliseconds/60_000)),clock=value=>new Date(value).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 const title='Für dieselbe geplante Abfahrt später gemeldet: '+clock(change.previousActual)+' → '+clock(change.actual)+' · Wiener Linien';
 return `<span class="departure-correction" title="${title}">${compact?'ca. +'+minutes+'′ neu':'Zeit korrigiert · ca. +'+minutes+' Min.'}</span>`;
}
