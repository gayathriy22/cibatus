from flask import g, jsonify
from .setup import setup_blueprint

test_bp = setup_blueprint("test")

@test_bp.route("/test")
def test():
    response = g.supabase.table("users").select("*").execute()
    return jsonify(response.data)
