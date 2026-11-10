import test from 'node:test';
import assert from 'node:assert/strict';
import {pdfRoutePatterns,pdfMapViewport,pdfMapPoint,pdfMapTiles,createPdfMapBackground} from '../pwa/src/timetable-pdf-map.mjs';
import {createTimetablePdf} from '../pwa/src/timetable-pdf.mjs';
const manifest={version:'v1',sourceSha256:'source',validFrom:'2026-11-01',validThrough:'2026-11-30',services:[['2026-11-10'],['2026-11-11']]};
const a={id:'wl:a',name:'Zweiter Halt',lat:48.2,lon:16.35},b={id:'wl:b',name:'Erster Halt',lat:48.21,lon:16.36},c={id:'wl:c',name:'Dritter Halt',lat:48.22,lon:16.37};
const line={route:'U6',mode:'metro',stops:[b,c,a]},rows=Object.fromEntries(line.stops.map(s=>[s.id,[['U6','Nord','metro','p','0',0,[3600]]]]));
const pattern=(id,stops,extra={})=>({id,direction:'0',towards:'Nord',services:[0],tripCount:10,stops,points:[],...extra});
const routeMap={...manifest,...line,patterns:[pattern('main',[a,b,c]),pattern('reverse',[c,b,a],{direction:'1',towards:'Süd'}),pattern('tomorrow',[a,c],{services:[1]})],shapes:{}};
const selection={manifest,line,routeMap,day:'2026-11-10',stopId:b.id,towards:'Nord'};
const readable=pdf=>Array.from(new TextDecoder().decode(pdf).matchAll(/<([a-f0-9]+)> Tj/g),m=>new TextDecoder('windows-1252').decode(Uint8Array.from(m[1].match(/../g),b=>parseInt(b,16)))).join('\n');
test('route appendix matches exact day, direction and station; whole line retains both directions and excludes tomorrow',()=>{
 assert.deepEqual(pdfRoutePatterns(selection).map(p=>p.id),['main']);
 assert.deepEqual(pdfRoutePatterns({...selection,wholeLine:true,stopId:'missing'}).map(p=>p.id),['main','reverse']);
 assert.deepEqual(pdfRoutePatterns({...selection,day:'2026-11-11',stopId:a.id}).map(p=>p.id),['tomorrow']);
 assert.equal(pdfRoutePatterns({...selection,stopId:'missing'}).length,0);
 assert.throws(()=>pdfRoutePatterns({...selection,routeMap:{...routeMap,version:'different'}}),/passen/);
});
test('map projection preserves geographic north/east and fits route points into one bounded print viewport',()=>{
 const patterns=pdfRoutePatterns({...selection,wholeLine:true}),view=pdfMapViewport(patterns),south=pdfMapPoint(view,[a.lat,a.lon]),north=pdfMapPoint(view,[c.lat,c.lon]);
 assert.ok(north.x>south.x&&north.y<south.y);
 for(const p of [south,north])assert.ok(p.x>=30&&p.x<view.width-30&&p.y>=30&&p.y<view.height-30);
 const tiles=pdfMapTiles(view);assert.ok(tiles.length>0&&tiles.length<=32);assert.equal(new Set(tiles.map(t=>t.url)).size,tiles.length);
 for(const tile of tiles)assert.match(tile.url,/^https:\/\/mapsneu\.wien\.gv\.at\/basemap\/geolandbasemap\/normal\/google3857\/\d+\/\d+\/\d+\.png$/);
});
test('offline export never requests map tiles, and explicit cancellation aborts rather than producing a late PDF',async()=>{
 let calls=0;assert.equal(await createPdfMapBackground(pdfMapViewport(pdfRoutePatterns(selection)),{online:false,fetch:()=>{calls++;}}),null);assert.equal(calls,0);
 const ctrl=new AbortController();ctrl.abort();await assert.rejects(createPdfMapBackground({}, {signal:ctrl.signal}),{name:'AbortError'});
});
test('PDF adds actual ordered stops and selected marker without inventing a shape; all hyperlinks and xref offsets are valid',()=>{
 const pdf=new TextDecoder().decode(createTimetablePdf({...selection,rows,stops:[b],selectedStopId:b.id})),text=readable(new TextEncoder().encode(pdf));
 assert.match(text,/Haltestellen in Fahrtfolge/);assert.ok(text.indexOf('Zweiter Halt')<text.indexOf('Erster Halt'));assert.match(text,/\* Erster Halt/);
 assert.match(text,/Fahrweg fehlt/);assert.match(text,/Ohne Straßenkartenhintergrund/);assert.match(pdf,/\/Subtype \/Link/);
 const xref=Number(pdf.match(/startxref\n(\d+)/)[1]);assert.equal(pdf.slice(xref,xref+4),'xref');
 const entries=pdf.slice(xref).match(/xref\n0 \d+\n([\s\S]*?)trailer/)[1].trimEnd().split('\n');entries.slice(1).forEach((entry,i)=>assert.ok(pdf.slice(Number(entry.slice(0,10))).startsWith(`${i+1} 0 obj\n`)));
});
test('a single raster background is shared across variant pages, with source attribution; mismatched map bounds fail',()=>{
 const patterns=pdfRoutePatterns({...selection,wholeLine:true}),viewport=pdfMapViewport(patterns),background={viewport,width:viewport.width,height:viewport.height,hex:'ffd8ffd9'};
 const bytes=createTimetablePdf({...selection,rows,wholeLine:true,mapBackground:background}),pdf=new TextDecoder().decode(bytes);
 assert.equal((pdf.match(/\/Subtype \/Image/g)||[]).length,1);assert.equal((pdf.match(/\/Map Do/g)||[]).length,2);assert.match(readable(bytes),/basemap.at \(CC BY 4.0\)/);
 assert.throws(()=>createTimetablePdf({...selection,rows,mapBackground:{...background,viewport:{...viewport,left:viewport.left+10}}}),/Ungültiger Kartenhintergrund/);
});
test('cancellation during background tile loading cancels pending work and never returns a partial map',async()=>{
 const ctrl=new AbortController();let calls=0;
 const document={createElement:()=>({getContext:()=>({fillRect(){}})})};
 const pending=createPdfMapBackground(pdfMapViewport(pdfRoutePatterns(selection)),{signal:ctrl.signal,document,bitmap:async()=>{},fetch:(_,options)=>{calls++;return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Stopped','AbortError')),{once:true}));}});
 ctrl.abort();await assert.rejects(pending,{name:'AbortError'});assert.ok(calls>0&&calls<=4);
});
test('very long ordered stop lists continue on additional A4 pages without losing their final stop or map link',()=>{
 const stops=Array.from({length:140},(_,i)=>({...a,id:'wl:long'+i,name:'Lange Haltestelle Nummer '+i+' mit zusätzlicher Beschreibung'}));
 const longMap={...routeMap,patterns:[pattern('long',stops)]};
 const pdf=createTimetablePdf({...selection,routeMap:longMap,rows,stops:[b],wholeLine:true});const text=readable(pdf),raw=new TextDecoder().decode(pdf);
 assert.match(text,/Fortsetzung/);assert.match(text,/Nummer 139/);assert.equal((raw.match(/\/Subtype \/Link/g)||[]).length,1);assert.ok(Number(raw.match(/\/Type \/Pages \/Count (\d+)/)[1])>3);
});
