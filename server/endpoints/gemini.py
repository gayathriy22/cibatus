import base64
import io
import os
import uuid
from urllib import request as urlrequest

from flask import g, jsonify, request
from google import genai
from google.genai import types
from PIL import Image

from .setup import setup_blueprint

MODEL = "gemini-3.1-flash-image-preview"
PROMPT = "Turn this plant photo into a cute cartoon illustration. Keep it recognizable."
MAX_INPUT_DIMENSION = 1024
STORAGE_BUCKET = "plant-images"

gemini_bp = setup_blueprint("gemini")


def _to_image_bytes(data):
    if isinstance(data, bytes):
        return data
    if isinstance(data, str):
        return base64.b64decode(data)
    raise TypeError(f"Unsupported inline image data type: {type(data)!r}")


def _resize_for_upload(image):
    width, height = image.size
    max_dim = max(width, height)
    if max_dim <= MAX_INPUT_DIMENSION:
        return image

    scale = MAX_INPUT_DIMENSION / float(max_dim)
    new_size = (int(width * scale), int(height * scale))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def _download_image_from_uri(uri):
    req = urlrequest.Request(uri, headers={"User-Agent": "cibatus-server/1.0"})
    with urlrequest.urlopen(req, timeout=20) as res:
        image_data = res.read()
    return Image.open(io.BytesIO(image_data)).convert("RGB")


def _resolve_inputs(body):
    plant_uid = body.get("plant_uid")
    if not plant_uid:
        return None, None, (jsonify({"error": "Missing plant_uid"}), 400)

    plant_img_uri = body.get("plant_img_uri")
    if plant_img_uri:
        return plant_uid, plant_img_uri, None

    db_response = g.supabase.table("plant").select("plant_img_uri").eq("plant_uid", plant_uid).execute()
    if not db_response.data:
        return None, None, (jsonify({"error": "Plant not found"}), 404)

    plant_img_uri = db_response.data[0].get("plant_img_uri")
    if not plant_img_uri:
        return None, None, (
            jsonify({
                "error": "Missing plant_img_uri",
                "detail": "The plant has no image set. Upload a plant photo in onboarding or set plant_img_uri on the plant row.",
            }),
            400,
        )
    return plant_uid, plant_img_uri, None


def _generate_cartoon_image(input_image):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")
    
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=MODEL,
        contents=[PROMPT, input_image],
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio="1:1",
                image_size="1K",
            ),
        ),
    )

    for part in response.parts or []:
        if part.inline_data and part.inline_data.data:
            return _to_image_bytes(part.inline_data.data)
    raise RuntimeError("No image was returned by Gemini.")


def _upload_output_to_storage(filename, output_bytes):
    storage_path = f"generated/{filename}"
    opts = {"content-type": "image/png"}
    g.supabase.storage.from_(STORAGE_BUCKET).upload(storage_path, output_bytes, opts)
    return g.supabase.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)


def _insert_plant_character(plant_uid, character_image_uri):
    result = g.supabase.table("plantCharacter").insert({
        "plant_uid": plant_uid,
        "character_image_uri": character_image_uri,
    }).execute()
    data = result.data
    if isinstance(data, list) and len(data) > 0:
        return data[0]
    return data


@gemini_bp.route("/gemini/generate_image", methods=["POST"])
def gemini_generate_image():
    body = request.get_json() or {}
    plant_uid, plant_img_uri, error_response = _resolve_inputs(body)
    if error_response is not None:
        return error_response

    try:
        downloaded_image = _download_image_from_uri(plant_img_uri)
        upload_image = _resize_for_upload(downloaded_image)
        output_bytes = _generate_cartoon_image(upload_image)

        filename = f"cartoon_plant_{uuid.uuid4().hex}.png"
        public_url = _upload_output_to_storage(filename, output_bytes)
        character_row = _insert_plant_character(plant_uid, public_url)
        print(f"Generated image public URL: {public_url}")
    except Exception as exc:
        return jsonify({"error": "Failed to generate image", "detail": str(exc)}), 500

    return jsonify({
        "ok": True,
        "plant_uid": plant_uid,
        "plant_img_uri": plant_img_uri,
        "output_filename": filename,
        "public_url": public_url,
        "plant_character": character_row,
    }), 200
