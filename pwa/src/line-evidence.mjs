export const CONFIRMATION_MS=30*86400_000;
export const EVIDENCE_RETENTION_MS=90*86400_000;
const modes=new Set(['metro','tram','bus','sbahn','regional','long']);
export const lineKey=line=>line.mode+'|'+line.route;
export function validEvidenceLine(line){return line&&typeof line.route==='string'&&line.route.trim().length>0&&line.route.length<=30&&modes.has(line.mode);}
export function mergeObservedLines(previous,incoming,now=Date.now()){
 const values=new Map();
 for(const line of previous||[])if(validEvidenceLine(line)&&Number.isFinite(line.lastSeen)&&now-line.lastSeen<=CONFIRMATION_MS)values.set(lineKey(line),{route:line.route,mode:line.mode,lastSeen:line.lastSeen});
 for(const line of incoming||[])if(validEvidenceLine(line))values.set(lineKey(line),{route:line.route,mode:line.mode,lastSeen:now});
 return [...values.values()];
}
export function evidenceForStation(entry,now=Date.now()){
 if(!entry||!Number.isFinite(entry.checkedAt)||entry.checkedAt>now+30_000||now-entry.checkedAt>EVIDENCE_RETENTION_MS)return [];
 const lines=(entry.lines||[]).filter(line=>validEvidenceLine(line)&&Number.isFinite(line.lastSeen)&&line.lastSeen<=now+30_000&&now-line.lastSeen<=EVIDENCE_RETENTION_MS).map(line=>({route:line.route,mode:line.mode,lastSeen:line.lastSeen}));
 const suppressed=(entry.suppressed||[]).filter(validEvidenceLine).map(line=>({route:line.route,mode:line.mode,suppressed:true}));
 return [...lines,...suppressed];
}
