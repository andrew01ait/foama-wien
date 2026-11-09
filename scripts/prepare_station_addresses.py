#!/usr/bin/env python3
"""Join public station coordinates to nearby official Vienna access addresses.

An address belongs to a property entrance, never automatically to a station.
Preserve the measured distance and provenance; never shift the routing target.
"""
import argparse,json,math
from pathlib import Path
from datetime import datetime,timezone
SOURCE='https://data.wien.gv.at/daten/geo?service=WFS&version=2.0.0&request=GetFeature&typeNames=ogdwien:ZUGANGSADROGD&srsName=EPSG:4326&outputFormat=application/json&propertyName=SHAPE,NAME,PLZ'
def distance(a,b):
    lat1,lon1,lat2,lon2=map(math.radians,[a[0],a[1],b[0],b[1]])
    h=math.sin((lat2-lat1)/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 6371000*2*math.asin(min(1,math.sqrt(h)))
def prepare(stops,pages):
    bins={};seen=set()
    for page in pages:
        for feature in page['features']:
            if feature['id'] in seen:raise ValueError('Duplicate address page')
            seen.add(feature['id']);props=feature['properties'];name=props.get('NAME','');postcode=str(props.get('PLZ',''))
            if not name or not any(c.isdigit() for c in name) or len(name)>180 or not postcode.isdigit():continue
            if feature['geometry']['type']!='Point':continue
            lon,lat=feature['geometry']['coordinates'][:2]
            if not 47.9<lat<48.5 or not 16<lon<16.8:continue
            bins.setdefault((math.floor(lat*1000),math.floor(lon*1000)),[]).append((lat,lon,name,postcode))
    expected=max(int(p.get('numberMatched',len(seen))) for p in pages)
    if len(seen)!=expected:raise ValueError('Incomplete official address source')
    matched={}
    for stop in stops:
        lat,lon=stop['lat'],stop['lon'];cell=(math.floor(lat*1000),math.floor(lon*1000));best=None
        for y in range(-2,3):
            for x in range(-2,3):
                for point in bins.get((cell[0]+y,cell[1]+x),[]):
                    meters=distance((lat,lon),point[:2])
                    if meters<=100 and (best is None or meters<best[0]):best=(meters,point)
        if best:
            meters,point=best;matched[stop['id']]={'address':point[2],'postcode':point[3],'meters':round(meters),'kind':'nearby-access'}
    return {'source':SOURCE,'attribution':'Datenquelle: Stadt Wien - data.wien.gv.at (CC BY 4.0)','updated':datetime.now(timezone.utc).isoformat(),'description':'Nächste amtliche Zugangsadresse innerhalb von 100 m. Keine bestätigte Stations-Postadresse. Routingziel bleibt der offizielle Haltepunkt.','sourceRecords':len(seen),'stations':matched}
if __name__=='__main__':
    root=Path(__file__).resolve().parents[1];parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('pages',nargs='+',type=Path);parser.add_argument('--output',type=Path,default=root/'pwa/data/station-addresses.json');args=parser.parse_args()
    out=prepare(json.loads((root/'pwa/data/stops.json').read_text())['stops'],[json.loads(p.read_text()) for p in args.pages]);args.output.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')));print('Mapped',len(out['stations']),'stations from',out['sourceRecords'],'official access addresses; bytes',args.output.stat().st_size)
