export function stationAddressMarkup(stop,data,approximate,{escape}={}){
 const value=data?.stations?.[stop?.id];
 if(value?.kind==='nearby-access'&&typeof value.address==='string'&&/^\d{4}$/.test(value.postcode)&&Number.isFinite(value.meters)&&value.meters>=0&&value.meters<=100){
  return `<strong>Adresse bei der Haltestelle</strong><br>${escape(value.address)} · ${escape(value.postcode)} Wien<small>Amtliche Zugangsadresse · ca. ${Math.round(value.meters)} m vom Haltepunkt. Keine bestätigte Stations-Postadresse.<br><a href="https://data.wien.gv.at" target="_blank" rel="noopener noreferrer">Datenquelle: Stadt Wien - data.wien.gv.at</a></small>`;
 }
 return approximate?`<strong>Straßenumgebung</strong><br>${escape(approximate.street)} · ${escape(approximate.postcode)} Wien<small>Für diesen Haltepunkt ist keine nahe amtliche Adresse mit Hausnummer verfügbar.</small>`:'Für diese Station ist keine Straßenadresse verfügbar.';
}
