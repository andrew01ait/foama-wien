#!/usr/bin/env python3
"""Run Android navigation/style tests with Robolectric and the APK's AAPT resources."""
from pathlib import Path
import argparse,hashlib,json,os,subprocess,urllib.parse,urllib.request,zipfile,xml.sax.saxutils
import firebase_sdk
from java_compile import java8_compiler

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.local'

def verified_download(url,destination,algorithm='sha1'):
    destination.parent.mkdir(parents=True,exist_ok=True)
    if destination.exists():return
    with urllib.request.urlopen(url+'.'+algorithm,timeout=30) as response:expected=response.read().decode().split()[0]
    with urllib.request.urlopen(url,timeout=120) as response:data=response.read()
    if hashlib.new(algorithm,data).hexdigest()!=expected:raise RuntimeError('Build-tool checksum mismatch')
    destination.write_bytes(data)

def dependencies():
    output=CACHE/'ui-dependencies'
    if not (output/'robolectric-4.14.1.jar').exists():
        maven=CACHE/'apache-maven-3.9.9'
        archive=CACHE/'apache-maven-3.9.9-bin.zip'
        verified_download('https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip',archive,'sha512')
        if not maven.exists():
            with zipfile.ZipFile(archive) as bundle:bundle.extractall(CACHE)
        (maven/'bin/mvn').chmod(0o755)
        args=[str(maven/'bin/mvn'),'-B','-f',str(ROOT/'wear/ui-test/pom.xml'),'-Dmaven.repo.local='+str(CACHE/'ui-maven'),
            'org.apache.maven.plugins:maven-dependency-plugin:3.7.1:copy-dependencies','-DoutputDirectory='+str(output)]
        proxy=urllib.parse.urlsplit(os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy') or os.environ.get('HTTP_PROXY') or '')
        descriptor=None
        if proxy.hostname:
            escape=xml.sax.saxutils.escape;credentials=''
            if proxy.username:credentials+='<username>'+escape(urllib.parse.unquote(proxy.username))+'</username>'
            if proxy.password:credentials+='<password>'+escape(urllib.parse.unquote(proxy.password))+'</password>'
            settings='<settings><proxies>'+''.join('<proxy><id>build-'+protocol+'</id><active>true</active><protocol>'+protocol+'</protocol><host>'+escape(proxy.hostname)+'</host><port>'+str(proxy.port or 80)+'</port>'+credentials+'</proxy>' for protocol in ('http','https'))+'</proxies></settings>'
            descriptor=os.memfd_create('ui-build-settings',0);os.write(descriptor,settings.encode());os.lseek(descriptor,0,0)
            args[1:1]=['-s','/proc/self/fd/'+str(descriptor)]
        try:
            with (CACHE/'ui-dependency-setup.log').open('w') as log:
                subprocess.run(args,cwd=ROOT,pass_fds=(() if descriptor is None else (descriptor,)),stdout=log,stderr=subprocess.STDOUT,check=True)
        finally:
            if descriptor is not None:os.close(descriptor)
    libraries=sorted(output.glob('*.jar'))
    for archive in sorted(output.glob('*.aar')):
        expanded=CACHE/'ui-aar'/archive.stem
        if not expanded.exists():
            with zipfile.ZipFile(archive) as bundle:bundle.extractall(expanded)
        libraries.append(expanded/'classes.jar')
    return libraries

def run(apk, generated,manifest=None):
    libraries=dependencies()
    libraries.extend(firebase_sdk.libraries()[0])
    sdk=CACHE/'ui-sdk';sdk.mkdir(exist_ok=True)
    for version in ('14-robolectric-10818077-i7','15-robolectric-12650502-i7'):
        name='android-all-instrumented-'+version+'.jar'
        verified_download('https://repo.maven.apache.org/maven2/org/robolectric/android-all-instrumented/'+version+'/'+name,sdk/name)
    app_classes=CACHE/'wear-test-app';app_classes.mkdir(exist_ok=True)
    test_classes=CACHE/'wear-test-classes';test_classes.mkdir(exist_ok=True)
    cp=os.pathsep.join(str(p) for p in [*libraries,CACHE/'deps/zxing-core-3.5.3.jar'])
    def command(args):subprocess.run([str(a) for a in args],cwd=ROOT,check=True)
    compiler=java8_compiler()
    command(compiler+['-classpath',cp,'-d',app_classes,*sorted((ROOT/'wear/app/src/main/java').rglob('*.java')),*sorted(Path(generated).rglob('*.java'))])
    cp=str(app_classes)+os.pathsep+cp
    tests=sorted((ROOT/'wear/ui-test').rglob('*Test.java'))
    if not tests:raise RuntimeError('Native tests missing')
    command(compiler+['-classpath',cp,'-d',test_classes,*sorted((ROOT/'wear/ui-test').rglob('*.java'))])
    config=test_classes/'com/android/tools/test_config.properties';config.parent.mkdir(parents=True,exist_ok=True)
    config.write_text('android_resource_apk='+str(Path(apk).resolve())+'\nandroid_merged_manifest='+str(Path(manifest).resolve() if manifest else ROOT/'wear/app/src/main/AndroidManifest.xml')+'\nandroid_custom_package=at.andrew.foamawien\n')
    result=subprocess.run(['java','-Xmx1536m','-Djava.awt.headless=true','-Drobolectric.offline=true','-Drobolectric.dependency.dir='+str(sdk),'-cp',str(test_classes)+os.pathsep+cp,
        'org.junit.runner.JUnitCore',*('at.foama.wien.'+t.stem for t in tests)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    (CACHE/'wear-test-results.txt').write_text(result.stdout);print(result.stdout,flush=True)
    if result.returncode:raise SystemExit(result.returncode)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--prepare',action='store_true');parser.add_argument('--apk');parser.add_argument('--generated');parser.add_argument('--manifest');args=parser.parse_args()
    if args.prepare:
        dependencies()
        sdk=CACHE/'ui-sdk';sdk.mkdir(exist_ok=True)
        for version in ('14-robolectric-10818077-i7','15-robolectric-12650502-i7'):
            name='android-all-instrumented-'+version+'.jar'
            verified_download('https://repo.maven.apache.org/maven2/org/robolectric/android-all-instrumented/'+version+'/'+name,sdk/name)
        print('Android test dependencies ready')
    else:run(args.apk,args.generated,args.manifest)
