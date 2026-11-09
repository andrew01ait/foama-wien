#!/usr/bin/env python3
"""Reduce public Vienna ADRESSENOGD to an offline approximate street/ZIP index.

The source contains public reference locations, never user locations. Deduplicate
to one street/ZIP point per ~50 m cell. No house numbers are included or inferred.
"""
import argparse,json,math
from pathlib import Path
from datetime import datetime,timezone

SOURCE='https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=2.0.0&typeNames=ogdwien:ADRESSENOGD&srsName=EPSG:4326&outputFormat=application/json&propertyName=SHAPE,NAME_STR,PLZ&cql_filter=HAUPT_IDENT_PSEUDO%3D%27H%27%20AND%20GEBADR_ANZEIGEN_J_N%3D1&count=400000'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--file',type=Path,required=True)
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'pwa/data/streets.json')
args=parser.parse_args()
data=json.loads(args.file.read_text())
if data.get('numberMatched')!=data.get('numberReturned'):raise ValueError('Truncated address reference source')
streets=[];street_ids={};points={}
for feature in data['features']:
    p=feature['properties'];street=p.get('NAME_STR');postcode=p.get('PLZ')
    if not street or not postcode:continue
    lon,lat=feature['geometry']['coordinates'][:2]
    if not 47.9<lat<48.5 or not 16<lon<16.7:continue
    key=(street,postcode)
    if key not in street_ids:street_ids[key]=len(streets);streets.append(key)
    sid=street_ids[key]
    # ~50 m in Vienna; retain street distinctions at crossroads.
    cell=(sid,math.floor(lat*2222),math.floor(lon*1480))
    points.setdefault(cell,[round(lat*100000),round(lon*100000),sid])
out={'source':SOURCE,'attribution':'Stadt Wien – data.wien.gv.at (CC BY 4.0)','updated':datetime.now(timezone.utc).isoformat(),'description':'Ungefähre Straßenumgebung; keine Hausnummern. Lokale Berechnung ohne Standortübertragung.','sourceRecords':data['numberReturned'],'streets':streets,'points':list(points.values())}
args.output.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print(f'Prepared {len(points)} reference points / {len(streets)} street-ZIP pairs ({args.output.stat().st_size:,} bytes)')
