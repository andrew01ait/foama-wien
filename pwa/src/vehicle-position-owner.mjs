// Ownership of active position work, independent of passive cached line data.
// Claiming a new view synchronously stops the previous owner's requests first.
let current=null;
export function createVehiclePositionOwner(onSuperseded=()=>{}){
 const owner={active:()=>current===owner,claim(){if(current===owner)return;const previous=current;current=owner;previous?.stop();},release(){if(current===owner)current=null;},stop:onSuperseded};
 return owner;
}
