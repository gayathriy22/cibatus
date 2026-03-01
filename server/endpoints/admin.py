from flask import g, jsonify, request
from .setup import setup_blueprint

admin_bp = setup_blueprint("admin")

@admin_bp.route("/admin/kill_plant", methods=["POST"])
def admin_kill_plant():
    body = request.get_json() or {}
    plant_uid = body.get("plant_uid")
    if not plant_uid:
        return jsonify({"error": "Missing plant_uid"}), 400
    
    print("killing plant")
    data = {
        "plant_uid": plant_uid,
        "action": "kill",
    }
    response = g.supabase.table("waterQueue").insert(data).execute()
    return jsonify(response.data)

@admin_bp.route("/admin/reset_kill", methods=["POST"])
def admin_reset_kill():
    body = request.get_json() or {}
    plant_uid = body.get("plant_uid")
    if not plant_uid:
        return jsonify({"error": "Missing plant_uid"}), 400
    
    print("resetting kill")
    data = {
        "plant_uid": plant_uid,
        "action": "reset_kill",
    }
    response = g.supabase.table("waterQueue").insert(data).execute()
    return jsonify(response.data)

@admin_bp.route("/admin/give_pure", methods=["POST"])
def admin_give_pure():
    body = request.get_json() or {}
    plant_uid = body.get("plant_uid")
    if not plant_uid:
        return jsonify({"error": "Missing plant_uid"}), 400
    
    print("giving pure")
    data = {
        "plant_uid": plant_uid,
        "action": "give_pure",
    }
    response = g.supabase.table("waterQueue").insert(data).execute()
    return jsonify(response.data)

@admin_bp.route("/admin/give_light_nutrient", methods=["POST"])
def admin_give_light_nutrient():
    body = request.get_json() or {}
    plant_uid = body.get("plant_uid")
    if not plant_uid:
        return jsonify({"error": "Missing plant_uid"}), 400
    
    print("giving light nutrient")
    data = {
        "plant_uid": plant_uid,
        "action": "give_light_nutrient",
    }
    response = g.supabase.table("waterQueue").insert(data).execute()
    return jsonify(response.data)
