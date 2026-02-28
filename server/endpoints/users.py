from flask import g, jsonify
from .setup import setup_blueprint

users_bp = setup_blueprint("users")

@users_bp.route("/users/all")
def users_all():
    response = g.supabase.table("users").select("*").execute()
    return jsonify(response.data)
