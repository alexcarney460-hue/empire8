"""
PRODUCER — Video Production Agent for Empire 8 Sales Direct Reels

Renders story-driven reels with MINIMAL text overlays.
Cinematic AI-generated images with zoompan animation.
Only the end card gets text (brand + URL).

Pipeline:
  1. Generate AI images per scene via Gemini
  2. Apply zoompan + color grading per scene via FFmpeg
  3. Add end card with Triple OG branding
  4. Concatenate all scene clips into final .mp4
"""

import os
import subprocess
from pathlib import Path
from agents.config import FFMPEG, TMP, BASE, FONT_BOLD, FONT_SEMI, COLOR_GRADES, BRAND, RUNWAY_API_KEY, CANNABIS_REFS, PRODUCT_SHOTS
from agents.imagegen import generate_scene_image as gemini_generate_image

# Import Runway if API key is available
RUNWAY_AVAILABLE = bool(RUNWAY_API_KEY)
if RUNWAY_AVAILABLE:
    from agents.runway import generate_scene_video, generate_scene_image as runway_generate_image


def _pick_reference_photo(scene_description: str) -> str | None:
    """Pick the best cannabis reference photo based on scene content.

    Matches keywords in the scene description to the right reference image
    so Runway generates video from real cannabis, not imagination.
    """
    desc = scene_description.lower()

    # Product box / packaging scenes -> use real product photo
    if any(kw in desc for kw in ["glove box", "packaging", "supply shelf", "supply room", "cases of", "box of"]):
        return PRODUCT_SHOTS.get("box_XL") or PRODUCT_SHOTS.get("box_M")

    # Trichome / macro scenes -> use trichome macro reference
    if any(kw in desc for kw in ["trichome", "macro", "loupe", "crystal", "frost"]):
        return CANNABIS_REFS.get("trichome_macro_1") or CANNABIS_REFS.get("trichome_macro_2")

    # Trimmed bud / cured / jar scenes -> use trimmed bud reference
    if any(kw in desc for kw in ["trimmed", "cured", "jar", "nug", "nugget", "finished"]):
        return CANNABIS_REFS.get("bud_trimmed") or CANNABIS_REFS.get("cola_led_1")

    # Grow room / LED / canopy / flowering scenes -> use LED grow photos
    if any(kw in desc for kw in ["grow room", "led", "canopy", "flowering", "scrog", "facility"]):
        return CANNABIS_REFS.get("cola_led_1") or CANNABIS_REFS.get("cola_led_3")

    # Trimming / harvest / hands / gloves with cannabis
    if any(kw in desc for kw in ["trim", "harvest", "cola", "bud", "cannabis", "resin"]):
        return CANNABIS_REFS.get("cola_led_2") or CANNABIS_REFS.get("cola_led_1")

    # Default: use a cannabis reference for any scene
    return CANNABIS_REFS.get("cola_led_1")


def _ffmpeg(*args, timeout=180) -> bool:
    cmd = [FFMPEG, "-y"] + [str(a).replace("\\", "/") for a in args]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=str(BASE))
    if result.returncode != 0:
        print(f"    FFmpeg error: {result.stderr[-400:]}")
    return result.returncode == 0


def _escape_text(text: str) -> str:
    """Escape text for FFmpeg drawtext in filter_script:v files."""
    return (text
            .replace("\\", "\\\\")
            .replace("'", "\u2019")
            .replace(":", "\\\\:")
            .replace(",", "\\,")
            .replace("[", "\\[")
            .replace("]", "\\]")
            .replace(";", "\\;"))


def _make_scene_clip(img_path: str, scene: dict, clip_path: str) -> bool:
    """Create a scene clip from a still image with zoompan + color grading."""
    duration = scene.get("duration", 3.0)
    zoom_speed = scene.get("zoom_speed", 0.0008)
    color_mood = scene.get("color_mood", "forest_green")
    text_lines = scene.get("text_lines", [])
    fontsize = scene.get("fontsize", 42)

    grade = COLOR_GRADES.get(color_mood, COLOR_GRADES["forest_green"])
    frames = int(duration * 30)

    scene_num = scene.get("scene_num", 1)
    if scene_num % 3 == 0:
        zoom_expr = f"z=if(eq(on\\,1)\\,1.15\\,max(z-{zoom_speed}\\,1.0))"
    elif scene_num % 3 == 1:
        zoom_expr = f"z=min(zoom+{zoom_speed}\\,1.2)"
    else:
        zoom_expr = f"z=min(zoom+{zoom_speed * 0.5}\\,1.1)"

    vf_parts = [
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
        f"zoompan={zoom_expr}:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d={frames}:s=1080x1920:fps=30",
        grade,
    ]

    if text_lines:
        escaped = [_escape_text(line) for line in text_lines]
        text = r"\n".join(escaped)
        vf_parts.append(
            f"drawtext=text={text}"
            f":fontfile={FONT_BOLD}"
            f":fontsize={fontsize}:fontcolor=white"
            f":borderw=2:bordercolor=black@0.6"
            f":x=(w-text_w)/2:y=h*0.82"
            f":alpha=if(lt(t\\,0.5)\\,t/0.5\\,1)"
        )

    vf = ",".join(vf_parts)
    filter_file = clip_path + ".filter.txt"
    with open(filter_file, "w", encoding="utf-8") as f:
        f.write(vf)

    ok = _ffmpeg(
        "-loop", "1", "-i", str(img_path).replace("\\", "/"),
        "-filter_script:v", filter_file.replace("\\", "/"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-t", str(duration),
        str(clip_path).replace("\\", "/"),
    )

    try:
        os.unlink(filter_file)
    except OSError:
        pass

    return ok


def _make_end_card(clip_path: str, duration: float = 5.0) -> bool:
    """Create the Empire 8 end card via Runway image-to-video.

    Uses the REAL product box photo as the reference image so the packaging
    matches what's actually on empire8salesdirect.com. Cinematic hero shot.
    Falls back to FFmpeg text card only if Runway fails.
    """
    if RUNWAY_AVAILABLE:
        from agents.runway import generate_video_from_image
        from agents.config import PRODUCT_SHOTS

        # Use the XL box photo (best shot — shows box + gloved hand)
        ref_image = PRODUCT_SHOTS.get("box_XL", PRODUCT_SHOTS.get("box_M", ""))

        if ref_image and Path(ref_image).exists():
            print("    [END CARD] Generating via Runway image-to-video (real product photo)...")
            end_prompt = (
                "Cinematic hero shot of this exact black nitrile glove box. "
                "Dramatic side lighting with subtle green and purple accent glow. "
                "Dark moody atmosphere, shallow depth of field. "
                "Slow cinematic push-in revealing the product. "
                "Premium product commercial. Photorealistic 4K."
            )
            raw_path = clip_path + ".raw.mp4"
            result = generate_video_from_image(
                ref_image, end_prompt, raw_path,
                duration=max(5, round(duration)), ratio="720:1280",
            )
        else:
            print("    [END CARD] No product photo found, using text-to-video...")
            from agents.runway import generate_video
            end_prompt = (
                "Cinematic close-up of a matte black nitrile glove box with green and purple "
                "logo on a dark surface. Dramatic side lighting. Dark moody atmosphere. "
                "Slow cinematic push-in. Premium product hero shot. Photorealistic 4K."
            )
            raw_path = clip_path + ".raw.mp4"
            result = generate_video(end_prompt, raw_path, duration=max(5, round(duration)), ratio="720:1280")

        if result:
            # Scale to 1080x1920 and trim to exact duration
            ok = _ffmpeg(
                "-i", raw_path.replace("\\", "/"),
                "-t", str(duration),
                "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
                clip_path.replace("\\", "/"),
            )
            try:
                os.unlink(raw_path)
            except OSError:
                pass
            if ok:
                print("    [END CARD] OK (Runway)")
                return True
            print("    [END CARD] Runway scale failed, trying FFmpeg fallback")

    # Fallback: simple FFmpeg text card
    print("    [END CARD] Using FFmpeg text fallback")
    ok = _ffmpeg(
        "-f", "lavfi",
        "-i", f"color=c=0x0A0A0A:s=1080x1920:d={duration}:r=30",
        "-vf",
        f"drawtext=text='EMPIRE 8':fontfile={FONT_BOLD}:fontsize=56:fontcolor=0x4AE54A:x=(w-text_w)/2:y=(h-text_h)/2-20,"
        f"drawtext=text='empire8salesdirect.com':fontfile={FONT_SEMI}:fontsize=30:fontcolor=white:x=(w-text_w)/2:y=(h+text_h)/2+50,"
        f"drawtext=text='Quality Demands Quality.':fontfile={FONT_SEMI}:fontsize=22:fontcolor=0x8B2FC9:x=(w-text_w)/2:y=(h+text_h)/2+110",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-t", str(duration),
        str(clip_path).replace("\\", "/"),
    )
    return ok


def run(reel: dict) -> dict | None:
    """Produce a complete reel video from scene definitions.

    Args:
        reel: dict with 'title', 'scenes' (list of scene dicts), 'caption'
              Each scene has: visual_description, duration, color_mood, zoom_speed,
              and optionally text_lines (most should NOT have text)

    Returns:
        dict with 'file', 'title', 'size_kb', 'duration' or None on failure
    """
    title = reel.get("title", "reel")
    scenes = reel.get("scenes", [])
    safe_title = "".join(c if c.isalnum() else "" for c in title)[:20].lower() or "reel"
    output_path = str(TMP / f"reel-{safe_title}.mp4")

    print(f"  [PRODUCER] Rendering \"{title}\" ({len(scenes)} scenes)...")

    clips = []

    for i, scene in enumerate(scenes):
        scene["scene_num"] = i + 1
        num = i + 1
        description = scene.get("visual_description", "cinematic cannabis scene")
        mood = scene.get("visual_mood", "professional grow room, dramatic lighting, forest green tones")
        duration = scene.get("duration", 3.0)
        clip_path = str(TMP / f"tog-{safe_title}-c{num}.mp4")

        # TIER 1: Runway Gen-4.5 video with real cannabis reference photo
        if RUNWAY_AVAILABLE:
            ref_photo = _pick_reference_photo(description)
            if ref_photo:
                print(f"    Scene {num}/{len(scenes)}: generating video via Runway (ref: {Path(ref_photo).name})...")
            else:
                print(f"    Scene {num}/{len(scenes)}: generating video via Runway (text-only)...")
            video_path = generate_scene_video(
                scene_description=description,
                visual_mood=mood,
                scene_num=num,
                duration=duration,
                prefix=f"tog-{safe_title}",
                reference_image=ref_photo,
            )
            if video_path:
                # Trim to exact duration and scale to 1080x1920
                ok = _ffmpeg(
                    "-i", video_path.replace("\\", "/"),
                    "-t", str(duration),
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
                    clip_path.replace("\\", "/"),
                )
                try:
                    os.unlink(video_path)
                except OSError:
                    pass
                if ok:
                    clips.append(clip_path)
                    print(f"    Scene {num}: OK (Runway video)")
                    continue

        # TIER 2: Runway image + zoompan (if video failed)
        img_path = None
        if RUNWAY_AVAILABLE:
            print(f"    Scene {num}/{len(scenes)}: trying Runway image fallback...")
            img_path = runway_generate_image(
                scene_description=description,
                visual_mood=mood,
                scene_num=num,
                prefix=f"tog-{safe_title}",
            )

        # TIER 3: Gemini image + zoompan (if Runway unavailable/failed)
        if not img_path:
            print(f"    Scene {num}/{len(scenes)}: trying Gemini image fallback...")
            img_path = gemini_generate_image(
                scene_description=description,
                visual_mood=mood,
                scene_num=num,
                prefix=f"tog-{safe_title}",
            )

        if not img_path:
            print(f"    Scene {num}: all image generation failed, skipping")
            continue

        if _make_scene_clip(img_path, scene, clip_path):
            clips.append(clip_path)
            print(f"    Scene {num}: OK (image + zoompan)")
        else:
            print(f"    Scene {num}: FFmpeg render failed")

        try:
            os.unlink(img_path)
        except OSError:
            pass

    if not clips:
        print("  [PRODUCER] ERROR: No scenes rendered")
        return None

    end_card_path = str(TMP / f"tog-{safe_title}-endcard.mp4")
    if _make_end_card(end_card_path, duration=2.5):
        clips.append(end_card_path)
    else:
        print("  [PRODUCER] Warning: end card failed, continuing without it")

    if len(clips) == 1:
        os.replace(clips[0], output_path)
    else:
        concat_file = str(TMP / f"concat-{safe_title}.txt")
        with open(concat_file, "w", encoding="utf-8") as f:
            for clip in clips:
                f.write(f"file '{clip.replace(chr(92), '/')}'\n")

        ok = _ffmpeg(
            "-f", "concat", "-safe", "0",
            "-i", concat_file.replace("\\", "/"),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", "-crf", "18",
            output_path.replace("\\", "/"),
        )

        try:
            os.unlink(concat_file)
        except OSError:
            pass

        if not ok:
            print("  [PRODUCER] ERROR: Concat failed")
            return None

    for clip in clips:
        if clip != output_path:
            try:
                os.unlink(clip)
            except OSError:
                pass

    size = os.path.getsize(output_path)
    total_dur = sum(s.get("duration", 3) for s in scenes) + 2.5

    print(f"  [PRODUCER] Done: {output_path} ({size // 1024}KB, {total_dur:.1f}s)")
    return {
        "file": output_path,
        "title": title,
        "size_kb": size // 1024,
        "duration": total_dur,
        "scene_count": len(scenes),
    }
