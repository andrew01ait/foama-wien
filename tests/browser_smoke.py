#!/usr/bin/env python3
"""Headless no-network mock DOM test; uses Playwright set_content because local HTTP is blocked in this sandbox."""
import base64,json,pathlib,re
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]/'pwa'
read=lambda filename:(root/filename).read_text()
url=lambda value:'data:text/javascript;base64,'+base64.b64encode(value.encode()).decode()
location_module=url(read('src/location.mjs'));core=url(read('src/core.mjs'));transfer=url(read('src/transfer.mjs'));storage=url(read('src/storage.mjs'))
station_search=url(read('src/station-search.mjs'));favorite_picker=url(read('src/favorite-picker.mjs').replace("from './station-search.mjs'",f'from "{station_search}"'))
app=read('src/app.mjs').replace("from './favorite-picker.mjs'",f'from "{favorite_picker}"').replace("from './station-search.mjs'",f'from "{station_search}"').replace("from './location.mjs'",f'from "{location_module}"').replace("from './core.mjs'",f'from "{core}"').replace("from './transfer.mjs'",f'from "{transfer}"').replace("from './storage.mjs'",f'from "{storage}"')
html=read('index.html').replace('<link rel="stylesheet" href="./style.css">','').replace('<script type="module" src="./src/app.mjs?v=0.1.13"></script>','')
wl={'data':{'monitors':[{'locationStop':{'properties':{'title':'Stephansplatz','attributes':{'rbl':4116}}},'lines':[{'name':'U1','type':'ptMetro','towards':'Leopoldau','departures':{'departure':[]}}]}]}}
from datetime import datetime,timedelta,timezone
now=datetime.now(timezone.utc)
for minutes in (7,17,31):
 dt=(now+timedelta(minutes=minutes)).astimezone(timezone(timedelta(hours=1))).strftime('%Y-%m-%dT%H:%M:%S.000+0100')
 wl['data']['monitors'][0]['lines'][0]['departures']['departure'].append({'departureTime':{'timePlanned':dt,'timeReal':dt}})
stops={'stops':[{'id':'wl:123','name':'Stephansplatz','lat':48.2085,'lon':16.3726,'provider':'wl','rbl':['4116']}], 'source':'test'}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:print('CONSOLE:',m.type,m.text));page.on('requestfailed',lambda r:print('REQ FAILED',r.url,r.failure))
 page.set_content(html,wait_until='domcontentloaded')
 page.add_style_tag(content=read('style.css'))
 mocks={'./config.json':{'apiBase':'/api','version':'0.1.0'},'./data/stops.json':stops,'./data/rail.json':{'services':{},'departures':[]},'/api/monitor':wl}
 page.evaluate('''({mocks})=>{
  Object.defineProperty(window,'localStorage',{configurable:true,value:{_m:new Map(),getItem(k){return this._m.get(k)||null;},setItem(k,v){this._m.set(k,String(v));},removeItem(k){this._m.delete(k);}}});
  window.fetch=async function(url){const u=String(url);const key=Object.keys(mocks).find(k=>u.includes(k));if(!key)throw new Error('Mock not found: '+u);return new Response(JSON.stringify(mocks[key]),{status:200,headers:{'content-type':'application/json'}});};
  Object.defineProperty(navigator,'permissions',{configurable:true,value:{query:async()=>({state:'granted'})}});
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(cb){setTimeout(()=>cb({coords:{latitude:48.2085,longitude:16.3726,accuracy:10}}),50);return 123;},clearWatch(){}}});
 }''',{'mocks':mocks})
 page.add_script_tag(type='module',content=app)
 page.wait_for_timeout(1500)
 print('errors:',errors)
 print('h2:',page.locator('#viewTitle').inner_text());print('status:',page.locator('#status').inner_text());print('scripts:',page.locator('script').count())
 print('text:',page.locator('#content').inner_text()[:250])
 assert not errors, errors
 assert 'Stephansplatz' in page.locator('#content').inner_text()
 page.locator('[data-toggle]').first.click()
 print('opened',page.locator('.line-row').count(),'rows')
 assert page.locator('.line-row').count()>0
 page.screenshot(path='/mnt/data/foama-wien_preview.png',full_page=True)
 page.locator('[data-favorite-line]').first.click()
 page.locator('#tabFav').click()
 print('favorite cards:',page.locator('.fav-card').count(),'body:',page.locator('#content').inner_text()[:200])
 assert page.locator('.fav-card').count()==1
 page.locator('#settingsToggle').click()
 assert page.locator('#settings').evaluate('(el)=>el.open')
 print('PASS browser UI controls with synthetic departures (never live)')
 browser.close()
