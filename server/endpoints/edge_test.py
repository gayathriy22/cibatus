from flask import g, jsonify, request
from .setup import setup_blueprint

edge_test_bp = setup_blueprint("edge_test")

@edge_test_bp.route("/edge/get_queue", methods=["GET"])
def edge_get_queue():
    print("getting queue")
    response = g.supabase.table("waterQueue") \
        .select("*") \
        .eq("plant_uid", "081f8a20-e6ab-4ed9-a904-431913167aac") \
        .eq("handled", False) \
        .execute()
    return jsonify(response.data)

@edge_test_bp.route("/edge/set_handled", methods=["POST"])
def edge_set_handled():
    data = request.get_json()
    response = g.supabase.table("waterQueue").update({
        "handled": True,
    }).eq("id", data["id"]).execute()
    return jsonify(response.data), 200
