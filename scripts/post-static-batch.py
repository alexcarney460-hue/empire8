#!/usr/bin/env python3
"""Post a batch of static image posts to @tripleoggloves."""

import sys
import time
import json
from pathlib import Path
from datetime import datetime

BROWSER_PROFILE = str(Path.home() / ".ig_tripleog_browser")
BASE = Path(__file__).resolve().parent.parent

POSTS = [
    {
        "image": str(BASE / "assets" / "product-shots" / "triple-og-box-XL.png"),
        "caption": (
            "meet the glove.\n\n"
            "5mil black nitrile. powder-free. textured grip.\n"
            "built for trim crews who don\u2019t stop until the job\u2019s done.\n\n"
            "Triple OG Gloves \u2014 quality demands quality.\n\n"
            "boxes + cases at valuesuppliers.co\n\n"
            "#tripleoggloves #nitrilegloves #cannabis #trimlife "
            "#growroom #cannabiscommunity #trimcrew #qualitydemandsquality "
            "#cannabisindustry #growlife #suppliedforthegrow"
        ),
    },
    {
        "image": str(BASE / "assets" / "product-shots" / "triple-og-box-M.png"),
        "caption": (
            "100 gloves. zero compromises.\n\n"
            "every box of Triple OG is 5mil thick, powder-free, "
            "and textured for grip \u2014 even when the resin builds up.\n\n"
            "your trim crew deserves better than gas station gloves.\n\n"
            "valuesuppliers.co\n\n"
            "#tripleoggloves #cannabis #trimming #nitrile "
            "#cannabiscultivation #trimseason #harvestseason "
            "#growop #cannabisbusiness #professionalgrade"
        ),
    },
    {
        "image": str(BASE / "assets" / "product-shots" / "triple-og-case-S.png"),
        "caption": (
            "case day.\n\n"
            "1 case = 10 boxes = 1,000 gloves.\n"
            "enough to get through harvest without a supply run.\n\n"
            "bulk pricing at valuesuppliers.co \u2014 "
            "because running out mid-trim is not an option.\n\n"
            "#tripleoggloves #bulkorder #cannabissupply "
            "#trimroom #growroom #wholesale #cannabisbusiness "
            "#trimcrew #harvestseason #suppliedforthegrow"
        ),
    },
]

DELAY_BETWEEN_POSTS = 70 * 60  # 70 minutes for new account safety


def find_and_click(page, button_text):
    for _ in range(5):
        result = page.evaluate(
            """(text) => {
            const dialog = document.querySelector("div[role='dialog']");
            if (!dialog) return null;
            const allEls = dialog.querySelectorAll("*");
            for (const el of allEls) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && rect.width < 200) {
                    const elText = el.textContent?.trim();
                    if (elText === text && el.children.length <= 1) {
                        return {x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2)};
                    }
                }
            }
            const buttons = dialog.querySelectorAll("div[role='button'], button, a, span");
            for (const el of buttons) {
                if (el.textContent?.trim() === text) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        return {x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2)};
                    }
                }
            }
            return null;
        }""",
            button_text,
        )
        if result:
            page.mouse.click(result["x"], result["y"])
            return True
        time.sleep(1.5)
    return False


def dismiss(page):
    for text in ["Not Now", "Not now", "OK", "Turn On", "Cancel"]:
        try:
            btn = page.locator(f'button:has-text("{text}")')
            if btn.count() > 0:
                btn.first.click()
                time.sleep(1)
        except Exception:
            pass


def post_image(page, image_path, caption):
    """Post a single static image."""
    page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=60000)
    time.sleep(4)
    dismiss(page)

    # Create
    create = page.locator('svg[aria-label="New post"]').locator("..")
    if create.count() == 0:
        create = page.locator('svg[aria-label="Create"]').locator("..")
    create.first.click()
    time.sleep(2)

    # Post submenu
    try:
        po = page.locator('span:text-is("Post")')
        if po.count() > 0:
            po.first.click()
            time.sleep(3)
    except Exception:
        pass

    dismiss(page)
    time.sleep(2)

    # Upload
    fi = page.locator('input[type="file"]')
    for _ in range(5):
        if fi.count() > 0:
            break
        time.sleep(2)
        fi = page.locator('input[type="file"]')

    fi.first.set_input_files(image_path)
    print(f"  Uploaded: {Path(image_path).name}")
    time.sleep(5)

    dismiss(page)
    time.sleep(2)

    # Crop -> Next
    find_and_click(page, "Next")
    print("  Next (crop)")
    time.sleep(3)

    dismiss(page)

    # Filter -> Next
    find_and_click(page, "Next")
    print("  Next (filter)")
    time.sleep(3)

    # Caption
    textbox = page.locator('div[role="textbox"]')
    if textbox.count() > 0:
        textbox.first.click()
        time.sleep(0.5)
        page.keyboard.insert_text(caption)
        print("  Caption inserted")
        time.sleep(1)

    # Share
    find_and_click(page, "Share")
    print("  Share clicked")

    # Wait for confirmation
    for i in range(40):
        time.sleep(5)
        try:
            dt = page.evaluate(
                """() => {
                const d = document.querySelector("div[role='dialog']");
                return d ? d.textContent.substring(0, 200) : "none";
            }"""
            )
            if "shared" in dt.lower() or "your" in dt.lower():
                print("  CONFIRMED!")
                return True
            if dt == "none":
                print("  Dialog closed - shared")
                return True
        except Exception:
            pass
        if i % 6 == 0:
            print(f"  processing [{i*5}s]")

    print("  TIMEOUT - check manually")
    return False


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=0, help="Start from post N (0-indexed)")
    parser.add_argument("--count", type=int, default=len(POSTS), help="Number of posts")
    parser.add_argument("--no-delay", action="store_true", help="Skip delay between posts")
    args = parser.parse_args()

    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            BROWSER_PROFILE,
            headless=False,
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            locale="en-US",
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        posts_to_do = POSTS[args.start:args.start + args.count]
        total = len(posts_to_do)

        print(f"\nPosting {total} static images to @tripleoggloves\n")

        for i, post in enumerate(posts_to_do):
            print(f"--- Post {i+1}/{total}: {Path(post['image']).name} ---")
            ok = post_image(page, post["image"], post["caption"])

            if ok and i < total - 1 and not args.no_delay:
                mins = DELAY_BETWEEN_POSTS // 60
                print(f"\n  Waiting {mins} minutes before next post...")
                time.sleep(DELAY_BETWEEN_POSTS)

        print(f"\nDone! Posted {total} images.")
        ctx.close()


if __name__ == "__main__":
    main()
