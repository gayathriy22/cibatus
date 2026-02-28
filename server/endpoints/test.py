from flask import g, jsonify
from .setup import setup_blueprint

test_bp = setup_blueprint("test")

@test_bp.route("/test")
def test():
    response = g.supabase.table("users").select("*").execute()
    return jsonify(response.data)

@test_bp.route("/test_post", methods=["POST"])
def test_post():
    print("posting")
    data = {
        "apps_to_track": None,
        "auth_uid": "546ef60d-a4e5-47d8-bada-c6965c3e8569",
        "daily_time_goal": 1.5,
        "first_name": "post_test",
        "plant_uid": "081f8a20-e6ab-4ed9-a904-431913167aac",
    }
    response = g.supabase.table("users").insert(data).execute()
    return jsonify(response.data)
