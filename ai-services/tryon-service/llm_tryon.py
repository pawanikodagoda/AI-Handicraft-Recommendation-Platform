import base64
import io
import os
import requests
from PIL import Image


def image_to_base64_jpeg(img: Image.Image, max_size: int = 800) -> str:
    """Convert PIL Image to base64 JPEG, resizing if too large."""
    img = img.convert("RGB")
    if max(img.width, img.height) > max_size:
        ratio = max_size / max(img.width, img.height)
        img = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


TRYON_PROMPT = (
    "Generate a single photorealistic image of the hand from the first photo "
    "wearing the bracelet/bangle shown in the second photo. "
    "The bracelet must sit perfectly on the wrist, wrapping around it naturally. "
    "Keep the exact hand pose, skin tone, fingers, and background unchanged. "
    "Keep the exact bracelet design, colors, and materials. "
    "Make it look like a professional jewelry store product photo."
)


def try_on_with_openai(
    hand_image: Image.Image,
    bracelet_image: Image.Image,
    api_key: str,
) -> Image.Image:
    """
    Generates a photorealistic virtual try-on using OpenAI GPT-4o image output.
    Uses gpt-4o-image or falls back to DALL-E 3 with a detailed description.
    """
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    hand_b64 = image_to_base64_jpeg(hand_image)
    bracelet_b64 = image_to_base64_jpeg(bracelet_image)

    # --- Method 1: GPT-4o with image output (responses API) ---
    try:
        print("[OpenAI TryOn] Trying gpt-4o-image via responses API...")
        response = client.responses.create(
            model="gpt-4o",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Hand photo:"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{hand_b64}"}},
                        {"type": "text", "text": "Bracelet product photo:"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{bracelet_b64}"}},
                        {"type": "text", "text": TRYON_PROMPT},
                    ],
                }
            ],
        )
        for block in response.output:
            if hasattr(block, "image") and block.image:
                img_bytes = base64.b64decode(block.image.data)
                result = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                print(f"[OpenAI TryOn] GPT-4o image output success: {result.size}")
                return result
    except Exception as e:
        print(f"[OpenAI TryOn] GPT-4o responses API: {e}")

    # --- Method 2: gpt-4o-mini image generation via chat ---
    try:
        print("[OpenAI TryOn] Trying chat completions with image output...")
        response = client.chat.completions.create(
            model="gpt-4o-image-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Hand photo:"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{hand_b64}"}},
                        {"type": "text", "text": "Bracelet product photo:"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{bracelet_b64}"}},
                        {"type": "text", "text": TRYON_PROMPT},
                    ],
                }
            ],
        )
        for choice in response.choices:
            for part in (choice.message.content or []):
                if isinstance(part, dict) and part.get("type") == "image_url":
                    url = part["image_url"]["url"]
                    if url.startswith("data:"):
                        b64 = url.split(",", 1)[1]
                        result = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
                        print(f"[OpenAI TryOn] chat image output success: {result.size}")
                        return result
    except Exception as e:
        print(f"[OpenAI TryOn] chat completions image: {e}")

    # --- Method 3: DALL-E 3 with GPT-4o description ---
    print("[OpenAI TryOn] Falling back to DALL-E 3 with GPT-4o description...")
    try:
        # First use GPT-4o to describe the hand and bracelet in detail
        desc_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this hand/wrist photo in precise detail: skin tone, hand orientation, angle, background, lighting. Keep it under 100 words."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{hand_b64}"}},
                    ],
                }
            ],
            max_tokens=150,
        )
        hand_desc = desc_response.choices[0].message.content or "a human hand"

        brac_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this bracelet/bangle in precise detail: material, color, design, gems, style. Keep it under 80 words."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{bracelet_b64}"}},
                    ],
                }
            ],
            max_tokens=120,
        )
        bracelet_desc = brac_response.choices[0].message.content or "a bracelet"

        dalle_prompt = (
            f"Photorealistic professional product photo of a human hand and wrist: {hand_desc}. "
            f"The wrist is wearing a bracelet: {bracelet_desc}. "
            "The bracelet sits perfectly on the wrist, fitting snugly and naturally. "
            "Studio lighting, sharp focus, white/neutral background."
        )
        print(f"[OpenAI TryOn] DALL-E 3 prompt: {dalle_prompt[:200]}...")

        dalle_response = client.images.generate(
            model="dall-e-3",
            prompt=dalle_prompt,
            n=1,
            size="1024x1024",
            quality="hd",
            response_format="b64_json",
        )
        img_data = base64.b64decode(dalle_response.data[0].b64_json)
        result = Image.open(io.BytesIO(img_data)).convert("RGB")
        print(f"[OpenAI TryOn] DALL-E 3 success: {result.size}")
        return result

    except Exception as e:
        raise RuntimeError(f"OpenAI try-on failed: {e}")


def try_on_with_gemini(
    hand_image: Image.Image,
    bracelet_image: Image.Image,
    api_key: str,
) -> Image.Image:
    """
    Generates a photorealistic virtual try-on using Google Gemini image generation.
    """
    hand_b64 = image_to_base64_jpeg(hand_image)
    bracelet_b64 = image_to_base64_jpeg(bracelet_image)

    models_to_try = [
        "gemini-3.1-flash-image",
        "gemini-2.5-flash-image",
        "gemini-3.1-flash-lite-image",
    ]

    last_error = None
    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": "Hand photo:"},
                    {"inline_data": {"mime_type": "image/jpeg", "data": hand_b64}},
                    {"text": "Bracelet product photo:"},
                    {"inline_data": {"mime_type": "image/jpeg", "data": bracelet_b64}},
                    {"text": TRYON_PROMPT},
                ]
            }],
            "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
        }

        try:
            res = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=90)
            if res.status_code == 429:
                last_error = f"Model {model_name} quota exceeded (429)"
                print(f"[Gemini TryOn] {last_error}, trying next model...")
                continue
            if res.status_code != 200:
                last_error = f"Model {model_name} returned {res.status_code}"
                print(f"[Gemini TryOn] {last_error}, trying next model...")
                continue

            parts = res.json().get("candidates", [{}])[0].get("content", {}).get("parts", [])
            for part in parts:
                if "inlineData" in part:
                    img_bytes = base64.b64decode(part["inlineData"]["data"])
                    result = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                    print(f"[Gemini TryOn] SUCCESS with {model_name}: {result.size}")
                    return result

            last_error = f"Model {model_name} returned no image"
            print(f"[Gemini TryOn] {last_error}, trying next model...")
        except Exception as e:
            last_error = str(e)
            print(f"[Gemini TryOn] {model_name} error: {e}")

    raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")


def generate_llm_tryon(
    hand_image: Image.Image,
    bracelet_image: Image.Image,
    api_key: str,
    provider: str = "gemini"
) -> Image.Image:
    """Primary dispatcher for LLM / Generative AI Virtual Try-On."""
    provider = (provider or "gemini").lower()
    if provider == "openai":
        return try_on_with_openai(hand_image, bracelet_image, api_key)
    else:
        return try_on_with_gemini(hand_image, bracelet_image, api_key)
