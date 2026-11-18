import base64
import gzip
import hashlib
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from prepare_watch_timetable import prepare


class WatchTimetableTests(unittest.TestCase):
    def fixture(self, root):
        source = root / 'pwa/data/timetables/wien'
        source.mkdir(parents=True)
        manifest = dict(format=1, city='wien', timezone='Europe/Vienna', version='a' * 20,
                        validFrom='2026-11-09', validThrough='2026-12-12', sourceSha256='b' * 64,
                        stations={'wl:60201917': 0}, services=[['2026-11-12']], shards={})
        for i in range(32):
            data = {'wl:60201917': [['29B', 'Floridsdorf S U', 'bus', 'at:49:1917', '0', 0, [43200]]]} if i == 0 else {}
            raw = json.dumps(dict(format=1, version=manifest['version'], encoding='gzip-base64',
                                 payload=base64.b64encode(gzip.compress(json.dumps(data).encode(), mtime=0)).decode())).encode()
            (source / f'{i}.json').write_bytes(raw)
            manifest['shards'][str(i)] = hashlib.sha256(raw).hexdigest()[:16]
        (source / 'manifest.json').write_text(json.dumps(manifest))
        return source

    def test_complete_deterministic_pack_preserves_hard_dates_and_public_provenance(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = self.fixture(root)
            first = prepare(root)
            second = prepare(root)
            self.assertEqual(first, second)
            raw = (source / first['filename']).read_bytes()
            self.assertEqual(first['sha256'], hashlib.sha256(raw).hexdigest())
            self.assertEqual(first['bytes'], len(raw))
            self.assertEqual(raw, (root / 'wear/app/src/main/assets/timetable-wien.zip').read_bytes())
            with zipfile.ZipFile(source / first['filename']) as archive:
                self.assertEqual(33, len(archive.namelist()))
                self.assertEqual(json.loads(archive.read('manifest.json'))['validThrough'], '2026-12-12')
            self.assertEqual('2026-11-09', first['validFrom'])

    def test_bad_shard_cannot_be_packaged(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = self.fixture(root)
            (source / '4.json').write_text('{}')
            with self.assertRaises(ValueError):
                prepare(root)

    def test_manifest_and_station_shard_binding_is_enforced(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = self.fixture(root)
            path = source / 'manifest.json'
            manifest = json.loads(path.read_text())
            manifest['stations']['wl:60201917'] = 1
            path.write_text(json.dumps(manifest))
            with self.assertRaises(ValueError):
                prepare(root)


if __name__ == '__main__':
    unittest.main()
