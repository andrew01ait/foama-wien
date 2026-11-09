import test from 'node:test';import assert from 'node:assert/strict';
import {b64urlEncode,encryptTransfer,decryptTransfer,getTransferHash} from '../pwa/src/transfer.mjs';
test('AES-256-GCM QR transfer roundtrip and URL fragment',async()=>{
 const key=b64urlEncode(crypto.getRandomValues(new Uint8Array(32)));
 const data={format:'foama-favorites-v1',favorites:[{stopId:'wl:123',route:'U1',towards:'Leopoldau'}]};
 const session='ABCDEFGHIJKLmnopQRSTuvwx';
 assert.deepEqual(getTransferHash('#session='+session+'&key='+key),{session,key});
 const ciphertext=await encryptTransfer(data,key);
 assert.doesNotMatch(JSON.stringify(ciphertext),/Leopoldau/);
 const restored=await decryptTransfer(ciphertext,key);
 assert.deepEqual(restored,data);
 await assert.rejects(decryptTransfer(ciphertext,b64urlEncode(crypto.getRandomValues(new Uint8Array(32)))));
});
