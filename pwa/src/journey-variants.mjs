const direction=value=>String(value||'').replace(/^Wien\s+/i,'').trim().toLocaleLowerCase('de-AT');
const place=p=>p?.stopId||direction(p?.name);
const rideKey=leg=>JSON.stringify([leg.mode,leg.route,place(leg.from),place(leg.to),direction(leg.towards),leg.staySeated===true]);
export function journeyPathKey(value){const legs=Array.isArray(value)?value:value?.legs||[],rides=legs.filter(leg=>leg.mode!=='walk');return JSON.stringify(rides.length?rides.map(rideKey):legs.map(leg=>[place(leg.from),place(leg.to)]));}
export function journeyFamily(journeys,selected,{limit=16}={}){
 const result=[],seen=new Set();for(const journey of [selected,...journeys]){if(!journey?.legs?.length)continue;const key=journeyPathKey(journey);if(seen.has(key))continue;seen.add(key);result.push(journey);if(result.length>=limit)break;}return result;
}
export function journeyBranch(base,candidate){
 const rides=value=>(value?.legs||[]).flatMap((leg,index)=>leg.mode==='walk'?[]:[{leg,index}]);const a=rides(base),b=rides(candidate);let common=0;
 while(common<a.length&&common<b.length&&rideKey(a[common].leg)===rideKey(b[common].leg))common++;
 if(common===a.length&&common===b.length)return null;
 return {common,baseLegIndex:a[common]?.index??Math.max(0,(base?.legs?.length||1)-1),candidateLegIndex:b[common]?.index??Math.max(0,(candidate?.legs?.length||1)-1),anchor:common?a[common-1].leg.to:null};
}
