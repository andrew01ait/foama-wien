// All user-facing JSON exports use the Vienna export date and application name.
export function jsonExportName(kind,date=new Date()){
 const parts=new Intl.DateTimeFormat('en',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const datePart=['year','month','day'].map(type=>parts.find(part=>part.type===type).value).join('');
 return `${datePart}_foama-wien-${kind}.json`;
}
