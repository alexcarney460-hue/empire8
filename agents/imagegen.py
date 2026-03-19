"""
Image generation via Gemini (primary) + Runway Gen-4.5 (video scenes).
Generates cinematic AI images for Triple OG Gloves reel scenes.
Supports automatic API key rotation on rate limits (429).
"""

import json
import base64
import time
import urllib.request
from pathlib import Path
from agents.config import GEMINI_KEYS, TMP

MODEL = "gemini-3.1-flash-image-preview"
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def generate_image(prompt: str, output_path: str, aspect_ratio: str = "9:16", size: str = "1K") -> str | None:
    """Generate an image using Gemini, with automatic key rotation."""
    print(f"    [IMAGEGEN] Generating: {prompt[:80]}...")

    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": {
                "aspectRatio": aspect_ratio,
                "imageSize": size,
            },
        },
    }).encode()

    for key_idx, api_key in enumerate(GEMINI_KEYS):
        req = urllib.request.Request(
            ENDPOINT,
            data=payload,
            headers={
                "x-goog-api-key": api_key,
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"    [IMAGEGEN] Key {key_idx + 1}/{len(GEMINI_KEYS)} rate-limited, trying next...")
                if key_idx < len(GEMINI_KEYS) - 1:
                    continue
                wait = 120
                print(f"    [IMAGEGEN] All keys rate-limited. Waiting {wait}s...")
                time.sleep(wait)
                return generate_image(prompt, output_path, aspect_ratio, size)
            print(f"    [IMAGEGEN] API error: {e}")
            return None
        except Exception as e:
            print(f"    [IMAGEGEN] API error: {e}")
            return None

        candidates = data.get("candidates", [])
        if not candidates:
            print("    [IMAGEGEN] No candidates in response")
            return None

        parts = candidates[0].get("content", {}).get("parts", [])
        for part in parts:
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                img_bytes = base64.b64decode(inline["data"])
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                with open(output_path, "wb") as f:
                    f.write(img_bytes)
                print(f"    [IMAGEGEN] Saved: {output_path} ({len(img_bytes) // 1024}KB) [key {key_idx + 1}]")
                return output_path

        print("    [IMAGEGEN] No image data in response")
        return None

    return None


def generate_scene_image(scene_description: str, visual_mood: str, scene_num: int, prefix: str = "tog") -> str | None:
    """Generate a cinematic scene image for a Triple OG Gloves reel.

    Cannabis trimming / grow room aesthetic. Professional, not stoner.
    Hands in nitrile gloves, product close-ups, warehouse vibes.
    """
    prompt = (
        f"Cinematic Instagram Reel frame, vertical 9:16, photorealistic. "
        f"Visual mood: {visual_mood}. "
        f"Scene: {scene_description}. "
        f"Style: professional cannabis industry, dark high-contrast aesthetic, "
        f"dramatic lighting with neon green (#4AE54A) and purple (#8B2FC9) accent tones. "
        f"BLACK nitrile gloves on hands, trimming tools, cannabis plants or buds. "
        f"Matte black glove boxes visible where relevant. Industrial-professional feel. "
        f"No text, no words, no letters, no watermarks in the image. "
        f"No faces visible — only hands, products, and environment."
    )

    output = str(TMP / f"{prefix}-scene{scene_num}.png")
    return generate_image(prompt, output, aspect_ratio="9:16", size="1K")
