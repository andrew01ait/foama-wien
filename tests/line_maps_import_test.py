import csv
import io
import sys
import unittest
import zipfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from prepare_line_maps import build, clip_shape, encode_polyline

class LineMapsImportTests(unittest.TestCase):
    def test_real_order_short_workings_modes_and_equivalent_calendar_shapes(self):
        rows={
          'calendar.txt':[['service_id','monday','tuesday','wednesday','thursday','friday','saturday','sunday','start_date','end_date'],['daily',*['1']*7,'20261109','20261110']],
          'routes.txt':[['route_id','route_short_name','route_type'],['tram','3','0'],['bus','3','3']],
          'trips.txt':[['trip_id','route_id','service_id','trip_headsign','direction_id','shape_id'],['full','tram','daily','Wien Nord','0','shape'],['copy','tram','daily','Wien Nord','0','same'],['short','tram','daily','Wien Nord','0','shape'],['bus','bus','daily','Wien Süd','1','reverse']],
          'stops.txt':[['stop_id','stop_name','stop_lat','stop_lon'],['at:49:1:0:1','Wien Eins','48','16'],['at:49:2:0:1','Wien Zwei','48.01','16'],['at:49:3:0:1','Wien Drei','48.01','16.01']],
          'stop_times.txt':[['trip_id','stop_id','stop_sequence','pickup_type','drop_off_type','shape_dist_traveled'],['full','at:49:3:0:1','30','0','0','2000'],['full','at:49:1:0:1','10','0','0','0'],['full','at:49:2:0:1','20','0','0','1000'],['copy','at:49:1:0:1','10','0','0','0'],['copy','at:49:2:0:1','20','0','0','1000'],['copy','at:49:3:0:1','30','0','0','2000'],['short','at:49:2:0:1','1','0','0','1000'],['short','at:49:3:0:1','2','0','0','2000'],['bus','at:49:3:0:1','1','0','0','0'],['bus','at:49:2:0:1','2','0','0','1000'],['bus','at:49:1:0:1','3','0','0','2000']],
          'shapes.txt':[['shape_id','shape_pt_lat','shape_pt_lon','shape_pt_sequence','shape_dist_traveled'],*[[shape,lat,lon,i,distance] for shape in ['shape','same'] for i,(lat,lon,distance) in enumerate([(48,16,0),(48.01,16,1000),(48.01,16.01,2000)])],*[["reverse",lat,lon,i,distance] for i,(lat,lon,distance) in enumerate([(48.01,16.01,0),(48.01,16,1000),(48,16,2000)])]]
        }
        buffer=io.BytesIO()
        with zipfile.ZipFile(buffer,'w') as archive:
            for name,values in rows.items():
                out=io.StringIO();csv.writer(out).writerows(values);archive.writestr(name,out.getvalue())
        manifest={'validFrom':'2026-11-10','validThrough':'2026-11-10','version':'v','sourceSha256':'sha','services':[['2026-11-09','2026-11-10']]}
        index={'lines':[{'id':mode+'|3','route':'3','mode':mode} for mode in ['tram','bus']]}
        known={'wl:'+str(60200000+i):{'name':name} for i,name in [(1,'Eins'),(2,'Zwei'),(3,'Drei')]}
        with zipfile.ZipFile(buffer) as archive: result=build(archive,manifest,index,known)
        self.assertEqual(len(result['tram|3']['patterns']),2)
        full=next(p for p in result['tram|3']['patterns'] if len(p['stops'])==3)
        self.assertEqual([p['name'] for p in full['stops']],['Eins','Zwei','Drei'])
        self.assertEqual(full['tripCount'],2);self.assertEqual(full['sourceShapeIds'],['same','shape'])
        self.assertEqual(result['bus|3']['patterns'][0]['stops'][0]['name'],'Drei')
        short=next(p for p in result['tram|3']['patterns'] if len(p['stops'])==2)
        self.assertEqual(result['tram|3']['shapes'][short['geometry']],encode_polyline([(48.01,16),(48.01,16.01)]))

    def test_distance_clipping_interpolates_on_real_geometry_and_rejects_bad_distances(self):
        points=[(48,16,0),(48.01,16,1000),(48.01,16.01,2000)]
        clipped=clip_shape(points,500,1500)
        self.assertEqual(len(clipped),3)
        for actual,expected in zip(clipped,[(48.005,16.0),(48.01,16),(48.01,16.005)]):
            for value,target in zip(actual,expected):self.assertAlmostEqual(value,target,places=9)
        self.assertEqual(clip_shape(points,0,3000),[])
        self.assertEqual(clip_shape([(48,16,0),(48.01,16,-1)],0,100),[])

if __name__=='__main__':unittest.main()
