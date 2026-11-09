#!/usr/bin/env python3
"""Package the existing, buildless PWA for ChatGPT Sites; no generated UI."""
from pathlib import Path
import json
from urllib.parse import urlsplit
import shutil

ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'pwa'
target=ROOT/'dist'
manifest=json.loads((source/'manifest.webmanifest').read_text())
assert manifest['display']=='standalone'
for icon in manifest['icons']:
    assert (source/urlsplit(icon['src']).path).is_file(), icon['src']
if target.exists():
    shutil.rmtree(target)
shutil.copytree(source,target)
print('Existing foama-wien PWA packaged in dist/')
