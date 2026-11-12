import {journeyPathKey} from './journey-variants.mjs?v=0.11.31';
import {coordinate} from './journey-geometry.mjs?v=0.11.31';

export function mergeJourneyResults(results){
 const journeys=[],seen=new Set();
 for(const result of results)for(const journey of result?.journeys||[]){
  const key=journeyPathKey(journey)+'|'+journey.startTime+'|'+journey.endTime;
  if(!seen.has(key)){seen.add(key);journeys.push(journey);}
  if(journeys.length===16)return journeys;
 }
 return journeys;
}
const changes=j=>Number.isInteger(j.transfers)&&j.transfers>=0?j.transfers:Infinity;
export function rankedJourneyIndices(journeys,{preference='fastest',arriveBy=false}={}){
 const time=j=>arriveBy?-Date.parse(j.startTime):Date.parse(j.endTime);
 return journeys.map((j,index)=>({j,index})).filter(({j})=>!j.savedPath&&Number.isFinite(time(j))).sort((a,b)=>
  (preference==='transfers'?changes(a.j)-changes(b.j):0)||time(a.j)-time(b.j)||changes(a.j)-changes(b.j)||(a.j.walkSeconds||0)-(b.j.walkSeconds||0)||a.index-b.index
 ).map(row=>row.index);
}
export function compareJourneyOptions(journeys,{arriveBy=false}={}){
 const fastest=rankedJourneyIndices(journeys,{arriveBy})[0],fewest=rankedJourneyIndices(journeys,{arriveBy,preference:'transfers'})[0];
 if(fastest===undefined||fewest===undefined)return null;
 const a=journeys[fastest],b=journeys[fewest],difference=arriveBy?Date.parse(a.startTime)-Date.parse(b.startTime):Date.parse(b.endTime)-Date.parse(a.endTime);
 return {fastest,fewest,minutes:Math.max(0,Math.round(difference/60000)),fewerTransfers:Math.max(0,changes(a)-changes(b)),arriveBy,same:fastest===fewest};
}
// Opposite services can use other streets/stops: return endpoints for a new
// plan, never reverse old legs or manufacture an opposite headsign.
export function reverseJourneyEndpoints(from,to){
 const dynamic=p=>p?.kind==='current'||!!p?.fixedAt;
 if(!from||!to||(!dynamic(from)&&!coordinate(from))||(!dynamic(to)&&!coordinate(to)))throw Error('Bitte zuerst Start und Ziel wählen.');
 return {from:dynamic(to)?{kind:'current',name:'Dein Standort'}:{...to},to:dynamic(from)?null:{...from},requiresDestination:dynamic(from)};
}
