#!/usr/bin/env python3
"""Copy prepared static catalogues into native Wear assets before building APK."""
import shutil
from pathlib import Path
r=Path(__file__).resolve().parents[1]
dest=r/'wear/app/src/main/assets';dest.mkdir(parents=True,exist_ok=True)
for f in ('stops.json','rail.json'):
    shutil.copy2(r/'pwa/data'/f,dest/f)
    print('asset:',f,(dest/f).stat().st_size,'bytes')
