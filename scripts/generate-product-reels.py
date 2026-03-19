#!/usr/bin/env python3
"""
Generate short product video reels from Triple OG Gloves product images using Runway Gen-4 Turbo.

Takes product images from public/products/, sends them to Runway image-to-video API,
and downloads the resulting MP4s ready for Instagram posting.

Usage:
  python scripts/generate-product-reels.py --list              # Show available shots
  python scripts/generate-product-reels.py --shot glove-snap   # Generate one shot
  python scripts/generate-product-reels.py --all               # Generate all shots
  python scripts/generate-product-reels.py --all --dry-run     # Preview without generating
  python scripts/generate-product-reels.py --shot glove-snap --duration 10

Requires:
  pip install httpx
  Runway API key in C:/Users/Claud/Desktop/keys/runwayapi.txt
"""

import sys
import os
import time
import json
import base64
import argparse
from pathlib import Path
from datetime import datetime

import httpx

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

RUNWAY_KEY_FILE = Path("C:/Users/Claud/Desktop/keys/runwayapi.txt")
RUNWAY_BASE = "https://api.dev.runwayml.com/v1"
RUNWAY_VERSION = "2024-11-06"
RUNWAY_MODEL = "gen4_turbo"  # 5 credits/sec (cheaper than gen4.5)

FFMPEG = "C:/Users/Claud/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe"

PROJECT_ROOT = Path(__file__).parent.parent
PRODUCTS_DIR = PROJECT_ROOT / "public" / "products"
OUTPUT_DIR = PROJECT_ROOT / "tmp" / "reels"
REEL_LOG = PROJECT_ROOT / "tmp" / "reel-log.jsonl"

# ---------------------------------------------------------------------------
# Shot definitions — each maps to a content calendar post
# ---------------------------------------------------------------------------

SHOTS = [
    {
        "id": "glove-snap",
        "image": "product-5.avif",
        "prompt": "Close-up of black nitrile gloves being snapped onto hands in slow motion, satisfying snap movement, professional studio lighting on dark background, cinematic product commercial feel",
        "duration": 5,
        "ratio": "720:1280",
        "calendar_post": "Triple OG Launch — Brand Intro Reel",
        "description": "Slow-mo glove snap for launch reel",
    },
    {
        "id": "glove-stretch",
        "image": "product-5.avif",
        "prompt": "Black nitrile glove being stretched to show durability, fingers flexing and testing grip, micro-textured fingertips visible, dark moody lighting with amber accent tones, product commercial",
        "duration": 5,
        "ratio": "720:1280",
        "calendar_post": "Glove Snap Test — Quick Reel",
        "description": "Stretch test showing durability",
    },
    {
        "id": "case-hero",
        "image": "product-3.avif",
        "prompt": "Slow cinematic zoom into a case of professional nitrile gloves, dramatic product reveal lighting, dark background with warm amber spotlight slowly illuminating the packaging, premium commercial feel",
        "duration": 5,
        "ratio": "720:1280",
        "calendar_post": "Case Unboxing — Quick Reel",
        "description": "Hero shot case reveal for unboxing reel",
    },
    {
        "id": "trim-room",
        "image": "product-5.avif",
        "prompt": "Hands wearing black nitrile gloves working at a professional station, precise hand movements showing dexterity and grip, warm amber workshop lighting, cinematic shallow depth of field",
        "duration": 5,
        "ratio": "720:1280",
        "calendar_post": "Day in the Life — Trim Crew Reel",
        "description": "Hands working in trim room environment",
    },
    {
        "id": "product-lineup",
        "image": "product-1.avif",
        "prompt": "Slow dolly shot revealing a lineup of professional nitrile glove boxes arranged neatly, dark surface with dramatic side lighting, amber highlights catching the packaging, premium brand commercial",
        "duration": 5,
        "ratio": "1280:720",
        "calendar_post": "Trim Room Setup — Lifestyle Static (animated)",
        "description": "Product lineup dolly shot for lifestyle content",
    },
    {
        "id": "glove-detail",
        "image": "product-2.avif",
        "prompt": "Extreme close-up macro shot of black nitrile glove texture, micro-textured fingertips, slow subtle camera movement revealing surface detail, professional product photography lighting, dark background",
        "duration": 5,
        "ratio": "720:1280",
        "calendar_post": "Resin Resistance Test — Quick Reel",
        "description": "Macro detail shot of glove texture",
    },
    {
        "id": "box-open",
        "image": "product-4.avif",
        "prompt": "Top-down overhead shot of nitrile glove box being opened, gloves being pulled out one by one, smooth satisfying motion, clean dark surface, professional studio lighting with amber accents",
        "duration": 5,
        "ratio": "720:1280",
        "calendar_post": "Trim Tip: Change Gloves Every 30 Min",
        "description": "Box opening ASMR-style shot",
    },
    {
        "id": "size-compare",
        "image": "product-6.avif",
        "prompt": "Side-by-side comparison of different size nitrile gloves, hands fitting into gloves showing perfect fit vs loose fit, educational product demonstration, clean studio lighting, professional commercial",
        "duration": 5,
        "ratio": "720:1280",
        "calendar_post": "How to Pick the Right Glove Size",
        "description": "Size comparison educational shot",
    },
]


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", file=sys.stderr, flush=True)


def log_reel(shot_id: str, image: str, video: str, status: str, error: str = "") -> None:
    REEL_LOG.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "shot": shot_id,
        "image": image,
        "video": video,
        "status": status,
        "error": error,
        "timestamp": datetime.now().isoformat(),
    }
    with open(REEL_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


# ---------------------------------------------------------------------------
# Runway API
# ---------------------------------------------------------------------------

def get_runway_key() -> str:
    if not RUNWAY_KEY_FILE.exists():
        log(f"ERROR: Runway API key not found at {RUNWAY_KEY_FILE}")
        sys.exit(1)
    return RUNWAY_KEY_FILE.read_text().strip()


def runway_headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "X-Runway-Version": RUNWAY_VERSION,
        "Content-Type": "application/json",
    }


def convert_to_jpeg(image_path: Path) -> bytes:
    """Convert any image (including AVIF) to JPEG bytes using ffmpeg."""
    import subprocess
    import tempfile

    suffix = image_path.suffix.lower()
    if suffix in (".jpg", ".jpeg"):
        return image_path.read_bytes()

    # Use ffmpeg to convert unsupported formats to JPEG
    ffmpeg = FFMPEG if Path(FFMPEG).exists() else "ffmpeg"
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            [ffmpeg, "-y", "-i", str(image_path), "-q:v", "2", tmp_path],
            capture_output=True, timeout=30,
        )
        if result.returncode != 0:
            log(f"  ffmpeg conversion failed: {result.stderr.decode()[:200]}")
            # Fallback: try sending as-is
            return image_path.read_bytes()
        return Path(tmp_path).read_bytes()
    finally:
        try:
            Path(tmp_path).unlink(missing_ok=True)
        except Exception:
            pass


def image_to_data_uri(image_path: Path) -> str:
    """Convert a local image file to a JPEG base64 data URI for Runway API."""
    data = convert_to_jpeg(image_path)
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def create_video_task(
    api_key: str,
    image_source: str,
    prompt: str,
    duration: int = 5,
    ratio: str = "720:1280",
) -> str | None:
    """Submit an image-to-video task to Runway. Returns task ID."""
    payload = {
        "model": RUNWAY_MODEL,
        "promptText": prompt,
        "promptImage": image_source,
        "ratio": ratio,
        "duration": duration,
    }
    try:
        resp = httpx.post(
            f"{RUNWAY_BASE}/image_to_video",
            json=payload,
            headers=runway_headers(api_key),
            timeout=30,
        )
        if resp.status_code == 200:
            data = resp.json()
            task_id = data.get("id")
            log(f"  Task created: {task_id}")
            return task_id
        log(f"  Runway API error: {resp.status_code} {resp.text[:300]}")
        return None
    except Exception as e:
        log(f"  Runway request error: {e}")
        return None


def poll_task(api_key: str, task_id: str, max_attempts: int = 120) -> dict | None:
    """Poll a Runway task until completion. Returns task data or None."""
    time.sleep(3)  # initial delay
    for attempt in range(max_attempts):
        try:
            resp = httpx.get(
                f"{RUNWAY_BASE}/tasks/{task_id}",
                headers=runway_headers(api_key),
                timeout=15,
            )
            if resp.status_code != 200:
                log(f"  Poll error: {resp.status_code}")
                time.sleep(10)
                continue

            data = resp.json()
            status = data.get("status", "UNKNOWN")

            if status == "SUCCEEDED":
                log(f"  Task completed!")
                return data
            elif status in ("FAILED", "CANCELED"):
                failure = data.get("failure", "unknown")
                log(f"  Task {status}: {failure}")
                return None

            if attempt % 6 == 0:
                elapsed = attempt * 5 if attempt < 10 else 50 + (attempt - 10) * 10
                log(f"  Status: {status} [~{elapsed}s elapsed]")

        except Exception as e:
            log(f"  Poll error: {e}")

        poll_interval = 5 if attempt < 10 else 10
        time.sleep(poll_interval)

    log("  Timed out waiting for Runway task")
    return None


def download_video(url: str, output_path: str) -> bool:
    """Download the generated video from Runway."""
    try:
        resp = httpx.get(url, timeout=60, follow_redirects=True)
        if resp.status_code == 200 and len(resp.content) > 10000:
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            Path(output_path).write_bytes(resp.content)
            size_mb = len(resp.content) / (1024 * 1024)
            log(f"  Downloaded: {size_mb:.1f}MB -> {Path(output_path).name}")
            return True
        log(f"  Download failed: HTTP {resp.status_code} ({len(resp.content)} bytes)")
        return False
    except Exception as e:
        log(f"  Download error: {e}")
        return False


# ---------------------------------------------------------------------------
# Generation pipeline
# ---------------------------------------------------------------------------

def generate_shot(shot: dict, api_key: str, duration_override: int | None = None) -> bool:
    """Generate a single product reel shot."""
    shot_id = shot["id"]
    image_file = shot["image"]
    prompt = shot["prompt"]
    duration = duration_override or shot["duration"]
    ratio = shot["ratio"]

    log(f"\n{'='*60}")
    log(f"Shot: {shot_id}")
    log(f"Image: {image_file}")
    log(f"Duration: {duration}s | Ratio: {ratio}")
    log(f"Prompt: {prompt[:80]}...")
    log(f"{'='*60}")

    # Load local image
    image_path = PRODUCTS_DIR / image_file
    if not image_path.exists():
        log(f"  ERROR: Image not found: {image_path}")
        log_reel(shot_id, image_file, "", "failed", "image_not_found")
        return False

    log(f"  Encoding image as data URI...")
    image_uri = image_to_data_uri(image_path)
    log(f"  Image encoded ({len(image_uri) // 1024}KB)")

    # Create Runway task
    log(f"  Submitting to Runway {RUNWAY_MODEL}...")
    task_id = create_video_task(api_key, image_uri, prompt, duration, ratio)
    if not task_id:
        log_reel(shot_id, image_file, "", "failed", "task_creation_failed")
        return False

    # Poll for completion
    log(f"  Waiting for generation...")
    result = poll_task(api_key, task_id)
    if not result:
        log_reel(shot_id, image_file, "", "failed", "generation_failed")
        return False

    # Download video
    output = result.get("output", [])
    if not output:
        log(f"  ERROR: No output URLs in task result")
        log_reel(shot_id, image_file, "", "failed", "no_output")
        return False

    video_url = output[0]
    output_file = OUTPUT_DIR / f"triple-og-{shot_id}.mp4"
    if not download_video(video_url, str(output_file)):
        log_reel(shot_id, image_file, "", "failed", "download_failed")
        return False

    log_reel(shot_id, image_file, str(output_file), "generated")
    log(f"  SUCCESS: {output_file}")
    return True


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate Triple OG product reels via Runway")
    parser.add_argument("--shot", type=str, help="Generate a specific shot by ID")
    parser.add_argument("--all", action="store_true", help="Generate all shots")
    parser.add_argument("--list", action="store_true", help="List available shots")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen")
    parser.add_argument("--duration", type=int, help="Override video duration (2-10s)")
    parser.add_argument("--max", type=int, default=8, help="Max shots per run (default: 8)")
    args = parser.parse_args()

    if args.list:
        print(f"\n{'ID':<20} {'Image':<20} {'Duration':<10} {'Description'}")
        print("-" * 80)
        for s in SHOTS:
            print(f"{s['id']:<20} {s['image']:<20} {s['duration']}s{'':<7} {s['description']}")
        print(f"\n{len(SHOTS)} shots available.\n")
        return

    if not args.shot and not args.all:
        parser.print_help()
        return

    # Select shots
    if args.shot:
        targets = [s for s in SHOTS if s["id"] == args.shot]
        if not targets:
            print(f"Unknown shot: {args.shot}")
            print(f"Available: {', '.join(s['id'] for s in SHOTS)}")
            return
    else:
        targets = SHOTS[:args.max]

    if args.dry_run:
        print(f"\nDRY RUN — would generate {len(targets)} shots:\n")
        for s in targets:
            print(f"  {s['id']:<20} {s['image']:<20} {s['duration']}s")
            print(f"    Prompt: {s['prompt'][:70]}...")
            print(f"    For: {s['calendar_post']}")
            print()
        credits = sum(s["duration"] * 5 for s in targets)
        print(f"Estimated cost: ~{credits} credits ({credits * 5 / 100:.0f} credits at 5/sec)")
        return

    # Generate
    api_key = get_runway_key()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    success = 0
    failed = 0

    for shot in targets:
        ok = generate_shot(shot, api_key, args.duration)
        if ok:
            success += 1
        else:
            failed += 1

    print(f"\n{'='*60}")
    print(f"Done: {success} generated, {failed} failed")
    print(f"Output: {OUTPUT_DIR}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
