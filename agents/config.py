"""Shared config for Triple OG Gloves reel production agents."""

from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
TMP = BASE / "tmp" / "reels"
TMP.mkdir(parents=True, exist_ok=True)
LOGS_DIR = BASE / "logs" / "agents"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG = "C:/Users/Claud/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe"

# Runway Gen-4.5 API
RUNWAY_KEY_FILE = Path.home() / "Desktop" / "keys" / "runwayapi.txt"
RUNWAY_API_KEY = RUNWAY_KEY_FILE.read_text().strip() if RUNWAY_KEY_FILE.exists() else ""

# Gemini image gen (backup — keys may be revoked)
GEMINI_KEYS = [
    "AIzaSyB_8sKMOp-3MGNV2WcWPUJF3cXA-uSK4ME",
    "AIzaSyAyDqVpIEozKnOweTWd-hShVth6RoOs9OE",
]

# Relative font paths (avoids Windows drive colon escaping in FFmpeg)
FONT_BOLD = "assets/fonts/Montserrat-ExtraBold.ttf"
FONT_SEMI = "assets/fonts/Montserrat-SemiBold.ttf"

# Triple OG Gloves brand — colors matched from actual product packaging
BRAND = {
    "name": "Triple OG Gloves",
    "url": "valuesuppliers.co",
    "instagram": "@tripleoggloves",
    "tagline": "Supplied for the Grow.",
    "slogan": "Quality Demands Quality.",
    "colors": {
        "black": "#0A0A0A",          # matte black box background
        "neon_green": "#4AE54A",     # logo "OG" outline accent
        "purple": "#8B2FC9",         # "TRIPLE" text
        "white": "#FFFFFF",          # product info text
        "charcoal": "#1C1C1C",       # dark UI backgrounds
    },
    "tone": (
        "Cannabis industry insider. Direct, no-fluff, value-forward. "
        "Street credibility meets professional supply. OG energy. "
        "Knows the grow world. Speaks to trimmers, growers, and ops."
    ),
    "visual_rule": (
        "Hands in BLACK nitrile gloves trimming cannabis. Professional grow rooms. "
        "Triple OG box packaging visible. Matte black + neon green + purple accents. "
        "No faces — hands and product only. Dark, high-contrast aesthetic."
    ),
}

# Product shot paths (for Runway input / reel overlays)
PRODUCT_SHOTS = {
    "box_M": str(BASE / "assets" / "product-shots" / "triple-og-box-M.png"),
    "box_XL": str(BASE / "assets" / "product-shots" / "triple-og-box-XL.png"),
    "case_S": str(BASE / "assets" / "product-shots" / "triple-og-case-S.png"),
}

# Cannabis reference photos (for Runway image-to-video — real cannabis, not AI guessing)
REF_PHOTOS_DIR = BASE / "assets" / "reference-photos"
CANNABIS_REFS = {
    "cola_led_1": str(REF_PHOTOS_DIR / "plants1.jpg"),    # dense cola under LED, purple/pink
    "cola_led_2": str(REF_PHOTOS_DIR / "plants2.jpg"),    # trichome macro, blue/purple LED
    "cola_led_3": str(REF_PHOTOS_DIR / "plants3.jpg"),    # flowering cola, purple LED
    "trichome_macro_1": str(REF_PHOTOS_DIR / "plant4.jpg"),  # extreme trichome detail, pink
    "trichome_macro_2": str(REF_PHOTOS_DIR / "plant5.jpg"),  # extreme trichome detail, pink
    "bud_trimmed": str(REF_PHOTOS_DIR / "bud-closeup-1.jpg"),  # trimmed bud on white
}

# Color grade presets (cannabis/grow room aesthetic)
COLOR_GRADES = {
    "forest_green": "eq=contrast=1.15:brightness=0.02:saturation=1.15,colorbalance=gs=0.08:gm=0.05:gh=0.03",
    "warm_amber": "eq=contrast=1.1:brightness=0.03:saturation=1.2,colorbalance=rs=0.06:gm=0.04:bh=-0.03",
    "grow_light": "eq=contrast=1.1:brightness=0.05:saturation=1.3,colorbalance=rs=0.02:gs=-0.05:bs=0.12",
    "clean_white": "eq=contrast=1.05:brightness=0.04:saturation=0.95",
    "dark_warehouse": "eq=contrast=1.2:brightness=-0.03:saturation=0.9,colorbalance=gs=0.05:bm=0.03",
    "harvest_gold": "eq=contrast=1.15:brightness=0.02:saturation=1.25,colorbalance=rs=0.08:gs=0.04:bh=-0.05",
}
