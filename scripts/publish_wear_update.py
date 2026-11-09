#!/usr/bin/env python3
"""Publish only a signed, metadata-checked native release; preserve PWA update fields."""
import hashlib,json,pathlib,re,shutil,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
def publish(src,version,code):
    src=pathlib.Path(src).resolve();sdk=ROOT/'.local/android-sdk/build-tools/34.0.0'
    certificate=subprocess.check_output([str(sdk/'apksigner'),'verify','--print-certs',str(src)],text=True)
    identity=json.loads((ROOT/'wear/release-signing.json').read_text())
    digest=re.search(r'Signer #1 certificate SHA-256 digest: ([0-9a-fA-F]+)',certificate)
    if not digest or digest.group(1).lower()!=identity['certificateSha256']:raise SystemExit('Release signing identity differs')
    metadata=subprocess.check_output([str(sdk/'aapt2'),'dump','badging',str(src)],text=True)
    for expected in ["name='at.andrew.foamawien'","versionCode='"+str(code)+"'","versionName='"+version+"'","android.hardware.type.watch"]:
        if expected not in metadata:raise SystemExit('APK metadata mismatch: '+expected)
    dst=ROOT/'pwa/apk';dst.mkdir(exist_ok=True);name='foama-wien-wear-'+version+'.apk';target=dst/name
    if target.exists() and target.read_bytes()!=src.read_bytes():raise SystemExit('Do not overwrite an already staged version with different APK bytes')
    shutil.copyfile(src,target);sha=hashlib.sha256(target.read_bytes()).hexdigest()
    update=json.loads((ROOT/'pwa/update.json').read_text())
    conf=json.loads((ROOT/'wear/build-config.json').read_text())
    notes=conf.get('releaseNotes',[]) if conf.get('versionName')==version and conf.get('versionCode')==code else []
    if not 3<=len(notes)<=4 or any(not isinstance(note,str) or not 1<=len(note)<=180 for note in notes):raise SystemExit('Native release requires three or four reviewed release notes')
    update.update(wearVersion=version,wearVersionCode=code,wearPackage='at.andrew.foamawien',wearApkUrl='/apk/'+name,wearApkSha256=sha,wearApkBytes=target.stat().st_size,wearMinSdk=30,wearReleaseNotes=notes,wearChangelog=' '.join(notes))
    (ROOT/'pwa/update.json').write_text(json.dumps(update,indent=2,ensure_ascii=False)+'\n')
    (ROOT/'pwa/apk'/('foama-wien-wear-'+version+'.sha256')).write_text(sha+'  '+name+'\n')
    manifest=ROOT/'site/native-releases.json';known=json.loads(manifest.read_text()) if manifest.exists() else {'releases':[]}
    row={'filename':name,'version':version,'bytes':target.stat().st_size,'sha256':sha}
    previous=next((r for r in known['releases'] if r['filename']==name),None)
    if previous and previous!=row:raise SystemExit('Immutable native release metadata mismatch')
    if not previous:known['releases'].append(row)
    manifest.write_text(json.dumps(known,indent=2)+'\n')
    print('Prepared native APK:',target.stat().st_size,'bytes; SHA-256',sha)
if __name__=='__main__':
    if len(sys.argv)!=4:raise SystemExit('Usage: publish_wear_update.py SIGNED_APK VERSION CODE')
    publish(sys.argv[1],sys.argv[2],int(sys.argv[3]))
