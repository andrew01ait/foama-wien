import test from 'node:test';
import assert from 'node:assert/strict';
import {API_RATE_LIMIT_MS, validateRbl, monitorUrl, proxyMonitorUrl,
  summarizeMonitor, summarizeCsv, classifyFetchError, sanitizeEvent,
  appendDiagnostic,buildReport} from '../pwa/src/diagnostic-core.mjs';
test('Direct request is restricted to an official fixed endpoint and numeric StopID',()=>{
  assert.equal(monitorUrl('4111'),'https://www.wienerlinien.at/ogd_realtime/monitor?stopId=4111');
  assert.equal(validateRbl(' 4903 '),'4903');
  assert.throws(()=>monitorUrl('4111&stopId=123'));
  assert.throws(()=>monitorUrl('https://evil.example'));
  assert.equal(API_RATE_LIMIT_MS,30000);
});
test('Optional proxy uses HTTPS and correct /api path',()=>{
  assert.equal(proxyMonitorUrl('https://test.example','4111'),'https://test.example/api/monitor?stopId=4111');
  assert.equal(proxyMonitorUrl('https://test.example/api','4111'),'https://test.example/api/monitor?stopId=4111');
  assert.throws(()=>proxyMonitorUrl('http://www.example.com','4111'));
});
test('Public monitor response yields only bounded non-personal summary',()=>{
  const result=summarizeMonitor({data:{monitors:[{locationStop:{properties:{title:'Stephansplatz',attributes:{rbl:4111}}},lines:[{name:'U1',towards:'Leopoldau',departures:{departure:[{departureTime:{timePlanned:'2026-11-07T15:00:00+0100',timeReal:'2026-11-07T15:01:00+0100'}}]}}]}]}});
  assert.equal(result.valid,true);assert.equal(result.monitorCount,1);assert.equal(result.lineCount,1);assert.equal(result.departureCount,1);assert.equal(result.examples[0].line,'U1');
  assert.equal(summarizeMonitor({message:{messageCode:3,value:'Error'}}).valid,false);
});
test('CSV summary and ambiguous network failure are labelled clearly',()=>{
  assert.equal(summarizeCsv('StopID;DIVA;StopText\n4111;xx;Sample\n').approxRows,1);
  assert.equal(classifyFetchError(new TypeError('Failed to fetch')).category,'browser-network');
  assert.match(classifyFetchError(new TypeError('Failed to fetch')).message,/CORS/);
  assert.equal(classifyFetchError(new Error('other'),true).category,'timeout');
});
test('Diagnostic logs keep only allowed fields, no GPS / QR / favorites',()=>{
  const event={timestamp:'2026-11-07T10:00:00Z',kind:'monitor',outcome:'ok',httpStatus:200,
    stopId:'4111',gps:{lat:48.2,lon:16.3},favorites:['some route'],secret:'private',message:'okay'};
  const sanitized=sanitizeEvent(event);
  assert.equal(sanitized.gps,undefined);assert.equal(sanitized.secret,undefined);assert.equal(sanitized.favorites,undefined);
  assert.equal(appendDiagnostic(Array(30).fill(event),event).length,30);
  const report=buildReport({events:[event],environment:{secureContext:true,online:true,pageProtocol:'https:',serviceWorkerControlled:true},rawIncluded:false});
  assert.equal(report.optionalPublicTransportResponse,undefined);
  assert.equal(JSON.stringify(report).includes('private'),false);
});
test('Raw response goes into report only after explicit opt-in and length is capped',()=>{
  const env={secureContext:true,online:true,pageProtocol:'https:',serviceWorkerControlled:false};
  const raw={kind:'monitor',body:'x'.repeat(50000),truncated:true};
  assert.equal(buildReport({environment:env,events:[],rawIncluded:false,raw}).optionalPublicTransportResponse,undefined);
  assert.equal(buildReport({environment:env,events:[],rawIncluded:true,raw}).optionalPublicTransportResponse.body.length,30000);
});
