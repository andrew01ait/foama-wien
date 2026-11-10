#!/usr/bin/env python3
"""Check the fixed official source against the imported archive; record only on request."""
import argparse,datetime as dt,hashlib,json,urllib.request
from pathlib import Path
from wl_gtfs_catalog import GTFS_SOURCE
ROOT=Path(__file__).resolve().parents[1]

def check(manifest):
    digest=hashlib.sha256();size=0
    request=urllib.request.Request(GTFS_SOURCE,headers={'User-Agent':'foama-wien timetable check (noncommercial)'})
    with urllib.request.urlopen(request,timeout=50) as response:
        modified=response.headers.get('Last-Modified');etag=response.headers.get('ETag')
        while True:
            chunk=response.read(1024*1024)
            if not chunk:break
            size+=len(chunk)
            if size>160*1024*1024:raise ValueError('Official source exceeds the bounded archive size')
            digest.update(chunk)
    actual=digest.hexdigest()
    return {'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'method':'sha256','status':'unchanged' if actual==manifest['sourceSha256'] else 'changed','sha256':actual,'bytes':size,'lastModified':modified,'etag':etag}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--record',action='store_true');args=parser.parse_args()
    path=ROOT/'pwa/data/timetables/wien/manifest.json';manifest=json.loads(path.read_text());result=check(manifest)
    if args.record:
        manifest['sourceCheck']=result
        if result['status']=='unchanged':
            manifest['sourceLastModified']=result['lastModified'];manifest['sourceEtag']=result['etag']
        path.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':main()
