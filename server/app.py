import os
from pathlib import Path
import importlib

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from supabase import create_client

load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

BLUEPRINTS = [
    "test",
    "users",
    "api",
    "edge_test",
    "admin",
]


def create_app():
    app = Flask(__name__)
    CORS(app, origins=["*"], allow_headers=["Content-Type", "Authorization"])
    load_dotenv()
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    supabase = None
    supabase_config_error = None

    if not supabase_url:
        supabase_config_error = "Supabase not configured. Set SUPABASE_URL in .env."
    else:
        if not supabase_service_role_key:
            supabase_config_error = (
                "Supabase not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env."
            )
        elif supabase_service_role_key.startswith("sb_publishable_"):
            supabase_config_error = (
                "Invalid key type for backend access. Use SUPABASE_SERVICE_ROLE_KEY, not a publishable key."
            )
        else:
            supabase = create_client(supabase_url, supabase_service_role_key)

    app.config["SUPABASE_CLIENT"] = supabase
    app.config["SUPABASE_CONFIG_ERROR"] = supabase_config_error

    for blueprint in BLUEPRINTS:
        blueprint_module = importlib.import_module(f"endpoints.{blueprint}")
        app.register_blueprint(getattr(blueprint_module, f"{blueprint}_bp"))

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
