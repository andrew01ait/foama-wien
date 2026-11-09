import test from 'node:test';import assert from 'node:assert/strict';
import {b64urlEncode,b64urlDecode,getTransferHash,encryptTransfer,decryptTransfer} from '../pwa/src/transfer.mjs';
test('AES-GCM transfer roundtrip with a secret only in URL fragment',async()=>{
 const key=b64urlEncode(crypto.getRandomValues(new Uint8Array(32)));
 const hash=getTransferHash(`#session=${'a'.repeat(48)}&key=${key}`);
 assert.equal(hash.session.length,48);
 const incoming={format:'foama-favorites-v1',favorites:[{stopId:'wl:42',stopName:'Test',route:'29B',towards:'Floridsdorf'}]};
 const encrypted=await encryptTransfer(incoming,key);
 assert.ok(!JSON.stringify(encrypted).includes('Floridsdorf'));
 assert.deepEqual(await decryptTransfer(encrypted,key),incoming);
});
test('invalid QR key and tampered cryptogram rejected',async()=>{
 assert.throws(()=>getTransferHash('#session=abc&key=abc'));
 const key=b64urlEncode(crypto.getRandomValues(new Uint8Array(32)));
 const msg=await encryptTransfer({favorites:[]},key);
 const tampered=b64urlDecode(msg.ciphertext);tampered[0]^=1;const flipped=b64urlEncode(tampered);
 await assert.rejects(()=>decryptTransfer({...msg,ciphertext:flipped},key));
});
