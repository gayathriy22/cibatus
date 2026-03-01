from flask import g, jsonify, request
from .setup import setup_blueprint

edge_test_bp = setup_blueprint("edge_test")

@edge_test_bp.route("/edge/get_queue", methods=["GET"])
def edge_get_queue():
    print("getting queue")
    response = g.supabase.table("waterQueue") \
        .select("*") \
        .eq("plant_uid", "d40def0b-bb1b-4cc3-84da-9ea8da0c17f4") \
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
