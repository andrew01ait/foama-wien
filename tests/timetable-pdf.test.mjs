import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimetablePdf,timetablePdfName} from '../pwa/src/timetable-pdf.mjs';

const manifest={format:1,city:'wien',timezone:'Europe/Vienna',version:'test',validFrom:'2026-10-25',validThrough:'2026-11-12',services:[['2026-11-10'],['2026-10-25']]};
const line={route:'U1',mode:'metro',stops:[{id:'wl:1',name:'Währinger Straße (West)'},{id:'wl:2',name:'Südtiroler Platz'}]};
const rows={'wl:1':[['U1','Nord','metro','p','0',0,[3600,43200]],['U1','Süd','metro','p','1',0,[45000]]],'wl:2':[['U1','Nord','metro','p','0',0,[43260]]]};
const options={manifest,rows,line,stops:[line.stops[0]],day:'2026-11-10',now:Date.parse('2026-11-10T12:00Z')};
const readable=pdf=>Array.from(new TextDecoder().decode(pdf).matchAll(/<([a-f0-9]+)> Tj/g),match=>new TextDecoder('windows-1252').decode(Uint8Array.from(match[1].match(/../g),byte=>parseInt(byte,16)))).join('\n');
test('download is a real A4 PDF with byte-correct cross references, German names, provenance and selected direction',()=>{
 const bytes=createTimetablePdf({...options,towards:'Nord'}),pdf=new TextDecoder().decode(bytes),text=readable(bytes);
 assert.match(pdf,/^%PDF-1\.4/);assert.match(pdf,/MediaBox \[0 0 595\.28 841\.89\]/);assert.match(text,/Währinger Straße \(West\)/);assert.match(text,/Richtung: Nord/);assert.doesNotMatch(text,/Richtung: Süd/);assert.match(text,/Geplante Zeiten/);assert.match(text,/CC BY 4\.0/);
 const xref=Number(pdf.match(/startxref\n(\d+)/)[1]);assert.equal(pdf.slice(xref,xref+4),'xref');
 const table=pdf.slice(xref).match(/xref\n0 (\d+)\n([\s\S]*?)trailer/);const entries=table[2].trimEnd().split('\n');assert.equal(entries.length,Number(table[1]));
 entries.slice(1).forEach((entry,i)=>assert.equal(pdf.slice(Number(entry.slice(0,10)),Number(entry.slice(0,10))+String(i+1).length+6),`${i+1} 0 obj`));
});
test('whole-line PDF contains all stations and all directions; missing packets and invalid dates fail explicitly',()=>{
 const text=readable(createTimetablePdf({...options,stops:line.stops,wholeLine:true,towards:'Nord'}));
 assert.match(text,/Südtiroler Platz/);assert.match(text,/Richtung: Süd/);assert.match(text,/Alle Haltestellen alphabetisch/);
 assert.throws(()=>createTimetablePdf({...options,stops:line.stops,rows:{'wl:1':rows['wl:1']}}),/unvollständig/);
 for(const day of ['2026-11-13','2026-02-30','invalid'])assert.throws(()=>createTimetablePdf({...options,day}),/gültiger Fahrplan/);
});
test('PDF retains both occurrences of the autumn hour and paginates long names and multiple stations',()=>{
 const autumn={'wl:1':[['U1','Nord','metro','p','0',1,[3600,7200]]]};const bytes=createTimetablePdf({...options,rows:autumn,day:'2026-10-25'}),text=readable(bytes);
 assert.match(text,/MESZ/);assert.match(text,/MEZ/);
 const many=Array.from({length:20},(_,i)=>({id:'wl:1',name:'Währinger Straße '+i}));const large=new TextDecoder().decode(createTimetablePdf({...options,stops:many,wholeLine:true}));assert.match(large,/\/Count 20 /);
});
test('PDF filenames use the Vienna export date, application name and chosen timetable day',()=>{
 assert.equal(timetablePdfName({route:'U1',day:'2026-11-11',stopName:'Südtiroler Platz',now:Date.parse('2026-11-09T23:30Z')}),'20261110_foama-wien_Fahrplan_U1_20261111_Sudtiroler-Platz.pdf');
 assert.match(timetablePdfName({route:'../x',day:'2026-11-10',wholeLine:true}),/^\d{8}_foama-wien_Fahrplan_x_20261110_ganze-Linie\.pdf$/);
});
