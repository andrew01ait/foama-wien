import test from 'node:test';
import assert from 'node:assert/strict';
import {googleMapsLocation,googleMapsWalk} from '../pwa/src/map-links.mjs';
test('Google walking navigation delegates current position to the phone instead of a stale app fix',()=>{
 const url=new URL(googleMapsWalk({lat:48.2,lon:16.3}));
 assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('api'),'1');
 assert.equal(url.searchParams.get('origin'),null);assert.equal(url.searchParams.get('destination'),'48.2,16.3');
 assert.equal(url.searchParams.get('travelmode'),'walking');assert.equal(url.searchParams.get('dir_action'),'navigate');
});
test('explicit manual navigation starts and location search preserve the chosen point',()=>{
 const url=new URL(googleMapsWalk({lat:48.2,lon:16.3},{lat:48.21,lon:16.31}));
 assert.equal(url.searchParams.get('origin'),'48.21,16.31');
 assert.equal(new URL(googleMapsLocation({lat:48.21,lon:16.31})).searchParams.get('query'),'48.21,16.31');
});
