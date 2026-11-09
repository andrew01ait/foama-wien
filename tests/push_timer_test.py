import importlib.util
import io
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("push_timer", Path(__file__).parents[1] / "deploy/push-timer/timer.py")
timer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(timer)


class FakeResponse(io.BytesIO):
    status = 200


class TimerContract(unittest.TestCase):
    def test_empty_post_and_recent_authoritative_receipt(self):
        def open_request(request, timeout):
            self.assertEqual(request.full_url, timer.TARGET)
            self.assertEqual(request.method, "POST")
            self.assertEqual(request.data, b"{}")
            self.assertEqual(timeout, 120)
            return FakeResponse(json.dumps({"lastSuccess": 2_000_000, "state": "ok", "skipped": True}).encode())
        self.assertEqual(timer.check_once(open_request, clock=lambda: 2010), 2000)

    def test_http_ok_without_a_fresh_source_success_is_unhealthy(self):
        for data in ({"state": "source-error", "lastSuccess": 2_000_000},
                     {"state": "ok", "lastSuccess": 1000},
                     {"state": "ok", "lastSuccess": 5_000_000}):
            with self.subTest(data=data), self.assertRaises(ValueError):
                timer.check_once(lambda *_args, **_kwargs: FakeResponse(json.dumps(data).encode()), clock=lambda: 2010)

    def test_invalid_or_missing_receipt_is_rejected(self):
        for raw in (b"not-json", b"{}", b"null"):
            with self.subTest(raw=raw), self.assertRaises((ValueError, AttributeError)):
                timer.check_once(lambda *_args, **_kwargs: FakeResponse(raw), clock=lambda: 2010)


if __name__ == "__main__":
    unittest.main()
