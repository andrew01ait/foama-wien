#!/usr/bin/env python3
"""Browser UI smoke test with synthetic data: no real API/network calls."""
import base64,json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]/'pwa'
read=lambda name:(ROOT/name).read_text()
module_url=lambda code:'data:text/javascript;base64,'+base64.b64encode(code.encode()).decode()
core=module_url(read('src/diagnostic-core.mjs'))
js=read('src/diagnostics.mjs').replace("from './diagnostic-core.mjs?v=0.1.13'",f'from "{core}"')
html=read('diagnose.html').replace('<link rel="stylesheet" href="./style.css">','').replace('<link rel="stylesheet" href="./diagnose.css">','').replace('<script type="module" src="./src/diagnostics.mjs?v=0.1.13"></script>','')
wl={'data':{'monitors':[{'locationStop':{'properties':{'title':'Stephansplatz','attributes':{'rbl':4111}}},'lines':[{'name':'U1','type':'ptMetro','towards':'Leopoldau','departures':{'departure':[{'departureTime':{'timePlanned':'2026-11-07T10:00:00+0100','timeReal':'2026-11-07T10:01:00+0100'}}]}}]}]}}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded')
 page.add_style_tag(content=read('style.css')+'\n'+read('diagnose.css'))
 page.evaluate('''({wl})=>{
   const storage=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return storage.get(k)||null;},setItem(k,v){storage.set(k,String(v));},removeItem(k){storage.delete(k);}}});
   window.fetch=async function(url){const u=String(url);if(u.includes('/ogd_realtime/monitor'))return new Response(JSON.stringify(wl),{status:200,headers:{'Content-Type':'application/json'}});if(u.includes('config.json'))return new Response(JSON.stringify({version:'0.1.1'}),{status:200,headers:{'Content-Type':'application/json'}});throw Error('Unexpected request '+u);};
 }''',{'wl':wl})
 page.add_script_tag(type='module',content=js)
 page.locator('#testMonitor').click()
 page.locator('.diag-success').first.wait_for(timeout=10000)
 assert 'HTTP 200' in page.locator('#activity').inner_text()
 assert '1 Monitore' in page.locator('#results').inner_text()
 page.locator('#testMonitor').click()
 assert 'warten' in page.locator('#activity').inner_text()
 assert page.locator('#eventsCount').inner_text()=='1'
 page.locator('#testHosting').click()
 page.wait_for_function("document.querySelector('#activity').textContent.includes('Website-Dateien direkt erreichbar')")
 assert 'Website-Dateien direkt erreichbar' in page.locator('#activity').inner_text()
 page.locator('#includeRaw').check()
 with page.expect_download() as dl_info:page.locator('#downloadLog').click()
 report=json.loads(pathlib.Path(dl_info.value.path()).read_text())
 assert report['format']=='foama-wien-api-diagnose-v1'
 assert len(report['events'])==2
 assert report['events'][0]['summary']['monitorCount']==1
 assert report['optionalPublicTransportResponse']['kind']=='monitor'
 assert 'position' not in json.dumps(report).lower()
 page.screenshot(path='/mnt/data/foama-wien_diagnose_preview.png',full_page=True)
 assert not errors,errors
 print('PASS: diagnose UI, response parsing, rate limiter, hosting test and log download (mocked, no live requests)')
 browser.close()
