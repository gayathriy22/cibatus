from urllib import error, parse, request
import json
import threading
import time

from arduino.app_utils import *

BASE_URL = "https://197d-128-199-12-13.ngrok-free.app"
ENDPOINT = "/test_post"
PAYLOAD = "{}"
POLL_INTERVAL_SECONDS = 30


def _join_url(base_url, endpoint):
    base = str(base_url or "").strip()
    path = str(endpoint or "").strip()
    return parse.urljoin(base.rstrip("/") + "/", path.lstrip("/"))


def _payload_to_bytes(payload):
    text = str(payload or "").strip()
    if not text:
        return b"{}"

    try:
        parsed = json.loads(text)
        return json.dumps(parsed).encode("utf-8")
    except json.JSONDecodeError:
        return text.encode("utf-8")


def _post_once(base_url, endpoint, payload):
    target_url = _join_url(base_url, endpoint)
    body = _payload_to_bytes(payload)

    req = request.Request(
        url=target_url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=10) as res:
            status = res.getcode()
            print(f"[poller] POST {target_url} -> {status}")
        return True
    except error.HTTPError as exc:
        print(f"[poller] HTTP error {exc.code} for {target_url}: {exc}")
    except error.URLError as exc:
        print(f"[poller] URL error for {target_url}: {exc}")
    except Exception as exc:
        print(f"[poller] Unexpected error for {target_url}: {exc}")

    return False


def _poll_and_blink_loop():
    while True:
        ok = _post_once(BASE_URL, ENDPOINT, PAYLOAD)
        if ok:
            try:
                Bridge.call("blink_led_once", True)
                print("[poller] Triggered blink_led_once over Bridge")
            except Exception as exc:
                print(f"[poller] Bridge call failed: {exc}")

        time.sleep(POLL_INTERVAL_SECONDS)


threading.Thread(target=_poll_and_blink_loop, daemon=True).start()

App.run()
