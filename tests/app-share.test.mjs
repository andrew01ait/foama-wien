import test from 'node:test';
import assert from 'node:assert/strict';
import {APP_INVITATION,bindAppShare} from '../pwa/src/app-share.mjs';

function harness(navigator={}){
 const elements=new Map();
 const get=id=>{
  if(!elements.has(id))elements.set(id,{handlers:{},disabled:false,textContent:'',open:false,focused:false,selected:false,
   addEventListener(type,handler){this.handlers[type]=handler;},
   showModal(){this.open=true;},close(){this.open=false;},focus(){this.focused=true;},select(){this.selected=true;}});
  return elements.get(id);
 };
 const document={getElementById:get,location:{href:'https://foama-wien.endruuu.chatgpt.site/transfer.html?debugging=1#session=PRIVATE_TOKEN&key=PRIVATE_KEY'}};
 bindAppShare({document,navigator});
 return {get,click:id=>get(id).handlers.click()};
}

test('native app sharing sends only the public invitation after a click, never the current transfer URL',async()=>{
 const calls=[];const h=harness({share:async data=>calls.push(data)});
 assert.equal(calls.length,0);
 await h.click('shareApp');
 assert.deepEqual(calls,[{...APP_INVITATION}]);
 assert.ok(!JSON.stringify(calls).includes('PRIVATE_'));
 assert.equal(h.get('appShareDialog').open,false);
 assert.equal(h.get('shareApp').disabled,false);
});

test('cancelling native sharing does not copy, open another chooser or show an error',async()=>{
 let copies=0;const h=harness({share:async()=>{throw Object.assign(new Error('cancelled'),{name:'AbortError'});},clipboard:{writeText:async()=>copies++}});
 await h.click('shareApp');
 assert.equal(copies,0);assert.equal(h.get('appShareDialog').open,false);assert.equal(h.get('shareApp').disabled,false);
});

test('unsupported or blocked native sharing opens a public-link fallback without automatic transmission',async()=>{
 for(const navigator of [{},{share:async()=>{throw Object.assign(new Error('blocked'),{name:'NotAllowedError'});}}]){
  const h=harness(navigator);await h.click('shareApp');
  assert.equal(h.get('appShareDialog').open,true);
  assert.equal(h.get('appShareUrl').value,APP_INVITATION.url);
  const whatsapp=new URL(h.get('appShareWhatsApp').href);
  assert.equal(whatsapp.origin,'https://wa.me');
  assert.equal(whatsapp.searchParams.get('text'),APP_INVITATION.text+'\n'+APP_INVITATION.url);
  assert.ok(!whatsapp.href.includes('PRIVATE_'));
  await h.click('closeAppShare');assert.equal(h.get('appShareDialog').open,false);
 }
});

test('fallback copies only on explicit action and offers manual copying when clipboard permission fails',async()=>{
 const copies=[];const h=harness({clipboard:{writeText:async value=>copies.push(value)}});
 await h.click('shareApp');assert.equal(copies.length,0);
 await h.click('copyAppLink');assert.deepEqual(copies,[APP_INVITATION.url]);assert.equal(h.get('appShareStatus').textContent,'App-Link kopiert.');
 const blocked=harness({clipboard:{writeText:async()=>{throw Error('denied');}}});
 await blocked.click('shareApp');await blocked.click('copyAppLink');
 assert.equal(blocked.get('appShareUrl').selected,true);assert.equal(blocked.get('appShareUrl').focused,true);
 assert.equal(blocked.get('appShareStatus').textContent,'Bitte den markierten App-Link kopieren.');
});

test('a pending native share cannot open duplicate choosers and becomes usable again afterwards',async()=>{
 let resolve,calls=0;const h=harness({share:()=>{calls++;return new Promise(done=>resolve=done);}});
 const first=h.click('shareApp');assert.equal(h.get('shareApp').disabled,true);
 await h.click('shareApp');assert.equal(calls,1);
 resolve();await first;assert.equal(h.get('shareApp').disabled,false);
});
