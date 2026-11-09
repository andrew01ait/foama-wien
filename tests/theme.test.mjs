import test from 'node:test';
import assert from 'node:assert/strict';
import {createThemeController} from '../pwa/src/theme.mjs';
import {mergeSettings} from '../pwa/src/core.mjs';
function fixture(){
 let listener=null;const buttons=['system','dark','light'].map(value=>({dataset:{themeChoice:value},setAttribute(key,value){this[key]=value;}}));
 const meta={setAttribute(key,value){this[key]=value;}};
 const doc={documentElement:{dataset:{},style:{}},querySelector:()=>meta,querySelectorAll:()=>buttons};
 const media={matches:false,addEventListener(type,fn){listener=fn;},removeEventListener(){listener=null;}};
 return {doc,media,meta,buttons,win:{matchMedia:()=>media},change(value){media.matches=value;listener?.();}};
}
test('system theme follows changes and updates browser chrome and the selected control',()=>{
 const f=fixture(),control=createThemeController(f);assert.equal(control.effective,'light');assert.equal(f.meta.content,'#edf4f7');
 assert.deepEqual(f.buttons.map(b=>b['aria-pressed']),['true','false','false']);
 f.change(true);assert.equal(control.effective,'dark');assert.equal(f.doc.documentElement.style.colorScheme,'dark');assert.equal(f.meta.content,'#0e2538');
});
test('explicit choices override system changes and returning to System resumes following them',()=>{
 const f=fixture(),control=createThemeController(f);control.set('dark');f.change(false);assert.equal(control.effective,'dark');
 control.set('light');f.change(true);assert.equal(control.effective,'light');assert.deepEqual(f.buttons.map(b=>b['aria-pressed']),['false','false','true']);
 control.set('system');assert.equal(control.effective,'dark');control.dispose();f.change(false);assert.equal(control.effective,'dark');
});
test('theme preferences validate without changing existing local settings',()=>{
 assert.equal(mergeSettings({theme:'dark',favoriteSort:'distance',radius:450}).theme,'dark');
 assert.equal(mergeSettings({theme:'invalid'}).theme,'system');assert.equal(mergeSettings({}).theme,'system');
});
