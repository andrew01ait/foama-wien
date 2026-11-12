#!/usr/bin/env python3
"""Build a deterministic complete Wear timetable from the canonical station shards."""
from pathlib import Path
import base64
import gzip
import hashlib
import io
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def prepare(root=ROOT):
    source = root / 'pwa/data/timetables/wien'
    manifest_bytes = (source / 'manifest.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    if manifest['format'] != 1 or manifest['timezone'] != 'Europe/Vienna':
        raise ValueError('Unsupported canonical timetable')
    files = {'manifest.json': manifest_bytes}
    for key, expected in manifest['shards'].items():
        raw = (source / (key + '.json')).read_bytes()
        shard = json.loads(raw)
        if hashlib.sha256(raw).hexdigest()[:16] != expected or shard['version'] != manifest['version']:
            raise ValueError('Timetable shard version/hash mismatch')
        stations = json.loads(gzip.decompress(base64.b64decode(shard['payload'], validate=True)))
        if any(manifest['stations'].get(sid) != int(key) for sid in stations):
            raise ValueError('Timetable station/shard mismatch')
        files[key + '.json'] = raw
    memory = io.BytesIO()
    with zipfile.ZipFile(memory, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, raw in sorted(files.items()):
            info = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, raw)
    payload = memory.getvalue()
    # Bind calendar/provenance edits too, even if the departure version stays unchanged.
    digest = hashlib.sha256(payload).hexdigest()
    filename = 'watch-' + digest[:20] + '.zip'
    for old in source.glob('watch-*.zip'):
        if old.name != filename:
            old.unlink()
    (source / filename).write_bytes(payload)
    metadata = {key: manifest[key] for key in ('format', 'city', 'timezone', 'version', 'validFrom', 'validThrough', 'sourceSha256')}
    metadata.update(filename=filename, bytes=len(payload), sha256=digest, stations=len(manifest['stations']))
    (source / 'watch.json').write_text(json.dumps(metadata, ensure_ascii=False, separators=(',', ':')) + '\n')
    destination = root / 'wear/app/src/main/assets/timetable-wien.zip'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(payload)
    return metadata


if __name__ == '__main__':
    data = prepare()
    print('Watch timetable:', data['stations'], 'stations;', data['bytes'], 'bytes; valid through', data['validThrough'])
