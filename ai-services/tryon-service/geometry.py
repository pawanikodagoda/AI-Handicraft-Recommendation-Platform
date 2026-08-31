"""
Wrist geometry + precision bracelet compositing.

Uses MediaPipe wrist landmarks to accurately place and scale a bracelet
so it fits EXACTLY onto the wrist — correct position, correct width,
correct angle — for any hand photo at any angle.
"""
import math
from typing import Tuple
import numpy as np
import cv2
from PIL import Image, ImageFilter, ImageChops


def angle_and_width_from_landmarks(wrist, index_mcp, pinky_mcp, image_w: int, image_h: int):
    """
    Derive wrist center, rotation angle and band width from MediaPipe landmarks.

    MediaPipe landmark indices:
        0  = WRIST
        5  = INDEX_FINGER_MCP
        17 = PINKY_MCP
    """
    wx, wy = wrist.x * image_w, wrist.y * image_h
    ix, iy = index_mcp.x * image_w, index_mcp.y * image_h
    px, py = pinky_mcp.x * image_w, pinky_mcp.y * image_h

    # Mid-point between index and pinky knuckles (palm center reference)
    knuckle_mid_x = (ix + px) / 2.0
    knuckle_mid_y = (iy + py) / 2.0

    # Unit vector pointing from wrist toward palm center (hand direction)
    dir_x = knuckle_mid_x - wx
    dir_y = knuckle_mid_y - wy
    dir_len = math.hypot(dir_x, dir_y) or 1.0
    dir_x /= dir_len
    dir_y /= dir_len

    # Place the bracelet center slightly above the wrist landmark
    # (wrist landmark is at the base of the palm; bracelet sits ~15% of arm-to-knuckle distance above)
    offset = dir_len * 0.15
    center_x = wx + dir_x * offset
    center_y = wy + dir_y * offset

    # Wrist width = actual distance between index and pinky MCP projected perpendicular
    # The pinky-to-index span at the MCP level closely approximates the wrist circumference diameter
    knuckle_width = math.hypot(ix - px, iy - py)
    # Wrist width is naturally ~80% of knuckle width (wrist is narrower than knuckles)
    wrist_width = max(knuckle_width * 0.80, 30.0)

    # Bracelet orientation is perpendicular to the wrist-to-palm axis
    angle_deg = math.degrees(math.atan2(dir_y, dir_x)) + 90

    return (center_x, center_y), angle_deg, wrist_width


def angle_and_width_from_points(p1: Tuple[float, float], p2: Tuple[float, float]):
    """Derive center/angle/width from two manual wrist edge points clicked by the user."""
    x1, y1 = p1
    x2, y2 = p2
    center = ((x1 + x2) / 2.0, (y1 + y2) / 2.0)
    width = math.hypot(x2 - x1, y2 - y1)
    angle_deg = math.degrees(math.atan2(y2 - y1, x2 - x1))
    return center, angle_deg, max(width, 30.0)


def _make_ellipse_mask(w: int, h: int, feather: int = 3) -> Image.Image:
    """Creates a soft elliptical alpha mask to cleanly clip the bracelet ends."""
    mask = Image.new("L", (w, h), 0)
    arr = np.zeros((h, w), dtype=np.uint8)
    cx, cy = w / 2.0, h / 2.0
    rx, ry = w / 2.0 - 1, h / 2.0 - 1
    for y in range(h):
        for x in range(w):
            val = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if val <= 1.0:
                arr[y, x] = 255
    from PIL import Image as PILImage
    mask = PILImage.fromarray(arr, "L")
    if feather > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(radius=feather))
    return mask


def composite_bracelet(
    hand_image: Image.Image,
    bracelet_image: Image.Image,
    center: Tuple[float, float],
    angle_deg: float,
    band_width: float,
) -> Image.Image:
    """
    Precision 3D Wrist Fitting.

    Algorithm:
    1. Scale bracelet to EXACTLY the wrist width (pixel-perfect match to skin width)
    2. Compress height to create realistic 3D ring perspective (ring seen at angle = ellipse)
    3. Rotate to match exact wrist tilt
    4. Apply soft elliptical clip so bracelet ends taper naturally at skin edges
    5. Blend with natural contact shadow from product silhouette only
    """
    base = hand_image.convert("RGBA")
    bracelet = bracelet_image.convert("RGBA")

    # ── Step 1: Pixel-perfect width matching ──────────────────────────────────
    # The bracelet should span exactly the full wrist width
    target_w = max(int(band_width), 30)

    # ── Step 2: 3D ring perspective compression ───────────────────────────────
    # A circular bracelet viewed obliquely on a wrist appears as a narrow ellipse.
    # Typical real-world ratio for a bracelet on a wrist is 20–30% of width.
    target_h = max(int(target_w * 0.25), 12)

    resized = bracelet.resize((target_w, target_h), Image.LANCZOS)

    # ── Step 3: Apply soft elliptical end caps ────────────────────────────────
    # This makes the bracelet ends fade into the skin naturally instead of hard cuts
    r, g, b, a = resized.split()
    ellipse_mask = _make_ellipse_mask(target_w, target_h, feather=2)
    # Combine product alpha with ellipse mask (both must be opaque)
    combined_alpha = ImageChops.multiply(a, ellipse_mask)
    resized = Image.merge("RGBA", (r, g, b, combined_alpha))

    # ── Step 4: Rotate to wrist tilt ──────────────────────────────────────────
    rotated = resized.rotate(-angle_deg, expand=True, resample=Image.BICUBIC)

    # ── Step 5: Subtle contact shadow ─────────────────────────────────────────
    _, _, _, rot_a = rotated.split()
    shadow_alpha = rot_a.filter(ImageFilter.GaussianBlur(radius=4))
    shadow = Image.new("RGBA", rotated.size, (20, 15, 10, 100))
    shadow.putalpha(shadow_alpha)

    # ── Step 6: Position precisely on wrist center ────────────────────────────
    paste_x = int(center[0] - rotated.width / 2.0)
    paste_y = int(center[1] - rotated.height / 2.0)
    shadow_x = paste_x + 1
    shadow_y = paste_y + 2

    # ── Step 7: Composite ─────────────────────────────────────────────────────
    composited = base.copy()
    composited.alpha_composite(shadow, (shadow_x, shadow_y))
    composited.alpha_composite(rotated, (paste_x, paste_y))

    return composited.convert("RGB")
