#!/usr/bin/env python3
"""
QA Heroes — February 23rd Poster Generator
Creates a heroic team poster with real employee faces.
"""

import os
import cv2
import math
import random
import numpy as np
from PIL import (
    Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont, ImageColor
)

FOTO_DIR = os.path.join(os.path.dirname(__file__), "foto")
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "qa_heroes_23feb.png")

CANVAS_W = 4096
CANVAS_H = 2560

# Hero accent colours (one per slot)
HERO_COLORS = [
    (80,  180, 255),   # electric blue
    (160, 80,  255),   # violet
    (80,  255, 180),   # cyan-green
    (255, 140, 60),    # orange
    (255, 80,  160),   # hot pink
    (60,  220, 255),   # sky cyan
    (120, 255, 80),    # lime
    (255, 220, 60),    # gold
]

CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
cascade = cv2.CascadeClassifier(CASCADE_PATH)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def pil_to_cv(img: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)


def detect_and_crop_face(img_pil: Image.Image) -> Image.Image:
    """Return a tight crop around the face (square), falling back to centre."""
    gray = cv2.cvtColor(pil_to_cv(img_pil), cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.05, minNeighbors=4, minSize=(40, 40)
    )
    w0, h0 = img_pil.size
    if len(faces) > 0:
        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        x, y, fw, fh = faces[0]
        pad_x = int(fw * 0.45)
        pad_y_top = int(fh * 0.65)
        pad_y_bot = int(fh * 0.25)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y_top)
        x2 = min(w0, x + fw + pad_x)
        y2 = min(h0, y + fh + pad_y_bot)
        crop = img_pil.crop((x1, y1, x2, y2))
    else:
        # Fallback — upper-centre square
        side = min(w0, h0)
        left = (w0 - side) // 2
        top  = max(0, (h0 - side) // 3)
        crop = img_pil.crop((left, top, left + side, min(h0, top + side)))

    # Make square
    cw, ch = crop.size
    side = max(cw, ch)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(crop.convert("RGBA"), ((side - cw) // 2, (side - ch) // 2))
    return sq


def circular_face(face_img: Image.Image, diameter: int,
                  ring_color: tuple) -> Image.Image:
    """Return a RGBA image: circular face + glowing tech ring."""
    face = face_img.resize((diameter, diameter), Image.LANCZOS).convert("RGBA")

    # Slightly boost contrast & colour
    rgb = face.convert("RGB")
    rgb = ImageEnhance.Contrast(rgb).enhance(1.25)
    rgb = ImageEnhance.Color(rgb).enhance(1.15)
    rgb = ImageEnhance.Brightness(rgb).enhance(1.05)
    face = rgb.convert("RGBA")

    # Circular mask
    mask = Image.new("L", (diameter, diameter), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, diameter - 1, diameter - 1], fill=255)

    face_circle = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    face_circle.paste(face, mask=mask)

    pad = 44
    total = diameter + pad * 2
    frame = Image.new("RGBA", (total, total), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)

    r, g, b = ring_color

    # Glow rings
    for i in range(18, 0, -1):
        alpha = int(180 * (i / 18) ** 1.5)
        fd.ellipse([pad - i, pad - i, total - pad + i, total - pad + i],
                   outline=(r, g, b, alpha), width=2)

    # Solid ring
    fd.ellipse([pad - 4, pad - 4, total - pad + 4, total - pad + 4],
               outline=(255, 255, 255, 200), width=2)
    fd.ellipse([pad - 7, pad - 7, total - pad + 7, total - pad + 7],
               outline=(r, g, b, 255), width=5)

    # Inner subtle ring
    fd.ellipse([pad + 3, pad + 3, total - pad - 3, total - pad - 3],
               outline=(255, 255, 255, 80), width=1)

    # Paste face
    frame.paste(face_circle, (pad, pad), mask=face_circle)

    # Corner tech brackets
    acc = (r, g, b, 230)
    size = 28
    pts = [
        (pad - 6, pad - 6),
        (total - pad + 6, pad - 6),
        (pad - 6, total - pad + 6),
        (total - pad + 6, total - pad + 6),
    ]
    dirs = [(1, 1), (-1, 1), (1, -1), (-1, -1)]
    for (px, py), (dx, dy) in zip(pts, dirs):
        fd.line([(px, py), (px + dx * size, py)], fill=acc, width=4)
        fd.line([(px, py), (px, py + dy * size)], fill=acc, width=4)

    return frame


# ---------------------------------------------------------------------------
# Background elements
# ---------------------------------------------------------------------------

def draw_gradient(canvas: Image.Image) -> Image.Image:
    arr = np.zeros((CANVAS_H, CANVAS_W, 4), dtype=np.uint8)
    for y in range(CANVAS_H):
        t = y / CANVAS_H
        r = int(6  + t * 12)
        g = int(4  + t *  8)
        b = int(28 + t * 18)
        arr[y, :] = [r, g, b, 255]
    grad = Image.fromarray(arr, "RGBA")
    return Image.alpha_composite(canvas, grad)


def draw_hex_grid(canvas: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    hex_r = 80
    dx = int(hex_r * math.sqrt(3))
    dy = int(hex_r * 1.5)
    col = (30, 80, 140, 35)
    for row in range(-1, CANVAS_H // dy + 2):
        for col_i in range(-1, CANVAS_W // dx + 2):
            cx = col_i * dx + (dx // 2 if row % 2 else 0)
            cy = row * dy
            pts = []
            for a in range(6):
                angle = math.radians(60 * a - 30)
                pts.append((cx + hex_r * math.cos(angle),
                             cy + hex_r * math.sin(angle)))
            d.polygon(pts, outline=col)
    return Image.alpha_composite(canvas, layer)


def draw_city_silhouette(canvas: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rng = random.Random(7)
    horizon = int(CANVAS_H * 0.72)

    # Back row of buildings
    x = 0
    while x < CANVAS_W:
        bw = rng.randint(55, 180)
        bh = rng.randint(80, 420)
        dark = (10, 18, 38, 200)
        d.rectangle([x, horizon - bh, x + bw, horizon], fill=dark)
        # windows
        for wx in range(x + 8, x + bw - 8, 18):
            for wy in range(horizon - bh + 10, horizon - 15, 22):
                if rng.random() > 0.42:
                    lum = rng.randint(80, 220)
                    wc = (0, lum, lum, 160)
                    d.rectangle([wx, wy, wx + 8, wy + 10], fill=wc)
        x += bw + rng.randint(-10, 30)

    # Ground glow line
    for i in range(12, 0, -1):
        a = int(100 * i / 12)
        d.line([(0, horizon + i), (CANVAS_W, horizon + i)],
               fill=(0, 120, 220, a))

    return Image.alpha_composite(canvas, layer)


def draw_stars(canvas: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rng = random.Random(3)
    for _ in range(600):
        sx = rng.randint(0, CANVAS_W)
        sy = rng.randint(0, int(CANVAS_H * 0.65))
        br = rng.randint(100, 255)
        r = rng.randint(0, 2)
        d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(br, br, br, br))
    return Image.alpha_composite(canvas, layer)


def draw_data_streams(canvas: Image.Image) -> Image.Image:
    """Vertical falling code-stream lines."""
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rng = random.Random(11)
    chars = "01BUG#@!QATEST{}[]<>/\\|"
    for _ in range(120):
        sx = rng.randint(0, CANVAS_W)
        sy = rng.randint(0, CANVAS_H)
        length = rng.randint(4, 18)
        alpha_base = rng.randint(20, 70)
        for i in range(length):
            ch = rng.choice(chars)
            cy2 = sy + i * 22
            if cy2 >= CANVAS_H:
                break
            a = int(alpha_base * (1 - i / length))
            d.text((sx, cy2), ch, fill=(0, 200, 100, a))
    return Image.alpha_composite(canvas, layer)


# ---------------------------------------------------------------------------
# Enemies
# ---------------------------------------------------------------------------

def draw_bug_monster(layer: Image.Image, cx: int, cy: int,
                     size: int, seed: int) -> None:
    rng = random.Random(seed)
    d = ImageDraw.Draw(layer)
    r = rng.randint(160, 255)
    g = rng.randint(0, 80)
    b = rng.randint(160, 255)
    body_col = (r, g, b, 200)

    # Glow
    for gi in range(6, 0, -1):
        ga = int(60 * gi / 6)
        d.ellipse([cx - size - gi*4, cy - size - gi*4,
                   cx + size + gi*4, cy + size + gi*4],
                  outline=(r, g, b, ga), width=2)

    # Body
    d.ellipse([cx - size, cy - size, cx + size, cy + size], fill=body_col)

    # Pixel glitch stripes across body
    stripe_col = (0, 255, 100, 180)
    for i in range(3):
        sy2 = cy - size + rng.randint(5, size * 2 - 10)
        sw = rng.randint(8, size)
        d.rectangle([cx - sw, sy2, cx + sw, sy2 + rng.randint(3, 7)],
                    fill=stripe_col)

    # Eyes
    eye_positions = [(-size // 3, -size // 3), (size // 3, -size // 3),
                     (0, 0)]
    for ex, ey in eye_positions:
        d.ellipse([cx + ex - 7, cy + ey - 7, cx + ex + 7, cy + ey + 7],
                  fill=(255, 50, 50, 255))
        d.ellipse([cx + ex - 3, cy + ey - 3, cx + ex + 3, cy + ey + 3],
                  fill=(255, 255, 0, 255))

    # Legs
    for i in range(6):
        angle = math.radians(i * 60 + 30)
        lx = int(cx + math.cos(angle) * (size + 20))
        ly = int(cy + math.sin(angle) * (size + 20))
        d.line([(cx, cy), (lx, ly)], fill=(0, 255, 100, 170), width=3)
        d.ellipse([lx - 5, ly - 5, lx + 5, ly + 5],
                  fill=(0, 255, 100, 200))


def draw_robot(layer: Image.Image, cx: int, cy: int,
               size: int, seed: int) -> None:
    rng = random.Random(seed + 200)
    d = ImageDraw.Draw(layer)
    metal = (70, 85, 100, 220)
    dark  = (40, 50, 60,  220)
    red   = (255, 60, 40, 255)

    hw = size
    hh = int(size * 0.85)
    bw = int(size * 1.3)
    bh = int(size * 1.1)

    # Head
    d.rectangle([cx - hw, cy - hh * 3, cx + hw, cy - hh], fill=metal)
    d.rectangle([cx - hw + 6, cy - hh * 3 + 6,
                 cx + hw - 6, cy - hh - 6], fill=dark)
    # Eyes
    for ex in [-hw // 2, hw // 2]:
        d.ellipse([cx + ex - 10, cy - hh * 3 + 14,
                   cx + ex + 10, cy - hh * 3 + 34], fill=red)
        d.ellipse([cx + ex - 4,  cy - hh * 3 + 20,
                   cx + ex + 4,  cy - hh * 3 + 28], fill=(255, 220, 0, 255))
    # Mouth
    for i in range(5):
        mx = cx - hw + 18 + i * 13
        d.rectangle([mx, cy - hh - 18, mx + 9, cy - hh - 8], fill=red)

    # Antenna
    d.line([(cx, cy - hh * 3), (cx, cy - hh * 3 - 30)],
           fill=(120, 140, 160, 220), width=4)
    d.ellipse([cx - 7, cy - hh * 3 - 37, cx + 7, cy - hh * 3 - 23],
              fill=red)

    # Body
    d.rectangle([cx - bw, cy - hh, cx + bw, cy + bh], fill=metal)
    d.rectangle([cx - bw + 8, cy - hh + 8,
                 cx + bw - 8, cy + bh - 8], fill=dark)
    # Core light
    for gi in range(5, 0, -1):
        d.ellipse([cx - 18 - gi*3, cy - 18 - gi*3,
                   cx + 18 + gi*3, cy + 18 + gi*3],
                  outline=(255, 80, 0, int(120 * gi / 5)), width=2)
    d.ellipse([cx - 18, cy - 18, cx + 18, cy + 18], fill=(255, 100, 0, 255))

    # Arms
    aw = 20
    d.rectangle([cx - bw - aw, cy - hh + 12, cx - bw, cy + bh // 2], fill=metal)
    d.rectangle([cx + bw, cy - hh + 12, cx + bw + aw, cy + bh // 2], fill=metal)
    # Claws
    claw = (90, 100, 110, 220)
    for side in [-1, 1]:
        base_x = cx - bw - aw - 2 if side == -1 else cx + bw + aw
        for ci in range(3):
            cd = side * (ci * 8)
            d.line([(base_x, cy + bh // 2),
                    (base_x + side * 20, cy + bh // 2 + 15 + ci * 5)],
                   fill=claw, width=4)

    # Legs
    lw = int(size * 0.45)
    d.rectangle([cx - bw // 2 - lw, cy + bh,
                 cx - bw // 4, cy + bh + size * 2], fill=metal)
    d.rectangle([cx + bw // 4, cy + bh,
                 cx + bw // 2 + lw, cy + bh + size * 2], fill=metal)
    # Feet
    for fx in [cx - bw // 2 - lw - 10, cx + bw // 4 - 10]:
        d.rectangle([fx, cy + bh + size * 2,
                     fx + lw + bw // 4 + 20, cy + bh + size * 2 + 20], fill=metal)


# ---------------------------------------------------------------------------
# Particle / energy effects
# ---------------------------------------------------------------------------

def draw_energy_particles(canvas: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rng = random.Random(99)
    colors = [(0, 180, 255), (160, 80, 255), (0, 255, 140), (255, 200, 0)]
    for _ in range(500):
        px = rng.randint(0, CANVAS_W)
        py = rng.randint(int(CANVAS_H * 0.3), CANVAS_H)
        r = rng.randint(0, 3)
        c = rng.choice(colors) + (rng.randint(80, 200),)
        d.ellipse([px - r, py - r, px + r, py + r], fill=c)
    return Image.alpha_composite(canvas, layer)


def draw_scan_lines(canvas: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for y in range(0, CANVAS_H, 4):
        d.line([(0, y), (CANVAS_W, y)], fill=(0, 0, 0, 18))
    return Image.alpha_composite(canvas, layer)


# ---------------------------------------------------------------------------
# Text
# ---------------------------------------------------------------------------

def render_title(canvas: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # Try to find a bold system font, fall back gracefully
    font_large = None
    font_small = None
    candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                font_large = ImageFont.truetype(path, 160)
                font_small = ImageFont.truetype(path, 80)
                break
            except Exception:
                continue
    if font_large is None:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    line1 = "С 23 ФЕВРАЛЯ,"
    line2 = "КОМАНДА ГЕРОЕВ КАЧЕСТВА!"

    def draw_glowing_text(text, y, font, main_color, glow_color):
        # Measure
        bbox = d.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        tx = (CANVAS_W - tw) // 2
        # Glow layers
        for spread in range(20, 0, -2):
            alpha = int(130 * (spread / 20) ** 1.5)
            d.text((tx - spread, y - spread), text, font=font,
                   fill=glow_color + (alpha,))
            d.text((tx + spread, y - spread), text, font=font,
                   fill=glow_color + (alpha,))
            d.text((tx, y + spread), text, font=font,
                   fill=glow_color + (alpha,))
            d.text((tx, y - spread), text, font=font,
                   fill=glow_color + (alpha,))
        # Shadow
        d.text((tx + 6, y + 8), text, font=font, fill=(0, 0, 0, 180))
        # Main text
        d.text((tx, y), text, font=font, fill=main_color + (255,))

    # Position at top of poster
    draw_glowing_text(line1, 60,  font_large, (255, 230, 80), (200, 100, 0))
    draw_glowing_text(line2, 240, font_large, (255, 255, 255), (60, 140, 255))

    # Sub-label
    sub = "QA TEAM  •  DEFENDERS OF QUALITY  •  2025"
    bbox = d.textbbox((0, 0), sub, font=font_small)
    tw2 = bbox[2] - bbox[0]
    tx2 = (CANVAS_W - tw2) // 2
    d.text((tx2, 430), sub, font=font_small,
           fill=(100, 200, 255, 180))

    return Image.alpha_composite(canvas, layer)


def render_name_labels(canvas: Image.Image, positions, names,
                       colors) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    font = None
    for path in [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Impact.ttf",
    ]:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, 52)
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()

    for (cx, cy, diam), name, color in zip(positions, names, colors):
        # Strip extension from filename
        display = os.path.splitext(name)[0]
        bbox = d.textbbox((0, 0), display, font=font)
        tw = bbox[2] - bbox[0]
        tx = cx - tw // 2
        ty = cy + diam // 2 + 28
        r, g, b = color
        # Glow
        for sp in range(6, 0, -1):
            d.text((tx - sp, ty), display, font=font,
                   fill=(r, g, b, int(80 * sp / 6)))
            d.text((tx + sp, ty), display, font=font,
                   fill=(r, g, b, int(80 * sp / 6)))
        d.text((tx + 2, ty + 3), display, font=font, fill=(0, 0, 0, 160))
        d.text((tx, ty), display, font=font, fill=(255, 255, 255, 230))

    return Image.alpha_composite(canvas, layer)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def load_photos():
    photos = []
    for fname in os.listdir(FOTO_DIR):
        fpath = os.path.join(FOTO_DIR, fname)
        if not os.path.isfile(fpath):
            continue
        try:
            img = Image.open(fpath)
            photos.append((fname, img.copy()))
            img.close()
        except Exception as e:
            print(f"  Warning: cannot open {fname}: {e}")
    return photos


def generate_poster():
    random.seed(42)
    print("Loading photos …")
    photos = load_photos()
    if not photos:
        raise RuntimeError(f"No photos found in {FOTO_DIR}")
    print(f"  {len(photos)} photos loaded")

    # ------------------------------------------------------------------ canvas
    print("Building background …")
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (5, 8, 20, 255))
    canvas = draw_gradient(canvas)
    canvas = draw_stars(canvas)
    canvas = draw_hex_grid(canvas)
    canvas = draw_data_streams(canvas)
    canvas = draw_city_silhouette(canvas)

    # ------------------------------------------------- enemies (background layer)
    print("Adding enemies …")
    enemy_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))

    # Bug monsters — scattered around edges and gaps
    bug_positions = [
        (300,  1900, 55), (700,  2100, 45), (1100, 1850, 60),
        (1600, 2150, 50), (2100, 1900, 65), (2600, 2100, 48),
        (3100, 1880, 58), (3700, 2050, 52), (3950, 1750, 42),
        (150,  1600, 38), (500,  2300, 40), (2900, 2280, 44),
    ]
    for i, (bx, by, bsize) in enumerate(bug_positions):
        draw_bug_monster(enemy_layer, bx, by, bsize, seed=i * 7)

    # Robots — flanking left and right
    robot_specs = [
        (180,  1600, 70, 1),
        (3916, 1600, 70, 2),
        (380,  1950, 55, 3),
        (3720, 1950, 55, 4),
    ]
    for rx, ry, rs, rseed in robot_specs:
        draw_robot(enemy_layer, rx, ry, rs, seed=rseed)

    canvas = Image.alpha_composite(canvas, enemy_layer)

    # ------------------------------------------------- hero positions
    # Two staggered rows: back (4) and front (4)
    # Back row: y_center ≈ 1450, face diam 360
    # Front row: y_center ≈ 1900, face diam 420
    back_diam  = 360
    front_diam = 420

    back_frame  = back_diam  + 88   # include ring padding (44*2)
    front_frame = front_diam + 88

    # Evenly spread 4 across width with margins
    margin = 350
    span   = CANVAS_W - 2 * margin

    def hero_x(i, n):
        return int(margin + span * i / (n - 1))

    back_row  = [(hero_x(i, 4), 1420, back_diam)  for i in range(4)]
    front_row = [(hero_x(i, 4), 1900, front_diam) for i in range(4)]

    # Slight stagger for dynamism
    stagger_y = [0, -60, 40, -30, 50, -40, 30, -20]
    all_positions = back_row + front_row
    all_positions = [
        (cx, cy + stagger_y[i], diam)
        for i, (cx, cy, diam) in enumerate(all_positions)
    ]

    # ------------------------------------------------- composite faces
    print("Processing faces …")
    names = [p[0] for p in photos[:8]]
    # If fewer than 8 photos, cycle
    while len(names) < 8:
        names += names
    names = names[:8]

    face_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))

    for idx, ((cx, cy, diam), (fname, pimg), color) in enumerate(
            zip(all_positions, photos[:8], HERO_COLORS)):

        print(f"  [{idx+1}/8] {fname}")
        face_crop = detect_and_crop_face(pimg.convert("RGBA"))
        hero_img  = circular_face(face_crop, diam, color)
        hw, hh = hero_img.size
        paste_x = cx - hw // 2
        paste_y = cy - hh // 2
        face_layer.paste(hero_img, (paste_x, paste_y), mask=hero_img)

    # Team glow aura under all heroes
    aura = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    ad = ImageDraw.Draw(aura)
    # Wide soft ellipse behind the group
    for gi in range(30, 0, -1):
        ga = int(25 * gi / 30)
        ad.ellipse([200 - gi * 10, 1200 - gi * 8,
                    CANVAS_W - 200 + gi * 10, 2200 + gi * 8],
                   outline=(60, 120, 255, ga), width=3)
    canvas = Image.alpha_composite(canvas, aura)
    canvas = Image.alpha_composite(canvas, face_layer)

    # ------------------------------------------------- energy & scan lines
    canvas = draw_energy_particles(canvas)
    canvas = draw_scan_lines(canvas)

    # ------------------------------------------------- title & names
    print("Rendering text …")
    canvas = render_title(canvas)
    canvas = render_name_labels(canvas, all_positions, names[:8], HERO_COLORS)

    # ------------------------------------------------- vignette
    vig = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    vd  = ImageDraw.Draw(vig)
    strength = 160
    for i in range(120):
        t = i / 120
        a = int(strength * (t ** 1.8))
        vd.rectangle([i, i, CANVAS_W - i, CANVAS_H - i],
                     outline=(0, 0, 0, a), width=1)
    canvas = Image.alpha_composite(canvas, vig)

    # ------------------------------------------------- export
    print(f"Saving to {OUTPUT_FILE} …")
    canvas.convert("RGB").save(OUTPUT_FILE, "PNG", optimize=False)
    size_mb = os.path.getsize(OUTPUT_FILE) / 1_048_576
    print(f"Done! File: {OUTPUT_FILE}  ({size_mb:.1f} MB)")
    print(f"Resolution: {CANVAS_W} x {CANVAS_H} px")


if __name__ == "__main__":
    generate_poster()
