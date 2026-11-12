import {haversineMeters} from './core.mjs?v=0.11.16';

// Public street reference points only. The user's position never leaves this lookup.
export function createAddressLookup(data){
  const bins=new Map();
  for(const point of data.points||[]){const key=`${Math.floor(point[0]/1000)},${Math.floor(point[1]/1000)}`;
    if(!bins.has(key))bins.set(key,[]);bins.get(key).push(point);
  }
  return position=>{
    if(!position)return null;
    const y=Math.floor(position.lat*100),x=Math.floor(position.lon*100);let best=null,meters=Infinity;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(const p of bins.get(`${y+dy},${x+dx}`)||[]){
      const distance=haversineMeters(position,{lat:p[0]/100000,lon:p[1]/100000});
      if(distance<meters){best=p;meters=distance;}
    }
    if(!best||meters>750)return null;
    const [street,postcode]=data.streets[best[2]];
    return {street,postcode,meters,text:`Umgebung ${street} · ${postcode} Wien`};
  };
}
