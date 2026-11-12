import {vehicleWindows,stationVehicleRange} from './vehicle-data.mjs?v=0.11.24';

// One line session, independent of its map/schema/station presentation. A
// selected area gets the next evidence samples; other areas still rotate.
export function createVehicleLineScope(direction,{focusStop=null,now=()=>Date.now()}={}){
 const windows=vehicleWindows(direction),samples=windows.map(()=>[]),key=ids=>[...ids].sort().join(','),keys=windows.map(w=>key(w.ids));
 let cursor=0,priority=-1,remaining=0;
 function prioritize(stopId){
  const range=stationVehicleRange(direction,stopId);priority=-1;remaining=0;if(!range)return;
  let best=-1;for(let i=0;i<windows.length;i++){const w=windows[i],contains=range.center>=w.start&&range.center<=w.end+1,overlap=Math.max(0,Math.min(range.end,w.end)-Math.max(range.start,w.start)+1),score=(contains?1000:0)+overlap;if(score>best){best=score;priority=i;}}
  if(priority>=0){const fresh=samples[priority].filter(at=>now()-at<=90_000);remaining=Math.max(1,2-fresh.length);}
 }
 function ids(){return windows[remaining>0?priority:cursor]?.ids||[];}
 function started(stops){const index=keys.indexOf(key(stops));if(index<0)return;if(index===priority&&remaining>0)remaining--;cursor=(index+1)%windows.length;}
 function received(stops,at){const index=keys.indexOf(key(stops));if(index<0||!Number.isFinite(at)||samples[index].includes(at))return;samples[index].push(at);samples[index].sort((a,b)=>a-b);samples[index].splice(0,Math.max(0,samples[index].length-2));}
 prioritize(focusStop);return {windows,ids,started,received,prioritize};
}
