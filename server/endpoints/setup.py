from flask import Blueprint, current_app, g, jsonify
from werkzeug.exceptions import HTTPException

def attach_supabase_client():
    supabase = current_app.config.get("SUPABASE_CLIENT")
    supabase_config_error = current_app.config.get("SUPABASE_CONFIG_ERROR")

    if supabase is None:
        return jsonify({"error": supabase_config_error}), 503

    g.supabase = supabase
    return None

def handle_blueprint_error(e):
    if isinstance(e, HTTPException):
        return e
    return jsonify({"error": str(e)}), 500

def setup_blueprint(name):
    bp = Blueprint(name, __name__)
    bp.before_request(attach_supabase_client)
    bp.errorhandler(Exception)(handle_blueprint_error)
    return bp
