export function googleMapsLocation(point){
 return `https://www.google.com/maps/search/?${new URLSearchParams({api:'1',query:`${point.lat},${point.lon}`})}`;
}
export function googleMapsWalk(destination,manualStart=null){
 const params=new URLSearchParams({api:'1',destination:`${destination.lat},${destination.lon}`,travelmode:'walking',dir_action:'navigate'});
 // Let the phone determine its current start; never substitute an old PWA fix.
 if(manualStart)params.set('origin',`${manualStart.lat},${manualStart.lon}`);
 return `https://www.google.com/maps/dir/?${params}`;
}
