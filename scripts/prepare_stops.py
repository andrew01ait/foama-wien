#!/usr/bin/env python3
"""Download official Wiener Linien haltepunkte and create a compact offline index.

Also joins official line/pattern CSVs for offline station and platform filtering.
Failures are explicit, never replaced with fabricated stop or line data.
"""
import argparse
import csv
import io
import json
from pathlib import Path
from urllib.request import Request, urlopen
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import hashlib
from wl_gtfs_catalog import passenger_line_mapping, GTFS_SOURCE

SOURCE = 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-haltepunkte.csv'
LINES=SOURCE.replace('haltepunkte','linien')
PATTERNS=SOURCE.replace('haltepunkte','fahrwegverlaeufe')

def read_rows(path,url):
    raw=path.read_bytes() if path else urlopen(Request(url,headers={'User-Agent':'foama-wien/0.1 (noncommercial transit app)'}),timeout=40).read(8_000_000)
    return list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig')),delimiter=';'))

def mode_for(kind):
    if kind=='ptMetro':return 'metro'
    if kind.startswith('ptTram'):return 'tram'
    if kind=='ptTrainS':return 'sbahn'
    if kind.startswith('ptBus') or kind=='ptRufBus':return 'bus'
    raise ValueError(f'Unknown official transport mode {kind!r}')

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--file', type=Path, help='Local copy of the official CSV (offline build)')
    p.add_argument('--lines-file',type=Path)
    p.add_argument('--patterns-file',type=Path)
    p.add_argument('--gtfs-file',type=Path,required=True,help='Official GTFS ZIP; never infer service from all route patterns')
    p.add_argument('--reference-date',type=lambda value:datetime.strptime(value,'%Y-%m-%d').date(),default=datetime.now(ZoneInfo('Europe/Vienna')).date())
    p.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1]/'pwa/data/stops.json')
    a=p.parse_args()
    if a.file:
        raw=a.file.read_bytes()
    else:
        req=Request(SOURCE, headers={'User-Agent':'foama-wien/0.1 (noncommercial open transit app; low frequency)'});
        with urlopen(req, timeout=30) as r: raw=r.read(8_000_000)
    decoded=None
    for encoding in ('utf-8-sig', 'cp1252'):
        try: decoded=raw.decode(encoding); break
        except UnicodeDecodeError: pass
    if decoded is None: raise ValueError('CSV encoding unsupported')
    rows=csv.DictReader(io.StringIO(decoded),delimiter=';')
    if not {'StopID','DIVA','StopText','Latitude','Longitude'}.issubset(rows.fieldnames or []):
        raise ValueError(f'Unexpected CSV header: {rows.fieldnames}')
    groups={}
    for row in rows:
        try: sid=str(int(row['StopID'])); lat=float(row['Latitude'].replace(',','.'));lon=float(row['Longitude'].replace(',','.'))
        except (ValueError,TypeError):continue
        if not (47<lat<49 and 15<lon<18):continue
        diva=row.get('DIVA','').strip();name=row.get('StopText','').strip()
        if not name:continue
        gid=f'wl:{diva}' if diva else f'wl:rbl:{sid}'
        if gid not in groups: groups[gid]={'id':gid,'name':name,'lat':lat,'lon':lon,'provider':'wl','diva':diva,'rbl':[]}
        if sid not in groups[gid]['rbl']: groups[gid]['rbl'].append(sid)
    if not groups: raise ValueError('No stops parsed – refusing to generate blank output')
    line_rows=read_rows(a.lines_file,LINES)
    lines={r['LineID']:{'route':r['LineText'],'mode':mode_for(r['MeansOfTransport'])} for r in line_rows}
    official={r['LineText']:{'kind':r['MeansOfTransport'],'mode':mode_for(r['MeansOfTransport'])} for r in line_rows}
    planned,proof=passenger_line_mapping(a.gtfs_file,groups,official,a.reference_date)
    proof['sha256']=hashlib.sha256(a.gtfs_file.read_bytes()).hexdigest()
    platforms={}
    for r in read_rows(a.patterns_file,PATTERNS):
        if r['LineID'] in lines:platforms.setdefault(r['StopID'],{})[r['LineID']]=lines[r['LineID']]
    for stop in groups.values():
        linked={k:v for sid in stop['rbl'] for k,v in platforms.get(sid,{}).items()}
        stop['candidateLines']=sorted(linked.values(),key=lambda l:(l['mode'],l['route']))
        stop['lines']=sorted([{'route':name,'mode':official[name]['mode']} for name in planned[stop['id']]],key=lambda l:(l['mode'],l['route']))
        stop['lineMapping']='gtfs-service-week-v1'
        stop['modes']=sorted({l['mode'] for l in stop['lines']})
        stop['platforms']=[{'id':sid,'modes':sorted({v['mode'] for v in platforms[sid].values()})} for sid in stop['rbl'] if sid in platforms]
    covered=sum(bool(s['lines']) for s in groups.values())
    if covered<1500:raise ValueError(f'Incomplete line mapping: {covered} groups')
    output={'source':SOURCE,'lineSources':[LINES,GTFS_SOURCE],'patternSource':PATTERNS,'lineMapping':proof,'updated':datetime.now(timezone.utc).isoformat(),'lineMappedStops':covered,'stops':sorted(groups.values(),key=lambda s:s['name'])}
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f'Prepared {len(groups)} Wiener Linien stop groups -> {a.output} ({a.output.stat().st_size:,} bytes)')
if __name__=='__main__':main()
