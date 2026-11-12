#!/usr/bin/env python3
"""Embed the existing PWA assets and existing API relay in a Sites ESM Worker."""
from pathlib import Path
import base64,hashlib,json,mimetypes,shutil,subprocess
from prepare_watch_timetable import prepare

ROOT=Path(__file__).resolve().parents[1]
prepare(ROOT)
out=ROOT/'dist'
manifest=json.loads((ROOT/'.openai/hosting.json').read_text())
assert manifest.get('project_id') and 'static' not in manifest
if out.exists():shutil.rmtree(out)
(out/'server').mkdir(parents=True)
(out/'.openai').mkdir()
shutil.copyfile(ROOT/'.openai/hosting.json',out/'.openai/hosting.json')
types={'.mjs':'text/javascript;charset=utf-8','.js':'text/javascript;charset=utf-8',
       '.webmanifest':'application/manifest+json','.json':'application/json;charset=utf-8',
       '.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8',
       '.apk':'application/vnd.android.package-archive'}
assets={}
releases=json.loads((ROOT/'site/native-releases.json').read_text())['releases']
assets['__nativeReleases']=releases
feed=json.loads((ROOT/'pwa/update.json').read_text())
apk=ROOT/'pwa'/feed['wearApkUrl'].lstrip('/')
if not apk.is_file() or hashlib.sha256(apk.read_bytes()).hexdigest()!=feed['wearApkSha256']:
    raise RuntimeError('Verified current public Wear APK must be restored before building the Site')
apk.with_suffix('.sha256').write_text(feed['wearApkSha256']+'  '+apk.name+'\n')
for file in sorted((ROOT/'pwa').rglob('*')):
    if not file.is_file():continue
    path='/'+file.relative_to(ROOT/'pwa').as_posix()
    if file.suffix=='.apk' and file!=apk:continue
    assets[path]={'type':types.get(file.suffix,mimetypes.guess_type(file.name)[0] or 'application/octet-stream'),
                  'base64':base64.b64encode(file.read_bytes()).decode()}
if (ROOT/'drizzle').exists():shutil.copytree(ROOT/'drizzle',out/'drizzle')
local=ROOT/'.local';local.mkdir(exist_ok=True)
entry=local/'site-entry.mjs'
entry.write_text("import apiWorker from '../cloudflare/src/index.js';\nimport {createSiteWorker} from '../site/runtime.mjs';\nconst SITE_ASSETS="+json.dumps(assets,separators=(',',':'))+';\nexport default createSiteWorker(apiWorker,SITE_ASSETS);\n')
subprocess.run([str(ROOT/'node_modules/.bin/esbuild'),str(entry),'--bundle','--format=esm','--platform=browser','--target=es2022','--legal-comments=inline','--outfile='+str(out/'server/index.js')],cwd=ROOT,check=True)
print(f'Packaged {len(assets)} PWA assets and API relay ({(out/"server/index.js").stat().st_size:,} bytes)')
