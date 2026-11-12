import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from prepare_vehicle_lines import ordered_match,matching_patterns,decode_shape,usable_geometry
from prepare_line_maps import encode_polyline

class VehicleLineImportTest(unittest.TestCase):
    def test_exact_stop_identity_and_order_required(self):
        sequence=[('wl:1','10'),('wl:2','11'),('wl:3','12')]
        self.assertEqual(ordered_match(sequence,['wl:1','wl:3']),['10','12'])
        self.assertIsNone(ordered_match(sequence,['wl:3','wl:1']))
        self.assertIsNone(ordered_match(sequence,['similar name']))

    def test_complete_regular_route_outweighs_detour_subsequence(self):
        regular=[('wl:1','10'),('wl:2','11'),('wl:3','12')]
        detour=[('wl:9','90'),*regular,('wl:8','80')]
        matches=matching_patterns([('regular','2',regular),('detour','1',detour)],['wl:1','wl:2','wl:3'])
        self.assertEqual(matches,[('regular','2',['10','11'])])

    def test_conflicting_complete_routes_remain_ambiguous(self):
        sequence=[('wl:1','10'),('wl:2','11'),('wl:3','12')]
        matches=matching_patterns([('a','1',sequence),('b','2',sequence)],['wl:1','wl:2','wl:3'])
        self.assertEqual({d for _,d,_ in matches},{'1','2'})

    def test_empty_diva_staging_node_does_not_hide_exact_route(self):
        sequence=[('wl:','99'),('wl:1','10'),('wl:2','11'),('wl:3','12')]
        self.assertEqual(matching_patterns([('regular','2',sequence)],['wl:1','wl:2','wl:3']),[('regular','2',['10','11'])])

    def test_shape_projection_rejects_wrong_side_order_and_distant_stations(self):
        shape=[(48,16),(48.001,16),(48.001,16.002)]
        stops=[{'lat':48,'lon':16},{'lat':48.001,'lon':16.002}]
        self.assertTrue(usable_geometry(shape,stops))
        self.assertFalse(usable_geometry(shape,list(reversed(stops))))
        self.assertFalse(usable_geometry(shape,[stops[0],{'lat':48.02,'lon':16.02}]))

    def test_real_shape_roundtrip_and_repeated_anchor_rejection(self):
        points=[(48.0,16.0),(48.001,16.0),(48.001,16.002)]
        self.assertEqual(decode_shape(encode_polyline(points)),points)
        self.assertFalse(usable_geometry(points,[{'lat':48,'lon':16}]*2))

if __name__=='__main__':unittest.main()
