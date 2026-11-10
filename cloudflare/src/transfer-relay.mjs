// Temporary encrypted handoff. The relay never receives the AES key or plaintext.
const TTL=600000,MAX_BODY=50000;
const headers={'content-type':'application/json;charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
const error=(message,status=400)=>reply({error:message},status);
const validToken=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{32}$/.test(s);
const validSecret=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{32}$/.test(s);
const KNOWN_CAPABILITIES=['journey-favorites-v1','journey-alternatives-v1','city-profiles-v1'];
function capabilities(value){try{const rows=Array.isArray(value)?value:value==='journey-favorites-v1'?[value]:JSON.parse(value||'[]');return KNOWN_CAPABILITIES.filter(key=>Array.isArray(rows)&&rows.includes(key));}catch{return [];}}
export async function transferHash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function purgeTransfers(db,now=Date.now()){if(db)await db.prepare('DELETE FROM foama_transfers WHERE expires <= ?').bind(now).run();}
async function bodyJson(request){
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw Error('JSON erwartet');
 const reader=request.body?.getReader();if(!reader)throw Error('JSON erwartet');let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY){await reader.cancel();throw Error('Nutzlast zu groß');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function transferRelay(request,env,now=Date.now()){
 const db=env.DB;if(!db)return error('Transferdienst nicht erreichbar',503);
 try{
  await purgeTransfers(db,now);
  const path=new URL(request.url).pathname;
  if(path==='/api/transfer/session'){
   if(request.method!=='POST')return error('Methode nicht erlaubt',405);
   const value=await bodyJson(request);
   if(!validToken(value.token)||!/^[a-f0-9]{64}$/.test(value.readHash||'')||!/^[a-f0-9]{64}$/.test(value.writeHash||'')||!['to-watch','to-phone'].includes(value.direction))return error('Ungültige Transfersitzung');
   const id=await transferHash(value.token),expires=now+TTL,capabilitiesValue=JSON.stringify(capabilities(value.capabilities));
   const result=await db.prepare("INSERT OR IGNORE INTO foama_transfers (id,read_hash,write_hash,expires,state,direction,capabilities) SELECT ?,?,?,?,'waiting',?,? WHERE (SELECT count(*) FROM foama_transfers) < 256").bind(id,value.readHash,value.writeHash,expires,value.direction,capabilitiesValue).run();
   if(!result.meta.changes)return error('Neue Transfersitzung auf der Uhr starten',409);
   return reply({created:true,expiresAt:expires,direction:value.direction},201);
  }
  const match=path.match(/^\/api\/transfer\/([A-Za-z0-9_-]{32})$/);if(!match)return error('Ungültiger Transferlink');
  const secret=request.headers.get('X-Transfer-Secret');if(!validSecret(secret))return error('Ungültige Transferfreigabe',403);
  const id=await transferHash(match[1]),record=await db.prepare('SELECT * FROM foama_transfers WHERE id = ? AND expires > ?').bind(id,now).first();
  if(!record)return error('Transfersitzung beendet oder abgelaufen',410);
  const hash=await transferHash(secret),read=hash===record.read_hash,write=hash===record.write_hash;
  if(!read&&!write)return error('Ungültige Transferfreigabe',403);
  if(request.method==='GET')return reply({status:record.state,expiresAt:record.expires,direction:record.direction,capabilities:capabilities(record.capabilities),...(read&&record.state==='ready'?JSON.parse(record.payload):{})});
  if(request.method==='PUT'){
   if(!write)return error('Keine Sendefreigabe',403);
   const data=await bodyJson(request);
   if(!/^[A-Za-z0-9_-]{16}$/.test(data.iv||'')||!/^[A-Za-z0-9_-]{22,48000}$/.test(data.ciphertext||'')||Object.keys(data).some(k=>!['iv','ciphertext'].includes(k)))return error('Ungültige verschlüsselte Nutzlast');
   const result=await db.prepare("UPDATE foama_transfers SET state='ready',payload=? WHERE id=? AND state='waiting' AND expires>?").bind(JSON.stringify({iv:data.iv,ciphertext:data.ciphertext}),id,now).run();
   return result.meta.changes?reply({uploaded:true,expiresAt:record.expires}):error('Transfer bereits gesendet oder beendet',409);
  }
  if(request.method==='DELETE'){
   // Erase ciphertext immediately; retain only a non-sensitive receipt until expiry.
   await db.prepare("UPDATE foama_transfers SET state='done',payload=NULL WHERE id=?").bind(id).run();return reply({deleted:true});
  }
  return error('Methode nicht erlaubt',405);
 }catch(e){return error(e?.message==='Nutzlast zu groß'?'Nutzlast zu groß':'Transfer nicht verfügbar',e?.message==='Nutzlast zu groß'?413:400);}
}
