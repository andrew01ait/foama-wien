#!/usr/bin/env python3
"""Index existing verified station timetables by line; no inferred stop order."""
import base64,collections,gzip,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def line_index(manifest,shards,stops):
    lines={}
    for shard in shards:
        if shard['version']!=manifest['version']:raise ValueError('Mixed timetable versions')
        rows=json.loads(gzip.decompress(base64.b64decode(shard['payload'])))
        for station,groups in rows.items():
            if station not in stops:continue
            for route,towards,mode,provider,direction,service,seconds in groups:
                if not seconds:continue
                key=mode+'|'+route
                line=lines.setdefault(key,{'id':key,'route':route,'mode':mode,'stops':{}})
                target=line['stops'].setdefault(station,{'id':station,'name':stops[station]['name'],'towards':set()})
                target['towards'].add(towards)
    result=[]
    for line in lines.values():
        line['stops']=[{**stop,'towards':sorted(stop['towards'])} for stop in sorted(line['stops'].values(),key=lambda row:row['name'])]
        result.append(line)
    return {'format':1,'city':'wien','version':manifest['version'],'validFrom':manifest['validFrom'],'validThrough':manifest['validThrough'],'lines':sorted(result,key=lambda row:(row['mode'],row['route']))}

def main():
    folder=ROOT/'pwa/data/timetables/wien'
    manifest=json.loads((folder/'manifest.json').read_text())
    stops={stop['id']:stop for stop in json.loads((ROOT/'pwa/data/stops.json').read_text())['stops']}
    index=line_index(manifest,[json.loads((folder/(key+'.json')).read_text()) for key in manifest['shards']],stops)
    (folder/'lines.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':')))
    print('Indexed',len(index['lines']),'lines, without inferring a route or stop sequence.')
if __name__=='__main__':main()
