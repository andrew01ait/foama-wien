// Read only the actual station cards inside the visible viewport; no position/sensor data.
export function visibleStationIds(root,{width=globalThis.innerWidth,height=globalThis.innerHeight}={}){
 const ids=new Set();if(!root)return ids;
 for(const card of root.querySelectorAll('[data-station-id]')){
  const rect=card.getBoundingClientRect();
  if(rect.width>0&&rect.height>0&&Math.min(rect.right,width)-Math.max(rect.left,0)>8&&Math.min(rect.bottom,height)-Math.max(rect.top,0)>8)ids.add(card.dataset.stationId);
 }
 return ids;
}
export function bindStationViewport(root,onChange,{window=globalThis.window}={}){
 let timer=null,previous='',stopped=false;
 const check=()=>{timer=null;if(stopped)return;const current=[...visibleStationIds(root,{width:window.innerWidth,height:window.innerHeight})].join('|');if(current!==previous){previous=current;onChange();}};
 const schedule=()=>{if(timer!==null)window.clearTimeout(timer);timer=window.setTimeout(check,120);};
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
 return {schedule,pause(){if(timer!==null)window.clearTimeout(timer);timer=null;},stop(){stopped=true;if(timer!==null)window.clearTimeout(timer);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);}};
}
