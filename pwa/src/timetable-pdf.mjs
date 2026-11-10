import {lineDayDepartures,hourlyTimetable} from './line-timetable.mjs?v=0.9.0';
import {timetableDate} from './timetable.mjs?v=0.9.0';

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
export function createTimetablePdf({manifest,rows,line,stops=line?.stops,day,towards='',wholeLine=false,now=Date.now()}){
 const date=Date.parse(day+'T12:00Z');
 if(!line||manifest?.version===undefined||!/^\d{4}-\d{2}-\d{2}$/.test(day||'')||!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==day||day<manifest.validFrom||day>manifest.validThrough||!Array.isArray(stops)||!stops.length)throw Error('Für dieses Datum liegt kein gültiger Fahrplan vor.');
 if(stops.some(stop=>!Array.isArray(rows?.[stop.id])))throw Error('Die Fahrplandaten sind unvollständig. Bitte die Linie zuerst vollständig laden.');
 const pages=[];let page=null,y=0;
 const text=(value,x,at,size=10,font='F1',color='0.08 0.18 0.25')=>page.push(`${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${at} Tm <${hex(clean(value))}> Tj ET`);
 function newPage(){
  page=[];pages.push(page);
  page.push('0.03 0.12 0.18 rg 36 773 523 40 re f');
  text('foama-wien  |  Linie '+line.route,48,789,17,'F2','1 1 1');
  text('Tagesfahrplan '+dateLabel(day)+(wholeLine?'  |  Alle Haltestellen alphabetisch':'  |  Gewählte Haltestelle'),40,754,10,'F2');
  text('Gültig '+dateLabel(manifest.validFrom)+' - '+dateLabel(manifest.validThrough)+'  |  Zeitzone Europe/Vienna',40,739,9);
  y=711;
 }
 function section(stop,continuation=false){
  for(const row of wrap(stop.name+(continuation?' (Fortsetzung)':''),52)){text(row,40,y,14,'F2');y-=18;}
  y-=5;
 }
 function nextPage(stop){newPage();section(stop,true);}
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
 const kids=[];
 for(const commands of pages){
  const stream=commands.join('\n'),content=objects.length;objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  const number=objects.length;kids.push(number+' 0 R');
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${content} 0 R >>`);
 }
 objects[2]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(' ')}] >>`;
 let output='%PDF-1.4\n',offsets=[0];
 for(let i=1;i<objects.length;i++){offsets.push(output.length);output+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
 const xref=output.length;
 output+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('');
 output+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return new TextEncoder().encode(output);
}
