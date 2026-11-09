"""Passenger-service evidence for OGD station lines, never arbitrary pattern IDs."""
import csv
from datetime import timedelta
import io
import zipfile

GTFS_SOURCE = 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/gtfs.zip'
WEEKDAYS = ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')

def csv_rows(archive, name):
    if name not in archive.namelist():
        return
    with archive.open(name) as source:
        yield from csv.DictReader(io.TextIOWrapper(source, encoding='utf-8-sig'))

def service_dates(calendars, exceptions, start, days=7):
    dates = [(start + timedelta(days=i)).strftime('%Y%m%d') for i in range(days)]
    active = {}
    for row in calendars:
        active[row['service_id']] = {value for i,value in enumerate(dates)
            if row['start_date'] <= value <= row['end_date'] and row.get(WEEKDAYS[(start.weekday()+i)%7]) == '1'}
    for row in exceptions:
        if row['date'] not in dates:
            continue
        entry = active.setdefault(row['service_id'], set())
        if row['exception_type'] == '1': entry.add(row['date'])
        elif row['exception_type'] == '2': entry.discard(row['date'])
    return active

def gtfs_station(stop_id, known):
    # The Vienna IFOPT local stop number is the local component of DIVA.
    # No radius/name-based join: Gerstnerstraße must stay its own station.
    parts = stop_id.split(':')
    if len(parts) < 3 or parts[:2] != ['at','49'] or not parts[2].isdigit():
        return None
    key = 'wl:' + str(60200000 + int(parts[2]))
    return key if key in known else None

def canonical_route(row, official):
    name = row['route_short_name'].strip()
    # Replacement service can be a bus in GTFS while OGD keeps the parent tram
    # category (e.g. 26E). Transport-type equality is not an identity test.
    if name in official: return name
    # OGD identifies Rufbus variants with R; GTFS uses the public line name.
    if name+'R' in official and official[name+'R']['kind'] == 'ptRufBus': return name+'R'
    if name == 'BB' and row.get('agency_id') == '03' and official.get('LB',{}).get('kind') == 'ptTramWLB': return 'LB'
    return None

def passenger_line_mapping(path, known, official, reference_date, days=7):
    result = {key:set() for key in known}
    with zipfile.ZipFile(path) as archive:
        calendars = list(csv_rows(archive,'calendar.txt'))
        exceptions = list(csv_rows(archive,'calendar_dates.txt'))
        active = service_dates(calendars, exceptions, reference_date, days)
        covered = set().union(*active.values()) if active else set()
        expected = {(reference_date+timedelta(days=i)).strftime('%Y%m%d') for i in range(days)}
        if covered != expected: raise ValueError('GTFS does not cover the requested complete service week')
        routes = {row['route_id']:canonical_route(row,official) for row in csv_rows(archive,'routes.txt')}
        stop_keys = {row['stop_id']:gtfs_station(row['stop_id'],known) for row in csv_rows(archive,'stops.txt')}
        trips = {row['trip_id']:routes[row['route_id']] for row in csv_rows(archive,'trips.txt')
            if active.get(row['service_id']) and routes.get(row['route_id'])}
        with archive.open('stop_times.txt') as source:
            reader = csv.reader(io.TextIOWrapper(source,encoding='utf-8-sig'))
            header = next(reader)
            tid,sid = header.index('trip_id'),header.index('stop_id')
            pickup = header.index('pickup_type') if 'pickup_type' in header else None
            dropoff = header.index('drop_off_type') if 'drop_off_type' in header else None
            for row in reader:
                name,key = trips.get(row[tid]),stop_keys.get(row[sid])
                if not name or not key: continue
                if pickup is not None and dropoff is not None and row[pickup] == row[dropoff] == '1': continue
                result[key].add(name)
    return result, {'kind':'gtfs-service-week-v1','source':GTFS_SOURCE,
        'from':reference_date.isoformat(),'through':(reference_date+timedelta(days=days-1)).isoformat()}
