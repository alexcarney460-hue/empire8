"""Generate Empire 8 '62 Counties' Instagram post using Pillow."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'ig-post-62-counties.png')
os.makedirs(os.path.dirname(OUT), exist_ok=True)

W, H = 1080, 1080

# Brand colors
ROYAL = (74, 14, 120)
ROYAL_DARK = (45, 10, 78)
GOLD = (200, 162, 60)
GOLD_LIGHT = (232, 212, 139)
WHITE = (248, 246, 242)
CHARCOAL = (26, 16, 37)

# Create base with gradient
img = Image.new('RGB', (W, H), ROYAL)
draw = ImageDraw.Draw(img)

# Vertical gradient: ROYAL -> ROYAL_DARK
for y in range(H):
    ratio = y / H
    r = int(ROYAL[0] + (ROYAL_DARK[0] - ROYAL[0]) * ratio)
    g = int(ROYAL[1] + (ROYAL_DARK[1] - ROYAL[1]) * ratio)
    b = int(ROYAL[2] + (ROYAL_DARK[2] - ROYAL[2]) * ratio)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Subtle radial glow in center (gold tint)
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
cx, cy = W // 2, H // 2 - 30
for radius in range(300, 0, -2):
    alpha = int(25 * (1 - radius / 300))
    glow_draw.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        fill=(200, 162, 60, alpha)
    )
img = Image.alpha_composite(img.convert('RGBA'), glow).convert('RGB')
draw = ImageDraw.Draw(img)

# Draw simplified NY state silhouette (gold filled polygon)
# Approximate NY state shape scaled to fit center
ny_points_raw = [
    (0.15, 0.35), (0.18, 0.22), (0.22, 0.15), (0.30, 0.10),
    (0.38, 0.08), (0.42, 0.06), (0.55, 0.05), (0.65, 0.08),
    (0.72, 0.12), (0.78, 0.10), (0.82, 0.08), (0.88, 0.12),
    (0.90, 0.18), (0.92, 0.28), (0.88, 0.32), (0.82, 0.30),
    (0.78, 0.35), (0.82, 0.42), (0.85, 0.55), (0.88, 0.62),
    (0.92, 0.68), (0.95, 0.72), (0.90, 0.78), (0.85, 0.82),
    (0.78, 0.78), (0.72, 0.75), (0.65, 0.80), (0.58, 0.85),
    (0.50, 0.88), (0.42, 0.92), (0.35, 0.95), (0.30, 0.90),
    (0.28, 0.82), (0.22, 0.78), (0.18, 0.72), (0.15, 0.65),
    (0.12, 0.55), (0.10, 0.48), (0.12, 0.42),
]

# Scale and position the state shape
map_w, map_h = 420, 380
map_x, map_y = (W - map_w) // 2, (H - map_h) // 2 - 20
ny_points = [(int(map_x + px * map_w), int(map_y + py * map_h)) for px, py in ny_points_raw]

# Gold glow behind the state shape
state_glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sg_draw = ImageDraw.Draw(state_glow)
for offset in range(20, 0, -1):
    expanded = [(x + (x - cx) * offset // 200, y + (y - cy) * offset // 200) for x, y in ny_points]
    alpha = int(40 * (1 - offset / 20))
    sg_draw.polygon(expanded, fill=(200, 162, 60, alpha))
img = Image.alpha_composite(img.convert('RGBA'), state_glow).convert('RGB')
draw = ImageDraw.Draw(img)

# Fill the state shape with gold
draw.polygon(ny_points, fill=GOLD, outline=GOLD_LIGHT)

# Add slight inner highlight
for i, (px, py) in enumerate(ny_points_raw):
    if py < 0.3:  # Top portion gets lighter gold
        x = int(map_x + px * map_w)
        y = int(map_y + py * map_h)

# Try to load a bold font, fall back to default
try:
    font_big = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 62)
    font_med = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 26)
    font_sm = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
    font_sub = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
except:
    font_big = ImageFont.load_default()
    font_med = ImageFont.load_default()
    font_sm = ImageFont.load_default()
    font_sub = ImageFont.load_default()

# Header text
header = "62 COUNTIES. ONE SUPPLIER."
bbox = draw.textbbox((0, 0), header, font=font_big)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 120), header, fill=WHITE, font=font_big)

# Subhead
sub = "Licensed Wholesale Cannabis Distribution"
bbox = draw.textbbox((0, 0), sub, font=font_sub)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 195), sub, fill=GOLD_LIGHT, font=font_sub)

sub2 = "Across All of New York"
bbox = draw.textbbox((0, 0), sub2, font=font_sub)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 225), sub2, fill=GOLD_LIGHT, font=font_sub)

# Horizontal gold line separator above footer
draw.line([(W // 2 - 120, 880), (W // 2 + 120, 880)], fill=GOLD, width=2)

# Footer
footer1 = "EMPIRE 8 SALES DIRECT"
bbox = draw.textbbox((0, 0), footer1, font=font_med)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 905), footer1, fill=WHITE, font=font_med)

footer2 = "empire8ny.com"
bbox = draw.textbbox((0, 0), footer2, font=font_sm)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 945), footer2, fill=GOLD_LIGHT, font=font_sm)

# Bottom tagline
tagline = "NOW ACCEPTING DISPENSARY ACCOUNTS"
bbox = draw.textbbox((0, 0), tagline, font=font_sm)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 985), tagline, fill=GOLD, font=font_sm)

# Save
img.save(OUT, 'PNG', quality=95)
print(f"Saved: {OUT}")
print(f"Size: {os.path.getsize(OUT)} bytes")
