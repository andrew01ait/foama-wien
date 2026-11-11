#!/usr/bin/env python3
"""Export the bounded U6 experiment from the exact published GTFS source."""
import argparse, base64, csv, datetime as dt, gzip, hashlib, io, json, zipfile
from pathlib import Path
from wl_gtfs_catalog import csv_rows, service_dates

ROOT=Path(__file__).resolve().parents[1]
CONFIG=[('1','Siebenhirten','R','2'),('0','Floridsdorf','H','1')]

def seconds(value):
    h,m,s=map(int,value.split(':'));return h*3600+m*60+s

def build(path,rbl_mapping):
    manifest=json.loads((ROOT/'pwa/data/timetables/wien/manifest.json').read_text())
    digest=hashlib.sha256(Path(path).read_bytes()).hexdigest()
    if digest!=manifest['sourceSha256']:raise ValueError('GTFS does not match the installed timetable')
    line=json.loads((ROOT/'pwa/data/line-maps/wien/bae72e3f0bcb480d.json').read_text())
    if line['sourceSha256']!=digest or line['version']!=manifest['version']:raise ValueError('Line map source differs')
    result={'format':2,'route':'U6','mode':'metro','version':manifest['version'],'sourceSha256':digest,'lineFile':'bae72e3f0bcb480d.json','validFrom':manifest['validFrom'],'validThrough':manifest['validThrough'],'directions':[]}
    with zipfile.ZipFile(path) as archive:
        start=dt.date.fromisoformat(manifest['validFrom']);days=(dt.date.fromisoformat(manifest['validThrough'])-start).days+1
        active=service_dates(list(csv_rows(archive,'calendar.txt')),list(csv_rows(archive,'calendar_dates.txt')),start-dt.timedelta(days=1),days+1)
        keys=[key for key,dates in sorted(active.items()) if dates]
        calendars=[sorted(dt.datetime.strptime(d,'%Y%m%d').date().isoformat() for d in active[key]) for key in keys]
        if calendars!=manifest['services']:raise ValueError('Calendar differs')
        services={key:i for i,key in enumerate(keys)}
        routes={r['route_id'] for r in csv_rows(archive,'routes.txt') if r['route_short_name']=='U6' and r['route_type']=='1'}
        trips={r['trip_id']:r for r in csv_rows(archive,'trips.txt') if r['route_id'] in routes and r['service_id'] in services}
        rows={}
        with archive.open('stop_times.txt') as source:
            reader=csv.reader(io.TextIOWrapper(source,encoding='utf-8-sig'));head=next(reader);cols={k:head.index(k) for k in ['trip_id','stop_id','arrival_time','departure_time','stop_sequence','pickup_type','drop_off_type']}
            for row in reader:
                trip,stop=row[cols['trip_id']],row[cols['stop_id']]
                if trip not in trips or row[cols['pickup_type']]==row[cols['drop_off_type']]=='1':continue
                rows.setdefault(trip,[]).append((int(row[cols['stop_sequence']]),stop,seconds(row[cols['arrival_time']]),seconds(row[cols['departure_time']])))
        for direction,towards,wl_direction,wl_id in CONFIG:
            pattern=max((p for p in line['patterns'] if p['direction']==direction and p['towards']==towards),key=lambda p:len(p['stops']))
            stops=pattern['stops']
            expected=[s['platformId'] for s in stops];found=[]
            for tid,trip in trips.items():
                if trip.get('direction_id')!=direction:continue
                sequence=sorted(rows.get(tid,[]))
                if len(sequence)<2 or any(s[1] not in expected for s in sequence):continue
                indices=[expected.index(s[1]) for s in sequence]
                if indices!=sorted(set(indices)):continue
                observed=[[s[2],s[3]] for s in sequence]
                if any(a>b for a,b in observed) or any(b[0]<=a[1] for a,b in zip(observed,observed[1:])):continue
                times=[None]*len(stops)
                for i,value in zip(indices,observed):times[i]=value
                found.append({'ref':hashlib.sha256(tid.encode()).hexdigest()[:16],'service':services[trip['service_id']],'towards':trip.get('trip_headsign','').removeprefix('Wien '),'times':times})
            if not found:raise ValueError('No complete passenger trips for '+towards)
            mapped=[]
            for i,s in enumerate(stops):
                matches=[r for r in rbl_mapping[wl_direction].get(s['id'],[]) if r['directionId']==wl_id]
                ids=list(dict.fromkeys(r['rbl'] for r in matches))
                if len(ids)>1:raise ValueError('Ambiguous RBL side at '+s['name'])
                if not ids and i!=len(stops)-1:raise ValueError('Unverified RBL at '+s['name'])
                mapped.append({**s,'rbl':ids[0] if ids else None})
            result['directions'].append({'id':direction,'towards':towards,'monitorDirection':wl_direction,'monitorDirectionId':wl_id,'patternId':pattern['id'],'stops':mapped,'trips':found})
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('gtfs');parser.add_argument('--rbl-mapping',default=str(ROOT/'scripts/data/u6-rbl-mapping.json'));args=parser.parse_args();result=build(args.gtfs,json.loads(Path(args.rbl_mapping).read_text()))
    raw=json.dumps(result,separators=(',',':'),ensure_ascii=False).encode();envelope={'format':2,'encoding':'gzip-base64','version':result['version'],'sourceSha256':result['sourceSha256'],'payload':base64.b64encode(gzip.compress(raw,mtime=0)).decode()}
    target=ROOT/'pwa/data/vehicle-pilot/u6.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(envelope,separators=(',',':'))+'\n')
    print('U6 pilot:',[(d['towards'],len(d['trips'])) for d in result['directions']],target.stat().st_size,'bytes')
