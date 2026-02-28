from flask import Blueprint, current_app, g, jsonify
from werkzeug.exceptions import HTTPException

test_bp = Blueprint("test", __name__)


@test_bp.before_request
def attach_supabase_client():
    supabase = current_app.config.get("SUPABASE_CLIENT")
    supabase_config_error = current_app.config.get("SUPABASE_CONFIG_ERROR")

    if supabase is None:
        return jsonify({"error": supabase_config_error}), 503

    g.supabase = supabase
    return None


@test_bp.errorhandler(Exception)
def handle_blueprint_error(e):
    if isinstance(e, HTTPException):
        return e
    return jsonify({"error": str(e)}), 500


@test_bp.route("/test")
def test():
    response = g.supabase.table("users").select("*").execute()
    return jsonify(response.data)
