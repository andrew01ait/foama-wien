#!/usr/bin/env python3
"""Derive physical station-map anchors from the installed official line maps."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def station_points(lines, manifest, known):
    grouped = {}
    for line in lines:
        if line['version'] != manifest['version'] or line['sourceSha256'] != manifest['sourceSha256']:
            raise ValueError('Station points and timetable source differ')
        for pattern in line['patterns']:
            for stop in pattern['stops']:
                station = known.get(stop['id'])
                if not station or not any(item['route'] == line['route'] and item['mode'] == line['mode'] for item in station.get('lines', [])):
                    continue
                key = (stop['id'], stop['lat'], stop['lon'], line['route'], line['mode'])
                grouped.setdefault(key, set()).update(pattern['services'])
    stations = {}
    for (sid, lat, lon, route, mode), services in sorted(grouped.items()):
        stations.setdefault(sid, []).append({'lat': lat, 'lon': lon, 'route': route, 'mode': mode, 'services': sorted(services)})
    return {key: manifest[key] for key in ('format', 'city', 'version', 'sourceSha256', 'validFrom', 'validThrough', 'services')} | {'stations': stations}


def main():
    manifest = json.loads((ROOT/'pwa/data/timetables/wien/manifest.json').read_text())
    folder = ROOT/'pwa/data/line-maps/wien'
    index = json.loads((folder/'index.json').read_text())
    lines = []
    for entry in index['lines']:
        raw = (folder/entry['file']).read_bytes()
        if hashlib.sha256(raw).hexdigest() != entry['sha256']:
            raise ValueError('Line-map digest differs')
        lines.append(json.loads(raw))
    known = {s['id']: s for s in json.loads((ROOT/'pwa/data/stops.json').read_text())['stops']}
    result = station_points(lines, manifest, known)
    target = ROOT/'pwa/data/station-map-points.json'
    target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
    print(f'Station-map points: {len(result["stations"])} stations, {target.stat().st_size} bytes')


if __name__ == '__main__':
    main()
