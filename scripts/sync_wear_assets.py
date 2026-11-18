#!/usr/bin/env python3
"""Copy prepared static catalogues into native Wear assets before building APK."""
import shutil
from pathlib import Path
from prepare_watch_timetable import prepare
r=Path(__file__).resolve().parents[1]
prepare(r)
dest=r/'wear/app/src/main/assets';dest.mkdir(parents=True,exist_ok=True)
shutil.copytree(r/'pwa/data/line-maps/wien',dest/'line-maps',dirs_exist_ok=True)
for f in ('stops.json','rail.json'):
    shutil.copy2(r/'pwa/data'/f,dest/f)
    print('asset:',f,(dest/f).stat().st_size,'bytes')

for city in ("graz", "linz", "salzburg"):
    shutil.copy2(r/"pwa/data/cities"/(city+".json"),dest/(city+".json"))
    print("city asset:",city,(dest/(city+".json")).stat().st_size,"bytes")
