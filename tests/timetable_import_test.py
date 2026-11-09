import csv
import datetime as dt
import io
import sys
import unittest
import zipfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from prepare_timetable import build, seconds

class TimetableImportTests(unittest.TestCase):
    def test_passenger_boarding_calendar_exceptions_and_identity(self):
        data={
          'calendar.txt':[['service_id','monday','tuesday','wednesday','thursday','friday','saturday','sunday','start_date','end_date'],['daily',*['1']*7,'20261108','20261111']],
          'calendar_dates.txt':[['service_id','date','exception_type'],['daily','20261110','2'],['special','20261110','1']],
          'routes.txt':[['route_id','route_short_name','route_type'],['u','U6','1']],
          'stops.txt':[['stop_id'],['at:49:1468:0:2'],['at:49:9999:0:1']],
          'trips.txt':[['trip_id','route_id','service_id','trip_headsign','direction_id'],['normal','u','daily','Wien Siebenhirten','1'],['extra','u','special','Wien Floridsdorf','0']],
          'stop_times.txt':[['trip_id','stop_id','departure_time','pickup_type','stop_sequence'],['normal','at:49:1468:0:2','25:15:00','0','1'],['normal','at:49:1468:0:2','25:16:00','1','2'],['normal','at:49:1468:0:2','25:17:00','2','3'],['normal','at:49:9999:0:1','25:18:00','0','4'],['extra','at:49:1468:0:2','12:00:00','0','1'],['extra','at:49:9999:0:1','12:05:00','0','2']]
        }
        buffer=io.BytesIO()
        with zipfile.ZipFile(buffer,'w') as z:
            for name,rows in data.items():
                out=io.StringIO();csv.writer(out).writerows(rows);z.writestr(name,out.getvalue())
        with zipfile.ZipFile(buffer) as z:
            services,groups=build(z,{'wl:60201468':{'lines':[{'route':'U6','mode':'metro'}]}},dt.date(2026,11,9),3)
        self.assertEqual(list(groups),['wl:60201468']);self.assertEqual(len(groups['wl:60201468']),2)
        regular=next(row for row in groups['wl:60201468'] if row[1]=='Siebenhirten')
        self.assertEqual(regular[-1],[90900]);self.assertNotIn('2026-11-10',services[regular[-2]])
        extra=next(row for row in groups['wl:60201468'] if row[1]=='Floridsdorf')
        self.assertEqual(services[extra[-2]],['2026-11-10'])

    def test_invalid_and_after_midnight_times(self):
        self.assertEqual(seconds('26:10:00'),94200)
        for value in ('48:00:00','20:60:00','bad','-1:00:00'): self.assertIsNone(seconds(value))

if __name__=='__main__':unittest.main()
