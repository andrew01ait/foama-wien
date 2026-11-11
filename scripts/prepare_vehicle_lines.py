#!/usr/bin/env python3
"""Bind passenger GTFS trips to ordered official RBL patterns for vehicle estimates."""
import argparse, base64, collections, csv, datetime as dt, gzip, hashlib, io, json, math, zipfile
from pathlib import Path
from wl_gtfs_catalog import csv_rows, service_dates
from prepare_timetable import route_mode
from prepare_vehicle_pilot import seconds

ROOT=Path(__file__).resolve().parents[1]
SOURCES={name:'https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-'+name+'.csv' for name in ['haltepunkte','linien','fahrwegverlaeufe']}
REFERENCE=ROOT/'scripts/data/vehicle-reference.json'

def ordered_match(sequence, expected):
    out=[];at=0
    for station in expected:
        while at<len(sequence) and sequence[at][0]!=station:at+=1
        if at==len(sequence):return None
        out.append(sequence[at][1]);at+=1
    return out

def decode_shape(value):
    points=[];at=0;last=[0,0]
    while at<len(value):
        for axis in range(2):
            result=shift=0
            while True:
                byte=ord(value[at])-63;at+=1;result|=(byte&31)<<shift;shift+=5
                if byte<32:break
            last[axis]+=~(result>>1) if result&1 else result>>1
        points.append((last[0]/1e6,last[1]/1e6))
    return points

def usable_geometry(points, stops):
    if len(points)<2:return False
    along=[0.0]
    for a,b in zip(points,points[1:]):along.append(along[-1]+math.hypot((a[0]-b[0])*111320,(a[1]-b[1])*111320*math.cos((a[0]+b[0])*math.pi/360)))
    previous=-1
    for stop in stops:
        lat,lon=stop['lat'],stop['lon'];scale=math.cos(lat*math.pi/180);best=float('inf');distance=0
        for i,(a,b) in enumerate(zip(points,points[1:])):
            dx=(b[1]-a[1])*scale;dy=b[0]-a[0];den=dx*dx+dy*dy
            q=max(0,min(1,((lon-a[1])*scale*dx+(lat-a[0])*dy)/den)) if den else 0
            p=(a[0]+q*(b[0]-a[0]),a[1]+q*(b[1]-a[1]));metres=math.hypot((lat-p[0])*111320,(lon-p[1])*111320*math.cos((lat+p[0])*math.pi/360))
            if metres<best:best=metres;distance=along[i]+q*(along[i+1]-along[i])
        if best>100 or distance<=previous:return False
        previous=distance
    return True

def reference(csv_dir, line_index):
    def read(name):return list(csv.DictReader((Path(csv_dir)/(name+'.csv')).open(encoding='utf-8-sig'),delimiter=';'))
    stops={r['StopID']:r for r in read('haltepunkte')};official={r['LineText']:r for r in read('linien')};groups=collections.defaultdict(list);byline=collections.defaultdict(list)
    names=collections.defaultdict(set)
    for r in stops.values():names['wl:'+r['DIVA']].add(r['StopText'])
    for r in read('fahrwegverlaeufe'):
        if r.get('Direction') in ['1','2']:groups[(r['LineID'],r['PatternID'],r['Direction'])].append(r)
    for (lid,pid,d),rows in groups.items():
        seq=[('wl:'+stops[r['StopID']]['DIVA'],r['StopID']) for r in sorted(rows,key=lambda r:int(r['StopSeqCount'])) if r['StopID'] in stops]
        byline[lid].append((pid,d,seq))
    # Retain the directly verified U6 side aliases where the CSV names an unused RBL.
    verified=json.loads((ROOT/'scripts/data/u6-rbl-mapping.json').read_text())
    configurations={};unsupported=[]
    for entry in line_index['lines']:
        source=official.get(entry['route']);directions=[]
        if not source or source['Realtime']!='1':unsupported.append({**entry,'reason':'Keine bestätigte Echtzeitquelle'});continue
        line=json.loads((ROOT/'pwa/data/line-maps/wien'/entry['file']).read_text())
        for pattern in line['patterns']:
            ss=pattern['stops'];expected=[s['id'] for s in ss]
            if len(ss)<3 or len(set(expected))!=len(ss) or not pattern['geometry']:continue
            if not usable_geometry(decode_shape(line['shapes'][pattern['geometry']]),ss):continue
            matches=[]
            for pid,d,seq in byline[source['LineID']]:
                match=ordered_match(seq,expected[:-1])
                if match:matches.append((pid,d,match))
            ds={d for _,d,_ in matches}
            if len(ds)!=1:continue
            d=next(iter(ds));rbls=[]
            for i,s in enumerate(ss):
                options={m[i] for _,_,m in matches if i<len(m)};rbl=next(iter(options)) if len(options)==1 else None
                if entry['route']=='U6':
                    observed=verified['H' if d=='1' else 'R'].get(s['id'],[])
                    observed={r['rbl'] for r in observed if r['directionId']==d}
                    if len(observed)==1:rbl=next(iter(observed))
                rbls.append(rbl if i<len(ss)-1 else None)
            if len({r for r in rbls if r})<2:continue
            directions.append({'id':pattern['id'],'patternId':pattern['id'],'gtfsDirection':pattern['direction'],'towards':pattern['towards'],'monitorDirection':'H' if d=='1' else 'R','monitorDirectionId':d,'stops':[{**s,'rbl':r} for s,r in zip(ss,rbls)],'services':pattern['services'],'trips':[],'targetAliases':{}})
        if directions:configurations[entry['id']]={'entry':entry,'official':source,'line':line,'directions':directions}
        else:unsupported.append({**entry,'reason':'Haltefolge oder Monitorseite nicht eindeutig zuordenbar'})
    return configurations,unsupported,names

def save_reference(path,configurations,unsupported,names,line_index,sources):
    public={'format':1,'version':line_index['version'],'sourceSha256':line_index['sourceSha256'],'sources':sources,'names':{k:sorted(v) for k,v in names.items()},'lines':[],'unavailable':[{'id':e['id'],'reason':e['reason']} for e in unsupported]}
    for key,c in configurations.items():public['lines'].append({'id':key,'official':c['official'],'directions':[{'patternId':d['patternId'],'monitorDirectionId':d['monitorDirectionId'],'rbls':[s['rbl'] for s in d['stops']]} for d in c['directions']]})
    Path(path).write_text(json.dumps(public,ensure_ascii=False,separators=(',',':'))+'\n')

def load_reference(path,line_index):
    r=json.loads(Path(path).read_text())
    if r['format']!=1 or r['version']!=line_index['version'] or r['sourceSha256']!=line_index['sourceSha256']:raise ValueError('RBL reference belongs to another timetable')
    entries={l['id']:l for l in line_index['lines']};configurations={}
    for c in r['lines']:
        entry=entries[c['id']];line=json.loads((ROOT/'pwa/data/line-maps/wien'/entry['file']).read_text());ds=[]
        for d in c['directions']:
            p=next(p for p in line['patterns'] if p['id']==d['patternId']);code=d['monitorDirectionId']
            if code not in ['1','2'] or len(d['rbls'])!=len(p['stops']):raise ValueError('Invalid reference side')
            ds.append({'id':p['id'],'patternId':p['id'],'gtfsDirection':p['direction'],'towards':p['towards'],'monitorDirection':'H' if code=='1' else 'R','monitorDirectionId':code,'stops':[{**s,'rbl':rid} for s,rid in zip(p['stops'],d['rbls'])],'services':p['services'],'trips':[],'targetAliases':{}})
        configurations[c['id']]={'entry':entry,'official':c['official'],'line':line,'directions':ds}
    return configurations,[{**entries[e['id']],'reason':e['reason']} for e in r['unavailable']],{k:set(v) for k,v in r['names'].items()},r['sources']

def build(gtfs,csv_dir=None,reference_file=REFERENCE):
    manifest=json.loads((ROOT/'pwa/data/timetables/wien/manifest.json').read_text());line_index=json.loads((ROOT/'pwa/data/line-maps/wien/index.json').read_text())
    digest=hashlib.sha256(Path(gtfs).read_bytes()).hexdigest()
    if digest!=manifest['sourceSha256'] or line_index['sourceSha256']!=digest or line_index['version']!=manifest['version']:raise ValueError('Source versions differ')
    if csv_dir:
        configurations,unsupported,names=reference(csv_dir,line_index)
        source_proof={name:{'url':url,'sha256':hashlib.sha256((Path(csv_dir)/(name+'.csv')).read_bytes()).hexdigest()} for name,url in SOURCES.items()}
        save_reference(reference_file,configurations,unsupported,names,line_index,source_proof)
    else:configurations,unsupported,names,source_proof=load_reference(reference_file,line_index)
    with zipfile.ZipFile(gtfs) as archive:
        start=dt.date.fromisoformat(manifest['validFrom']);days=(dt.date.fromisoformat(manifest['validThrough'])-start).days+1
        active=service_dates(list(csv_rows(archive,'calendar.txt')),list(csv_rows(archive,'calendar_dates.txt')),start-dt.timedelta(days=1),days+1)
        keys=[k for k,ds in sorted(active.items()) if ds];calendars=[sorted(dt.datetime.strptime(d,'%Y%m%d').date().isoformat() for d in active[k]) for k in keys]
        if calendars!=manifest['services']:raise ValueError('Calendars differ')
        services={k:i for i,k in enumerate(keys)};routes={}
        for r in csv_rows(archive,'routes.txt'):
            name=r['route_short_name'].strip();name='LB' if name=='BB' and r.get('agency_id')=='03' else name
            candidates=[c for c in configurations.values() if c['entry']['route'] in [name,name+'R']]
            chosen=next((c for c in candidates if c['entry']['mode']==route_mode(r['route_type'])),None)
            if not chosen and len(candidates)==1:chosen=candidates[0]
            if chosen:routes[r['route_id']]=chosen['entry']['id']
        trips={r['trip_id']:r for r in csv_rows(archive,'trips.txt') if r['route_id'] in routes and r['service_id'] in services};rows={}
        with archive.open('stop_times.txt') as source:
            reader=csv.reader(io.TextIOWrapper(source,encoding='utf-8-sig'));head=next(reader);cols={k:head.index(k) for k in ['trip_id','stop_id','arrival_time','departure_time','stop_sequence','pickup_type','drop_off_type']}
            for row in reader:
                tid=row[cols['trip_id']]
                if tid not in trips or row[cols['pickup_type']]==row[cols['drop_off_type']]=='1':continue
                rows.setdefault(tid,[]).append((int(row[cols['stop_sequence']]),row[cols['stop_id']],seconds(row[cols['arrival_time']]),seconds(row[cols['departure_time']])))
        prepared={}
        for key,c in configurations.items():
            for d in c['directions']:prepared[d['id']]={s['platformId']:i for i,s in enumerate(d['stops'])}
        for tid,trip in trips.items():
            c=configurations[routes[trip['route_id']]];sequence=sorted(rows.get(tid,[]))
            if len(sequence)<2:continue
            actual=[[r[2],r[3]] for r in sequence]
            if any(a>b for a,b in actual) or any(b[0]<a[1] for a,b in zip(actual,actual[1:])):continue
            target=trip.get('trip_headsign','').removeprefix('Wien ')
            for d in c['directions']:
                if d['gtfsDirection']!=trip.get('direction_id'):continue
                ids=prepared[d['id']]
                if any(s[1] not in ids for s in sequence):continue
                indices=[ids[s[1]] for s in sequence]
                if indices!=sorted(set(indices)):continue
                times=[None]*len(d['stops'])
                for i,value in zip(indices,actual):times[i]=value
                d['trips'].append({'ref':hashlib.sha256(tid.encode()).hexdigest()[:16],'service':services[trip['service_id']],'towards':target,'times':times})
                terminal=d['stops'][indices[-1]];d['targetAliases'].setdefault(target,set()).update([target,terminal['name'],*names.get(terminal['id'],[])])
    output=ROOT/'pwa/data/vehicle-pilot';index={'format':3,'city':'wien','version':manifest['version'],'sourceSha256':digest,'validFrom':manifest['validFrom'],'validThrough':manifest['validThrough'],'rblSources':source_proof,'lines':[],'unavailable':unsupported}
    total=0
    for key,c in configurations.items():
        ds=[d for d in c['directions'] if d['trips'] and len([s for s in d['stops'] if s['rbl']])>=(2 if c['entry']['mode']=='metro' else 3)]
        if not ds:
            unsupported.append({**c['entry'],'reason':'Keine passenden Fahrgastfahrten im importierten Fahrplan'});continue
        for d in ds:
            d['route']=c['entry']['route'];d['mode']=c['entry']['mode'];d['targetAliases']={k:sorted(v) for k,v in d['targetAliases'].items()}
        data={k:index[k] for k in ['format','city','version','sourceSha256','validFrom','validThrough']};data.update({'route':c['entry']['route'],'mode':c['entry']['mode'],'lineFile':c['entry']['file'],'directions':ds})
        raw=json.dumps(data,separators=(',',':'),ensure_ascii=False).encode()
        if len(raw)>12_000_000:raise ValueError('Oversized decoded line '+key)
        envelope={'format':3,'encoding':'gzip-base64','version':manifest['version'],'sourceSha256':digest,'payload':base64.b64encode(gzip.compress(raw,mtime=0)).decode()}
        content=(json.dumps(envelope,separators=(',',':'))+'\n').encode();filename=c['entry']['file'];(output/filename).write_bytes(content);total+=len(content)
        index['lines'].append({**c['entry'],'sha256':hashlib.sha256(content).hexdigest(),'patterns':len(ds),'patternIds':[d['patternId'] for d in ds],'file':filename})
    (output/'index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
    print('Vehicle lines:',len(index['lines']),'patterns:',sum(l['patterns'] for l in index['lines']),'bytes:',total,'unavailable:',[l['route'] for l in unsupported],flush=True)
    return index

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('gtfs');p.add_argument('--csv-dir');p.add_argument('--reference-file',default=str(REFERENCE));a=p.parse_args();build(a.gtfs,a.csv_dir,a.reference_file)
