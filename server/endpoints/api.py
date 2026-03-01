"""
API blueprint: all table access goes through these endpoints.
Requires Authorization: Bearer <supabase_access_token>. Backend uses service role for DB/Storage.
"""
import logging
from flask import g, jsonify, request
from .setup import setup_blueprint

api_bp = setup_blueprint("api")
logger = logging.getLogger(__name__)


def get_auth_uid():
    """Require valid Bearer token and set g.auth_uid. Return (error_response, status) or (None, None)."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    token = auth[7:]
    try:
        try:
            user = g.supabase.auth.get_user(jwt=token)
        except TypeError:
            user = g.supabase.auth.get_user(token)
        if not user or not getattr(user, "user", None):
            return jsonify({"error": "Invalid token"}), 401
        g.auth_uid = str(getattr(user.user, "id", None) or "")
        if not g.auth_uid:
            return jsonify({"error": "Invalid token"}), 401
        return None, None
    except Exception as e:
        logger.exception("get_auth_uid failed")
        return jsonify({"error": "Invalid token", "detail": str(e)}), 401


@api_bp.route("/api/profile", methods=["GET"])
def get_profile():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    try:
        r = g.supabase.table("users").select("*").eq("auth_uid", g.auth_uid).execute()
        data = r.data
        if isinstance(data, list):
            profile = data[0] if len(data) > 0 else None
        else:
            profile = data
        return jsonify(profile), 200
    except Exception as e:
        logger.exception("get_profile failed")
        return jsonify({"error": "Get profile failed", "detail": str(e)}), 500


@api_bp.route("/api/profile", methods=["POST"])
def create_profile():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    body = request.get_json() or {}
    for k in ("first_name", "daily_time_goal", "apps_to_track", "plant_uid"):
        if k not in body:
            return jsonify({"error": f"Missing {k}"}), 400
    try:
        r = g.supabase.table("users").insert({
            "auth_uid": g.auth_uid,
            "first_name": body["first_name"],
            "daily_time_goal": body["daily_time_goal"],
            "apps_to_track": body["apps_to_track"],
            "plant_uid": body["plant_uid"],
        }).execute()
        data = r.data
        if isinstance(data, list) and len(data) > 0:
            data = data[0]
        return jsonify(data), 201
    except Exception as e:
        logger.exception("create_profile failed")
        return jsonify({"error": "Create profile failed", "detail": str(e)}), 500


@api_bp.route("/api/profile/disconnect-plant", methods=["PATCH"])
def disconnect_plant():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    try:
        g.supabase.table("users").update({"plant_uid": None}).eq("auth_uid", g.auth_uid).execute()
        return jsonify({"ok": True}), 200
    except Exception as e:
        logger.exception("disconnect_plant failed")
        return jsonify({"error": "Disconnect plant failed", "detail": str(e)}), 500

@api_bp.route("/api/plants", methods=["POST"])
def create_plant():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    body = request.get_json() or {}
    plant_uid = body.get("plant_uid")
    plant_name = body.get("plant_name", "My Plant")
    plant_img_uri = body.get("plant_img_uri")
    if not plant_uid:
        return jsonify({"error": "Missing plant_uid"}), 400
    try:
        r = g.supabase.table("plant").insert({
            "plant_uid": plant_uid,
            "plant_name": plant_name,
            "plant_img_uri": plant_img_uri,
        }).execute()
        data = r.data
        if isinstance(data, list) and len(data) > 0:
            data = data[0]
        elif isinstance(data, list) and len(data) == 0:
            return jsonify({"error": "Insert failed", "detail": "No row returned"}), 500
        return jsonify(data), 201
    except Exception as e:
        logger.exception("create_plant failed")
        return jsonify({"error": "Create plant failed", "detail": str(e)}), 500


@api_bp.route("/api/plants/<plant_uid>", methods=["GET", "PATCH"])
def get_or_update_plant(plant_uid):
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    if request.method == "GET":
        try:
            r = g.supabase.table("plant").select("*").eq("plant_uid", plant_uid).execute()
            data = r.data
            if isinstance(data, list):
                data = data[0] if len(data) > 0 else None
            return jsonify(data), 200
        except Exception as e:
            logger.exception("get_plant failed")
            return jsonify({"error": "Get plant failed", "detail": str(e)}), 500
    if request.method == "PATCH":
        body = request.get_json() or {}
        updates = {}
        if "plant_img_uri" in body:
            updates["plant_img_uri"] = body["plant_img_uri"]
        if "plant_name" in body:
            updates["plant_name"] = body["plant_name"]
        if not updates:
            return jsonify({"error": "No updates provided"}), 400
        try:
            r = g.supabase.table("plant").update(updates).eq("plant_uid", plant_uid).execute()
            data = r.data
            if isinstance(data, list) and len(data) > 0:
                data = data[0]
            return jsonify(data or {"ok": True}), 200
        except Exception as e:
            logger.exception("update_plant failed")
            return jsonify({"error": "Update plant failed", "detail": str(e)}), 500
    return jsonify({"error": "Method not allowed"}), 405


@api_bp.route("/api/plants/character", methods=["POST"])
def insert_plant_character():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    body = request.get_json() or {}
    for k in ("plant_uid", "character_health"):
        if k not in body:
            return jsonify({"error": f"Missing {k}"}), 400
    try:
        r = g.supabase.table("plantCharacter").insert({
            "plant_uid": body["plant_uid"],
            "character_health": body["character_health"],
            "character_image_uri": body.get("character_image_uri"),
        }).execute()
        data = r.data
        if isinstance(data, list) and len(data) > 0:
            data = data[0]
        return jsonify(data), 201
    except Exception as e:
        logger.exception("insert_plant_character failed")
        return jsonify({"error": "Insert plant character failed", "detail": str(e)}), 500


@api_bp.route("/api/plants/<plant_uid>/character", methods=["GET"])
def get_plant_character(plant_uid):
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    try:
        r = (
            g.supabase.table("plantCharacter")
            .select("*")
            .eq("plant_uid", plant_uid)
            .order("plant_character_id", desc=True)
            .limit(1)
            .execute()
        )
        data = r.data
        if isinstance(data, list):
            data = data[0] if len(data) > 0 else None
        return jsonify(data), 200
    except Exception as e:
        logger.exception("get_plant_character failed")
        return jsonify({"error": "Get plant character failed", "detail": str(e)}), 500


@api_bp.route("/api/time-history", methods=["POST"])
def append_time_history():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    try:
        r = g.supabase.table("users").select("user_id").eq("auth_uid", g.auth_uid).execute()
        profile_list = r.data if isinstance(r.data, list) else [r.data] if r.data else []
        if not profile_list:
            return jsonify({"error": "User profile not found"}), 404
        user_id = profile_list[0]["user_id"]
        body = request.get_json() or {}
        daily_total = body.get("daily_total", 0)
        daily_pickups = body.get("daily_pickups", 0)
        date_time = body.get("date_time")
        if date_time is None:
            from datetime import datetime, timezone
            date_time = datetime.now(timezone.utc).isoformat()
        r = g.supabase.table("timeHistory").insert({
            "user_id": user_id,
            "daily_total": daily_total,
            "daily_pickups": daily_pickups,
            "date_time": date_time,
        }).execute()
        data = r.data
        if isinstance(data, list) and len(data) > 0:
            data = data[0]
        return jsonify(data), 201
    except Exception as e:
        logger.exception("append_time_history failed")
        return jsonify({"error": "Append time history failed", "detail": str(e)}), 500


@api_bp.route("/api/time-history/latest", methods=["GET"])
def get_time_history_latest():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    try:
        r = g.supabase.table("users").select("user_id").eq("auth_uid", g.auth_uid).execute()
        profile_list = r.data if isinstance(r.data, list) else [r.data] if r.data else []
        if not profile_list:
            return jsonify(None), 200
        user_id = profile_list[0]["user_id"]
        r = (
            g.supabase.table("timeHistory")
            .select("*")
            .eq("user_id", user_id)
            .order("date_time", desc=True)
            .limit(1)
            .execute()
        )
        data = r.data
        if isinstance(data, list):
            data = data[0] if len(data) > 0 else None
        return jsonify(data), 200
    except Exception as e:
        logger.exception("get_time_history_latest failed")
        return jsonify({"error": "Get time history failed", "detail": str(e)}), 500


@api_bp.route("/api/time-history", methods=["GET"])
def get_time_history_range():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    try:
        r = g.supabase.table("users").select("user_id").eq("auth_uid", g.auth_uid).execute()
        profile_list = r.data if isinstance(r.data, list) else [r.data] if r.data else []
        if not profile_list:
            return jsonify([]), 200
        user_id = profile_list[0]["user_id"]
        days = request.args.get("days", type=int, default=7)
        from datetime import datetime, timezone, timedelta
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        r = (
            g.supabase.table("timeHistory")
            .select("*")
            .eq("user_id", user_id)
            .gte("date_time", since)
            .order("date_time", desc=False)
            .execute()
        )
        return jsonify(r.data or []), 200
    except Exception as e:
        logger.exception("get_time_history_range failed")
        return jsonify({"error": "Get time history range failed", "detail": str(e)}), 500


@api_bp.route("/api/upload/plant-image", methods=["POST"])
def upload_plant_image():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    if "file" not in request.files:
        return jsonify({"error": "Missing file"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "No filename"}), 400
    try:
        path = f"{int(__import__('time').time() * 1000)}-{f.filename}"
        bucket = "plant-images"
        content = f.read()
        opts = {"content-type": f.content_type or "image/jpeg"} if f.content_type else {}
        g.supabase.storage.from_(bucket).upload(path, content, opts)
        url = g.supabase.storage.from_(bucket).get_public_url(path)
        return jsonify({"publicUrl": url}), 200
    except Exception as e:
        logger.exception("upload_plant_image failed")
        return jsonify({"error": "Upload plant image failed", "detail": str(e)}), 500

