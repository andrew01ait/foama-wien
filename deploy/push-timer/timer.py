#!/usr/bin/env python3
"""Small standalone timer; no account, keys, user data or incoming port."""
import json
import os
from pathlib import Path
import signal
import sys
import threading
import time
import urllib.error
import urllib.request

TARGET = "https://foama-wien.endruuu.chatgpt.site/api/push/check"
STAMP = Path("/tmp/foama-push-last-success")


def check_once(opener=urllib.request.urlopen, clock=time.time):
    request = urllib.request.Request(
        TARGET, data=b"{}", method="POST",
        headers={"Content-Type": "application/json", "Accept": "application/json",
                 "User-Agent": "foama-wien-push-timer/0.1"},
    )
    with opener(request, timeout=120) as response:
        if response.status != 200:
            raise ValueError("http-status")
        value = json.loads(response.read(8192))
    last = value.get("lastSuccess")
    if value.get("state") not in ("ok", "partial") or not isinstance(last, (int, float)):
        raise ValueError("source-not-ready")
    if not 0 <= clock() - last / 1000 <= 20 * 60:
        raise ValueError("source-stale")
    return last / 1000


def interval():
    return max(300, min(3600, int(os.environ.get("PUSH_INTERVAL_SECONDS", "300"))))


def main():
    if "--healthcheck" in sys.argv:
        try:
            return 0 if time.time() - float(STAMP.read_text()) < 20 * 60 else 1
        except (OSError, ValueError):
            return 1
    stop = threading.Event()
    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, lambda *_: stop.set())
    while not stop.is_set():
        ok = False
        try:
            STAMP.write_text(str(check_once()))
            print(json.dumps({"event": "check-ok"}), flush=True)
            ok = True
        except urllib.error.HTTPError as error:
            print(json.dumps({"event": "check-http-error", "status": error.code}), flush=True)
        except Exception:
            # Provider bodies and URLs may contain credentials; never log them.
            print(json.dumps({"event": "check-unavailable"}), flush=True)
        if "--once" in sys.argv:
            return 0 if ok else 1
        stop.wait(interval())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
