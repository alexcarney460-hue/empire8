"""
RUNWAY GEN-4.5 — Video + Image Generation for Triple OG Gloves
Generates cinematic video clips AND still images via Runway Gen-4.5 API.

API: https://api.dev.runwayml.com/v1
Model: gen4.5 (text-to-video + image-to-video)
Cost: ~12 credits/sec ($0.01/credit) = ~$0.60 per 5s clip

Endpoints:
  POST /text_to_video   — generate from text prompt
  POST /image_to_video  — generate from image + text prompt (uses real product photos)
  GET  /tasks/{id}      — poll status
"""

import base64
import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path
from agents.config import TMP, FFMPEG, BASE, RUNWAY_API_KEY

API_BASE = "https://api.dev.runwayml.com/v1"
API_KEY = RUNWAY_API_KEY
API_VERSION = "2024-11-06"
MODEL = "gen4.5"
RATIO = "720:1280"  # vertical reel

MAX_POLL_SECONDS = 300
POLL_INTERVAL = 5


def _api_request(method: str, path: str, body: dict | None = None) -> dict:
    """Make an authenticated request to the Runway API."""
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode() if body else None

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "X-Runway-Version": API_VERSION,
            "Content-Type": "application/json",
        },
        method=method,
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def _download(url: str, dest: str) -> str:
    """Download a file from URL to local path."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        with open(dest, "wb") as f:
            f.write(resp.read())
    return dest


def generate_video(
    prompt: str,
    output_path: str,
    duration: int = 5,
    ratio: str = RATIO,
) -> str | None:
    """Generate a video clip using Runway Gen-4.5.

    Returns the output_path if successful, None on failure.
    """
    duration = max(5, min(30, duration))
    print(f"    [RUNWAY] Generating {duration}s clip: {prompt[:80]}...")

    try:
        task = _api_request("POST", "/text_to_video", {
            "model": MODEL,
            "promptText": prompt,
            "duration": duration,
            "ratio": ratio,
        })
    except Exception as e:
        print(f"    [RUNWAY] Submit failed: {e}")
        return None

    task_id = task.get("id")
    if not task_id:
        print(f"    [RUNWAY] No task ID in response: {task}")
        return None

    print(f"    [RUNWAY] Task {task_id} submitted, polling...")

    elapsed = 0
    while elapsed < MAX_POLL_SECONDS:
        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL

        try:
            status = _api_request("GET", f"/tasks/{task_id}", None)
        except Exception as e:
            print(f"    [RUNWAY] Poll error: {e}")
            continue

        state = status.get("status", "UNKNOWN")

        if state == "SUCCEEDED":
            video_url = None
            output = status.get("output")
            if isinstance(output, list) and output:
                video_url = output[0]
            elif isinstance(output, dict):
                video_url = output.get("url") or output.get("video")
            elif isinstance(output, str):
                video_url = output

            if not video_url:
                print(f"    [RUNWAY] Succeeded but no video URL: {status}")
                return None

            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            _download(video_url, output_path)
            size_kb = Path(output_path).stat().st_size // 1024
            print(f"    [RUNWAY] Done: {output_path} ({size_kb}KB, {duration}s)")
            return output_path

        if state in ("FAILED", "CANCELLED"):
            failure = status.get("failure") or status.get("error") or "unknown"
            print(f"    [RUNWAY] Task {state}: {failure}")
            return None

        dots = "." * ((elapsed // POLL_INTERVAL) % 4)
        print(f"    [RUNWAY] {state} ({elapsed}s){dots}")

    print(f"    [RUNWAY] Timed out after {MAX_POLL_SECONDS}s")
    return None


def generate_video_from_image(
    image_path: str,
    prompt: str,
    output_path: str,
    duration: int = 5,
    ratio: str = RATIO,
) -> str | None:
    """Generate a video clip using a reference image + text prompt (image-to-video).

    This produces video that matches the actual product packaging/photos,
    not Runway's imagination of what the product looks like.

    Args:
        image_path: Path to the reference image (PNG/JPG)
        prompt: Text description of desired motion/mood
        output_path: Where to save the .mp4
        duration: Video duration in seconds (5-30)
        ratio: Aspect ratio

    Returns:
        The output_path if successful, None on failure
    """
    duration = max(5, min(30, duration))

    if not Path(image_path).exists():
        print(f"    [RUNWAY] Reference image not found: {image_path}")
        return None

    # Read image and encode as base64 data URI
    with open(image_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode()

    ext = Path(image_path).suffix.lower()
    mime = "image/png" if ext == ".png" else "image/jpeg"
    data_uri = f"data:{mime};base64,{img_data}"

    print(f"    [RUNWAY] Image-to-video ({duration}s): {prompt[:60]}...")
    print(f"    [RUNWAY] Reference: {Path(image_path).name}")

    try:
        task = _api_request("POST", "/image_to_video", {
            "model": MODEL,
            "promptText": prompt,
            "promptImage": data_uri,
            "duration": duration,
            "ratio": ratio,
        })
    except Exception as e:
        print(f"    [RUNWAY] Submit failed: {e}")
        return None

    task_id = task.get("id")
    if not task_id:
        print(f"    [RUNWAY] No task ID in response: {task}")
        return None

    print(f"    [RUNWAY] Task {task_id} submitted, polling...")

    elapsed = 0
    while elapsed < MAX_POLL_SECONDS:
        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL

        try:
            status = _api_request("GET", f"/tasks/{task_id}", None)
        except Exception as e:
            print(f"    [RUNWAY] Poll error: {e}")
            continue

        state = status.get("status", "UNKNOWN")

        if state == "SUCCEEDED":
            video_url = None
            output = status.get("output")
            if isinstance(output, list) and output:
                video_url = output[0]
            elif isinstance(output, dict):
                video_url = output.get("url") or output.get("video")
            elif isinstance(output, str):
                video_url = output

            if not video_url:
                print(f"    [RUNWAY] Succeeded but no video URL: {status}")
                return None

            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            _download(video_url, output_path)
            size_kb = Path(output_path).stat().st_size // 1024
            print(f"    [RUNWAY] Done: {output_path} ({size_kb}KB, {duration}s)")
            return output_path

        if state in ("FAILED", "CANCELLED"):
            failure = status.get("failure") or status.get("error") or "unknown"
            print(f"    [RUNWAY] Task {state}: {failure}")
            return None

        dots = "." * ((elapsed // POLL_INTERVAL) % 4)
        print(f"    [RUNWAY] {state} ({elapsed}s){dots}")

    print(f"    [RUNWAY] Timed out after {MAX_POLL_SECONDS}s")
    return None


def generate_scene_video(
    scene_description: str,
    visual_mood: str,
    scene_num: int,
    duration: float = 5.0,
    prefix: str = "tog",
    reference_image: str | None = None,
) -> str | None:
    """Generate a scene video clip for a Triple OG reel.

    If a reference_image is provided, uses image-to-video (Runway animates
    the real photo). Otherwise falls back to text-to-video.

    Returns path to generated .mp4 or None.
    """
    runway_duration = max(5, round(duration))

    prompt = (
        f"Cinematic vertical video for Instagram Reel. "
        f"Visual mood: {visual_mood}. "
        f"{scene_description}. "
        f"Smooth slow camera movement, photorealistic 4K. "
        f"No text, no words, no watermarks."
    )

    output = str(TMP / f"{prefix}-scene{scene_num}.mp4")

    # Prefer image-to-video with real cannabis reference photo
    if reference_image and Path(reference_image).exists():
        result = generate_video_from_image(
            reference_image, prompt, output,
            duration=runway_duration, ratio=RATIO,
        )
        if result:
            return result
        print(f"    [RUNWAY] Image-to-video failed, falling back to text-to-video")

    return generate_video(prompt, output, duration=runway_duration)


def _extract_frame(video_path: str, output_path: str, timestamp: float = 1.5) -> str | None:
    """Extract a single frame from a video at the given timestamp."""
    cmd = [
        FFMPEG, "-y",
        "-ss", str(timestamp),
        "-i", video_path.replace("\\", "/"),
        "-frames:v", "1",
        "-q:v", "2",
        output_path.replace("\\", "/"),
    ]
    result = subprocess.run(
        [str(c) for c in cmd],
        capture_output=True, text=True, timeout=30,
        cwd=str(BASE),
    )
    if result.returncode == 0 and Path(output_path).exists():
        return output_path
    print(f"    [RUNWAY] Frame extraction failed: {result.stderr[-200:]}")
    return None


def generate_scene_image(
    scene_description: str,
    visual_mood: str,
    scene_num: int,
    prefix: str = "tog-img",
) -> str | None:
    """Generate a still image by creating a short video and extracting a frame.

    Uses Runway to generate a 5s clip, extracts a clean frame at 1.5s
    (past any fade-in artifacts). Costs ~$0.60 per image.
    """
    prompt = (
        f"Cinematic still composition, minimal camera movement. "
        f"Visual mood: {visual_mood}. "
        f"{scene_description}. "
        f"Licensed commercial cannabis facility, clean industrial environment. "
        f"Cannabis buds are dense frosty colas with trichome crystal coverage, "
        f"deep green and purple calyxes, amber-orange pistil hairs. "
        f"Premium black nitrile gloves with amber resin on fingertips. "
        f"Photorealistic 4K, shallow depth of field. "
        f"No text, no words, no watermarks."
    )

    video_path = str(TMP / f"{prefix}-vid-s{scene_num}.mp4")
    video = generate_video(prompt, video_path, duration=5, ratio="720:1280")
    if not video:
        return None

    frame_path = str(TMP / f"{prefix}-s{scene_num}.png")
    frame = _extract_frame(video, frame_path, timestamp=1.5)

    try:
        os.unlink(video)
    except OSError:
        pass

    if not frame:
        return None

    size_kb = Path(frame).stat().st_size // 1024
    print(f"    [RUNWAY] Image extracted: {frame} ({size_kb}KB)")
    return frame
