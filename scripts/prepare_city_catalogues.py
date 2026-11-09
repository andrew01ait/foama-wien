#!/usr/bin/env python3
"""Convert explicitly retrieved public MOTIS v6 grouped map stops, no GPS input.

Only documented IFOPT station identities are joined. Never combine by name or
radius. The public source is recorded; direct MVO import still needs its own
operator registration/license acceptance.
"""
import argparse
import datetime as dt
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
MODES={'SUBWAY':'metro','TRAM':'tram','BUS':'bus','COACH':'bus','ODM':'bus','SUBURBAN':'sbahn','REGIONAL_RAIL':'regional','LONG_DISTANCE':'long','HIGHSPEED_RAIL':'long','NIGHT_RAIL':'long'}
PREFIXES={'graz':('at-PTA-Styria-Flex-',),'linz':('at-Fahrplandaten-Linz-AG-Flex-','at-PTA-Upper-Austria-Flex-'),'salzburg':('at-PTA-Salzburg-Flex-',)}

def convert(rows,city):
    groups={}
    for row in rows:
        identity=re.search(r'(?:^|_)P?(at:\d+:\d+)(?::|$)',row.get('stopId',''))
        if not identity or not row['stopId'].startswith((*PREFIXES[city],'at-Railway-Current-Reference-Data-')):continue
        modes=sorted({MODES[mode] for mode in row.get('modes',[]) if mode in MODES})
        if not modes or not isinstance(row.get('lat'),(float,int)) or not isinstance(row.get('lon'),(float,int)):continue
        key=city+':'+identity[1]
        if key not in groups:
            groups[key]={'id':key,'city':city,'name':row['name'],'lat':row['lat'],'lon':row['lon'],'provider':'transitous','ifopt':identity[1],'providerStopId':row['stopId'],'providerStopIds':[],'modes':[],'lines':[]}
        entry=groups[key]
        entry['providerStopIds'].append(row['stopId']);entry['modes']=sorted(set(entry['modes']+modes))
        # Prefer local source over a rail copy when both describe this identity.
        if row['stopId'].startswith(PREFIXES[city]):entry['providerStopId']=row['stopId']
    return sorted(groups.values(),key=lambda s:s['name'])

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('city',choices=PREFIXES);p.add_argument('input',type=Path);a=p.parse_args()
    stops=convert(json.loads(a.input.read_text()),a.city)
    if len(stops)<100:raise ValueError('Incomplete city catalogue')
    data={'format':1,'city':a.city,'source':'https://api.transitous.org/api/v6/map/stops','licenseSources':'https://transitous.org/sources/','attribution':'Transitous · Mobilitätsverbünde Österreich / regionale Betreiber · ÖBB; jeweilige Datenlizenzen','updated':dt.datetime.now(dt.timezone.utc).isoformat(),'stops':stops}
    out=ROOT/'pwa/data/cities'/f'{a.city}.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
    print(a.city,len(stops),'stations',out.stat().st_size,'bytes')

if __name__=='__main__':main()
