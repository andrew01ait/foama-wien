import {CITY_PROFILES} from '../../pwa/src/city-profiles.mjs';
import {motisPlanUrl,normalizeJourneys} from '../../pwa/src/journey-planning.mjs';

const BASE='https://api.transitous.org/';
const UA='foama-wien/0.11.8 (+https://foama-wien.endruuu.chatgpt.site; noncommercial open-source transit app)';
const headers={'content-type':'application/json;charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const answer=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
const clean=(value,n=160)=>String(value??'').trim().slice(0,n);
const point=value=>value&&Number.isFinite(value.lat)&&Number.isFinite(value.lon)&&value.lat>=46&&value.lat<=50&&value.lon>=9&&value.lon<=18;

// Only aggregate request counts, with no query, coordinates, IP or device ID.
// Count the current and previous 24 complete hour buckets (a conservative 25h
// window). The single conditional write is atomic even across Worker isolates.
export async function reserveJourneyRequest(db,{now=Date.now(),kind='plan'}={}){
 if(!db)return false;
 const hour=Math.floor(now/3600000),limit=kind==='plan'?700:500;
 try{
  const result=await db.prepare(`INSERT INTO foama_journey_budget (id,kind,hour,count)
   SELECT ?,?,?,1 WHERE COALESCE((SELECT SUM(count) FROM foama_journey_budget WHERE kind=? AND hour>=?),0)<?
   ON CONFLICT(id) DO UPDATE SET count=count+1`).bind(kind+':'+hour,kind,hour,kind,hour-24,limit).run();
  await db.prepare('DELETE FROM foama_journey_budget WHERE hour<?').bind(hour-25).run();
  return result.meta?.changes===1;
 }catch{return false;}
}

async function boundedJson(response,limit){
 if(Number(response.headers.get('content-length'))>limit)throw Error('Antwort des Planungsdienstes zu groß.');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('Antwort des Planungsdienstes zu groß.');chunks.push(value);}}
 catch(error){await reader.cancel().catch(()=>{});throw error;}
 const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export function geocodePlaces(payload){
 if(!Array.isArray(payload))throw Error('Ungültige Ortsantwort.');
 return payload.slice(0,16).map(match=>{
  const p=match?.place||match;
  const street=[clean(p?.street),clean(p?.houseNumber,20)].filter(Boolean).join(' '),kind=p?.type==='ADDRESS'?'address':p?.type==='STOP'?'stop':'place',name=clean(p?.name);
  const locality=(Array.isArray(p?.areas)?p.areas:[]).filter(area=>area?.unique&&area?.adminLevel>=4&&area.adminLevel<=9).map(area=>clean(area.name,60)).slice(0,2).join(' · ');
  return {name:clean(kind==='address'&&street?street:name),lat:p?.lat,lon:p?.lon,kind,detail:clean([p?.zip,locality].filter(Boolean).join(' '))};
 }).filter(p=>p.name&&point(p)).slice(0,6);
}

export async function journeyApi(request,env,{fetch=(input,options)=>globalThis.fetch(input,options),now=Date.now()}={}){
 if(request.method!=='POST')return answer({error:'Bitte die Verbindungssuche verwenden.'},405);
 const path=new URL(request.url).pathname,isPlan=path==='/api/journeys/plan',isWalk=path==='/api/journeys/walk';
 if(!isPlan&&!isWalk&&path!=='/api/journeys/places')return answer({error:'Nicht gefunden.'},404);
 if(new URL(request.url).search)return answer({error:'Suchangaben nur im Anfrageinhalt erlaubt.'},400);
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return answer({error:'JSON erforderlich.'},415);
 let body,url;
 try{
  body=await boundedJson(request,4096);
  if(isPlan){
   if(!point(body.from)||!point(body.to))throw Error('Start und Ziel in Österreich oder Umgebung auswählen.');
   const time=Date.parse(body.time);if(!Number.isFinite(time)||time<now-3600000||time>now+90*86400000)throw Error('Reisezeit muss zwischen jetzt und den nächsten 90 Tagen liegen.');
   url=motisPlanUrl(body,BASE);
  }else if(isWalk){
   const stop=(env.JOURNEY_STOPS||[]).find(stop=>stop.id===body.stopId),speed=Number(body.speed??4.5);
   if(!point(body.from)||!point(stop)||!Number.isFinite(speed)||speed<2.5||speed>7)throw Error('Start und Einstiegsstation prüfen.');
   const coords=p=>p.lat.toFixed(6)+';'+p.lon.toFixed(6);
   url=new URL('api/v1/one-to-many',BASE);url.search=new URLSearchParams({one:coords(body.from),many:coords(stop),mode:'WALK',max:'3600',maxMatchingDistance:'100',arriveBy:'false',withDistance:'true'}).toString();
  }else{
   const text=clean(body.text,161);if(text.length<3||text.length>160||/[\x00-\x1f]/.test(text))throw Error('Bitte einen Ort oder eine Adresse mit 3 bis 160 Zeichen eingeben.');
   url=new URL('api/v1/geocode',BASE);url.search=new URLSearchParams({text,language:'de',place:(Object.hasOwn(CITY_PROFILES,body.city)?CITY_PROFILES[body.city]:CITY_PROFILES.wien).center.lat+','+(Object.hasOwn(CITY_PROFILES,body.city)?CITY_PROFILES[body.city]:CITY_PROFILES.wien).center.lon,numResults:'6'}).toString();
  }
 }catch(error){return answer({error:error.message==='Antwort des Planungsdienstes zu groß.'?'Anfrage zu groß.':clean(error.message)},400);}
 if(!await reserveJourneyRequest(env.DB,{now,kind:isPlan||isWalk?'plan':'places'}))return answer({error:'Die gemeinsame Verbindungssuche ist derzeit ausgelastet. Bitte später erneut versuchen. Abfahrten und Favoriten bleiben verfügbar.'},429);
 const controller=new AbortController(),abort=()=>controller.abort();request.signal.addEventListener('abort',abort,{once:true});
 const timeout=setTimeout(abort,20000);
 let stage='fetch';
 try{
  if(request.signal.aborted)controller.abort();
  // workerd supports only manual/follow. Manual rejects redirects through the
  // status check below, keeping every request on the fixed public endpoint.
  const response=await fetch(url.href,{headers:{Accept:'application/json','User-Agent':UA},redirect:'manual',signal:controller.signal});
  if(!response.ok)return answer({error:response.status===429?'Transitous ist ausgelastet. Bitte später erneut versuchen.':'Transitous ist derzeit nicht verfügbar. Bitte später erneut versuchen.'},response.status===429?429:502);
  stage='parse';const payload=await boundedJson(response,2000000);stage='model';
  if(isWalk){
   const route=payload?.[0];if(!Number.isFinite(route?.duration)||!Number.isFinite(route.distance)||route.duration<0||route.duration>3600||route.distance<0||route.distance>15000)return answer({error:'Kein Fußweg innerhalb einer Stunde zur Einstiegsstation gefunden. Bitte neu planen.'},422);
   return answer({walk:{distanceMeters:route.distance,durationSeconds:route.distance/(Number(body.speed??4.5)/3.6),checkedAt:new Date(now).toISOString(),quality:'estimate'}});
  }
  return answer(isPlan?{journeys:normalizeJourneys(payload,{stops:env.JOURNEY_STOPS||[]}),plannedAt:new Date(now).toISOString(),provider:'Transitous'}:{places:geocodePlaces(payload)});
 }catch(error){
  const reason=controller.signal.aborted?'timeout':/Illegal invocation|incorrect.*this/i.test(String(error?.message))?'context':error instanceof SyntaxError?'invalid-json':'failed';
  const category='journey-'+stage+'-'+reason;
  console.error(category); // Fixed technical code only: never URLs, inputs or raw errors.
  return answer({error:controller.signal.aborted?'Verbindungssuche beendet oder Zeitüberschreitung. Bitte bei Bedarf erneut suchen.':'Planungsdienst derzeit nicht erreichbar. Bitte erneut versuchen.',category},502);
 }
 finally{clearTimeout(timeout);request.signal.removeEventListener('abort',abort);}
}
