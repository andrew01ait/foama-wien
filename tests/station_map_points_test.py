import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from prepare_station_map_points import station_points


class StationMapPointsTests(unittest.TestCase):
    def test_exact_station_and_passenger_line_identity_preserve_physical_points_and_dates(self):
        manifest = dict(format=1, city='wien', version='v', sourceSha256='sha', validFrom='2026-11-09', validThrough='2026-12-12', services=[['2026-11-12'], ['2026-11-13']])
        known = {'s': {'lines': [{'route': '3', 'mode': 'bus'}]}}
        point = dict(id='s', lat=48.2, lon=16.4)
        line = dict(version='v', sourceSha256='sha', route='3', mode='bus', patterns=[{'services': [0], 'stops': [point, dict(point, id='unknown')]}, {'services': [1], 'stops': [point, dict(point, lat=48.21)]}])
        result = station_points([line, dict(line, mode='tram')], manifest, known)
        self.assertEqual(set(result['stations']), {'s'})
        rows = result['stations']['s']
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]['services'], [0, 1])
        self.assertEqual(rows[1]['services'], [1])
        self.assertEqual({row['mode'] for row in rows}, {'bus'})
        self.assertEqual(result['sourceSha256'], 'sha')
        with self.assertRaises(ValueError):
            station_points([dict(line, sourceSha256='different')], manifest, known)
