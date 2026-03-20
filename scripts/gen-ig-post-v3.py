"""
Empire 8 — '62 Counties' Instagram Post v3
Uses the actual zone-map.jpg as the hero image with clean text overlay.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'assets')
FONTS = os.path.join(ASSETS, 'fonts')
PUBLIC = os.path.join(os.path.dirname(__file__), '..', 'public')
OUT = os.path.join(ASSETS, 'ig-post-62-counties.png')

W, H = 1080, 1080

# Brand colors
ROYAL       = (74, 14, 120)
ROYAL_DARK  = (26, 6, 51)
GOLD        = (200, 162, 60)
GOLD_LIGHT  = (232, 212, 139)
WHITE       = (248, 246, 242)

# Fonts
font_hero     = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-Bold.ttf'), 72)
font_hero_big = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-Bold.ttf'), 86)
font_sub      = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-SemiBold.ttf'), 26)
font_cta      = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-Bold.ttf'), 30)
font_url      = ImageFont.truetype(os.path.join(FONTS, 'BarlowCondensed-SemiBold.ttf'), 20)

# ─── Load and prepare the zone map ──────────────────────────────────
map_img = Image.open(os.path.join(PUBLIC, 'zone-map.jpg')).convert('RGB')

# Crop to square (center crop)
mw, mh = map_img.size
if mw > mh:
    left = (mw - mh) // 2
    map_img = map_img.crop((left, 0, left + mh, mh))
else:
    top = (mh - mw) // 2
    map_img = map_img.crop((0, top, mw, top + mw))

# Resize to fill canvas
map_img = map_img.resize((W, W), Image.LANCZOS)

# Create the final image
img = Image.new('RGB', (W, H), ROYAL_DARK)

# Position map in the middle/upper area
# We want the map to be the star, with text bars at top and bottom
map_y_offset = 140
img.paste(map_img.crop((0, 0, W, min(W, H - 240))), (0, map_y_offset))

draw = ImageDraw.Draw(img)

# ─── Top bar: dark gradient overlay for text ─────────────────────────
for y in range(0, 180):
    alpha = int(255 * (1 - y / 180) ** 1.2)
    draw.line([(0, y), (W, y)], fill=(
        int(ROYAL_DARK[0]),
        int(ROYAL_DARK[1]),
        int(ROYAL_DARK[2]),
    ))

# Blend the top gradient properly
top_gradient = Image.new('RGBA', (W, H), (0, 0, 0, 0))
tg_draw = ImageDraw.Draw(top_gradient)
for y in range(200):
    a = int(255 * max(0, 1 - y / 180) ** 1.3)
    tg_draw.line([(0, y), (W, y)], fill=(ROYAL_DARK[0], ROYAL_DARK[1], ROYAL_DARK[2], a))
img_rgba = img.convert('RGBA')
img_rgba = Image.alpha_composite(img_rgba, top_gradient)

# ─── Bottom bar: dark gradient for CTA ───────────────────────────────
bot_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
bg_draw = ImageDraw.Draw(bot_layer)
for y in range(300):
    a = int(255 * (y / 300) ** 1.5)
    bg_draw.line([(0, H - 300 + y), (W, H - 300 + y)], fill=(ROYAL_DARK[0], ROYAL_DARK[1], ROYAL_DARK[2], a))
img_rgba = Image.alpha_composite(img_rgba, bot_layer)

img = img_rgba.convert('RGB')
draw = ImageDraw.Draw(img)

# ─── Top text ────────────────────────────────────────────────────────

# "62 COUNTIES." in big bold white
line1 = "62 COUNTIES."
bbox1 = draw.textbbox((0, 0), line1, font=font_hero_big)
tw1 = bbox1[2] - bbox1[0]
# Drop shadow
draw.text(((W - tw1) // 2 + 2, 24 + 2), line1, fill=(0, 0, 0), font=font_hero_big)
draw.text(((W - tw1) // 2, 24), line1, fill=WHITE, font=font_hero_big)

# "ONE SUPPLIER." in gold
line2 = "ONE SUPPLIER."
bbox2 = draw.textbbox((0, 0), line2, font=font_hero)
tw2 = bbox2[2] - bbox2[0]
draw.text(((W - tw2) // 2 + 2, 108 + 2), line2, fill=(0, 0, 0), font=font_hero)
draw.text(((W - tw2) // 2, 108), line2, fill=GOLD, font=font_hero)

# ─── Bottom text ─────────────────────────────────────────────────────

# Subhead
sub = "LICENSED WHOLESALE CANNABIS DISTRIBUTION"
bbox = draw.textbbox((0, 0), sub, font=font_sub)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 900), sub, fill=GOLD_LIGHT, font=font_sub)

# CTA pill
cta = "NOW ACCEPTING DISPENSARY ACCOUNTS"
bbox = draw.textbbox((0, 0), cta, font=font_cta)
tw = bbox[2] - bbox[0]
pill_x = (W - tw) // 2 - 24
pill_y = 948
pill_w = tw + 48
pill_h = (bbox[3] - bbox[1]) + 20
draw.rounded_rectangle(
    [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
    radius=6, fill=GOLD
)
draw.text(((W - tw) // 2, 955), cta, fill=ROYAL_DARK, font=font_cta)

# URL
url = "empire8ny.com"
bbox = draw.textbbox((0, 0), url, font=font_url)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 1010), url, fill=GOLD_LIGHT, font=font_url)

# Gold accent line under hero text
draw.line([(W // 2 - 60, 185), (W // 2 + 60, 185)], fill=GOLD, width=2)

# ─── Save ────────────────────────────────────────────────────────────
img.save(OUT, 'PNG', quality=95)
desktop = os.path.expanduser('~/Desktop/ig-post-62-counties.png')
img.save(desktop, 'PNG', quality=95)
print(f"Saved: {OUT}")
print(f"Desktop: {desktop}")
print(f"Size: {os.path.getsize(OUT)} bytes")
