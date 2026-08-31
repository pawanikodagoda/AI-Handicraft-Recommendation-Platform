"""
Turns an ordinary product photo (bracelet on a plain card, in a jewellery
box, on fabric, etc.) into a transparent cutout suitable for overlaying on
a wrist photo.

Sellers upload regular photos, not pre-cut PNGs, so the try-on endpoint
cannot assume it was handed a clean cutout - it has to make one.

Primary method: rembg (U2Net, a pretrained neural background-removal
model) - it segments cleanly regardless of how busy or low-contrast the
background is, including cases a classical approach cannot: tested
against a bracelet photographed on top of an open magazine (text,
printed photo and all) where colour/texture-based segmentation has no
real edge to find, and it isolated the piece correctly. Session creation
loads ~176MB of model weights and takes real time (~20s), which is why
it's created once at process startup (see main.py) rather than per
request; inference itself is under a second per image.

Fallback: a classical OpenCV GrabCut pass, used only if the rembg model
can't be loaded (offline first run with no cached weights, etc.), so the
feature still works, just with lower-quality cutouts on hard backgrounds.
"""
import io
from typing import Optional

import cv2
import numpy as np
from PIL import Image

_rembg_session = None
_rembg_unavailable = False


def has_real_transparency(image: Image.Image) -> bool:
    """True only if the image is a genuine pre-cut transparent PNG where
    the outer border area is transparent. Prevents skipping background removal
    on regular product photos saved with an alpha channel."""
    if image.mode != "RGBA":
        return False
    alpha = np.array(image.split()[-1])
    h, w = alpha.shape
    if h < 10 or w < 10:
        return False
    border_pixels = np.concatenate([
        alpha[:5, :].flatten(),
        alpha[-5:, :].flatten(),
        alpha[:, :5].flatten(),
        alpha[:, -5:].flatten(),
    ])
    transparent_ratio = float(np.mean(border_pixels < 15))
    return transparent_ratio > 0.25


def warm_up_rembg() -> None:
    """Loads the U2Net session eagerly (called at FastAPI startup) so the
    ~20s one-time cost lands during deploy, not on a customer's first
    try-on request."""
    global _rembg_session, _rembg_unavailable
    try:
        from rembg import new_session

        _rembg_session = new_session("u2net")
    except Exception:
        _rembg_unavailable = True


def _remove_background_rembg(image: Image.Image) -> Optional[Image.Image]:
    global _rembg_session, _rembg_unavailable
    if _rembg_unavailable:
        return None
    if _rembg_session is None:
        warm_up_rembg()
        if _rembg_unavailable:
            return None

    from rembg import remove

    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="PNG")
    result = remove(buf.getvalue(), session=_rembg_session)
    return Image.open(io.BytesIO(result)).convert("RGBA")


# --- GrabCut fallback (classical CV, no model download required) --------

_WORKING_MAX_DIM = 380
_ITER_COUNT = 5


def _grabcut_mask(bgr: np.ndarray, margin_ratio: float) -> np.ndarray:
    h, w = bgr.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    mx, my = int(w * margin_ratio), int(h * margin_ratio)
    rect = (mx, my, w - 2 * mx, h - 2 * my)

    cv2.grabCut(bgr, mask, rect, bgd_model, fgd_model, _ITER_COUNT, cv2.GC_INIT_WITH_RECT)
    return np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)


def _remove_background_grabcut(image: Image.Image, margin_ratio: float = 0.06) -> Image.Image:
    rgb = np.array(image.convert("RGB"))
    h, w = rgb.shape[:2]

    scale = min(1.0, _WORKING_MAX_DIM / max(h, w))
    small_bgr = cv2.cvtColor(
        cv2.resize(rgb, (max(int(w * scale), 1), max(int(h * scale), 1)), interpolation=cv2.INTER_AREA),
        cv2.COLOR_RGB2BGR,
    )

    try:
        small_mask = _grabcut_mask(small_bgr, margin_ratio)
    except cv2.error:
        return image.convert("RGBA")

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    small_mask = cv2.morphologyEx(small_mask, cv2.MORPH_OPEN, kernel)
    small_mask = cv2.morphologyEx(small_mask, cv2.MORPH_CLOSE, kernel)

    binary_mask = cv2.resize(small_mask, (w, h), interpolation=cv2.INTER_LINEAR)
    _, binary_mask = cv2.threshold(binary_mask, 127, 255, cv2.THRESH_BINARY)
    soft_mask = cv2.GaussianBlur(binary_mask, (7, 7), 0)

    coords = cv2.findNonZero(binary_mask)
    if coords is None:
        return image.convert("RGBA")

    x, y, bw, bh = cv2.boundingRect(coords)
    pad_x, pad_y = max(int(bw * 0.04), 2), max(int(bh * 0.04), 2)
    x0, y0 = max(x - pad_x, 0), max(y - pad_y, 0)
    x1, y1 = min(x + bw + pad_x, w), min(y + bh + pad_y, h)

    rgba = np.dstack([rgb, soft_mask])
    return Image.fromarray(rgba[y0:y1, x0:x1], mode="RGBA")


def _crop_to_content(image: Image.Image, pad_ratio: float = 0.04) -> Image.Image:
    """rembg returns a full-frame RGBA with the background zeroed out
    rather than cropped - crop to the actual object so it isn't rendered
    tiny in the middle of a mostly-transparent square."""
    alpha = np.array(image.split()[-1])
    coords = cv2.findNonZero(np.where(alpha > 16, 255, 0).astype(np.uint8))
    if coords is None:
        return image
    x, y, w, h = cv2.boundingRect(coords)
    pad_x, pad_y = max(int(w * pad_ratio), 2), max(int(h * pad_ratio), 2)
    x0, y0 = max(x - pad_x, 0), max(y - pad_y, 0)
    x1, y1 = min(x + w + pad_x, image.width), min(y + h + pad_y, image.height)
    return image.crop((x0, y0, x1, y1))


def remove_background(image: Image.Image) -> Image.Image:
    """Segments the product out of its background and crops tightly to
    it, preferring the trained model and falling back to classical
    segmentation only if that model isn't available."""
    rembg_result = _remove_background_rembg(image)
    if rembg_result is not None:
        return _crop_to_content(rembg_result)
    return _remove_background_grabcut(image)


def ensure_cutout(image: Image.Image) -> Image.Image:
    """Entry point used by the try-on endpoint: respects a real cutout if
    one was given, otherwise generates one."""
    if has_real_transparency(image):
        return image.convert("RGBA")
    return remove_background(image)
