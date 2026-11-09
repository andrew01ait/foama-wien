import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MODE_CHOICES,modeButtonMarkup,compactFiltersMarkup,bindModeToggles,bindLocationDisclosure} from '../pwa/src/transport-controls.mjs';

test('collapsed filters keep all six modes reachable, including switched-off modes',()=>{
 const html=compactFiltersMarkup({metro:true,tram:false,bus:false,sbahn:true,regional:false,long:false},600);
 assert.equal((html.match(/data-mode=/g)||[]).length,6);assert.equal((html.match(/aria-pressed="false"/g)||[]).length,4);assert.equal((html.match(/<svg /g)||[]).length,6);assert.match(html,/600 m/);
 for(const [,label] of MODE_CHOICES)assert.ok(html.includes(`aria-label="${label}"`));
 assert.ok(!html.includes('<img'));assert.equal(modeButtonMarkup('unknown',true),'');
});
test('icon clicks toggle once and stop propagation to any enclosing disclosure',()=>{
 const handlers={},calls=[];const button={dataset:{mode:'bus'}};
 const root={addEventListener:(type,fn)=>handlers[type]=fn,contains:target=>target===button};bindModeToggles(root,mode=>calls.push(mode));
 let prevented=0,stopped=0;handlers.click({target:{closest:()=>button},preventDefault(){prevented++;},stopPropagation(){stopped++;}});
 assert.deepEqual(calls,['bus']);assert.equal(prevented,1);assert.equal(stopped,1);
});
test('delegated filter ignores unrelated, unknown and foreign buttons',()=>{
 const handlers={},calls=[];const root={addEventListener:(type,fn)=>handlers[type]=fn,contains:button=>!button.foreign};bindModeToggles(root,mode=>calls.push(mode));
 for(const button of [null,{dataset:{mode:'unknown'}},{dataset:{mode:'metro'},foreign:true}])handlers.click({target:{closest:()=>button}});
 assert.equal(calls.length,0);
});
test('location details start collapsed and expand independently without persistence or GPS',()=>{
 const handlers={},attrs={};const button={setAttribute:(key,value)=>attrs[key]=value,addEventListener:(type,fn)=>handlers[type]=fn};const body={hidden:false},chevron={textContent:''};
 bindLocationDisclosure(button,body,chevron);assert.equal(body.hidden,true);assert.equal(attrs['aria-expanded'],'false');
 handlers.click();assert.equal(body.hidden,false);assert.equal(attrs['aria-expanded'],'true');assert.equal(chevron.textContent,'⌃');
 handlers.click();assert.equal(body.hidden,true);assert.equal(attrs['aria-expanded'],'false');
});
test('initial HTML hides location details before JavaScript loads and keeps filter buttons separate',async()=>{
 const html=await readFile(new URL('../pwa/index.html',import.meta.url),'utf8');assert.match(html,/<div id="locationBody" hidden>/);assert.match(html,/id="toggleLocation"[^>]*aria-expanded="false"/);assert.match(html,/<div id="filterSummary"[^>]*hidden>/);
 const sw=await readFile(new URL('../pwa/sw.js',import.meta.url),'utf8');assert.ok(sw.includes('./src/transport-controls.mjs'));
});
