export const DEBUG_KEY='foama.debug.v1';
const kinds=new Set(['monitor','routing','map','catalogue','app']);
const codes=new Set(['ok','upstream-http','http','network','timeout','invalid-data','unexpected']);
export function sanitizeDebugEvent(event={}){
 const number=value=>Number.isFinite(value)?Math.max(0,Math.min(100000,Math.round(value))):null;
 return {timestamp:Number.isFinite(Date.parse(event.timestamp))?new Date(event.timestamp).toISOString():new Date().toISOString(),
  kind:kinds.has(event.kind)?event.kind:'app',outcome:event.outcome==='ok'?'ok':'error',code:codes.has(event.code)?event.code:'unexpected',
  httpStatus:number(event.httpStatus),upstreamHttpStatus:number(event.upstreamHttpStatus),elapsedMs:number(event.elapsedMs),
  stopCount:number(event.stopCount),departureCount:number(event.departureCount),noticeCount:number(event.noticeCount)};
}
export function appendDebugEvent(previous,next){return [...(Array.isArray(previous)?previous:[]).map(sanitizeDebugEvent),sanitizeDebugEvent(next)].slice(-60);}
export function debugReport(events,environment={},version='0.11.29'){
 return {format:'foama-wien-debug-v1',generatedAt:new Date().toISOString(),app:'foama-wien',version,
  privacy:'Keine GPS-Koordinaten, Haltestellennamen/StopIDs, Favoriten, QR-Schlüssel, Standortfreigabe, URLs oder API-Rohantworten protokolliert.',
  environment:{secureContext:!!environment.secureContext,online:!!environment.online,serviceWorkerControlled:!!environment.serviceWorkerControlled,pageProtocol:environment.pageProtocol==='https:'?'https:':'http:'},
  events:(events||[]).map(sanitizeDebugEvent).slice(-60)};
}
