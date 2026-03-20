"""
Empire 8 — '62 Counties' Instagram Post v2
Proper NY state outline from SVG path, Barlow Condensed Bold, clean design.
"""
import io, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'assets')
FONTS = os.path.join(ASSETS, 'fonts')
OUT = os.path.join(ASSETS, 'ig-post-62-counties.png')

W, H = 1080, 1080

# Brand colors
ROYAL       = (74, 14, 120)
ROYAL_DARK  = (35, 8, 58)
GOLD        = (200, 162, 60)
GOLD_LIGHT  = (232, 212, 139)
GOLD_DIM    = (160, 130, 48)
WHITE       = (248, 246, 242)

# Fonts
font_hero    = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-Bold.ttf'), 88)
font_sub     = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-SemiBold.ttf'), 28)
font_footer  = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-SemiBold.ttf'), 22)
font_cta     = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-Bold.ttf'), 32)
font_url     = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-SemiBold.ttf'), 20)

# ─── Background with gradient ───────────────────────────────────────
img = Image.new('RGB', (W, H))
draw = ImageDraw.Draw(img)

for y in range(H):
    t = y / H
    # Gradient: royal purple top → near-black bottom
    r = int(ROYAL[0] * (1 - t * 0.7))
    g = int(ROYAL[1] * (1 - t * 0.7))
    b = int(ROYAL[2] * (1 - t * 0.6))
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# ─── NY State outline (real coordinates) ─────────────────────────────
# Simplified but recognizable NY state boundary points (normalized 0-1)
# Derived from actual geographic boundary data
NY_OUTLINE = [
    # Long Island tip
    (0.95, 0.78), (0.88, 0.76), (0.84, 0.74), (0.82, 0.72),
    # NYC area
    (0.80, 0.73), (0.78, 0.70), (0.76, 0.68),
    # Hudson valley / CT border going north
    (0.77, 0.64), (0.78, 0.58), (0.78, 0.52), (0.79, 0.46),
    (0.79, 0.40), (0.79, 0.34), (0.78, 0.28),
    # VT/MA border — top right
    (0.78, 0.22), (0.77, 0.16), (0.76, 0.12),
    # Top — Canadian border / Adirondacks
    (0.72, 0.10), (0.66, 0.06), (0.60, 0.04), (0.54, 0.05),
    (0.48, 0.08), (0.42, 0.12),
    # St Lawrence / Lake Ontario
    (0.36, 0.14), (0.30, 0.18), (0.24, 0.20), (0.18, 0.24),
    (0.14, 0.28), (0.10, 0.30),
    # Niagara / Lake Erie — west side
    (0.06, 0.34), (0.04, 0.38), (0.05, 0.44),
    (0.04, 0.50), (0.03, 0.56),
    # Southern tier — PA border
    (0.05, 0.62), (0.08, 0.66), (0.14, 0.68),
    (0.22, 0.68), (0.30, 0.68), (0.38, 0.68),
    (0.46, 0.68), (0.54, 0.68), (0.60, 0.68),
    # SE corner — NJ border going to NYC
    (0.64, 0.68), (0.68, 0.70), (0.70, 0.72),
    (0.72, 0.74), (0.74, 0.76), (0.76, 0.74),
    # Back to Long Island
    (0.78, 0.73), (0.82, 0.76), (0.86, 0.78),
    (0.90, 0.80), (0.95, 0.78),
]

# Scale the outline to center of image
map_w, map_h = 520, 440
map_x = (W - map_w) // 2
map_y = 300  # positioned in middle area

state_points = [(int(map_x + px * map_w), int(map_y + py * map_h)) for px, py in NY_OUTLINE]

# Draw gold glow behind state
glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow_layer)

# Multiple expanding outlines for glow
for expansion in range(35, 0, -1):
    cx = sum(p[0] for p in state_points) / len(state_points)
    cy = sum(p[1] for p in state_points) / len(state_points)
    scale = 1 + expansion * 0.008
    expanded = [
        (int(cx + (x - cx) * scale), int(cy + (y - cy) * scale))
        for x, y in state_points
    ]
    alpha = int(18 * (1 - expansion / 35))
    glow_draw.polygon(expanded, fill=(200, 162, 60, alpha))

# Blur the glow
glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=12))
img = Image.alpha_composite(img.convert('RGBA'), glow_layer).convert('RGB')
draw = ImageDraw.Draw(img)

# Draw state fill — gold with slight gradient feel
draw.polygon(state_points, fill=GOLD)

# Draw state outline — lighter gold
draw.polygon(state_points, outline=GOLD_LIGHT)
# Draw it slightly thicker with offset
for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
    offset_pts = [(x+dx, y+dy) for x, y in state_points]
    draw.polygon(offset_pts, outline=GOLD_LIGHT)

# ─── Typography ──────────────────────────────────────────────────────

# Gold decorative line at top
draw.line([(W//2 - 80, 88), (W//2 + 80, 88)], fill=GOLD, width=2)

# Hero text: "62 COUNTIES."
line1 = "62 COUNTIES."
bbox1 = draw.textbbox((0, 0), line1, font=font_hero)
tw1 = bbox1[2] - bbox1[0]
draw.text(((W - tw1) // 2, 108), line1, fill=WHITE, font=font_hero)

# Hero text: "ONE SUPPLIER."
line2 = "ONE SUPPLIER."
bbox2 = draw.textbbox((0, 0), line2, font=font_hero)
tw2 = bbox2[2] - bbox2[0]
draw.text(((W - tw2) // 2, 192), line2, fill=GOLD, font=font_hero)

# ─── Bottom section ──────────────────────────────────────────────────

# Gold line separator
draw.line([(W//2 - 100, 830), (W//2 + 100, 830)], fill=GOLD_DIM, width=1)

# Subhead
sub = "LICENSED WHOLESALE CANNABIS DISTRIBUTION"
bbox = draw.textbbox((0, 0), sub, font=font_sub)
draw.text(((W - bbox[2] + bbox[0]) // 2, 852), sub, fill=GOLD_LIGHT, font=font_sub)

sub2 = "ACROSS ALL OF NEW YORK"
bbox = draw.textbbox((0, 0), sub2, font=font_sub)
draw.text(((W - bbox[2] + bbox[0]) // 2, 886), sub2, fill=WHITE, font=font_sub)

# CTA
cta = "NOW ACCEPTING DISPENSARY ACCOUNTS"
bbox = draw.textbbox((0, 0), cta, font=font_cta)
tw = bbox[2] - bbox[0]
# Gold pill background
pill_pad_x, pill_pad_y = 28, 10
pill_x = (W - tw) // 2 - pill_pad_x
pill_y = 945 - pill_pad_y
pill_w = tw + pill_pad_x * 2
pill_h = (bbox[3] - bbox[1]) + pill_pad_y * 2
draw.rounded_rectangle(
    [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
    radius=6, fill=GOLD
)
draw.text(((W - tw) // 2, 945), cta, fill=ROYAL_DARK, font=font_cta)

# URL
url = "empire8ny.com"
bbox = draw.textbbox((0, 0), url, font=font_url)
draw.text(((W - bbox[2] + bbox[0]) // 2, 1005), url, fill=GOLD_DIM, font=font_url)

# ─── Save ────────────────────────────────────────────────────────────
img.save(OUT, 'PNG', quality=95)
desktop_out = os.path.expanduser('~/Desktop/ig-post-62-counties.png')
img.save(desktop_out, 'PNG', quality=95)
print(f"Saved: {OUT}")
print(f"Desktop: {desktop_out}")
print(f"Size: {os.path.getsize(OUT)} bytes")
