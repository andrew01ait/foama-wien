#!/usr/bin/env python3
"""Bootstrap isolated Android CLI toolchain and ZXing, no Android Studio/Gradle.

Internet access is needed for a fresh toolchain. For offline CI, provide an existing SDK
and Maven's verified ZXing core 3.5.3 JAR. Never store private signing keys in source.
"""
from __future__ import annotations
import argparse, hashlib, json, os, shutil, subprocess, sys, tempfile, urllib.request, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TOOLS_VERSION="11076708"
TOOLS_URL=f"https://dl.google.com/android/repository/commandlinetools-linux-{TOOLS_VERSION}_latest.zip"
ZXING_URL="https://repo.maven.apache.org/maven2/com/google/zxing/core/3.5.3/core-3.5.3.jar"
LOCK=ROOT/"android-dependencies.json"

def download(url: str, dest: Path):
    print("Hole:",url,flush=True)
    with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"foama-wien-bootstrap/1.0"}),timeout=75) as resp, dest.open("wb") as out:
        shutil.copyfileobj(resp,out)

def sha(data:bytes,method="sha256")->str:
    h=hashlib.new(method);h.update(data);return h.hexdigest()

def verify_zip(z:zipfile.ZipFile,target:Path):
    # Avoid archive traversal when using downloaded SDK tools.
    for info in z.infolist():
        p=(target/info.filename).resolve()
        if not p.is_relative_to(target.resolve()):raise ValueError("Unsicherer SDK-Archivpfad")
    z.extractall(target)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--sdk',default=str(ROOT/'.local/android-sdk'))
    ap.add_argument('--accept-licenses',action='store_true',help='SDK-Lizenzbedingungen für SDK-Tools ausdrücklich akzeptieren')
    ap.add_argument('--skip-sdk',action='store_true',help='Vorhandenes SDK verwenden')
    ap.add_argument('--zxing',type=Path,help='Bereits heruntergeladene ZXing core-3.5.3.jar')
    args=ap.parse_args();sdk=Path(args.sdk).expanduser().resolve();sdk.mkdir(parents=True,exist_ok=True)
    aapt=sdk/'build-tools/34.0.0/aapt2';android=sdk/'platforms/android-34/android.jar'
    if not (aapt.is_file() and android.is_file()) and not args.skip_sdk:
        # Same pinned Google-package workflow as the existing Squash Tap builder.
        import xml.etree.ElementTree as ET
        with urllib.request.urlopen('https://dl.google.com/android/repository/repository2-1.xml',timeout=60) as response:
            metadata=ET.fromstring(response.read())
        for package_path in ['build-tools;34.0.0','platforms;android-34']:
            package=next(item for item in metadata.iter() if item.tag.rsplit('}',1)[-1]=='remotePackage' and item.get('path')==package_path)
            archive=next(a.find('complete') for a in package.findall('archives/archive') if a.findtext('host-os') in [None,'linux'])
            url='https://dl.google.com/android/repository/'+archive.findtext('url')
            expected=archive.findtext('checksum').strip();algorithm=archive.find('checksum').get('type','sha1')
            destination=sdk/package_path.split(';')[0]/package_path.split(';')[1]
            if destination.exists():continue
            with tempfile.TemporaryDirectory() as td:
                path=Path(td)/'package.zip';download(url,path)
                if sha(path.read_bytes(),algorithm)!=expected:raise SystemExit('Google SDK checksum mismatch: '+package_path)
                expanded=Path(td)/'expanded';expanded.mkdir()
                with zipfile.ZipFile(path) as z:verify_zip(z,expanded)
                source=next(expanded.iterdir());destination.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(source),destination)
            if package_path.startswith('build-tools'):
                for file in destination.iterdir():
                    if file.is_file() and not file.suffix:file.chmod(file.stat().st_mode|0o111)
    if not(aapt.is_file() and android.is_file()):raise SystemExit('Android-SDK-Tools 34.0.0 und Plattform 34 fehlen unter '+str(sdk))
    zxing=args.zxing or ROOT/'.local/deps/zxing-core-3.5.3.jar';zxing=Path(zxing).expanduser().resolve();zxing.parent.mkdir(parents=True,exist_ok=True)
    lock=json.loads(LOCK.read_text()) if LOCK.exists() else {'zxing':{'version':'3.5.3','origin':ZXING_URL,'sha256':None}}
    expected=lock['zxing'].get('sha256')
    if not zxing.exists():
        download(ZXING_URL,zxing)
        # Verify the published Maven Central digest before trusting the first download.
        with urllib.request.urlopen(ZXING_URL+'.sha1',timeout=30) as r:published=r.read().decode().strip().split()[0]
        if sha(zxing.read_bytes(),'sha1')!=published:
            zxing.unlink(missing_ok=True);raise SystemExit('Maven SHA-1 stimmt nicht mit dem heruntergeladenen JAR überein.')
    observed=sha(zxing.read_bytes())
    if expected and observed!=expected:raise SystemExit('ZXing-JAR SHA-256 stimmt nicht mit android-dependencies.json überein')
    if not expected:
        lock['zxing']['sha256']=observed;LOCK.write_text(json.dumps(lock,indent=2,ensure_ascii=False)+'\n')
        print('Erstmalig überprüfte SHA-256 festgeschrieben:',observed)
    print('Android SDK:',sdk,'\nZXing:',zxing,'\nBereit zum Build. Private Signaturschlüssel bleiben separat.')
if __name__=='__main__':main()
