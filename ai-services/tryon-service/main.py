"""
Virtual Try-On service (computer vision).

POST /try-on takes a customer's hand/wrist photo plus the selected
product's bracelet image, detects the wrist, and returns a composited
preview image - proposal section 5.3.

Detection: MediaPipe HandLandmarker (Google's pretrained hand-landmark
model) finds the wrist and knuckle landmarks. If no hand is detected
(bad lighting, cropped photo, etc.) the endpoint falls back to two
manually-marked wrist points that the frontend lets the customer drag
onto their own photo, so the feature still works end-to-end.
"""
import base64
import io
import os
import time
import uuid
from typing import Optional

import requests as http_requests
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from PIL import Image
from pydantic import BaseModel

from background_removal import ensure_cutout, warm_up_rembg
from geometry import (
    angle_and_width_from_landmarks,
    angle_and_width_from_points,
    composite_bracelet,
)
from llm_tryon import generate_llm_tryon

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def _load_env():
    possible_paths = [
        os.path.join(BASE_DIR, "..", "..", "backend", ".env"),
        os.path.join(BASE_DIR, ".env"),
        os.path.join(BASE_DIR, "..", "..", ".env"),
    ]
    for p in possible_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            if k and not os.environ.get(k):
                                os.environ[k] = v
            except Exception:
                pass

_load_env()

MODEL_PATH = os.path.join(BASE_DIR, "models", "hand_landmarker.task")
OUTPUT_DIR = os.path.join(BASE_DIR, "uploads", "results")
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI(title="Virtual Try-On Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

_landmarker: Optional[mp_vision.HandLandmarker] = None


@app.on_event("startup")
def _warm_up_models() -> None:
    get_landmarker()
    warm_up_rembg()


def get_landmarker() -> mp_vision.HandLandmarker:
    global _landmarker
    if _landmarker is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(
                f"Hand landmark model not found at {MODEL_PATH}. "
                "See ai-services/tryon-service/README.md to download it."
            )
        base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
        options = mp_vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=1,
            min_hand_detection_confidence=0.5,
            running_mode=mp_vision.RunningMode.IMAGE,
        )
        _landmarker = mp_vision.HandLandmarker.create_from_options(options)
    return _landmarker


class TryOnResponse(BaseModel):
    detected: bool
    method: str
    image_base64: str
    result_url: str


def _load_image_from_upload(upload: UploadFile) -> Image.Image:
    data = upload.file.read()
    return Image.open(io.BytesIO(data))


def _load_bracelet_image(bracelet_image: Optional[UploadFile], bracelet_image_url: Optional[str]) -> Image.Image:
    if bracelet_image is not None:
        return _load_image_from_upload(bracelet_image)
    if bracelet_image_url:
        resp = http_requests.get(bracelet_image_url, timeout=10)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content))
    raise HTTPException(400, "Provide either bracelet_image or bracelet_image_url")


@app.get("/health")
def health():
    return {"status": "ok", "service": "tryon-service", "model_loaded": os.path.exists(MODEL_PATH)}


@app.post("/try-on", response_model=TryOnResponse)
def try_on(
    hand_image: UploadFile = File(...),
    bracelet_image: Optional[UploadFile] = File(None),
    bracelet_image_url: Optional[str] = Form(None),
    wrist_x1: Optional[float] = Form(None),
    wrist_y1: Optional[float] = Form(None),
    wrist_x2: Optional[float] = Form(None),
    wrist_y2: Optional[float] = Form(None),
    force_manual: bool = Form(False),
    mode: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None),
    provider: Optional[str] = Form("gemini"),
):
    hand_img = _load_image_from_upload(hand_image).convert("RGB")
    bracelet_img = _load_bracelet_image(bracelet_image, bracelet_image_url)

    effective_api_key = (
        api_key
        or os.environ.get("LLM_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or os.environ.get("GEMINI_API_KEY")
    )

    # Auto-detect provider from key prefix: OpenAI keys start with "sk-"
    if not provider or provider == "gemini":
        if effective_api_key and effective_api_key.startswith("sk-"):
            provider = "openai"
        else:
            provider = "gemini"

    print(f"[TryOn] Using provider: {provider}, key present: {bool(effective_api_key)}")

    # 1. Try LLM Generative AI Try-On if API Key is available
    if effective_api_key:
        try:
            result_img = generate_llm_tryon(
                hand_img, bracelet_img, effective_api_key, provider
            )
            filename = f"{uuid.uuid4().hex}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)
            result_img.save(filepath, format="PNG")
            _cleanup_old_files(OUTPUT_DIR, max_age_seconds=3600)

            buf = io.BytesIO()
            result_img.save(buf, format="PNG")
            b64 = base64.b64encode(buf.getvalue()).decode("ascii")

            return TryOnResponse(
                detected=True,
                method=f"ai_generative_{provider}",
                image_base64=b64,
                result_url=f"/outputs/{filename}",
            )
        except Exception as e:
            print(f"[LLM Try-On Error]: {e} - falling back to CV compositing")

    # 2. Enhanced 3D Elliptical Compositing (Standard / Fallback Mode)
    bracelet_img = ensure_cutout(bracelet_img)

    manual_points_given = None not in (wrist_x1, wrist_y1, wrist_x2, wrist_y2)
    method = "manual"
    center = angle_deg = width = None

    if not force_manual:
        try:
            import numpy as np
            from mediapipe import Image as MPImage
            from mediapipe import ImageFormat

            mp_image = MPImage(image_format=ImageFormat.SRGB, data=np.array(hand_img))
            result = get_landmarker().detect(mp_image)
            if result.hand_landmarks:
                lm = result.hand_landmarks[0]
                center, angle_deg, width = angle_and_width_from_landmarks(
                    lm[0], lm[5], lm[17], hand_img.width, hand_img.height
                )
                method = "auto_3d"
                print(f"[TryOn] Landmarks detected. Center={center}, Angle={angle_deg:.1f}°, WristWidth={width:.1f}px, ImageSize={hand_img.size}")
            else:
                print(f"[TryOn] No hand landmarks detected in image (size={hand_img.size})")
        except Exception as ex:
            print(f"[TryOn] Landmark detection error: {ex}")

    if method not in ("auto", "auto_3d"):
        if not manual_points_given:
            raise HTTPException(
                422,
                "No hand detected automatically. Retry with wrist_x1/y1/x2/y2 "
                "marking both edges of the wrist on the photo.",
            )
        center, angle_deg, width = angle_and_width_from_points((wrist_x1, wrist_y1), (wrist_x2, wrist_y2))

    result_img = composite_bracelet(hand_img, bracelet_img, center, angle_deg, width)

    filename = f"{uuid.uuid4().hex}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    result_img.save(filepath, format="PNG")
    _cleanup_old_files(OUTPUT_DIR, max_age_seconds=3600)

    buf = io.BytesIO()
    result_img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    return TryOnResponse(
        detected=(method in ("auto", "auto_3d")),
        method=method,
        image_base64=b64,
        result_url=f"/outputs/{filename}",
    )


def _cleanup_old_files(directory: str, max_age_seconds: int) -> None:
    now = time.time()
    try:
        for name in os.listdir(directory):
            path = os.path.join(directory, name)
            if os.path.isfile(path) and now - os.path.getmtime(path) > max_age_seconds:
                os.remove(path)
    except OSError:
        pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
