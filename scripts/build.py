#!/usr/bin/env python3
"""Build independent, signed foama-wien Wear OS APK using Android SDK command-line tools.

No Gradle/GitHub/Android Studio. Requires SDK API 34, Build Tools 34.0.0,
Java (javac/keytool), Python >=3.9 and ZXing core 3.5.3 (bootstrap_android.py).
Never package or commit the private signing keystore.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile, zipfile
import firebase_sdk
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEFAULT_CONFIG=ROOT/'wear/build-config.json'

def call(*cmd,env=None):
    print('>', ' '.join(str(c) for c in cmd),flush=True)
    subprocess.run([str(c) for c in cmd],check=True,env=env)

def sdk_command(path):
    if path.exists():return path
    alt=path.with_suffix('.bat')
    if alt.exists():return alt
    raise FileNotFoundError('Android-SDK-Befehl fehlt: '+str(path))

def require_sensible_url(value):
    if not re.fullmatch(r'https://[A-Za-z0-9.-]+(?::\d+)?(?:/[A-Za-z0-9/_-]*)?',value or '') or '.example' in value:
        raise ValueError('Für das Release muss eine echte HTTPS-Veröffentlichungsadresse angegeben werden (FOAMA_BASE_URL).')
    return value.rstrip('/')

def replace_buildconfig(folder,conf,site):
    target=folder/'at/foama/wien/BuildConfig.java';target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text('package at.foama.wien;\npublic final class BuildConfig {\n'
        f'public static final String APPLICATION_ID = "{conf["applicationId"]}";\n'
        f'public static final String FOAMA_BASE_URL = "{site}";\n'
        f'public static final String VERSION_NAME = "{conf["versionName"]}";\n'
        f'public static final int VERSION_CODE = {conf["versionCode"]};\n'
        '}\n')

def check_config(conf):
    assert conf['applicationId']=='at.andrew.foamawien', 'Falscher, bereits projektfremder Paketname'
    assert 30<=int(conf['minSdk'])<=int(conf['targetSdk'])==34
    assert 1<=int(conf['versionCode'])<=2**30
    assert re.fullmatch(r'\d+\.\d+\.\d+',conf['versionName'])

def create_key(path,alias):
    if path.exists():raise SystemExit('Signaturschlüssel existiert bereits; wird niemals überschrieben.')
    if not os.environ.get('FOAMA_STORE_PASSWORD') or not os.environ.get('FOAMA_KEY_PASSWORD'):
        raise SystemExit('FOAMA_STORE_PASSWORD und FOAMA_KEY_PASSWORD müssen als Umgebungsvariablen gesetzt sein.')
    if len(os.environ['FOAMA_STORE_PASSWORD'])<8 or len(os.environ['FOAMA_KEY_PASSWORD'])<8:
        raise SystemExit('Key- und Store-Passwort müssen mindestens acht Zeichen haben.')
    path.parent.mkdir(parents=True,exist_ok=True)
    # keytool supports environment-variable passwords using -storepass:env/-keypass:env.
    call('keytool','-genkeypair','-v','-keystore',path,'-storetype','PKCS12','-alias',alias,
         '-keyalg','RSA','-keysize','3072','-validity','9125',
         '-dname','CN=foama-wien Wear OS, OU=Independent project, O=foama-wien, C=AT',
         '-storepass:env','FOAMA_STORE_PASSWORD','-keypass:env','FOAMA_KEY_PASSWORD')
    path.chmod(0o600)
    print('Neuen Keystore UNBEDINGT getrennt vom Quellarchiv sichern:',path)

def build(args):
    conf=json.loads(DEFAULT_CONFIG.read_text());check_config(conf)
    sdk=Path(args.sdk).expanduser().resolve();site=require_sensible_url(args.base_url or os.environ.get('FOAMA_BASE_URL',''))
    tools=sdk/'build-tools/34.0.0';aapt=sdk_command(tools/'aapt2');d8=sdk_command(tools/'d8');align=sdk_command(tools/'zipalign');signer=sdk_command(tools/'apksigner')
    android=sdk/'platforms/android-34/android.jar';zxing=Path(args.zxing).expanduser().resolve()
    for f in [android,zxing]:
        if not f.is_file():raise FileNotFoundError('Build-Abhängigkeit fehlt: '+str(f))
    locked=json.loads((ROOT/'android-dependencies.json').read_text())['zxing']['sha256']
    if not locked or hashlib.sha256(zxing.read_bytes()).hexdigest()!=locked:
        raise SystemExit('ZXing-Abhängigkeit nicht SHA-256-verifiziert. Zuerst scripts/bootstrap_android.py ausführen.')
    if not args.skip_tests:
        call('node','--test',*[str(p) for p in sorted((ROOT/'tests').glob('*.test.mjs'))],ROOT/'tests/test_core.mjs',ROOT/'tests/test_worker.mjs')
    keystore=Path(args.keystore).expanduser().resolve()
    out=Path(args.out).expanduser().resolve();out.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='foama-build-') as temp:
        t=Path(temp);compiled=t/'compiled';compiled.mkdir();gen=t/'generated';gen.mkdir()
        res=ROOT/'wear/app/src/main/res';assets=ROOT/'wear/app/src/main/assets';source_manifest=ROOT/'wear/app/src/main/AndroidManifest.xml'
        firebase_jars,firebase_aars,manifest,flat=firebase_sdk.prepare(aapt,t,source_manifest,res,call)
        if not flat:raise RuntimeError('Keine AAPT2-Ressourcen kompiliert')
        base=t/'base.apk'
        call(aapt,'link','-o',base,'-I',android,'--manifest',manifest,'--java',gen,'-A',assets,
             '--min-sdk-version',str(conf['minSdk']),'--target-sdk-version',str(conf['targetSdk']),
             '--version-code',str(conf['versionCode']),'--version-name',conf['versionName'],'--auto-add-overlay',*[part for f in flat for part in ['-R',f]])
        firebase_sdk.resource_classes(gen,firebase_aars)
        replace_buildconfig(gen,conf,site)
        classes=t/'classes';classes.mkdir()
        java_sources=sorted((ROOT/'wear/app/src/main/java').rglob('*.java'))+sorted(gen.rglob('*.java'))
        if not java_sources:raise RuntimeError('Keine Java-Dateien')
        call(*([shutil.which('javac')] if shutil.which('javac') else ['java','-m','jdk.compiler/com.sun.tools.javac.Main']),'--release','8','-encoding','UTF-8','-cp',os.pathsep.join([str(android),str(zxing),*map(str,firebase_jars)]),
             '-d',classes,*java_sources)
        call(sys.executable,ROOT/'scripts/test_wear.py','--apk',base,'--generated',gen,'--manifest',manifest)
        if args.check_only:
            print('Native compilation and Android tests passed; no APK signed.');return
        identity=ROOT/'wear/release-signing.json'
        if args.create_key:
            if identity.exists():raise SystemExit('Release identity exists. Restore the original private key; never generate a replacement.')
            create_key(keystore,args.alias)
        if not keystore.is_file():raise SystemExit('Restore the original private foama-wien signing key before building.')
        if not os.getenv('FOAMA_STORE_PASSWORD') or not os.getenv('FOAMA_KEY_PASSWORD'):
            raise SystemExit('Signing requires FOAMA_STORE_PASSWORD and FOAMA_KEY_PASSWORD environment variables.')
        classjar=t/'classes.jar'
        with zipfile.ZipFile(classjar,'w',zipfile.ZIP_DEFLATED) as archive:
            for f in classes.rglob('*.class'):archive.write(f,f.relative_to(classes))
        dex=t/'dex';dex.mkdir()
        call(*firebase_sdk.d8_command(),'--min-api',str(conf['minSdk']),'--lib',android,'--output',dex,classjar,zxing,*firebase_jars)
        unsigned=t/'unsigned.apk';shutil.copy2(base,unsigned)
        with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as archive:
            for f in sorted(dex.glob('classes*.dex')):archive.write(f,f.name)
        firebase_sdk.package_resources(unsigned,firebase_aars)
        aligned=t/'aligned.apk';call(align,'-f','-p','4',unsigned,aligned)
        apk=out/f'foama-wien-{conf["versionName"]}.apk'
        call(signer,'sign','--ks',keystore,'--ks-key-alias',args.alias,'--ks-pass','env:FOAMA_STORE_PASSWORD',
             '--key-pass','env:FOAMA_KEY_PASSWORD','--out',apk,aligned)
        verified=subprocess.check_output([str(signer),'verify','--verbose','--print-certs',str(apk)],text=True)
        print(verified)
        certificate=re.search(r'Signer #1 certificate SHA-256 digest: ([0-9a-fA-F]+)',verified)
        if not certificate:raise SystemExit('Signing certificate digest missing')
        fingerprint=certificate.group(1).lower()
        if identity.exists():
            if json.loads(identity.read_text())['certificateSha256']!=fingerprint:
                apk.unlink();raise SystemExit('Signing identity differs from the original release')
        else:identity.write_text(json.dumps({'applicationId':conf['applicationId'],'certificateSha256':fingerprint,'alias':args.alias},indent=2)+'\n')
        call(align,'-c','-p','4',apk)
        badging=subprocess.check_output([str(aapt),'dump','badging',str(apk)],text=True);print(badging)
        for expected in ["name='"+conf['applicationId']+"'","versionCode='"+str(conf['versionCode'])+"'","versionName='"+conf['versionName']+"'","targetSdkVersion:'34'","android.hardware.type.watch"]:
            if expected not in badging:raise SystemExit('APK metadata assertion failed: '+expected)
        digest=hashlib.sha256(apk.read_bytes()).hexdigest()
        release={'wearVersion':conf['versionName'],'wearVersionCode':conf['versionCode'],'wearPackage':conf['applicationId'],
                 'wearApkUrl':f'releases/{apk.name}','wearApkBytes':apk.stat().st_size,'wearApkSha256':digest,
                 'minSdk':conf['minSdk'],'wearReleaseNotes':conf.get('releaseNotes',[])[:4]}
        (out/'update.json').write_text(json.dumps(release,indent=2,ensure_ascii=False)+'\n')
        (out/'release.properties').write_text('\n'.join(f'{k}={v}' for k,v in release.items())+'\n')
        print('\n*** APK signiert und verifiziert:',apk,'\nSHA-256:',digest)
        print('Nur nach erfolgreichem Test APK und update.json gemeinsam unter HTTPS veröffentlichen.')

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--sdk',default=str(ROOT/'.local/android-sdk'))
    ap.add_argument('--zxing',default=str(ROOT/'.local/deps/zxing-core-3.5.3.jar'))
    ap.add_argument('--base-url',help='Öffentliche PWA-HTTPS-Adresse (z.B. https://foama-wien.example.invalid als Platzhalter NICHT gültig)')
    ap.add_argument('--keystore',default=str(ROOT/'.local/private/foama-wien-release.p12'))
    ap.add_argument('--alias',default='foama-wien')
    ap.add_argument('--create-key',action='store_true',help='Nur bei Erstveröffentlichung: neuen, separaten Key erzeugen')
    ap.add_argument('--skip-tests',action='store_true')
    ap.add_argument('--check-only',action='store_true',help='Compile and run native Android tests without signing')
    ap.add_argument('--out',default=str(ROOT/'dist'))
    args=ap.parse_args()
    try:build(args)
    except (FileNotFoundError,ValueError,subprocess.CalledProcessError) as e:
        raise SystemExit(f'Build nicht abgeschlossen: {e}')
if __name__=='__main__':main()
