#!/usr/bin/env python3
"""Derive real, version-bound passenger route variants from the matching GTFS."""
import argparse
from array import array
import collections
import csv
import datetime as dt
import hashlib
import io
import json
import math
from pathlib import Path
import zipfile
from wl_gtfs_catalog import csv_rows, gtfs_station, service_dates
from prepare_timetable import route_mode

ROOT = Path(__file__).resolve().parents[1]

def encode_polyline(points):
    out, previous = [], [0, 0]
    for point in points:
        for axis in range(2):
            value = round(point[axis] * 1_000_000)
            delta = value - previous[axis]
            previous[axis] = value
            delta = ~(delta << 1) if delta < 0 else delta << 1
            while delta >= 32:
                out.append(chr((32 | (delta & 31)) + 63)); delta >>= 5
            out.append(chr(delta + 63))
    return ''.join(out)

def simplify(points, tolerance=3):
    """RDP in approximate local metres; retain the real path to within 3 m."""
    if len(points) < 3: return points
    keep, stack = {0, len(points)-1}, [(0, len(points)-1)]
    scale = math.cos(math.radians(points[0][0]))
    xy = [(p[1]*111_320*scale, p[0]*111_320) for p in points]
    while stack:
        start, end = stack.pop(); a, b = xy[start], xy[end]
        dx, dy = b[0]-a[0], b[1]-a[1]; length = dx*dx+dy*dy
        far, index = 0, None
        for i in range(start+1, end):
            p = xy[i]; ratio = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)) if length else 0
            distance = (p[0]-a[0]-ratio*dx)**2+(p[1]-a[1]-ratio*dy)**2
            if distance > far: far, index = distance, i
        if index is not None and far > tolerance*tolerance:
            keep.add(index); stack.extend([(start,index),(index,end)])
    return [points[i] for i in sorted(keep)]

def clip_shape(points, start, end):
    """Use GTFS shape distances so short workings do not show unused track."""
    if not points: return []
    if not math.isfinite(start) or not math.isfinite(end) or end <= start:
        return [(p[0],p[1]) for p in points]
    if any(not math.isfinite(p[2]) for p in points) or any(b[2]<a[2] for a,b in zip(points,points[1:])):
        return []
    if start < points[0][2]-.01 or end > points[-1][2]+.01: return []
    def at(value):
        for a,b in zip(points, points[1:]):
            if a[2] <= value <= b[2]:
                ratio=(value-a[2])/(b[2]-a[2]) if b[2]>a[2] else 0
                return (a[0]+ratio*(b[0]-a[0]),a[1]+ratio*(b[1]-a[1]))
        return (points[-1][0],points[-1][1])
    return [at(start), *((p[0],p[1]) for p in points if start<p[2]<end), at(end)]

def number(value):
    try: return float(value)
    except (ValueError,TypeError): return float('nan')

def build(archive, manifest, line_index, known):
    start=dt.date.fromisoformat(manifest['validFrom'])
    days=(dt.date.fromisoformat(manifest['validThrough'])-start).days+1
    active=service_dates(list(csv_rows(archive,'calendar.txt')),list(csv_rows(archive,'calendar_dates.txt')),start-dt.timedelta(days=1),days+1)
    service_keys=[key for key,dates in sorted(active.items()) if dates]
    service_ids={key:i for i,key in enumerate(service_keys)}
    calendars=[sorted(dt.datetime.strptime(d,'%Y%m%d').date().isoformat() for d in active[key]) for key in service_keys]
    if calendars != manifest['services']: raise ValueError('Calendar differs from the installed timetable')
    by_name=collections.defaultdict(list)
    for line in line_index['lines']: by_name[line['route']].append(line)
    routes={}
    for row in csv_rows(archive,'routes.txt'):
        name=row['route_short_name'].strip()
        if name=='BB' and row.get('agency_id')=='03': name='LB'
        if name not in by_name and name+'R' in by_name: name+='R'
        candidates=by_name.get(name,[])
        line=next((line for line in candidates if line['mode']==route_mode(row.get('route_type','3'))),None)
        if not line and len(candidates)==1: line=candidates[0]
        if line: routes[row['route_id']]=line
    trips={}
    for row in csv_rows(archive,'trips.txt'):
        if row['route_id'] in routes and row['service_id'] in service_ids:
            trips[row['trip_id']]=(routes[row['route_id']]['id'],row.get('direction_id',''),row.get('shape_id',''),row.get('trip_headsign','').removeprefix('Wien '),service_ids[row['service_id']])
    stops, stop_ids = [], {}
    for row in csv_rows(archive,'stops.txt'):
        lat,lon=number(row['stop_lat']),number(row['stop_lon'])
        if not (47<lat<50 and 14<lon<18): continue
        parent=gtfs_station(row['stop_id'],known)
        stop_ids[row['stop_id']]=len(stops)
        stops.append({'id':parent or 'gtfs:'+row['stop_id'],'platformId':row['stop_id'],'name':known[parent]['name'] if parent else row['stop_name'].removeprefix('Wien '),'lat':round(lat,6),'lon':round(lon,6)})
    sequences={}; rejected=set()
    with archive.open('stop_times.txt') as source:
        reader=csv.reader(io.TextIOWrapper(source,encoding='utf-8-sig')); head=next(reader)
        tid,sid,seq=(head.index(k) for k in ('trip_id','stop_id','stop_sequence'))
        pickup=head.index('pickup_type'); dropoff=head.index('drop_off_type'); dist=head.index('shape_dist_traveled')
        for row in reader:
            trip=row[tid]
            if trip not in trips or row[pickup]==row[dropoff]=='1': continue
            if row[sid] not in stop_ids: rejected.add(trip);continue
            sequences.setdefault(trip,array('d')).extend((int(row[seq]),stop_ids[row[sid]],number(row[dist])))
    variants={}
    for trip,values in sequences.items():
        if trip in rejected: continue
        sequence=sorted(zip(values[::3],values[1::3],values[2::3]))
        if len(sequence)<2: continue
        line,direction,shape,headsign,service=trips[trip]
        key=(line,direction,shape,headsign,tuple(int(p[1]) for p in sequence))
        variant=variants.setdefault(key,{'line':line,'direction':direction,'shapeId':shape,'towards':headsign,'stops':[{**stops[int(p[1])],'sequence':int(p[0]),**({'distance':p[2]} if math.isfinite(p[2]) else {})} for p in sequence],'services':set(),'tripCount':0,'exampleTripId':trip})
        variant['services'].add(service); variant['tripCount']+=1
    del sequences,trips
    used={v['shapeId'] for v in variants.values()}; shapes=collections.defaultdict(list)
    for row in csv_rows(archive,'shapes.txt'):
        if row['shape_id'] not in used: continue
        lat,lon=number(row['shape_pt_lat']),number(row['shape_pt_lon'])
        if not (47<lat<50 and 14<lon<18): raise ValueError('Invalid source geometry')
        shapes[row['shape_id']].append((int(row['shape_pt_sequence']),lat,lon,number(row['shape_dist_traveled'])))
    for key,values in shapes.items(): shapes[key]=[(p[1],p[2],p[3]) for p in sorted(values)]
    lines={line['id']:{'format':1,'city':'wien','version':manifest['version'],'sourceSha256':manifest['sourceSha256'],'route':line['route'],'mode':line['mode'],'id':line['id'],'validFrom':manifest['validFrom'],'validThrough':manifest['validThrough'],'patterns':[],'shapes':{}} for line in line_index['lines']}
    merged={}
    for variant in variants.values():
        target=lines[variant.pop('line')]
        points=clip_shape(shapes.get(variant['shapeId'],[]),variant['stops'][0].get('distance',float('nan')),variant['stops'][-1].get('distance',float('nan')))
        encoded=encode_polyline(simplify(points)) if len(points)>1 else ''
        geometry=hashlib.sha256(encoded.encode()).hexdigest()[:16] if encoded else None
        if geometry: target['shapes'][geometry]=encoded
        variant['geometry']=geometry
        signature=json.dumps([target['id'],variant['direction'],geometry,variant['towards'],[s['platformId'] for s in variant['stops']]],ensure_ascii=False)
        if signature in merged:
            previous=merged[signature];previous['services'].update(variant['services']);previous['tripCount']+=variant['tripCount'];previous['sourceShapeIds'].add(variant['shapeId']);continue
        variant['sourceShapeIds']={variant['shapeId']};variant['id']=hashlib.sha256(signature.encode()).hexdigest()[:16]
        merged[signature]=variant;target['patterns'].append(variant)
    for variant in merged.values():
        variant['services']=sorted(variant['services']);variant['sourceShapeIds']=sorted(variant['sourceShapeIds'])
    return lines

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('gtfs',type=Path);parser.add_argument('--out',type=Path,default=ROOT/'pwa/data/line-maps/wien');args=parser.parse_args()
    manifest=json.loads((ROOT/'pwa/data/timetables/wien/manifest.json').read_text()); index=json.loads((ROOT/'pwa/data/timetables/wien/lines.json').read_text())
    if hashlib.sha256(args.gtfs.read_bytes()).hexdigest()!=manifest['sourceSha256'] or index['version']!=manifest['version']: raise ValueError('Source does not match the installed timetable')
    known={s['id']:s for s in json.loads((ROOT/'pwa/data/stops.json').read_text())['stops']}
    with zipfile.ZipFile(args.gtfs) as archive: lines=build(archive,manifest,index,known)
    args.out.mkdir(parents=True,exist_ok=True); overview=[]
    for key,line in sorted(lines.items()):
        line['patterns'].sort(key=lambda p:(p['direction'],-len(p['stops']),-p['tripCount'],p['id']))
        name=hashlib.sha256(key.encode()).hexdigest()[:16]+'.json'; raw=json.dumps(line,ensure_ascii=False,separators=(',',':')).encode();(args.out/name).write_bytes(raw)
        overview.append({'id':key,'route':line['route'],'mode':line['mode'],'file':name,'sha256':hashlib.sha256(raw).hexdigest(),'patterns':len(line['patterns']),'mapped':sum(bool(p['geometry']) for p in line['patterns'])})
    result={'format':1,'city':'wien','version':manifest['version'],'sourceSha256':manifest['sourceSha256'],'validFrom':manifest['validFrom'],'validThrough':manifest['validThrough'],'attribution':manifest['attribution'],'lines':overview}
    (args.out/'index.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
    from prepare_station_map_points import station_points
    (args.out.parent.parent/'station-map-points.json').write_text(json.dumps(station_points(lines.values(),manifest,known),ensure_ascii=False,separators=(',',':')))
    print(json.dumps({'lines':len(overview),'patterns':sum(r['patterns'] for r in overview),'mapped':sum(r['mapped'] for r in overview),'bytes':sum(p.stat().st_size for p in args.out.glob('*.json'))}))

if __name__=='__main__':main()
