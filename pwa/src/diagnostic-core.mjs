/* foama-wien diagnostic helpers: no user position or personal favorites are collected. */
export const API_RATE_LIMIT_MS = 30_000;
export const MAX_DIAGNOSTIC_EVENTS = 30;
export const RBL_PATTERN = /^\d{1,7}$/;
export const DIRECT_MONITOR_URL = 'https://www.wienerlinien.at/ogd_realtime/monitor';
export const DIRECT_CATALOGUE_URL = 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-haltepunkte.csv';

export function validateRbl(value) {
  const id=String(value??'').trim();
  if(!RBL_PATTERN.test(id)) throw new Error('Bitte eine numerische RBL-/StopID (max. sieben Stellen) eingeben.');
  return id;
}
export function monitorUrl(id) {
  const url=new URL(DIRECT_MONITOR_URL);
  url.searchParams.set('stopId', validateRbl(id));
  return url.toString();
}
export function proxyMonitorUrl(base,id) {
  const b=String(base||'').trim().replace(/\/$/,'');
  if(!b)throw new Error('Bitte zuerst die HTTPS-Adresse des Proxys eingeben.');
  const url=new URL(b, 'https://example.invalid');
  if(url.protocol!=='https:' && !(url.hostname==='localhost'&&url.protocol==='http:'))throw new Error('Proxy muss HTTPS verwenden.');
  const endpoint=url.pathname.endsWith('/api')?'monitor':'api/monitor';
  return `${b}/${endpoint}?stopId=${encodeURIComponent(validateRbl(id))}`;
}
export function summarizeMonitor(body) {
  if(!Array.isArray(body?.data?.monitors)) {
    return {valid:false,reason:'Kein Array data.monitors – möglicherweise Fehlerantwort oder geändertes API-Format.',
      messageCode:body?.message?.messageCode??null,message:String(body?.message?.value??'').slice(0,180)};
  }
  const monitors=body.data.monitors,example=[];let lines=0,departures=0;
  for(const m of monitors){
    const p=m?.locationStop?.properties||{};
    for(const line of (Array.isArray(m?.lines)?m.lines:[])){
      lines++;
      const dep=Array.isArray(line?.departures?.departure)?line.departures.departure:[];
      departures+=dep.length;
      if(example.length<4){
        const d=dep[0]?.departureTime||{};
        example.push({station:String(p.title||'').slice(0,70),rbl:String(p.attributes?.rbl??''),
          line:String(line.name||'').slice(0,32),direction:String(line.towards||'').slice(0,85),
          firstDeparturePlan:d.timePlanned??null,firstDepartureReal:d.timeReal??null});
      }
    }
  }
  return {valid:true,monitorCount:monitors.length,lineCount:lines,departureCount:departures,examples:example};
}
export function summarizeCsv(text) {
  const lines=String(text).split(/\r?\n/);
  return {characters:String(text).length,approxRows:Math.max(0,lines.filter(Boolean).length-1),
    header:String(lines[0]||'').slice(0,250),looksLikeStopCsv:/stopid/i.test(lines[0]||'')};
}
export function classifyFetchError(error,aborted=false){
  if(aborted || error?.name==='AbortError')return {category:'timeout',message:'Zeitüberschreitung – der Server hat nicht rechtzeitig geantwortet.'};
  if(error instanceof TypeError)return {category:'browser-network',message:'Browser konnte die Antwort nicht lesen. Möglich: CORS, Netzwerkfehler oder Zugriffssperre. Der HTTP-Status ist dabei nicht sichtbar; allein daraus lässt sich CORS nicht beweisen.'};
  return {category:'other',message:String(error?.message||error).slice(0,350)};
}
export function sanitizeEvent(event){
  return {
    timestamp:String(event.timestamp||''),kind:String(event.kind||''),outcome:String(event.outcome||''),
    category:String(event.category||''),httpStatus:Number.isInteger(event.httpStatus)?event.httpStatus:null,
    responseType:String(event.responseType||''),contentType:String(event.contentType||''),
    elapsedMs:Number.isFinite(event.elapsedMs)?Math.round(event.elapsedMs):null,
    stopId:String(event.stopId||'').replace(/\D/g,'').slice(0,7),
    summary:event.summary??null,message:String(event.message||'').slice(0,380)
  };
}
export function appendDiagnostic(previous,next,max=MAX_DIAGNOSTIC_EVENTS){return [...(Array.isArray(previous)?previous:[]).map(sanitizeEvent),sanitizeEvent(next)].slice(-max);}
export function buildReport({events,environment,rawIncluded=false,raw=null,generatedAt=new Date().toISOString()}){
  const result={format:'foama-wien-api-diagnose-v1',generatedAt,app:'foama-wien',version:'0.11.1',
    privacy:'Keine GPS-Koordinaten, Favoriten, QR-Schlüssel oder Standortfreigabe protokolliert.',
    environment:{secureContext:Boolean(environment.secureContext),online:Boolean(environment.online),
      serviceWorkerControlled:Boolean(environment.serviceWorkerControlled),pageProtocol:String(environment.pageProtocol||'')},
    events:(events||[]).map(sanitizeEvent)};
  if(rawIncluded&&raw)result.optionalPublicTransportResponse={kind:raw.kind,body:String(raw.body).slice(0,30000),truncated:Boolean(raw.truncated)};
  return result;
}
