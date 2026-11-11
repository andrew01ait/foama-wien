#!/usr/bin/env python3
"""Export the bounded U6 experiment from the exact published GTFS source."""
import argparse, csv, datetime as dt, hashlib, io, json, zipfile
from pathlib import Path
from wl_gtfs_catalog import csv_rows, service_dates

ROOT=Path(__file__).resolve().parents[1]
ANCHORS=['wl:60200615','wl:60201372','wl:60200188']
CONFIG=[('1','Siebenhirten','R','2',['4607','4608','4609']),('0','Floridsdorf','H','1',['4620','4621','4622'])]

def seconds(value):
    h,m,s=map(int,value.split(':'));return h*3600+m*60+s

def build(path):
    manifest=json.loads((ROOT/'pwa/data/timetables/wien/manifest.json').read_text())
    digest=hashlib.sha256(Path(path).read_bytes()).hexdigest()
    if digest!=manifest['sourceSha256']:raise ValueError('GTFS does not match the installed timetable')
    line=json.loads((ROOT/'pwa/data/line-maps/wien/bae72e3f0bcb480d.json').read_text())
    if line['sourceSha256']!=digest or line['version']!=manifest['version']:raise ValueError('Line map source differs')
    result={'format':1,'route':'U6','mode':'metro','version':manifest['version'],'sourceSha256':digest,'lineFile':'bae72e3f0bcb480d.json','validFrom':manifest['validFrom'],'validThrough':manifest['validThrough'],'directions':[]}
    with zipfile.ZipFile(path) as archive:
        start=dt.date.fromisoformat(manifest['validFrom']);days=(dt.date.fromisoformat(manifest['validThrough'])-start).days+1
        active=service_dates(list(csv_rows(archive,'calendar.txt')),list(csv_rows(archive,'calendar_dates.txt')),start-dt.timedelta(days=1),days+1)
        keys=[key for key,dates in sorted(active.items()) if dates]
        calendars=[sorted(dt.datetime.strptime(d,'%Y%m%d').date().isoformat() for d in active[key]) for key in keys]
        if calendars!=manifest['services']:raise ValueError('Calendar differs')
        services={key:i for i,key in enumerate(keys)}
        routes={r['route_id'] for r in csv_rows(archive,'routes.txt') if r['route_short_name']=='U6' and r['route_type']=='1'}
        trips={r['trip_id']:r for r in csv_rows(archive,'trips.txt') if r['route_id'] in routes and r['service_id'] in services}
        platforms={s['platformId'] for p in line['patterns'] for s in p['stops'] if s['id'] in ANCHORS}
        rows={}
        with archive.open('stop_times.txt') as source:
            reader=csv.reader(io.TextIOWrapper(source,encoding='utf-8-sig'));head=next(reader);cols={k:head.index(k) for k in ['trip_id','stop_id','arrival_time','departure_time','stop_sequence','pickup_type','drop_off_type']}
            for row in reader:
                trip,stop=row[cols['trip_id']],row[cols['stop_id']]
                if trip not in trips or stop not in platforms or row[cols['pickup_type']]==row[cols['drop_off_type']]=='1':continue
                rows.setdefault(trip,[]).append((int(row[cols['stop_sequence']]),stop,seconds(row[cols['arrival_time']]),seconds(row[cols['departure_time']])))
        for direction,towards,wl_direction,wl_id,rbls in CONFIG:
            pattern=max((p for p in line['patterns'] if p['direction']==direction and p['towards']==towards),key=lambda p:len(p['stops']))
            stops=[s for s in pattern['stops'] if s['id'] in ANCHORS]
            expected=[s['platformId'] for s in stops];found=[]
            for tid,trip in trips.items():
                if trip.get('direction_id')!=direction or trip.get('trip_headsign','').removeprefix('Wien ')!=towards:continue
                sequence=sorted(rows.get(tid,[]))
                if [s[1] for s in sequence]!=expected:continue
                times=[[s[2],s[3]] for s in sequence]
                if any(a>b for a,b in times) or any(b[0]<=a[1] for a,b in zip(times,times[1:])):continue
                found.append({'ref':hashlib.sha256(tid.encode()).hexdigest()[:16],'service':services[trip['service_id']],'times':times})
            if not found:raise ValueError('No complete passenger trips for '+towards)
            result['directions'].append({'id':direction,'towards':towards,'monitorDirection':wl_direction,'monitorDirectionId':wl_id,'patternId':pattern['id'],'stops':[{**s,'rbl':rbl} for s,rbl in zip(stops,rbls)],'trips':found})
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('gtfs');args=parser.parse_args();result=build(args.gtfs)
    target=ROOT/'pwa/data/vehicle-pilot/u6.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(result,separators=(',',':'),ensure_ascii=False)+'\n')
    print('U6 pilot:',[(d['towards'],len(d['trips'])) for d in result['directions']],target.stat().st_size,'bytes')
