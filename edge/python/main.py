from urllib import error, parse, request
import json
import threading
import time

from arduino.app_utils import *

API_BASE_URL = "https://c680-128-199-12-13.ngrok-free.app"
GET_QUEUE_ENDPOINT = "/edge/get_queue"
SET_HANDLED_ENDPOINT = "/edge/set_handled"
POLL_INTERVAL_SECONDS = 5
ACTION_TO_ID = {
    "kill": "KILL",
    "reset_kill": "RESET_KILL",
    "give_pure": 0,
    "give_light_nutrient": 1
}


def _join_url(base_url, endpoint):
    base = str(base_url or "").strip()
    path = str(endpoint or "").strip()
    return parse.urljoin(base.rstrip("/") + "/", path.lstrip("/"))


def _request_json(method, endpoint, payload=None):
    target_url = _join_url(API_BASE_URL, endpoint)
    body = None
    headers = {}

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(
        url=target_url,
        data=body,
        headers=headers,
        method=method,
    )

    with request.urlopen(req, timeout=10) as res:
        status = res.getcode()
        text = res.read().decode("utf-8").strip()
        data = json.loads(text) if text else None
        print(f"[poller] {method} {target_url} -> {status}")
        return status, data


def _get_next_queue_item():
    try:
        _, data = _request_json("GET", GET_QUEUE_ENDPOINT)
    except error.HTTPError as exc:
        print(f"[poller] GET queue HTTP error {exc.code}: {exc}")
        return None
    except error.URLError as exc:
        print(f"[poller] GET queue URL error: {exc}")
        return None
    except Exception as exc:
        print(f"[poller] GET queue unexpected error: {exc}")
        return None

    if not isinstance(data, list) or len(data) == 0:
        return None
    return data[0]


def _set_handled(item_id):
    try:
        _request_json("POST", SET_HANDLED_ENDPOINT, {"id": item_id})
        return True
    except error.HTTPError as exc:
        print(f"[poller] set_handled HTTP error {exc.code}: {exc}")
    except error.URLError as exc:
        print(f"[poller] set_handled URL error: {exc}")
    except Exception as exc:
        print(f"[poller] set_handled unexpected error: {exc}")
    return False


def _arduino_ack_is_success(ack):
    if ack is True:
        return True
    if isinstance(ack, str):
        return ack.strip().lower() in ("true", "1", "ok", "success")
    return False


def _kill_plant():
    try:
        ack = Bridge.call("kill_plant")
        print(f"[poller] Bridge kill_plant ack: {ack}")
        return ack
    except Exception as exc:
        print(f"[poller] Bridge call failed: {exc}")
        return None


def _reset_kill():
    try:
        ack = Bridge.call("reset_kill")
        print(f"[poller] Bridge reset_kill ack: {ack}")
        return ack
    except Exception as exc:
        print(f"[poller] Bridge call failed: {exc}")
        return None


def _run_pump(duration_ms, action_id):
    try:
        ack = Bridge.call("run_pump", duration_ms, action_id)
        print(f"[poller] Bridge run_pump ack: {ack}")
        return ack
    except Exception as exc:
        print(f"[poller] Bridge call failed: {exc}")
        return None


def _poll_loop():
    while True:
        item = _get_next_queue_item()
        if item is None:
            print("[poller] queue empty")
            time.sleep(POLL_INTERVAL_SECONDS)
            continue

        item_id = item.get("id") if isinstance(item, dict) else None
        action = item.get("action") if isinstance(item, dict) else None
        action_id = ACTION_TO_ID.get(action)
        duration_ms = 1000

        if item_id is None:
            print("[poller] first queue item missing 'id'")
            time.sleep(POLL_INTERVAL_SECONDS)
            continue

        ack = None
        if action_id == "KILL":
            ack = _kill_plant()
        elif action_id == "RESET_KILL":
            ack = _reset_kill()
        else:
            print(type(duration_ms), duration_ms, type(action_id), action_id)
            ack = _run_pump(duration_ms, action_id)
        
        if ack is None:
            time.sleep(POLL_INTERVAL_SECONDS)
            continue

        if _arduino_ack_is_success(ack):
            _set_handled(item_id)
        else:
            print("[poller] Arduino did not ack success; skipping set_handled")

        time.sleep(POLL_INTERVAL_SECONDS)


threading.Thread(target=_poll_loop, daemon=True).start()

App.run()
