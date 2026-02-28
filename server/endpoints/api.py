"""
API blueprint: all table access goes through these endpoints.
Requires Authorization: Bearer <supabase_access_token>. Backend uses service role for DB/Storage.
"""
from flask import g, jsonify, request
from .setup import setup_blueprint

api_bp = setup_blueprint("api")


def get_auth_uid():
    """Require valid Bearer token and set g.auth_uid. Return (error_response, status) or (None, None)."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    token = auth[7:]
    try:
        user = g.supabase.auth.get_user(jwt=token)
        if not user or not getattr(user, "user", None):
            return jsonify({"error": "Invalid token"}), 401
        g.auth_uid = str(getattr(user.user, "id", None) or "")
        if not g.auth_uid:
            return jsonify({"error": "Invalid token"}), 401
        return None, None
    except Exception as e:
        return jsonify({"error": "Invalid token", "detail": str(e)}), 401


@api_bp.route("/api/profile", methods=["GET"])
def get_profile():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    r = g.supabase.table("users").select("*").eq("auth_uid", g.auth_uid).maybe_single().execute()
    if not r.data:
        return jsonify(None), 200
    return jsonify(r.data), 200


@api_bp.route("/api/profile", methods=["POST"])
def create_profile():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    body = request.get_json() or {}
    for k in ("first_name", "daily_time_goal", "apps_to_track", "plant_uid"):
        if k not in body:
            return jsonify({"error": f"Missing {k}"}), 400
    r = g.supabase.table("users").insert({
        "auth_uid": g.auth_uid,
        "first_name": body["first_name"],
        "daily_time_goal": body["daily_time_goal"],
        "apps_to_track": body["apps_to_track"],
        "plant_uid": body["plant_uid"],
    }).select().single().execute()
    return jsonify(r.data), 201


@api_bp.route("/api/profile/disconnect-plant", methods=["PATCH"])
def disconnect_plant():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    g.supabase.table("users").update({"plant_uid": None}).eq("auth_uid", g.auth_uid).execute()
    return jsonify({"ok": True}), 200


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
    r = g.supabase.table("plant").insert({
        "plant_uid": plant_uid,
        "plant_name": plant_name,
        "plant_img_uri": plant_img_uri,
    }).select().single().execute()
    return jsonify(r.data), 201


@api_bp.route("/api/plants/<plant_uid>", methods=["GET"])
def get_plant(plant_uid):
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    r = g.supabase.table("plant").select("*").eq("plant_uid", plant_uid).maybe_single().execute()
    return jsonify(r.data), 200


@api_bp.route("/api/plants/character", methods=["POST"])
def insert_plant_character():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    body = request.get_json() or {}
    for k in ("plant_uid", "character_health"):
        if k not in body:
            return jsonify({"error": f"Missing {k}"}), 400
    r = g.supabase.table("plantCharacter").insert({
        "plant_uid": body["plant_uid"],
        "character_health": body["character_health"],
        "character_image_uri": body.get("character_image_uri"),
    }).select().single().execute()
    return jsonify(r.data), 201


@api_bp.route("/api/plants/<plant_uid>/character", methods=["GET"])
def get_plant_character(plant_uid):
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    r = (
        g.supabase.table("plantCharacter")
        .select("*")
        .eq("plant_uid", plant_uid)
        .order("plant_character_id", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    return jsonify(r.data), 200


@api_bp.route("/api/time-history", methods=["POST"])
def append_time_history():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    profile = g.supabase.table("users").select("user_id").eq("auth_uid", g.auth_uid).maybe_single().execute()
    if not profile.data:
        return jsonify({"error": "User profile not found"}), 404
    user_id = profile.data["user_id"]
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
    }).select().single().execute()
    return jsonify(r.data), 201


@api_bp.route("/api/time-history/latest", methods=["GET"])
def get_time_history_latest():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    profile = g.supabase.table("users").select("user_id").eq("auth_uid", g.auth_uid).maybe_single().execute()
    if not profile.data:
        return jsonify(None), 200
    user_id = profile.data["user_id"]
    r = (
        g.supabase.table("timeHistory")
        .select("*")
        .eq("user_id", user_id)
        .order("date_time", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    return jsonify(r.data), 200


@api_bp.route("/api/time-history", methods=["GET"])
def get_time_history_range():
    err, status = get_auth_uid()
    if err is not None:
        return err, status
    profile = g.supabase.table("users").select("user_id").eq("auth_uid", g.auth_uid).maybe_single().execute()
    if not profile.data:
        return jsonify([]), 200
    user_id = profile.data["user_id"]
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
    path = f"{int(__import__('time').time() * 1000)}-{f.filename}"
    bucket = "plant-images"
    content = f.read()
    opts = {"content-type": f.content_type or "image/jpeg"} if f.content_type else {}
    g.supabase.storage.from_(bucket).upload(path, content, opts)
    url = g.supabase.storage.from_(bucket).get_public_url(path)
    return jsonify({"publicUrl": url}), 200
