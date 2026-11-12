#!/usr/bin/env python3
"""Package current source/docs, excluding SDKs, keys, caches and APK build output."""
from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parents[1]
def package():
    files=set(ROOT.glob('*.md'))|set(ROOT.glob('*.json'))|set(ROOT.glob('*.ts'))|{ROOT/'LICENSE',ROOT/'.gitignore',ROOT/'.openai/hosting.json'}
    allowed={'.py','.sh','.mjs','.js','.java','.xml','.json','.md','.html','.css','.svg','.png','.webp','.txt','.gradle','.properties','.toml','.webmanifest','.ts','.sql','.yml','.yaml'}
    for directory in ('.github','scripts','site','cloudflare','pwa','tests','docs','wear','db','drizzle','deploy'):
        for file in (ROOT/directory).rglob('*'):
            if not file.is_file():continue
            relative=file.relative_to(ROOT)
            if any(part in ('.local','build','dist','.git','node_modules','__pycache__','apk') for part in relative.parts):continue
            if relative.parts[:6]==('wear','app','src','main','assets','line-maps'):continue
            if file.suffix in allowed or file.name in ('Dockerfile','LICENSE'):files.add(file)
    destination=ROOT/'pwa/foama-wien-source.zip'
    with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(files):
            if file.is_symlink():raise RuntimeError('Symlink in source archive')
            relative=file.relative_to(ROOT)
            if any(part in ('.local','build','dist','.git','__pycache__','apk') for part in relative.parts) or file.suffix in ('.p12','.password','.jks','.keystore','.apk','.zip') or file.name=='signing-env.json':raise RuntimeError('Private/build file in source list')
            entry=zipfile.ZipInfo('foama-wien/'+relative.as_posix(),(2026,11,7,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;entry.external_attr=0o644<<16;archive.writestr(entry,file.read_bytes())
    print('Source/docs archive:',len(files),'files,',destination.stat().st_size,'bytes')
if __name__=='__main__':package()
