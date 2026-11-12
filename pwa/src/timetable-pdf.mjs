import {lineDayDepartures,hourlyTimetable} from './line-timetable.mjs?v=0.11.23';
import {timetableDate} from './timetable.mjs?v=0.11.23';
import {pdfRoutePatterns,pdfMapViewport,pdfMapPoint} from './timetable-pdf-map.mjs?v=0.11.23';
import {routeColor} from './journey-geometry.mjs?v=0.11.23';

// Standard PDF fonts use WinAnsi. All shipped Vienna station/destination names
// are checked against this encoding; never silently replace a user's text.
const decoder=new TextDecoder('windows-1252'),encoding=new Map();
for(let i=32;i<256;i++)encoding.set(decoder.decode(Uint8Array.of(i)),i);
const hex=value=>Array.from(String(value)).map(char=>{
 const code=encoding.get(char);if(code===undefined)throw Error('Ein Name enthält Zeichen, die im PDF nicht dargestellt werden können.');
 return code.toString(16).padStart(2,'0');
}).join('');
const dateLabel=value=>new Date(value+'T12:00Z').toLocaleDateString('de-AT',{timeZone:'Europe/Vienna'});
const clean=value=>String(value).replace(/[\r\n\t]+/g,' ').trim();
function wrap(value,limit){
 const rows=[];let row='';
 for(const word of clean(value).split(/\s+/)){
  if(row&&row.length+word.length+1>limit){rows.push(row);row='';}
  let rest=word;while(rest.length>limit){if(row){rows.push(row);row='';}rows.push(rest.slice(0,limit));rest=rest.slice(limit);}
  row+=(row?' ':'')+rest;
 }
 if(row)rows.push(row);return rows;
}
export function timetablePdfName({route,day,wholeLine=false,stopName='',now=Date.now()}){
 const safe=value=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,65);
 return `${timetableDate(now).replaceAll('-','')}_foama-wien_Fahrplan_${safe(route)}_${day.replaceAll('-','')}_${wholeLine?'ganze-Linie':safe(stopName)||'Haltestelle'}.pdf`;
}
export function createTimetablePdf({manifest,rows,line,stops=line?.stops,day,towards='',wholeLine=false,routeMap,mapBackground=null,selectedStopId=stops?.[0]?.id,now=Date.now()}){
 const date=Date.parse(day+'T12:00Z');
 if(!line||manifest?.version===undefined||!/^\d{4}-\d{2}-\d{2}$/.test(day||'')||!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==day||day<manifest.validFrom||day>manifest.validThrough||!Array.isArray(stops)||!stops.length)throw Error('Für dieses Datum liegt kein gültiger Fahrplan vor.');
 if(stops.some(stop=>!Array.isArray(rows?.[stop.id])))throw Error('Die Fahrplandaten sind unvollständig. Bitte die Linie zuerst vollständig laden.');
 const patterns=routeMap?pdfRoutePatterns({manifest,line,routeMap,day,stopId:selectedStopId,towards,wholeLine}):[];
 const viewport=patterns.length?pdfMapViewport(patterns):null;
 if(mapBackground&&(!viewport||JSON.stringify(mapBackground.viewport)!==JSON.stringify(viewport)||mapBackground.width!==viewport.width||mapBackground.height!==viewport.height||typeof mapBackground.hex!=='string'||mapBackground.hex.length>4_000_000||!/^([a-f0-9]{2})+$/.test(mapBackground.hex)))throw Error('Ungültiger Kartenhintergrund.');
 const pages=[],links=new Map();let page=null,y=0;
 const text=(value,x,at,size=10,font='F1',color='0.08 0.18 0.25')=>page.push(`${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${at} Tm <${hex(clean(value))}> Tj ET`);
 function newPage(kind='schedule'){
  page=[];pages.push(page);
  page.push('0.03 0.12 0.18 rg 36 773 523 40 re f');
  text('foama-wien  |  Linie '+line.route,48,789,17,'F2','1 1 1');
  text((kind==='route'?'Streckenführung':'Tagesfahrplan')+' '+dateLabel(day)+(kind==='route'?'  |  Haltestellen in Fahrtfolge':wholeLine?'  |  Alle Haltestellen alphabetisch':'  |  Gewählte Haltestelle'),40,754,10,'F2');
  text('Gültig '+dateLabel(manifest.validFrom)+' - '+dateLabel(manifest.validThrough)+'  |  Zeitzone Europe/Vienna',40,739,9);
  y=711;
 }
 function section(stop,continuation=false){
  for(const row of wrap(stop.name+(continuation?' (Fortsetzung)':''),52)){text(row,40,y,14,'F2');y-=18;}
  y-=5;
 }
 function nextPage(stop){newPage();section(stop,true);}
 function link(label,url,x,at,size=8){text(label,x,at,size,'F1','0.03 0.40 0.34');if(!links.has(page))links.set(page,[]);links.get(page).push({url,rect:[x,at-3,x+label.length*size*.6,at+size]});}
 function circle(x,at,r,fill='1 1 1',stroke='0.1 0.25 0.3'){
  const k=r*.55228475;page.push(`${fill} rg ${stroke} RG 1 w ${x+r} ${at} m ${x+r} ${at+k} ${x+k} ${at+r} ${x} ${at+r} c ${x-k} ${at+r} ${x-r} ${at+k} ${x-r} ${at} c ${x-r} ${at-k} ${x-k} ${at-r} ${x} ${at-r} c ${x+k} ${at-r} ${x+r} ${at-k} ${x+r} ${at} c B`);
 }
 const route=(/^N\d/.test(line.route)?'#162a63':routeColor(line.route,line.mode)).replace('#',''),ink=[0,2,4].map(i=>(parseInt(route.slice(i,i+2),16)/255).toFixed(3)).join(' ');
 for(const [variant,pattern] of patterns.entries()){
  newPage('route');
  const mapPage=page;
  for(const row of wrap('Richtung '+pattern.towards+' | Variante '+(variant+1)+'/'+patterns.length,79)){text(row,40,y,11,'F2');y-=15;}
  const mapX=40,mapY=115,mapW=300,mapH=535;
  page.push(`q ${mapX} ${mapY} ${mapW} ${mapH} re W n`);
  page.push(`0.95 0.97 0.96 rg ${mapX} ${mapY} ${mapW} ${mapH} re f`);
  if(mapBackground)page.push(`q ${mapW} 0 0 ${mapH} ${mapX} ${mapY} cm /Map Do Q`);
  else{
   page.push('0.84 0.89 0.89 RG .4 w');
   for(let x=mapX+30;x<mapX+mapW;x+=30)page.push(`${x} ${mapY} m ${x} ${mapY+mapH} l S`);
   for(let at=mapY+30;at<mapY+mapH;at+=30)page.push(`${mapX} ${at} m ${mapX+mapW} ${at} l S`);
  }
  const position=point=>{const p=pdfMapPoint(viewport,point);return {x:mapX+p.x/viewport.width*mapW,y:mapY+mapH-p.y/viewport.height*mapH};};
  if(pattern.points.length){page.push(`${ink} RG 2.5 w 1 J 1 j`);pattern.points.forEach((p,i)=>{const at=position(p);page.push(`${at.x.toFixed(2)} ${at.y.toFixed(2)} ${i?'l':'m'}`);});page.push('S');}
  const placed=[],points=pattern.stops.map(s=>position([s.lat,s.lon]));
  points.forEach((p,i)=>circle(p.x,p.y,pattern.stops[i].id===selectedStopId?5:2.4,pattern.stops[i].id===selectedStopId?'0.03 0.49 0.40':'1 1 1',ink));
  const labels=points.map((p,i)=>({...p,i})).sort((a,b)=>Number(pattern.stops[b.i].id===selectedStopId)-Number(pattern.stops[a.i].id===selectedStopId));
  for(const p of labels){const label=String(p.i+1),box={x:p.x+4,y:p.y+2,w:label.length*4.8,h:9};
   if(box.x+box.w>mapX+mapW-3||box.y+box.h>mapY+mapH-3||placed.some(b=>box.x<b.x+b.w+3&&box.x+box.w+3>b.x&&box.y<b.y+b.h+3&&box.y+box.h+3>b.y))continue;
   page.push(`1 1 1 rg ${box.x-1} ${box.y-1} ${box.w+2} ${box.h+1} re f`);text(label,box.x,box.y,8,'F2');placed.push(box);
  }
  page.push('Q');page.push(`0.5 0.6 0.64 RG .5 w ${mapX} ${mapY} ${mapW} ${mapH} re S`);
  text('N',mapX+mapW-14,mapY+mapH-15,9,'F2');
  text(pattern.stops.some(s=>s.id===selectedStopId)?'* Gewählte Haltestelle':'Haltestellen in Fahrtfolge',356,661,8,'F2','0.03 0.40 0.34');
  let listY=641,listX=356,limit=32;
  for(const [number,stop] of pattern.stops.entries()){
   const name=(stop.id===selectedStopId?'* ':'')+stop.name,wrapped=wrap(name,limit),height=wrapped.length*12+5;
   if(listY-height<80){newPage('route');text('Variante '+(variant+1)+' | '+pattern.towards+' (Fortsetzung)',40,y,11,'F2');listY=y-25;listX=40;limit=82;}
   const selected=stop.id===selectedStopId,mark=selected?'0.03 0.40 0.34':'0.08 0.18 0.25';
   text(String(number+1)+'.',listX,listY,9,'F2',mark);
   for(const row of wrap(name,limit)){text(row,listX+24,listY,9,selected?'F2':'F1',mark);listY-=12;}listY-=5;
  }
  // Links belong to the map page, even if the station list needed continuation.
  const current=page;page=mapPage;
  const mapUrl='https://foama-wien.endruuu.chatgpt.site/linienkarte.html?'+new URLSearchParams({linie:line.route,verkehrsmittel:line.mode,variante:pattern.id,...(selectedStopId?{halt:selectedStopId}:{})});
  link('Linie interaktiv auf der Karte öffnen',mapUrl,40,97);
  if(mapBackground)link('Kartenhintergrund: basemap.at (CC BY 4.0)','https://basemap.at/',40,82,7);
  else{text('Ohne Straßenkartenhintergrund - geografischer Verlauf.',40,82,7);}
  if(!pattern.points.length)text('Fahrweg fehlt: nur tatsächliche Haltepunkte eingezeichnet.',40,68,7);
  page=current;
 }
 if(routeMap&&!patterns.length){newPage('route');text('Für diese Auswahl fährt am gewählten Tag keine Streckenvariante.',40,y,10);}
 for(const stop of stops){
  newPage();section(stop);
  const departures=lineDayDepartures(manifest,rows,{route:line.route,mode:line.mode,stopId:stop.id,day,towards:wholeLine?'':towards});
  const destinations=[...new Set(departures.map(d=>d.towards))];
  if(!destinations.length){text('Keine geplanten Abfahrten für diese Auswahl.',40,y,11);continue;}
  for(const destination of destinations){
   const headings=wrap('Richtung: '+destination,79);
   if(y<100+headings.length*14)nextPage(stop);
   for(const row of headings){text(row,40,y,11,'F2');y-=15;}
   text('Stunde',48,y,9,'F2');text('Abfahrt in Minute',136,y,9,'F2');y-=16;
   for(const hour of hourlyTimetable(departures.filter(d=>d.towards===destination))){
    const minutes=wrap(hour.departures.map(d=>d.minute).join('  '),66),labels=wrap(hour.label,16);
    const height=Math.max(minutes.length,labels.length)*13+10;
    if(y-height<70){nextPage(stop);for(const row of wrap('Richtung: '+destination+' (Fortsetzung)',79)){text(row,40,y,11,'F2');y-=15;}}
    page.push(`0.91 0.95 0.96 rg 40 ${y-height+6} 515 ${height} re f`);
    labels.forEach((row,i)=>text(row,48,y-i*13,9,'F2'));
    minutes.forEach((row,i)=>text(row,136,y-i*13,10,'F3'));
    y-=height;
   }
   y-=17;
  }
 }
 const created=new Date(now).toLocaleString('de-AT',{timeZone:'Europe/Vienna',dateStyle:'short',timeStyle:'short'});
 pages.forEach((commands,i)=>{
  page=commands;
  text('Geplante Zeiten: Verspätungen, Ausfälle und kurzfristige Änderungen können fehlen.',40,49,8);
  text('Datenquelle: Stadt Wien - data.wien.gv.at | CC BY 4.0',40,36,8);
  text('Erstellt '+created+' | Fahrplanversion '+manifest.version,40,23,7);
  text('Seite '+(i+1)+' / '+pages.length,490,23,8);
 });
 // ASCII-only PDF syntax with byte-accurate xref offsets, real PDF download,
 // no print-dialog dependency, network calls or third-party PDF service.
 const objects=['','<< /Type /Catalog /Pages 2 0 R >>','',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'];
 let image=null;
 if(mapBackground){image=objects.length;const data=mapBackground.hex+'>';objects.push(`<< /Type /XObject /Subtype /Image /Width ${mapBackground.width} /Height ${mapBackground.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${data.length} >>\nstream\n${data}\nendstream`);}
 const kids=[];
 for(const commands of pages){
  const stream=commands.join('\n'),content=objects.length;objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  const annotations=(links.get(commands)||[]).map(link=>{const n=objects.length;objects.push(`<< /Type /Annot /Subtype /Link /Rect [${link.rect.join(' ')}] /Border [0 0 0] /A << /S /URI /URI <${hex(link.url)}> >> >>`);return n+' 0 R';});
  const number=objects.length;kids.push(number+' 0 R');
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> ${image?`/XObject << /Map ${image} 0 R >>`:''} >> /Contents ${content} 0 R ${annotations.length?`/Annots [${annotations.join(' ')}]`:''} >>`);
 }
 objects[2]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(' ')}] >>`;
 let output='%PDF-1.4\n',offsets=[0];
 for(let i=1;i<objects.length;i++){offsets.push(output.length);output+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
 const xref=output.length;
 output+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('');
 output+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return new TextEncoder().encode(output);
}
