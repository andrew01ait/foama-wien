import test from 'node:test';
import assert from 'node:assert/strict';
import {createFavoriteMenuController} from '../pwa/src/favorite-menu.mjs';
import {moveFavorite} from '../pwa/src/favorite-state.mjs';
import {favoriteKey} from '../pwa/src/core.mjs';

function fixture(){
 const events=()=>({handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},removeEventListener(type){delete this.handlers[type];}});
 const doc=events(),root=events();let menus=[];
 const make=key=>{const menu={dataset:{favoriteMenu:key},open:false};menu.summary={parentElement:menu,focus(options){menu.focused=options;},closest(selector){return selector.includes('> summary')?this:menu;}};menu.querySelector=()=>menu.summary;return menu;};
 menus=['a','b','c'].map(make);root.querySelectorAll=()=>menus;root.contains=menu=>menus.includes(menu);
 const control=createFavoriteMenuController({root,document:doc});
 return {control,doc,root,get menus(){return menus;},click(menu){root.handlers.click({target:menu.summary,preventDefault(){}});},toggle(menu){root.handlers.toggle({target:menu});},replace(){menus=menus.map(old=>{const menu=make(old.dataset.favoriteMenu);menu.open=control.isOpen(menu.dataset.favoriteMenu);return menu;});}};
}
test('opening another action menu closes the first immediately, before queued toggle events',()=>{
 const f=fixture(),[a,b]=f.menus;f.click(a);assert.equal(f.control.isOpen('a'),true);f.click(b);
 assert.equal(a.open,false);assert.equal(b.open,true);assert.equal(f.control.isOpen('b'),true);f.toggle(a);assert.equal(f.control.isOpen('b'),true);
 f.click(b);assert.equal(b.open,false);assert.equal(f.control.isOpen('b'),false);
});
test('move closure cannot be undone by a queued toggle from the old rendered card',()=>{
 const f=fixture(),old=f.menus[0];f.click(old);f.control.close();f.replace();old.open=true;f.toggle(old);
 assert.equal(f.menus.some(menu=>menu.open),false);assert.equal(f.control.isOpen('a'),false);
});
test('a refresh preserves one active menu and ignores removed-element events',()=>{
 const f=fixture(),old=f.menus[0];f.click(old);f.replace();old.open=false;f.toggle(old);
 assert.equal(f.control.isOpen('a'),true);assert.equal(f.menus.filter(menu=>menu.open).length,1);
});
test('outside click and Escape close menus; Escape returns focus without scrolling',()=>{
 const f=fixture(),menu=f.menus[0];f.click(menu);f.doc.handlers.click({target:{closest:()=>null}});assert.equal(menu.open,false);
 f.click(menu);let prevented=false;f.doc.handlers.keydown({key:'Escape',preventDefault(){prevented=true;}});
 assert.equal(menu.open,false);assert.equal(prevented,true);assert.deepEqual(menu.focused,{preventScroll:true});
});
test('notice disclosures and unrelated keys are unaffected; listeners can be removed',()=>{
 const f=fixture(),menu=f.menus[1];f.click(menu);f.toggle({dataset:{persistKey:'notice'},open:true});f.doc.handlers.keydown({key:'Enter'});assert.equal(f.control.isOpen('b'),true);
 f.control.destroy();assert.deepEqual(Object.keys(f.root.handlers),[]);assert.deepEqual(Object.keys(f.doc.handlers),[]);
});
const favorites=[{stopId:'one',route:'',towards:''},{stopId:'one',route:'46',towards:'Endstation'},{stopId:'two',route:'',towards:''}];
test('up/down round trips preserve every station and connection favorite and the original input',()=>{
 const key=favoriteKey(favorites[0]),moved=moveFavorite(favorites,key,1);assert.equal(moved.moved,true);assert.deepEqual(moved.favorites,[favorites[1],favorites[0],favorites[2]]);assert.notEqual(moved.favorites,favorites);
 assert.deepEqual(moveFavorite(moved.favorites,key,-1).favorites,favorites);assert.deepEqual(favorites.map(f=>f.stopId),['one','one','two']);
});
test('moving a saved identity after an earlier reorder targets that favorite, not its old index',()=>{
 const first=moveFavorite(favorites,favoriteKey(favorites[0]),1).favorites;
 assert.deepEqual(moveFavorite(first,favoriteKey(favorites[0]),1).favorites,[favorites[1],favorites[2],favorites[0]]);
});
test('first/last boundaries and invalid actions do not change or drop saved favorites',()=>{
 for(const [key,delta] of [[favoriteKey(favorites[0]),-1],[favoriteKey(favorites[2]),1],['missing',1],[favoriteKey(favorites[1]),0],[favoriteKey(favorites[1]),2],[favoriteKey(favorites[1]),NaN]]){
  const result=moveFavorite(favorites,key,delta);assert.equal(result.moved,false);assert.equal(result.favorites,favorites);
 }
});
