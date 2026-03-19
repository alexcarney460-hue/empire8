#!/usr/bin/env python3
"""One-shot: post the Glove Up reel to @tripleoggloves."""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

BROWSER_PROFILE = "C:/Users/Claud/.ig_tripleog_browser"
VIDEO = str(Path(__file__).resolve().parent.parent / "tmp" / "reels" / "reel-gloveup-final.mp4")

CAPTION = (
    "first thing every morning. glove up.\n\n"
    "your hands touch everything \u2014 plants, soil, resin, scissors. "
    "trichomes don\u2019t lie. they stick to skin and never come back.\n\n"
    "5mil black nitrile. no powder. no latex. no rip.\n"
    "built for 16-hour trim shifts, not your dentist\u2019s office.\n\n"
    "Triple OG Gloves \u2014 Supplied for the Grow.\n"
    "valuesuppliers.co\n\n"
    "#cannabis #trimlife #nitrilegloves #cannabiscommunity "
    "#trimseason #growroom #trimcrew #harvestseason "
    "#cannabisindustry #growlife #cannabiscultivation "
    "#trimscene #weedlife #indoorgrow #commercialgrow "
    "#cannabisbusiness #tripleoggloves #suppliedforthegrow"
)


def find_and_click(page, button_text):
    for attempt in range(5):
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


def main():
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

        # Navigate
        page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=60000)
        time.sleep(5)
        dismiss(page)

        # Click Create
        create = page.locator('svg[aria-label="New post"]').locator("..")
        if create.count() == 0:
            create = page.locator('svg[aria-label="Create"]').locator("..")
        if create.count() == 0:
            print("ERROR: not logged in")
            ctx.close()
            return
        create.first.click()
        time.sleep(2)

        # Post submenu
        try:
            post_option = page.locator('span:text-is("Post")')
            if post_option.count() > 0:
                post_option.first.click()
                print("Clicked Post submenu")
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

        fi.first.set_input_files(VIDEO)
        print(f"Uploaded: {Path(VIDEO).name}")

        # Wait for video processing
        time.sleep(15)

        # Dismiss reels popup
        for text in ["OK", "Not Now"]:
            try:
                btn = page.locator(f'button:has-text("{text}")')
                if btn.count() > 0:
                    btn.first.click()
                    print(f"Dismissed: {text}")
                    time.sleep(2)
            except Exception:
                pass
        time.sleep(3)

        # CROP -> Next
        if find_and_click(page, "Next"):
            print("Next (crop)")
        else:
            print("WARNING: Next (crop) not found")
        time.sleep(4)

        # Dismiss again
        for text in ["OK", "Not Now"]:
            try:
                btn = page.locator(f'button:has-text("{text}")')
                if btn.count() > 0:
                    btn.first.click()
                    print(f"Dismissed: {text}")
                    time.sleep(2)
            except Exception:
                pass

        # FILTER -> Next
        if find_and_click(page, "Next"):
            print("Next (filter)")
        else:
            print("WARNING: Next (filter) not found")
        time.sleep(4)

        # CAPTION
        textbox = page.locator('div[role="textbox"]')
        if textbox.count() > 0:
            textbox.first.click()
            time.sleep(0.5)
            page.keyboard.insert_text(CAPTION)
            print("Caption inserted")
            time.sleep(1)
        else:
            print("WARNING: No textbox found")

        # SHARE
        if find_and_click(page, "Share"):
            print("Share clicked!")
        else:
            print("ERROR: Share not found")
            page.screenshot(path="debug-share-fail.png")
            ctx.close()
            return

        # Wait for processing
        print("Waiting for IG to process...")
        shared = False
        for i in range(60):
            time.sleep(5)
            try:
                dialog_text = page.evaluate(
                    """() => {
                    const d = document.querySelector("div[role='dialog']");
                    return d ? d.textContent.substring(0, 200) : "none";
                }"""
                )
                if "shared" in dialog_text.lower() or "your reel" in dialog_text.lower():
                    print("CONFIRMED: Reel shared!")
                    shared = True
                    break
                if dialog_text == "none":
                    print("Dialog closed - likely shared")
                    shared = True
                    break
            except Exception:
                pass
            if i % 6 == 0:
                print(f"  processing... [{i * 5}s]")

        if shared:
            print("SUCCESS - Glove Up reel is live!")
        else:
            print("TIMEOUT - check @tripleoggloves manually")

        page.screenshot(path="debug-post-result.png")
        ctx.close()


if __name__ == "__main__":
    main()
