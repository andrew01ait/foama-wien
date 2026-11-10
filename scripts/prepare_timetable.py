#!/usr/bin/env python3
"""Build bounded, station-indexed passenger schedules from official GTFS.

No raw GTFS is parsed in the Worker or browser. Calendar exceptions are resolved
at import, and each compressed shard is fetched only when its station is used.
"""
import argparse
import base64
import collections
import csv
import datetime as dt
import gzip
import hashlib
import io
import json
from pathlib import Path
import zipfile
from zoneinfo import ZoneInfo
from wl_gtfs_catalog import csv_rows, gtfs_station, service_dates, GTFS_SOURCE

ROOT = Path(__file__).resolve().parents[1]

def seconds(value):
    try:
        h, m, s = map(int, value.split(':'))
        return h * 3600 + m * 60 + s if 0 <= h < 48 and 0 <= m < 60 and 0 <= s < 60 else None
    except (ValueError, AttributeError):
        return None

def route_mode(value):
    value = int(value)
    if value == 0 or 900 <= value < 1000: return 'tram'
    if value == 1 or value in (400, 401, 402): return 'metro'
    if value == 2 or 100 <= value < 200: return 'regional'
    return 'bus'

def build(archive, known, anchor, days):
    # Include yesterday so after-midnight trips from its service day survive.
    active = service_dates(list(csv_rows(archive, 'calendar.txt')),
        list(csv_rows(archive, 'calendar_dates.txt')), anchor - dt.timedelta(days=1), days + 1)
    covered = set().union(*active.values()) if active else set()
    expected = {(anchor + dt.timedelta(days=i)).strftime('%Y%m%d') for i in range(days)}
    if not expected.issubset(covered):
        raise ValueError('GTFS does not cover the complete requested schedule period')
    services = [sorted(dt.datetime.strptime(day, '%Y%m%d').date().isoformat() for day in dates)
                for key, dates in sorted(active.items()) if dates]
    service_ids = {key: i for i, (key, dates) in enumerate((item for item in sorted(active.items()) if item[1]))}
    known_lines = {line['route']: line['mode'] for stop in known.values()
                   for line in stop.get('lines', []) + stop.get('candidateLines', [])}
    routes = {}
    for row in csv_rows(archive, 'routes.txt'):
        name = row['route_short_name'].strip()
        if name == 'BB' and row.get('agency_id') == '03' and 'LB' in known_lines: name = 'LB'
        if name not in known_lines and name + 'R' in known_lines: name += 'R'
        routes[row['route_id']] = (name, known_lines.get(name, route_mode(row.get('route_type', '3'))))
    trips = {}
    for row in csv_rows(archive, 'trips.txt'):
        route = routes.get(row['route_id'])
        if route and row['service_id'] in service_ids:
            trips[row['trip_id']] = (*route, row.get('trip_headsign', '').removeprefix('Wien '),
                row.get('direction_id', ''), service_ids[row['service_id']])
    stops = {row['stop_id']: gtfs_station(row['stop_id'], known) for row in csv_rows(archive, 'stops.txt')}
    groups = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
    terminal = {}
    with archive.open('stop_times.txt') as source:
        reader = csv.reader(io.TextIOWrapper(source, encoding='utf-8-sig'))
        header = next(reader)
        tid, sid, dep, seq = (header.index(k) for k in ('trip_id', 'stop_id', 'departure_time', 'stop_sequence'))
        pickup = header.index('pickup_type') if 'pickup_type' in header else None
        headsign = header.index('stop_headsign') if 'stop_headsign' in header else None
        for row in reader:
            trip, stop = trips.get(row[tid]), stops.get(row[sid])
            if not trip: continue
            sequence = int(row[seq])
            if sequence >= terminal.get(row[tid], (-1, None))[0]: terminal[row[tid]] = (sequence, None)
            if not stop or pickup is not None and row[pickup] in ('1', '2', '3'): continue
            value = seconds(row[dep])
            if value is None: continue
            route, mode, towards, direction, service = trip
            towards = (row[headsign] if headsign is not None and row[headsign] else towards).removeprefix('Wien ')
            if not towards: continue
            # IFOPT is retained as provenance, never guessed to be a monitor RBL.
            key = (route, towards, mode, row[sid], direction, service)
            groups[stop][key][value] += 1
            if sequence >= terminal[row[tid]][0]: terminal[row[tid]] = (sequence, (stop, key, value))
    # Even if an upstream feed defaults pickup_type to 0, a trip's final stop
    # has no onward passenger departure. Count contributions to retain another
    # real trip departing at the same station/time. File order is irrelevant.
    for sequence, last in terminal.values():
        if last:
            stop, key, value = last
            groups[stop][key][value] -= 1
    result = {stop: [list(group) + [sorted(value for value, count in values.items() if count > 0)]
                    for group, values in sorted(rows.items()) if any(count > 0 for count in values.values())]
              for stop, rows in sorted(groups.items())}
    return services, {stop: rows for stop, rows in result.items() if rows}

def write_bundle(groups, services, out, anchor, days, digest, source=GTFS_SOURCE, line_stops=None, source_archive_date=None, source_version=None):
    version = hashlib.sha256(json.dumps([services, groups], sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()[:20]
    count = 32
    buckets = [{} for _ in range(count)]
    station_index = {}
    for stop, rows in groups.items():
        bucket = int(hashlib.sha256(stop.encode()).hexdigest()[:8], 16) % count
        buckets[bucket][stop] = rows
        station_index[stop] = bucket
    out.mkdir(parents=True, exist_ok=True)
    hashes = {}
    for index, bucket in enumerate(buckets):
        raw = json.dumps(bucket, ensure_ascii=False, separators=(',', ':')).encode()
        compressed = gzip.compress(raw, compresslevel=9, mtime=0)
        payload = {'format': 1, 'version': version, 'encoding': 'gzip-base64', 'payload': base64.b64encode(compressed).decode()}
        text = json.dumps(payload, separators=(',', ':'))
        hashes[str(index)] = hashlib.sha256(text.encode()).hexdigest()[:16]
        (out / f'{index}.json').write_text(text)
    manifest = {'format': 1, 'city': 'wien', 'timezone': 'Europe/Vienna', 'source': source,
        'attribution': 'Datenquelle: Stadt Wien – data.wien.gv.at · CC BY 4.0',
        'generated': dt.datetime.now(dt.timezone.utc).isoformat(), 'sourceSha256': digest,
        'sourcePublishedAt': None, 'sourceArchiveDate': source_archive_date, 'sourceVersion': source_version,
        'validFrom': anchor.isoformat(), 'validThrough': (anchor + dt.timedelta(days=days-1)).isoformat(),
        'services': services, 'stations': station_index, 'shards': hashes}
    # Version binds the calendars and all shard hashes; no mixed old/new tables.
    manifest['version'] = version
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
    if line_stops is not None:
        from prepare_line_index import line_index
        index=line_index(manifest,[json.loads((out/(key+'.json')).read_text()) for key in hashes],line_stops)
        (out/'lines.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':')))
    return manifest

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('gtfs', type=Path)
    parser.add_argument('--date', type=dt.date.fromisoformat, default=dt.datetime.now(ZoneInfo('Europe/Vienna')).date())
    parser.add_argument('--days', type=int, default=35)
    parser.add_argument('--out', type=Path, default=ROOT / 'pwa/data/timetables/wien')
    args = parser.parse_args()
    if not 1 <= args.days <= 90: parser.error('--days must be between 1 and 90')
    known = {stop['id']: stop for stop in json.loads((ROOT / 'pwa/data/stops.json').read_text())['stops']}
    with zipfile.ZipFile(args.gtfs) as archive:
        services, groups = build(archive, known, args.date, args.days)
        source_archive_date='-'.join(str(value).zfill(2) for value in max(info.date_time for info in archive.infolist())[:3])
        feed_info=list(csv_rows(archive,'feed_info.txt')) if 'feed_info.txt' in archive.namelist() else []
        source_version=feed_info[0].get('feed_version') if feed_info else None
    if len(groups) < 1500: raise ValueError('Incomplete Vienna passenger timetable')
    manifest = write_bundle(groups, services, args.out, args.date, args.days, hashlib.sha256(args.gtfs.read_bytes()).hexdigest(), line_stops=known, source_archive_date=source_archive_date, source_version=source_version)
    print(f'{len(groups)} stations; {sum(len(v) for v in groups.values())} schedule groups; valid {manifest["validFrom"]}–{manifest["validThrough"]}; {sum(p.stat().st_size for p in args.out.glob("*.json")):,} bytes')

if __name__ == '__main__': main()
