#!/usr/bin/env python3
"""Rasterize the repo-native SVG mark into matching PWA installation icons."""
from pathlib import Path
import json
import fitz

root=Path(__file__).resolve().parents[1]
version=json.loads((root/'pwa/config.json').read_text())['version']
with fitz.open(root/'pwa/icons/foama-mark.svg') as document:
    page=document[0]
    for size in (192,512):
        pix=page.get_pixmap(matrix=fitz.Matrix(size/page.rect.width,size/page.rect.height),alpha=False)
        assert pix.width==pix.height==size
        pix.save(root/f'pwa/icons/icon-{size}.png')
        pix.save(root/f'pwa/icons/icon-{size}-v{version}.png')
print(f'Rendered matching 192px and 512px PWA icons and versioned v{version} copies from foama-mark.svg')
