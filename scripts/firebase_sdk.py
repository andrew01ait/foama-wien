"""Pinned official Firebase AARs for the existing Gradle-free Android CLI builder."""
from pathlib import Path
import copy,hashlib,json,re,shutil,urllib.request,zipfile,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
ANDROID='http://schemas.android.com/apk/res/android'
TOOLS='http://schemas.android.com/tools'
ET.register_namespace('android',ANDROID)
def a(name):return '{'+ANDROID+'}'+name
def d8_command():
    entry=json.loads((ROOT/'android-dependencies.json').read_text())['d8'];path=ROOT/'.local/deps'/('r8-'+entry['version']+'.jar')
    if not path.exists():
        with urllib.request.urlopen(entry['url'],timeout=90) as response:path.write_bytes(response.read(60*1024*1024))
    if hashlib.sha256(path.read_bytes()).hexdigest()!=entry['sha256']:raise ValueError('D8 compiler checksum mismatch')
    return ['java','-Xmx1536m','-cp',path,'com.android.tools.r8.D8']

def dependencies():
    lock=json.loads((ROOT/'firebase-dependencies.json').read_text());out=ROOT/'.local/firebase-artifacts';out.mkdir(parents=True,exist_ok=True)
    files=[]
    for row in lock['artifacts']:
        path=out/row['name']
        if not path.exists():
            if not row['url'].startswith(('https://dl.google.com/dl/android/maven2/','https://repo.maven.apache.org/maven2/')):raise ValueError('Untrusted dependency repository')
            with urllib.request.urlopen(row['url'],timeout=90) as response:path.write_bytes(response.read(40*1024*1024))
        if hashlib.sha256(path.read_bytes()).hexdigest()!=row['sha256']:raise ValueError('Firebase dependency checksum mismatch: '+path.name)
        files.append(path)
    return files

def libraries():
    jars=[];aars=[]
    for path in dependencies():
        if path.suffix=='.jar':jars.append(path);continue
        folder=ROOT/'.local/firebase-aar'/path.stem
        if not (folder/'AndroidManifest.xml').exists():
            folder.mkdir(parents=True,exist_ok=True)
            with zipfile.ZipFile(path) as archive:
                if any(not (folder/n).resolve().is_relative_to(folder.resolve()) for n in archive.namelist()):raise ValueError('Unsafe Firebase archive path')
                archive.extractall(folder)
        if (folder/'classes.jar').exists():jars.append(folder/'classes.jar')
        jars.extend(sorted((folder/'libs').glob('*.jar')))
        aars.append(folder)
    return jars,aars

def merge_manifest(source,destination,aars):
    main=ET.parse(source).getroot();app=main.find('application');package=main.get('package');assert package=='at.andrew.foamawien'
    def replace(node):
        for key,value in list(node.attrib.items()):
            if key.startswith('{'+TOOLS+'}'):del node.attrib[key]
            else:node.set(key,value.replace('${applicationId}',package))
        for child in node:replace(child)
    def merge(parent,item):
        name=item.get(a('name'));old=next((n for n in parent if n.tag==item.tag and n.get(a('name'))==name),None) if name else None
        if old is None:parent.append(copy.deepcopy(item));return
        for key,value in item.attrib.items():
            if key not in old.attrib:old.set(key,value)
        for child in item:
            if child.tag=='intent-filter':
                if not any(ET.tostring(c)==ET.tostring(child) for c in old):old.append(copy.deepcopy(child))
            else:merge(old,child)
    for folder in aars:
        library=ET.parse(folder/'AndroidManifest.xml').getroot();replace(library)
        sdk=library.find('uses-sdk')
        if sdk is not None and int(sdk.get(a('minSdkVersion'),'1'))>30:raise ValueError('Firebase dependency raises supported watch minimum SDK')
        for item in library:
            if item.tag=='uses-sdk':continue
            if item.tag=='application':
                for key,value in item.attrib.items():
                    if key not in app.attrib:app.set(key,value)
                for child in item:
                    # The app initializes Firebase only after explicit opt-in.
                    if child.get(a('name'))!='com.google.firebase.provider.FirebaseInitProvider':merge(app,child)
            else:merge(main,item)
    replace(main);ET.ElementTree(main).write(destination,encoding='utf-8',xml_declaration=True)

def prepare(aapt,temporary,source_manifest,source_res,call):
    jars,aars=libraries();manifest=temporary/'merged-manifest.xml';merge_manifest(source_manifest,manifest,aars)
    compiled=temporary/'firebase-res';compiled.mkdir();files=[]
    for i,folder in enumerate(aars+[source_res.parent]):
        res=folder/'res'
        if not res.is_dir() or not any(res.rglob('*.xml')):continue
        out=compiled/str(i);out.mkdir();call(aapt,'compile','--dir',res,'-o',out)
        files.extend(sorted(out.glob('*.flat')))
    return jars,aars,manifest,files

def resource_classes(generated,aars):
    resource=generated/'at/andrew/foamawien/R.java';source=resource.read_text()
    for folder in aars:
        package=ET.parse(folder/'AndroidManifest.xml').getroot().get('package')
        if not package or not (folder/'R.txt').exists() or not (folder/'R.txt').stat().st_size:continue
        target=generated/Path(package.replace('.','/'))/'R.java';target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(source.replace('package at.andrew.foamawien;','package '+package+';'))

def package_resources(apk,aars):
    with zipfile.ZipFile(apk,'a',zipfile.ZIP_DEFLATED) as archive:
        existing=set(archive.namelist())
        for folder in aars:
            for file in (folder/'jni').rglob('*.so') if (folder/'jni').exists() else []:
                name='lib/'+file.relative_to(folder/'jni').as_posix()
                if name in existing:
                    if archive.read(name)!=file.read_bytes():raise ValueError('Conflicting dependency native library')
                else:archive.write(file,name);existing.add(name)
            for file in (folder/'assets').rglob('*') if (folder/'assets').exists() else []:
                if file.is_file():
                    name='assets/'+file.relative_to(folder/'assets').as_posix()
                    if name in existing:raise ValueError('Duplicate dependency asset')
                    archive.write(file,name);existing.add(name)
        # Keep the dependency inventory available in the APK, without private build paths.
        archive.writestr('META-INF/foama-licenses/Apache-2.0.txt',(ROOT/'docs/licenses/Apache-2.0.txt').read_bytes())
        archive.writestr('META-INF/foama-firebase-dependencies.json',(ROOT/'firebase-dependencies.json').read_bytes())
        for jar in libraries()[0]:
            with zipfile.ZipFile(jar) as source:
                for entry in source.namelist():
                    if not entry.endswith('/') and re.search(r'(^|/)(LICENSE|NOTICE|COPYING)([._-]|$)',entry,re.I):
                        name='META-INF/foama-licenses/'+jar.parent.name+'-'+jar.stem+'/'+entry.replace('/','_')
                        if name not in existing:archive.writestr(name,source.read(entry));existing.add(name)

if __name__=='__main__':
    jars,aars=libraries();print('Verified Firebase dependencies:',len(jars),'JARs,',len(aars),'AARs')
