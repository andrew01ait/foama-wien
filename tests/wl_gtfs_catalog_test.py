import csv
from datetime import date
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
import zipfile

spec=importlib.util.spec_from_file_location('wl_gtfs_catalog',Path(__file__).resolve().parents[1]/'scripts/wl_gtfs_catalog.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class CatalogTests(unittest.TestCase):
    def test_calendar_dates_additions_removals_and_weekend_only_services(self):
        calendars=[dict(service_id='day',start_date='20261108',end_date='20261114',**{key:'1' for key in module.WEEKDAYS}),dict(service_id='night',start_date='20261108',end_date='20261114',**{key:str(int(key=='saturday')) for key in module.WEEKDAYS})]
        exceptions=[dict(service_id='day',date='20261110',exception_type='2'),dict(service_id='extra',date='20261111',exception_type='1')]
        result=module.service_dates(calendars,exceptions,date(2026,11,8))
        self.assertNotIn('20261110',result['day']);self.assertEqual(result['extra'],{'20261111'});self.assertEqual(result['night'],{'20261114'})

    def test_station_identity_does_not_join_neighboring_stops_by_name_or_distance(self):
        known={'wl:60201468','wl:60201566'}
        self.assertEqual(module.gtfs_station('at:49:1468:0:3',known),'wl:60201468')
        self.assertEqual(module.gtfs_station('at:49:1566:0:3',known),'wl:60201566')
        self.assertIsNone(module.gtfs_station('at:43:1468:0:3',known));self.assertIsNone(module.gtfs_station('at:49:9999:0:3',known))

    def test_only_documented_operator_label_variants_are_canonicalized(self):
        official={'N54R':{'kind':'ptRufBus'},'LB':{'kind':'ptTramWLB'}}
        self.assertEqual(module.canonical_route({'route_short_name':'N54'},official),'N54R')
        self.assertEqual(module.canonical_route({'route_short_name':'BB','agency_id':'03'},official),'LB')
        self.assertIsNone(module.canonical_route({'route_short_name':'BB','agency_id':'04'},official))
        self.assertIsNone(module.canonical_route({'route_short_name':'54'},official))
        self.assertEqual(module.canonical_route({'route_short_name':'26E','route_type':'3'},{'26E':{'kind':'ptTram','mode':'tram'}}),'26E')

    def fixture(self,path,old_calendar=False):
        calendar=[['service_id',*module.WEEKDAYS,'start_date','end_date'],['normal',*['1']*7,'20250101','20250107'] if old_calendar else ['normal',*['1']*7,'20261108','20261114'],['past',*['1']*7,'20260101','20260107']]
        files={
          'calendar.txt':calendar,'calendar_dates.txt':[['service_id','date','exception_type']],
          'routes.txt':[['route_id','route_short_name','agency_id'],['u','U6','04'],['one','1','04'],['five','5','04'],['bus','57A','04']],
          'stops.txt':[['stop_id','stop_name'],['at:49:1468:0:1','Westbahnhof'],['at:49:1566:0:1','Westbahnhof/Gerstnerstraße']],
          'trips.txt':[['trip_id','route_id','service_id'],['a','u','normal'],['b','one','past'],['c','one','normal'],['d','five','normal'],['e','bus','normal']],
          'stop_times.txt':[['trip_id','stop_id','pickup_type','drop_off_type'],['a','at:49:1468:0:1','0','0'],['b','at:49:1468:0:1','0','0'],['c','at:49:1468:0:1','1','1'],['d','at:49:1468:0:1','1','0'],['e','at:49:1566:0:1','0','0']]
        }
        with zipfile.ZipFile(path,'w') as archive:
            for name,rows in files.items():
                text=io.StringIO();csv.writer(text).writerows(rows);archive.writestr(name,text.getvalue())

    def test_only_dated_passenger_trips_establish_membership_including_alighting_terminal(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'feed.zip';self.fixture(path)
            official={key:{'kind':'ptMetro' if key=='U6' else 'ptTram'} for key in ['U6','1','5','57A']}
            result,proof=module.passenger_line_mapping(path,{'wl:60201468','wl:60201566'},official,date(2026,11,8))
            self.assertEqual(result['wl:60201468'],{'U6','5'});self.assertEqual(result['wl:60201566'],{'57A'});self.assertEqual(proof['through'],'2026-11-14')

    def test_expired_or_incomplete_feed_fails_without_falling_back_to_route_variants(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'feed.zip';self.fixture(path,True)
            with self.assertRaisesRegex(ValueError,'complete service week'):
                module.passenger_line_mapping(path,{'wl:60201468'},{},date(2026,11,8))

if __name__=='__main__':unittest.main()
