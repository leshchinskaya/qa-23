#!/usr/bin/env python3
"""
QA Heroes — cinematic Marvel/DC-style poster for February 23rd.

Usage:  python3 make_poster.py
Output: qa_heroes_marvel_style_23feb.png
Needs:  Pillow, opencv-python, numpy  (all pre-installed)
"""

import os, math, random, sys
import cv2
import numpy as np
from PIL import (Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance,
                 ImageChops)

# ═══════════════════════════════════════════════════════════════════════════════
#  CONFIG
# ═══════════════════════════════════════════════════════════════════════════════
W, H         = 5120, 3200
OUT_FILE     = "qa_heroes_marvel_style_23feb.png"
FOTO_DIR     = "foto"
BASE_HERO_H  = int(H * 0.52)          # hero body height at scale=1.0  (1664 px)
np.random.seed(42)
_RNG = random.Random(42)

FONT_TITLE    = "/System/Library/Fonts/Supplemental/Impact.ttf"
FONT_SUBTITLE = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

# V-formation layout — (cx_frac, cy_feet_frac, scale)
# cy_feet: fraction of H where the hero's feet touch the ground
LAYOUT = [
    (0.500, 0.985, 1.25),   # 0  center-front  (main)
    (0.345, 0.860, 1.05),   # 1  left-2
    (0.655, 0.860, 1.05),   # 2  right-2
    (0.195, 0.745, 0.90),   # 3  left-3
    (0.805, 0.745, 0.90),   # 4  right-3
    (0.085, 0.655, 0.78),   # 5  edge-left   (back)
    (0.915, 0.655, 0.78),   # 6  edge-right  (back)
    (0.500, 0.695, 0.82),   # 7  back-center
]

# (primary_rgb, accent_rgb) — assigned alphabetically to heroes
COSTUMES = [
    ((210, 25,  25),  (255, 120,  20)),   # Александр — red / gold
    (( 25, 70, 210),  ( 80, 160, 255)),   # Влад       — blue
    (( 25,155,  70),  ( 80, 255, 130)),   # Всеволод   — green
    ((170,125,  15),  (255, 210,  40)),   # Данил      — gold
    ((120, 25, 205),  (195,  85, 255)),   # Дмитрий    — purple
    (( 15,150, 170),  ( 45, 235, 240)),   # Матвей     — cyan
    ((205, 70,  15),  (255, 160,  45)),   # Рома       — orange
    ((125,125, 145),  (210, 210, 235)),   # Сергей     — silver
]

# Painter's order: smallest cy_feet → drawn first (furthest back)
DRAW_ORDER = sorted(range(len(LAYOUT)), key=lambda i: LAYOUT[i][1])


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════
def rgba(r, g, b, a=255):
    return (int(r), int(g), int(b), int(a))


def lerp_color(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def np_to_pil(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def pil_to_np(img: Image.Image) -> np.ndarray:
    return np.array(img, dtype=np.float32)


def radial_gradient(cx, cy, r_inner, r_outer, col_inner, col_outer, shape):
    """Return float32 RGBA array of a radial gradient ellipse."""
    H2, W2 = shape
    yy, xx = np.mgrid[0:H2, 0:W2]
    dist = np.sqrt(((xx - cx) / max(r_outer, 1)) ** 2 +
                   ((yy - cy) / max(r_outer, 1)) ** 2)
    t = np.clip((dist - r_inner / r_outer) / (1 - r_inner / r_outer + 1e-6), 0, 1)
    out = np.zeros((H2, W2, 4), dtype=np.float32)
    for ch in range(4):
        out[:, :, ch] = col_inner[ch] + (col_outer[ch] - col_inner[ch]) * t
    out[:, :, 3] *= (dist <= 1).astype(np.float32)
    return out


# ═══════════════════════════════════════════════════════════════════════════════
#  1. LOAD PHOTOS & DETECT FACES
# ═══════════════════════════════════════════════════════════════════════════════
CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def detect_face(bgr: np.ndarray):
    """Return (x, y, w, h) of largest frontal face, or None."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    faces = CASCADE.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=4,
        minSize=(60, 60), flags=cv2.CASCADE_SCALE_IMAGE)
    if len(faces) == 0:
        return None
    return max(faces, key=lambda f: f[2] * f[3])


def extract_face(path: str) -> Image.Image:
    """Return a cropped face+neck square as RGB PIL Image."""
    bgr = cv2.imread(path, cv2.IMREAD_COLOR)
    if bgr is None:
        img = Image.open(path).convert("RGB")
        bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    ih, iw = bgr.shape[:2]
    det = detect_face(bgr)

    if det is not None:
        x, y, fw, fh = det
        pad = int(max(fw, fh) * 0.55)
        x1 = max(0, x - pad)
        y1 = max(0, y - int(pad * 0.5))
        x2 = min(iw, x + fw + pad)
        y2 = min(ih, y + fh + int(pad * 1.2))
    else:
        # fallback: use top-centre crop
        side = int(min(iw, ih) * 0.72)
        cx = iw // 2
        cy = int(ih * 0.38)
        x1, y1 = max(0, cx - side // 2), max(0, cy - side // 2)
        x2, y2 = min(iw, x1 + side),     min(ih, y1 + side)

    crop = bgr[y1:y2, x1:x2]
    return Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))


def load_photos() -> list:
    """Return [(name, face_pil), …] sorted alphabetically (≤ 8 entries)."""
    files = sorted(f for f in os.listdir(FOTO_DIR)
                   if os.path.isfile(os.path.join(FOTO_DIR, f)))
    result = []
    for fname in files[:8]:
        path = os.path.join(FOTO_DIR, fname)
        name = os.path.splitext(fname)[0]
        print(f"  [{len(result)+1}/8] {name}")
        face = extract_face(path)
        result.append((name, face))
    return result


# ═══════════════════════════════════════════════════════════════════════════════
#  2. BACKGROUND
# ═══════════════════════════════════════════════════════════════════════════════
def make_background() -> np.ndarray:
    """Return float32 (H, W, 3) cinematic dark background."""
    arr = np.zeros((H, W, 3), dtype=np.float32)

    # Vertical gradient: deep space at top → dark teal-blue at bottom
    gy = np.linspace(0, 1, H)[:, None, None]      # (H, 1, 1)
    top = np.array([5, 3, 20], np.float32)
    bot = np.array([10, 18, 45], np.float32)
    arr += (1 - gy) * top + gy * bot              # (H, 1, 3) → broadcasts to (H, W, 3)

    # Horizontal subtle vignette pre-pass (darker sides)
    gx = np.linspace(0, 1, W)[None, :]            # (1, W)
    edge = np.exp(-(gx ** 2) / 0.04) + np.exp(-((gx - 1) ** 2) / 0.04)
    arr[:, :, 2] += edge * 12                     # blue accent on edges

    # Bottom-centre orange energy glow  (the battlefield energy source)
    gy2 = np.linspace(0, 1, H)[:, None]
    gx2 = np.linspace(0, 1, W)[None, :]
    glow_y = np.exp(-((gy2 - 1.05) ** 2) / 0.07)
    glow_x = np.exp(-((gx2 - 0.50) ** 2) / 0.04)
    glow = glow_y * glow_x
    arr[:, :, 0] += glow * 160
    arr[:, :, 1] += glow * 60
    arr[:, :, 2] += glow * 5

    # Upper blue-purple energy (top centre — sky portal effect)
    glow_top_y = np.exp(-((gy2 + 0.05) ** 2) / 0.06)
    glow_top_x = np.exp(-((gx2 - 0.50) ** 2) / 0.06)
    glow_top = glow_top_y * glow_top_x
    arr[:, :, 0] += glow_top * 25
    arr[:, :, 1] += glow_top * 15
    arr[:, :, 2] += glow_top * 90

    return arr


def draw_volumetric_rays(arr: np.ndarray) -> None:
    """Add God-rays / volumetric light streaks from bottom-centre."""
    cx = W // 2
    cy = int(H * 1.05)   # source slightly below bottom edge
    num_rays = 28

    gy = np.arange(H, dtype=np.float32)[:, None]
    gx = np.arange(W, dtype=np.float32)[None, :]

    rng = random.Random(7)
    for i in range(num_rays):
        angle = rng.uniform(-55, 55)              # degrees from vertical
        width = rng.uniform(0.008, 0.025)         # angular width
        brightness = rng.uniform(0.04, 0.15)
        hue_r = rng.uniform(0.6, 1.0)
        hue_b = rng.uniform(0.1, 0.4)

        # Angle from source point
        dx = gx - cx
        dy = cy - gy                              # positive going up
        ray_angle = np.degrees(np.arctan2(dx, dy + 1e-6))
        angular_dist = np.abs(ray_angle - angle)
        ray_mask = np.exp(-(angular_dist ** 2) / (width * 3000))

        # Fade with distance from source
        dist = np.sqrt(dx ** 2 + dy ** 2) / H
        fade = np.exp(-dist * 1.2) * (gy < cy).astype(np.float32)

        ray = ray_mask * fade * brightness
        arr[:, :, 0] += ray * 80 * hue_r
        arr[:, :, 1] += ray * 40
        arr[:, :, 2] += ray * 30 * hue_b


def draw_city_silhouette(canvas: Image.Image) -> None:
    """Draw destroyed futuristic city as dark polygon silhouette."""
    d = ImageDraw.Draw(canvas)
    rng = random.Random(17)

    horizon_y = int(H * 0.60)
    base_col   = (6, 4, 14)
    mid_col    = (10, 7, 22)

    # Background layer of buildings (smaller, further away)
    x = -80
    while x < W + 80:
        bw = rng.randint(40, 180)
        bh = rng.randint(int(H * 0.04), int(H * 0.22))
        by = horizon_y - bh
        d.rectangle([x, by, x + bw, H], fill=mid_col)
        x += bw + rng.randint(2, 25)

    # Foreground layer of buildings (larger, closer)
    x = -120
    while x < W + 120:
        bw = rng.randint(80, 320)
        bh = rng.randint(int(H * 0.08), int(H * 0.35))
        by = horizon_y - bh

        # Jagged / destroyed top
        segs = rng.randint(3, 8)
        pts = [(x, H)]
        seg_w = bw // segs
        for s in range(segs):
            sx = x + s * seg_w
            sy = by + rng.randint(-int(bh * 0.12), int(bh * 0.12))
            pts.append((sx, sy))
        pts.append((x + bw, by + rng.randint(-int(bh * 0.1), int(bh * 0.1))))
        pts.append((x + bw, H))
        d.polygon(pts, fill=base_col)

        # Glowing windows
        for _ in range(rng.randint(0, 12)):
            wx = rng.randint(x + 8, x + bw - 20)
            wy = rng.randint(by + 15, horizon_y - 20)
            ww = rng.randint(6, 18)
            wh = rng.randint(8, 20)
            lum = rng.randint(15, 70)
            win_col = (lum // 3, lum // 3, lum)
            d.rectangle([wx, wy, wx + ww, wy + wh], fill=win_col)

        x += bw + rng.randint(5, 50)

    # Ground / street — dark with slight orange tint from explosions below
    d.rectangle([0, horizon_y, W, H], fill=(12, 7, 4))
    # Cracks / rubble lines
    for _ in range(20):
        lx = rng.randint(0, W)
        ly = rng.randint(horizon_y, H)
        d.line([(lx, ly),
                (lx + rng.randint(-150, 150), ly + rng.randint(10, 80))],
               fill=(20, 12, 6), width=rng.randint(1, 4))


def draw_enemies(canvas: Image.Image) -> None:
    """Draw robot army + glitch bug monsters in the background."""
    d = ImageDraw.Draw(canvas)
    rng = random.Random(31)

    # Robot silhouettes — geometric dark shapes scattered across mid-horizon
    horizon_y = int(H * 0.60)
    for _ in range(45):
        rx = rng.randint(0, W)
        rh = rng.randint(int(H * 0.03), int(H * 0.10))
        ry = horizon_y - rh + rng.randint(-30, 30)
        rw = int(rh * 0.45)
        col_r = rng.randint(18, 40)
        col = (col_r // 2, col_r // 2, col_r)

        # Body
        d.rectangle([rx - rw // 2, ry, rx + rw // 2, ry + rh], fill=col)
        # Head
        hd = int(rw * 0.7)
        d.rectangle([rx - hd // 2, ry - hd, rx + hd // 2, ry], fill=col)
        # Eye glow
        eye_lum = rng.randint(80, 180)
        d.ellipse([rx - 5, ry - hd + 8, rx + 5, ry - hd + 18],
                  fill=(eye_lum, eye_lum // 3, 0))
        # Arms
        d.rectangle([rx - rw, ry + rh // 5, rx - rw // 2, ry + rh // 2], fill=col)
        d.rectangle([rx + rw // 2, ry + rh // 5, rx + rw, ry + rh // 2], fill=col)

    # Glitch bug monsters — distorted neon shapes
    for _ in range(18):
        bx = rng.randint(50, W - 50)
        by_f = rng.uniform(0.30, 0.58)
        by = int(H * by_f)
        size = rng.randint(int(H * 0.015), int(H * 0.05))

        # Random polygon glitch shape
        n_pts = rng.randint(5, 9)
        pts = []
        for k in range(n_pts):
            angle = 2 * math.pi * k / n_pts + rng.uniform(-0.3, 0.3)
            r = size * rng.uniform(0.5, 1.4)
            pts.append((bx + int(r * math.cos(angle)),
                        by  + int(r * math.sin(angle))))

        glitch_lum = rng.randint(60, 180)
        ch = rng.randint(0, 2)
        gc = [10, 10, 10]
        gc[ch] = glitch_lum
        # Draw with slight transparency by using a separate layer
        d.polygon(pts, fill=tuple(gc), outline=(glitch_lum, glitch_lum, glitch_lum))

        # Glitch offset lines
        for _ in range(3):
            d.line([(bx + rng.randint(-size, size), by + rng.randint(-size, size)),
                    (bx + rng.randint(-size * 2, size * 2),
                     by + rng.randint(-size, size))],
                   fill=tuple(gc), width=rng.randint(1, 3))


# ═══════════════════════════════════════════════════════════════════════════════
#  3. HERO RENDERING
# ═══════════════════════════════════════════════════════════════════════════════
def _draw_glow_ellipse(d: ImageDraw.ImageDraw, cx, cy, rx, ry, col, alpha=200):
    """Draw a filled glow ellipse (approximate layered approach)."""
    layers = 5
    for i in range(layers, 0, -1):
        f = i / layers
        a = int(alpha * (1 - f) * 0.7)
        ex = int(rx * (1 + (1 - f) * 1.5))
        ey = int(ry * (1 + (1 - f) * 1.5))
        d.ellipse([cx - ex, cy - ey, cx + ex, cy + ey],
                  fill=rgba(*col, a))


def make_hero_rgba(face_pil: Image.Image, hero_h: int,
                   primary: tuple, accent: tuple, idx: int) -> Image.Image:
    """
    Build a single RGBA hero image.
    Coordinate system: feet at (hcx, hero_h-1), head top at (hcx, 0).
    Returns an image larger than the hero to accommodate cape/glow.
    """
    # Body proportions (fractions of hero_h, measured from FEET upward)
    P_KNEE       = 0.26
    P_WAIST      = 0.44
    P_SHOULDER   = 0.65
    P_NECK_BOT   = 0.74
    P_NECK_TOP   = 0.78
    P_FACE_CY    = 0.87   # face centre
    P_HEAD_TOP   = 1.00

    head_r      = int(hero_h * 0.105)         # head radius
    shoulder_hw = int(hero_h * 0.24)          # half-width at shoulders
    waist_hw    = int(hero_h * 0.14)          # half-width at waist
    leg_hw      = int(hero_h * 0.09)          # half-width each leg
    arm_w       = int(hero_h * 0.08)          # arm width

    # Padded canvas so cape / glow don't get clipped
    pad_x = int(hero_h * 0.45)
    pad_y = int(hero_h * 0.08)
    cw = shoulder_hw * 2 + pad_x * 2 + arm_w * 4
    ch = hero_h + pad_y + int(hero_h * 0.05)   # tiny bottom margin

    hero_canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(hero_canvas)

    hcx = cw // 2
    feet_y = ch - 1 - int(hero_h * 0.02)

    # Helper: convert "fraction from feet upward" → canvas Y
    def fy(frac):
        return feet_y - int(hero_h * frac)

    # ── 1. Ground energy shadow / halo ───────────────────────────────────────
    _draw_glow_ellipse(d, hcx, feet_y, shoulder_hw + arm_w * 2,
                       int(hero_h * 0.04), accent, alpha=120)

    # ── 2. Cape (behind everything) ──────────────────────────────────────────
    cape_dark  = tuple(max(0, c - 50) for c in primary)
    cape_dark2 = tuple(max(0, c - 80) for c in primary)
    cape_pts = [
        (hcx,                   fy(P_NECK_BOT)),
        (hcx - shoulder_hw - arm_w,  fy(P_SHOULDER) + int(hero_h * 0.02)),
        (hcx - int(hero_h * 0.35),   fy(0.08)),
        (hcx,                   fy(0.15)),
        (hcx + int(hero_h * 0.35),   fy(0.08)),
        (hcx + shoulder_hw + arm_w,  fy(P_SHOULDER) + int(hero_h * 0.02)),
    ]
    d.polygon(cape_pts, fill=rgba(*cape_dark2, 200))
    # Cape inner lighter stripe
    inner_cape = [
        (hcx,                   fy(P_NECK_BOT)),
        (hcx - shoulder_hw // 2, fy(P_SHOULDER)),
        (hcx - int(hero_h * 0.1), fy(0.20)),
        (hcx,                   fy(0.25)),
        (hcx + int(hero_h * 0.1), fy(0.20)),
        (hcx + shoulder_hw // 2, fy(P_SHOULDER)),
    ]
    d.polygon(inner_cape, fill=rgba(*cape_dark, 180))

    # ── 3. Legs ───────────────────────────────────────────────────────────────
    leg_dark = tuple(max(0, c - 40) for c in primary)
    # Left leg
    d.polygon([
        (hcx - waist_hw,     fy(P_WAIST)),
        (hcx - int(hero_h * 0.02), fy(P_WAIST)),
        (hcx - int(hero_h * 0.02) + leg_hw // 2, feet_y),
        (hcx - waist_hw - leg_hw // 2, feet_y),
    ], fill=rgba(*leg_dark, 255))
    # Right leg
    d.polygon([
        (hcx + int(hero_h * 0.02), fy(P_WAIST)),
        (hcx + waist_hw,     fy(P_WAIST)),
        (hcx + waist_hw + leg_hw // 2, feet_y),
        (hcx + int(hero_h * 0.02) - leg_hw // 2, feet_y),
    ], fill=rgba(*leg_dark, 255))
    # Boot highlights
    boot_light = tuple(min(255, c + 30) for c in accent)
    d.rectangle([hcx - waist_hw - leg_hw // 2, feet_y - int(hero_h * 0.06),
                 hcx - int(hero_h * 0.01),     feet_y],
                fill=rgba(*boot_light, 100))
    d.rectangle([hcx + int(hero_h * 0.01), feet_y - int(hero_h * 0.06),
                 hcx + waist_hw + leg_hw // 2, feet_y],
                fill=rgba(*boot_light, 100))

    # ── 4. Torso ─────────────────────────────────────────────────────────────
    torso_pts = [
        (hcx - shoulder_hw, fy(P_SHOULDER)),
        (hcx + shoulder_hw, fy(P_SHOULDER)),
        (hcx + waist_hw,    fy(P_WAIST)),
        (hcx - waist_hw,    fy(P_WAIST)),
    ]
    d.polygon(torso_pts, fill=rgba(*primary, 255))

    # Chest centre vertical line (suit detail)
    d.rectangle([hcx - int(hero_h * 0.015), fy(P_SHOULDER) + 5,
                 hcx + int(hero_h * 0.015), fy(P_WAIST) - 5],
                fill=rgba(*accent, 180))

    # Chest emblem
    emb_cy = fy(P_SHOULDER) + int((fy(P_WAIST) - fy(P_SHOULDER)) * 0.35)
    emb_r  = int(hero_h * 0.04)
    _draw_glow_ellipse(d, hcx, emb_cy, emb_r, emb_r, accent, alpha=220)
    d.ellipse([hcx - emb_r, emb_cy - emb_r, hcx + emb_r, emb_cy + emb_r],
              fill=rgba(*accent, 255))

    # Belt
    d.rectangle([hcx - waist_hw, fy(P_WAIST) - int(hero_h * 0.025),
                 hcx + waist_hw, fy(P_WAIST)],
                fill=rgba(*accent, 200))

    # ── 5. Arms ──────────────────────────────────────────────────────────────
    # Left arm (slightly angled forward for action pose)
    elbow_x_l = hcx - shoulder_hw - arm_w - int(hero_h * 0.06)
    elbow_y_l = fy((P_SHOULDER + P_WAIST) / 2)
    hand_x_l  = hcx - shoulder_hw - arm_w * 2 - int(hero_h * 0.10)
    hand_y_l  = fy(P_WAIST - 0.04)
    d.polygon([
        (hcx - shoulder_hw,         fy(P_SHOULDER)),
        (hcx - shoulder_hw + arm_w, fy(P_SHOULDER) + int(hero_h * 0.01)),
        (hand_x_l + arm_w,          hand_y_l),
        (hand_x_l,                  hand_y_l + int(hero_h * 0.03)),
    ], fill=rgba(*primary, 255))
    # Glove
    d.ellipse([hand_x_l - int(arm_w * 0.6), hand_y_l - int(arm_w * 0.4),
               hand_x_l + int(arm_w * 1.4), hand_y_l + int(arm_w * 1.0)],
              fill=rgba(*accent, 200))

    # Right arm (raised / action pose)
    hand_x_r  = hcx + shoulder_hw + arm_w * 2 + int(hero_h * 0.12)
    hand_y_r  = fy(P_WAIST + 0.06)
    d.polygon([
        (hcx + shoulder_hw - arm_w, fy(P_SHOULDER) + int(hero_h * 0.01)),
        (hcx + shoulder_hw,         fy(P_SHOULDER)),
        (hand_x_r,                  hand_y_r),
        (hand_x_r - arm_w,          hand_y_r + int(hero_h * 0.03)),
    ], fill=rgba(*primary, 255))
    d.ellipse([hand_x_r - int(arm_w * 0.4), hand_y_r - int(arm_w * 0.4),
               hand_x_r + int(arm_w * 1.6), hand_y_r + int(arm_w * 1.0)],
              fill=rgba(*accent, 200))

    # ── 6. Code Sword (for main hero, index 0; QA element) ───────────────────
    if idx == 0:
        sw_x1  = hand_x_r + int(arm_w * 0.8)
        sw_y1  = hand_y_r - int(hero_h * 0.01)
        sw_len = int(hero_h * 0.38)
        sw_w   = int(arm_w * 0.35)
        angle  = -35
        rad    = math.radians(angle)
        sw_dx  = int(sw_len * math.sin(rad))
        sw_dy  = int(-sw_len * math.cos(rad))
        # Blade glow
        for gw in range(8, 0, -2):
            ga = 40 + gw * 10
            d.line([(sw_x1, sw_y1), (sw_x1 + sw_dx, sw_y1 + sw_dy)],
                   fill=(0, ga, ga // 2, ga), width=sw_w + gw * 3)
        # Blade
        d.line([(sw_x1, sw_y1), (sw_x1 + sw_dx, sw_y1 + sw_dy)],
               fill=(80, 255, 200, 240), width=sw_w)
        # Guard
        gd_cx = sw_x1 + int(sw_dx * 0.12)
        gd_cy = sw_y1 + int(sw_dy * 0.12)
        d.rectangle([gd_cx - arm_w, gd_cy - int(arm_w * 0.4),
                     gd_cx + arm_w, gd_cy + int(arm_w * 0.4)],
                    fill=rgba(*accent, 220))

    # ── 7. Holographic shield (index 1: Влад) ────────────────────────────────
    if idx == 1:
        sh_cx = hand_x_l - int(arm_w * 1.5)
        sh_cy = hand_y_l - int(hero_h * 0.06)
        sh_r  = int(hero_h * 0.14)
        n = 6
        hex_pts = [(sh_cx + int(sh_r * math.cos(2*math.pi*k/n + math.pi/6)),
                    sh_cy + int(sh_r * math.sin(2*math.pi*k/n + math.pi/6)))
                   for k in range(n)]
        for lw in range(6, 0, -1):
            la = 20 + lw * 15
            d.polygon(hex_pts, outline=(50, 160 + lw * 10, 255, la), width=lw * 2)
        d.polygon(hex_pts, fill=(30, 100, 220, 60))
        d.polygon(hex_pts, outline=(80, 200, 255, 200), width=2)

    # ── 8. Neck ───────────────────────────────────────────────────────────────
    neck_hw = int(hero_h * 0.04)
    d.rectangle([hcx - neck_hw, fy(P_NECK_TOP),
                 hcx + neck_hw, fy(P_NECK_BOT)],
                fill=rgba(70, 55, 45, 255))

    # ── 9. Head base circle ───────────────────────────────────────────────────
    face_cy = fy(P_FACE_CY)
    d.ellipse([hcx - head_r - 2, face_cy - head_r - 2,
               hcx + head_r + 2, face_cy + head_r + 2],
              fill=rgba(75, 60, 50, 255))

    # ── 10. Hero glow aura ────────────────────────────────────────────────────
    # Will be applied after face overlay via blur (see caller)

    # ── 11. Face overlay ─────────────────────────────────────────────────────
    fw = int(head_r * 2.3)
    fh = int(head_r * 2.7)
    face_resized = face_pil.resize((fw, fh), Image.LANCZOS)

    # Oval mask with feathered edges
    mask = Image.new("L", (fw, fh), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, fw - 1, fh - 1], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(2, fw // 18)))

    fx_left = hcx - fw // 2
    fy_top  = face_cy - int(fh * 0.52)
    hero_canvas.paste(face_resized.convert("RGBA"), (fx_left, fy_top), mask)

    # Rim light on face edges (cinematic effect)
    rim = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    rim_d = ImageDraw.Draw(rim)
    rim_lw = max(2, fw // 10)
    rim_d.ellipse([rim_lw // 2, rim_lw // 2,
                   fw - rim_lw // 2, fh - rim_lw // 2],
                  outline=rgba(*accent, 120), width=rim_lw)
    rim = rim.filter(ImageFilter.GaussianBlur(radius=rim_lw * 1.5))
    hero_canvas.paste(rim, (fx_left, fy_top), rim)

    # ── 12. Floating HUD panel (QA element around some heroes) ───────────────
    if idx in (2, 3, 4):
        panel_x = hcx + shoulder_hw + arm_w * 3
        panel_y = fy(P_SHOULDER) - int(hero_h * 0.06)
        pw, ph = int(hero_h * 0.14), int(hero_h * 0.09)
        d.rectangle([panel_x, panel_y, panel_x + pw, panel_y + ph],
                    fill=rgba(0, 20, 40, 160),
                    outline=rgba(*accent, 180), width=2)
        # Fake scan lines
        for ly in range(panel_y + 6, panel_y + ph - 4, 8):
            bar_w = int(pw * _RNG.uniform(0.3, 0.9))
            d.rectangle([panel_x + 4, ly, panel_x + 4 + bar_w, ly + 3],
                        fill=rgba(*accent, 120))

    return hero_canvas


def composite_hero(main: Image.Image,
                   face_pil: Image.Image,
                   layout_entry: tuple,
                   costume: tuple,
                   idx: int) -> None:
    """Render one hero and paste onto `main` (RGBA)."""
    cx_frac, cy_feet_frac, scale = layout_entry
    primary, accent = costume

    hero_h = int(BASE_HERO_H * scale)
    hero_img = make_hero_rgba(face_pil, hero_h, primary, accent, idx)

    # Glow aura: blur a colour-tinted version of hero and underlay
    aura = Image.new("RGBA", hero_img.size, (0, 0, 0, 0))
    alpha_ch = hero_img.getchannel("A")
    tinted = Image.new("RGBA", hero_img.size,
                       rgba(*primary, 0))
    tinted.putalpha(alpha_ch)
    glow_layer = tinted.filter(ImageFilter.GaussianBlur(radius=int(hero_h * 0.04)))
    # Underlay glow
    composite_buf = Image.new("RGBA", hero_img.size, (0, 0, 0, 0))
    composite_buf = Image.alpha_composite(composite_buf, glow_layer)
    composite_buf = Image.alpha_composite(composite_buf, hero_img)

    # Position: feet land at (cx, cy_feet)
    cx_px   = int(cx_frac   * W)
    feet_y  = int(cy_feet_frac * H)
    # hero origin = hero canvas bottom-centre
    paste_x = cx_px - composite_buf.width // 2
    paste_y = feet_y - (composite_buf.height - 1)

    main.alpha_composite(composite_buf, dest=(paste_x, paste_y))


# ═══════════════════════════════════════════════════════════════════════════════
#  4. PARTICLES & FLOATING CODE
# ═══════════════════════════════════════════════════════════════════════════════
def draw_particles(canvas: Image.Image) -> None:
    """Add energy sparkles and floating code runes."""
    d = ImageDraw.Draw(canvas)
    rng = random.Random(55)

    # Energy sparks (bright dots with glow)
    for _ in range(600):
        px = rng.randint(0, W)
        py = rng.randint(int(H * 0.30), H)
        size = rng.randint(1, 5)
        ch = rng.randint(0, 2)
        cols = [(255, 160, 40), (80, 200, 255), (200, 80, 255)]
        col = cols[ch]
        alpha = rng.randint(120, 255)
        if size > 2:
            # Draw small glow
            for gr in range(size + 4, size, -1):
                ga = int(alpha * (1 - (gr - size) / 5) * 0.4)
                d.ellipse([px - gr, py - gr, px + gr, py + gr],
                          fill=rgba(*col, ga))
        d.ellipse([px - size, py - size, px + size, py + size],
                  fill=rgba(*col, alpha))

    # Floating code characters (green Matrix vibe)
    code_chars = "10{}[]()/*#<>!=;QA?"
    font_size = int(H * 0.018)
    try:
        font = ImageFont.truetype(
            "/System/Library/Fonts/Supplemental/Courier New.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    for _ in range(80):
        ch = rng.choice(code_chars)
        cx = rng.randint(0, W)
        cy = rng.randint(int(H * 0.25), int(H * 0.85))
        alpha = rng.randint(40, 140)
        brightness = rng.randint(100, 220)
        d.text((cx, cy), ch, fill=(0, brightness, brightness // 2, alpha),
               font=font)

    # Energy arcs between hero positions
    for i in range(0, len(LAYOUT) - 1, 2):
        cx1 = int(LAYOUT[i][0] * W)
        cy1 = int(LAYOUT[i][1] * H) - int(BASE_HERO_H * LAYOUT[i][2] * 0.85)
        cx2 = int(LAYOUT[i+1][0] * W)
        cy2 = int(LAYOUT[i+1][1] * H) - int(BASE_HERO_H * LAYOUT[i+1][2] * 0.85)
        # Draw a jagged lightning bolt
        pts = [(cx1, cy1)]
        steps = 8
        for s in range(1, steps):
            t = s / steps
            mx = int(cx1 + (cx2 - cx1) * t + rng.randint(-40, 40))
            my = int(cy1 + (cy2 - cy1) * t + rng.randint(-30, 30))
            pts.append((mx, my))
        pts.append((cx2, cy2))
        d.line(pts, fill=(100, 200, 255, 80), width=2)


# ═══════════════════════════════════════════════════════════════════════════════
#  5. TEXT OVERLAY
# ═══════════════════════════════════════════════════════════════════════════════
def add_text(canvas: Image.Image) -> None:
    """Add cinematic 'QA HEROES' title + subtitle."""
    d = ImageDraw.Draw(canvas)

    # ── Main title: QA HEROES ────────────────────────────────────────────────
    title_size = int(H * 0.145)
    try:
        font_title = ImageFont.truetype(FONT_TITLE, title_size)
    except Exception:
        font_title = ImageFont.load_default()

    title_text = "QA HEROES"
    # Measure
    bbox = d.textbbox((0, 0), title_text, font=font_title)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (W - tw) // 2
    ty = int(H * 0.03)

    # Outer glow (large, dark)
    for offset in range(16, 0, -4):
        alpha = int(180 * (1 - offset / 20))
        d.text((tx - offset + bbox[0] * -1, ty - offset + bbox[1] * -1),
               title_text, font=font_title,
               fill=(200, 80, 0, alpha))
    # Gold-orange gradient text (simulate by drawing offset copies)
    for shift, col in [(4, (80, 30, 0)),
                       (2, (160, 80, 10)),
                       (0, (255, 200, 50))]:
        d.text((tx - bbox[0] + shift, ty - bbox[1] + shift),
               title_text, font=font_title, fill=col)

    # Metallic highlight on top half
    d.text((tx - bbox[0], ty - bbox[1]),
           title_text, font=font_title, fill=(255, 240, 180))

    # ── Subtitle ─────────────────────────────────────────────────────────────
    sub_size = int(H * 0.033)
    try:
        font_sub = ImageFont.truetype(FONT_SUBTITLE, sub_size)
    except Exception:
        font_sub = ImageFont.load_default()

    sub_text = "С 23 ФЕВРАЛЯ, КОМАНДА ГЕРОЕВ КАЧЕСТВА!"
    sbbox = d.textbbox((0, 0), sub_text, font=font_sub)
    sw = sbbox[2] - sbbox[0]
    sx = (W - sw) // 2
    sy = ty + th + int(H * 0.015)

    # Shadow
    d.text((sx - sbbox[0] + 3, sy - sbbox[1] + 3),
           sub_text, font=font_sub, fill=(0, 0, 0, 180))
    # Text
    d.text((sx - sbbox[0], sy - sbbox[1]),
           sub_text, font=font_sub, fill=(220, 200, 255))

    # ── "DEFENDING QUALITY SINCE {YEAR}" bottom tagline ──────────────────────
    tag_size = int(H * 0.020)
    try:
        font_tag = ImageFont.truetype(FONT_SUBTITLE, tag_size)
    except Exception:
        font_tag = ImageFont.load_default()

    tag_text = "★  DEFENDING QUALITY  ·  23.02.2025  ·  ALWAYS ON GUARD  ★"
    tbbox = d.textbbox((0, 0), tag_text, font=font_tag)
    tx2 = (W - (tbbox[2] - tbbox[0])) // 2
    ty2 = H - int(H * 0.055)
    d.text((tx2 - tbbox[0] + 2, ty2 - tbbox[1] + 2),
           tag_text, font=font_tag, fill=(0, 0, 0, 160))
    d.text((tx2 - tbbox[0], ty2 - tbbox[1]),
           tag_text, font=font_tag, fill=(180, 160, 220))

    # ── Hero name badges ─────────────────────────────────────────────────────
    name_size = int(H * 0.018)
    try:
        font_name = ImageFont.truetype(FONT_SUBTITLE, name_size)
    except Exception:
        font_name = ImageFont.load_default()

    for i, (cx_frac, cy_feet_frac, scale) in enumerate(LAYOUT):
        if i >= len(_HERO_NAMES):
            break
        name = _HERO_NAMES[i]
        hero_h = int(BASE_HERO_H * scale)
        # Position badge below the hero's feet
        badge_x = int(cx_frac * W)
        badge_y = int(cy_feet_frac * H) + int(hero_h * 0.01)

        nbbox = d.textbbox((0, 0), name, font=font_name)
        nw = nbbox[2] - nbbox[0]
        d.rectangle([badge_x - nw // 2 - 10, badge_y,
                     badge_x + nw // 2 + 10,
                     badge_y + (nbbox[3] - nbbox[1]) + 8],
                    fill=(0, 0, 0, 140))
        d.text((badge_x - nw // 2 - nbbox[0],
                badge_y + 4 - nbbox[1]),
               name, font=font_name, fill=(220, 210, 255))


# ═══════════════════════════════════════════════════════════════════════════════
#  6. POST-PROCESSING
# ═══════════════════════════════════════════════════════════════════════════════
def color_grade(arr: np.ndarray) -> np.ndarray:
    """Apply teal-shadow / orange-highlight cinematic grade."""
    arr = arr.astype(np.float32)
    # Separate into shadow and highlight masks
    lum = 0.299 * arr[:,:,0] + 0.587 * arr[:,:,1] + 0.114 * arr[:,:,2]
    shadow_mask    = np.clip(1.0 - lum / 128, 0, 1)[:, :, None]
    highlight_mask = np.clip((lum - 128) / 128, 0, 1)[:, :, None]

    # Push shadows to teal
    arr[:,:,0] -= shadow_mask[:,:,0] * 15
    arr[:,:,1] += shadow_mask[:,:,0] * 8
    arr[:,:,2] += shadow_mask[:,:,0] * 18

    # Push highlights to warm orange
    arr[:,:,0] += highlight_mask[:,:,0] * 20
    arr[:,:,1] += highlight_mask[:,:,0] * 5
    arr[:,:,2] -= highlight_mask[:,:,0] * 10

    # Slight overall contrast boost (S-curve approximation)
    arr = arr / 255.0
    arr = arr + 0.08 * np.sin(arr * math.pi)   # mild S-curve lift
    arr = arr * 255.0

    return np.clip(arr, 0, 255).astype(np.uint8)


def add_vignette(arr: np.ndarray) -> np.ndarray:
    """Dark cinematic vignette at edges."""
    gy = np.linspace(-1, 1, H)[:, None]
    gx = np.linspace(-1, 1, W)[None, :]
    dist = np.sqrt(gx ** 2 + gy ** 2)
    vig  = np.clip(1.0 - dist * 0.65, 0, 1)[:, :, None]
    arr  = (arr.astype(np.float32) * vig).astype(np.uint8)
    return arr


def add_bloom(img: Image.Image) -> Image.Image:
    """Soft bloom — blend bright glow from a blurred overexposed copy."""
    bright = ImageEnhance.Brightness(img).enhance(1.4)
    bloom  = bright.filter(ImageFilter.GaussianBlur(radius=int(H * 0.012)))
    return ImageChops.screen(img, bloom)


def add_grain(arr: np.ndarray, strength: float = 6.0) -> np.ndarray:
    """Subtle film grain."""
    grain = np.random.normal(0, strength, arr.shape).astype(np.float32)
    return np.clip(arr.astype(np.float32) + grain, 0, 255).astype(np.uint8)


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════
_HERO_NAMES: list[str] = []   # populated in main()


def main():
    global _HERO_NAMES

    print("=== QA Heroes Poster Generator ===\n")

    # 1. Load photos
    print("[1/8] Loading photos & detecting faces …")
    heroes = load_photos()
    if not heroes:
        print("ERROR: no photos found in foto/"); sys.exit(1)

    _HERO_NAMES = [name.split()[0] for name, _ in heroes]  # first name only

    # 2. Background (numpy)
    print("[2/8] Building background …")
    bg_arr = make_background()
    draw_volumetric_rays(bg_arr)
    bg = np_to_pil(bg_arr).convert("RGBA")

    # 3. City silhouette
    print("[3/8] Drawing city silhouette …")
    draw_city_silhouette(bg)

    # 4. Enemies
    print("[4/8] Drawing enemies …")
    draw_enemies(bg)

    # 5. Composite heroes (back → front)
    print("[5/8] Rendering heroes …")
    for order_idx in DRAW_ORDER:
        if order_idx >= len(heroes):
            continue
        name, face_pil = heroes[order_idx]
        layout = LAYOUT[order_idx]
        costume = COSTUMES[order_idx]
        print(f"      hero [{order_idx}] {name}")
        composite_hero(bg, face_pil, layout, costume, order_idx)

    # 6. Particles & floating code
    print("[6/8] Adding particles & energy …")
    draw_particles(bg)

    # 7. Text
    print("[7/8] Adding cinematic text …")
    add_text(bg)

    # 8. Post-processing
    print("[8/8] Color grading & post-FX …")
    rgb = bg.convert("RGB")
    arr = np.array(rgb, dtype=np.uint8)
    arr = color_grade(arr)
    arr = add_vignette(arr)
    out_img = Image.fromarray(arr)
    out_img = add_bloom(out_img)
    arr2 = np.array(out_img, dtype=np.uint8)
    arr2 = add_grain(arr2, strength=5.0)
    final = Image.fromarray(arr2)

    # Save
    print(f"\nSaving → {OUT_FILE}  ({W}×{H} px) …")
    final.save(OUT_FILE, "PNG", optimize=False)
    size_mb = os.path.getsize(OUT_FILE) / 1024 / 1024
    print(f"Done!  File size: {size_mb:.1f} MB")
    print(f"Output: {os.path.abspath(OUT_FILE)}")


if __name__ == "__main__":
    main()
