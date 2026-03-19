#!/usr/bin/env python3
"""
Triple OG Gloves — Instagram Engagement Bot

Daily automation:
  - Follow accounts with hemp/cannabis in name
  - Like posts from followed accounts
  - Comment on cannabis plant pictures
  - Post static images

Usage:
  python scripts/ig-engage.py --follow 5        # Follow 5 cannabis accounts
  python scripts/ig-engage.py --like 15          # Like 15 posts from feed
  python scripts/ig-engage.py --comment 18       # Comment on 18 cannabis posts
  python scripts/ig-engage.py --post <image>     # Post a static image with caption
  python scripts/ig-engage.py --daily            # Run full daily routine
"""

import sys
import time
import json
import random
import argparse
from pathlib import Path
from datetime import datetime

BROWSER_PROFILE = str(Path.home() / ".ig_tripleog_browser")
LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
ENGAGE_LOG = LOG_DIR / "engagement.jsonl"

VIEWPORT = {"width": 1280, "height": 900}
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

# Cannabis-related search terms for discovery
SEARCH_TERMS = [
    "cannabis", "hemp", "trimming", "growroom", "cannabiscultivation",
    "trimlife", "indoorgrow", "cannabisharvest", "commercialgrow",
    "trimcrew", "cannabisgrower", "weedfarm",
]

# Comment templates — authentic, varied, never spammy
FIRE_COMMENTS = [
    "that frost is insane 🔥",
    "trichome city 👀",
    "now THAT is quality flower",
    "absolute gas ⛽",
    "that's what top shelf looks like",
    "frosty 🥶🔥",
    "those genetics are fire",
    "dense and frosty, exactly how it should be",
    "the terps must be crazy on those",
    "beautiful canopy 💪",
    "that trim job is clean af",
    "whoever grew this knows what they're doing",
    "premium quality right there",
    "that crystal coverage though",
    "looking like it's ready for the jar",
    "proper flower, respect",
    "the colors on those colas 🔥",
    "that's some serious frost",
    "dialed in perfectly",
    "those pistils tell you everything you need to know",
    "that bud structure is crazy dense",
    "quality demands quality 🧤",
    "real recognize real 💯",
    "this is why people love this plant",
    "the resin on that must be insane",
    "trim crew goals right there",
    "that's how you do it, no shortcuts",
    "everything about this is clean",
]


def log_action(action_type, details):
    entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action_type,
        **details,
    }
    with open(ENGAGE_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def dismiss_popups(page):
    for text in ["Not Now", "Not now", "OK", "Turn On", "Cancel"]:
        try:
            btn = page.locator(f'button:has-text("{text}")')
            if btn.count() > 0:
                btn.first.click()
                time.sleep(1)
        except Exception:
            pass


def check_login(page):
    create = page.locator('svg[aria-label="New post"]')
    if create.count() == 0:
        create = page.locator('svg[aria-label="Create"]')
    return create.count() > 0


def follow_cannabis_accounts(page, count=5):
    """Search for and follow accounts with cannabis/hemp in the name."""
    print(f"\n--- FOLLOW {count} cannabis/hemp accounts ---")
    followed = 0
    terms = random.sample(SEARCH_TERMS, min(len(SEARCH_TERMS), count + 2))

    for term in terms:
        if followed >= count:
            break

        print(f"  Searching: {term}")
        page.goto(f"https://www.instagram.com/explore/tags/{term}/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(4)
        dismiss_popups(page)

        # Find post links on the explore page
        links = page.locator('a[href*="/p/"]')
        link_count = min(links.count(), 5)

        for i in range(link_count):
            if followed >= count:
                break
            try:
                links.nth(i).click()
                time.sleep(3)

                # Find the username in the post dialog
                username_el = page.locator('div[role="dialog"] a[href*="/"]').first
                if username_el.count() == 0:
                    page.keyboard.press("Escape")
                    time.sleep(1)
                    continue

                username = username_el.get_attribute("href").strip("/").split("/")[0]

                # Check if there's a Follow button
                follow_btn = page.locator('div[role="dialog"] button:has-text("Follow")')
                if follow_btn.count() > 0 and follow_btn.first.text_content().strip() == "Follow":
                    follow_btn.first.click()
                    time.sleep(2)
                    print(f"  + Followed @{username}")
                    log_action("follow", {"username": username, "source": term})
                    followed += 1
                    time.sleep(random.uniform(3, 6))
                else:
                    print(f"  - Already following @{username}")

                page.keyboard.press("Escape")
                time.sleep(1)
            except Exception as e:
                print(f"  ! Error: {e}")
                try:
                    page.keyboard.press("Escape")
                except Exception:
                    pass
                time.sleep(2)

        time.sleep(random.uniform(2, 4))

    print(f"  Done: followed {followed}/{count}")
    return followed


def like_feed_posts(page, count=15):
    """Like posts from the home feed."""
    print(f"\n--- LIKE {count} posts from feed ---")
    liked = 0

    page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    dismiss_popups(page)

    for scroll_round in range(count * 2):
        if liked >= count:
            break

        try:
            # Find unliked heart buttons
            like_btns = page.locator('svg[aria-label="Like"]')
            btn_count = like_btns.count()

            for i in range(btn_count):
                if liked >= count:
                    break
                try:
                    btn = like_btns.nth(i)
                    # Click the parent (the actual button)
                    parent = btn.locator("..")
                    parent.click()
                    liked += 1
                    print(f"  + Liked post ({liked}/{count})")
                    log_action("like", {"source": "feed", "index": liked})
                    time.sleep(random.uniform(2, 5))
                except Exception:
                    pass

            # Scroll down to load more
            page.evaluate("window.scrollBy(0, 800)")
            time.sleep(random.uniform(2, 4))

        except Exception as e:
            print(f"  ! Error: {e}")
            time.sleep(2)

    print(f"  Done: liked {liked}/{count}")
    return liked


def comment_on_cannabis_posts(page, count=18):
    """Find cannabis plant posts and leave fire comments.

    Collects post URLs from explore tags, then navigates directly to each
    post page (avoids overlay click-blocking issues).
    """
    print(f"\n--- COMMENT on {count} cannabis posts ---")
    commented = 0
    used_comments = set()
    terms = random.sample(SEARCH_TERMS, min(len(SEARCH_TERMS), 8))

    # First collect post URLs from multiple tags
    post_urls = []
    for term in terms:
        if len(post_urls) >= count * 2:
            break
        try:
            print(f"  Collecting posts from #{term}...")
            page.goto(f"https://www.instagram.com/explore/tags/{term}/", wait_until="domcontentloaded", timeout=30000)
            time.sleep(4)
            dismiss_popups(page)

            links = page.locator('a[href*="/p/"]')
            for i in range(min(links.count(), 6)):
                href = links.nth(i).get_attribute("href")
                if href and href not in post_urls:
                    post_urls.append(href)
            time.sleep(random.uniform(1, 3))
        except Exception as e:
            print(f"  ! Error collecting from #{term}: {e}")

    random.shuffle(post_urls)
    print(f"  Collected {len(post_urls)} post URLs")

    # Now visit each post directly and comment
    for post_url in post_urls:
        if commented >= count:
            break
        try:
            full_url = f"https://www.instagram.com{post_url}" if post_url.startswith("/") else post_url
            page.goto(full_url, wait_until="domcontentloaded", timeout=20000)
            time.sleep(3)
            dismiss_popups(page)

            # Pick a comment
            available = [c for c in FIRE_COMMENTS if c not in used_comments]
            if not available:
                used_comments.clear()
                available = FIRE_COMMENTS
            comment = random.choice(available)
            used_comments.add(comment)

            # Find comment input — try multiple selectors
            comment_input = page.locator('textarea[aria-label="Add a comment\u2026"]')
            if comment_input.count() == 0:
                comment_input = page.locator('textarea[placeholder="Add a comment\u2026"]')
            if comment_input.count() == 0:
                comment_input = page.locator('textarea')
            if comment_input.count() == 0:
                # Some posts have a "comment" icon that needs clicking first
                comment_icon = page.locator('svg[aria-label="Comment"]')
                if comment_icon.count() > 0:
                    comment_icon.first.locator("..").click()
                    time.sleep(2)
                    comment_input = page.locator('textarea')

            if comment_input.count() > 0:
                comment_input.first.click()
                time.sleep(0.5)
                page.keyboard.type(comment, delay=25)
                time.sleep(0.5)

                # Submit — try Post button first, then Enter
                post_btn = page.locator('button:has-text("Post")')
                if post_btn.count() > 0:
                    post_btn.first.click()
                else:
                    page.keyboard.press("Enter")

                time.sleep(2)
                commented += 1
                print(f"  + Commented ({commented}/{count}): \"{comment}\"")
                log_action("comment", {"comment": comment, "post": post_url})
                time.sleep(random.uniform(10, 18))
            else:
                print(f"  - No comment box on {post_url}")
                time.sleep(1)

        except Exception as e:
            err_msg = str(e)[:80]
            print(f"  ! Error on {post_url}: {err_msg}")
            time.sleep(3)

    print(f"  Done: commented {commented}/{count}")
    return commented


def main():
    parser = argparse.ArgumentParser(description="Triple OG Gloves — IG Engagement Bot")
    parser.add_argument("--follow", type=int, help="Follow N cannabis accounts")
    parser.add_argument("--like", type=int, help="Like N posts from feed")
    parser.add_argument("--comment", type=int, help="Comment on N cannabis posts")
    parser.add_argument("--daily", action="store_true", help="Run full daily routine")
    parser.add_argument("--headless", action="store_true", help="Run headless")
    args = parser.parse_args()

    if args.daily:
        args.follow = 5
        args.like = 15
        args.comment = 18

    if not any([args.follow, args.like, args.comment]):
        parser.print_help()
        return

    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            BROWSER_PROFILE,
            headless=args.headless,
            viewport=VIEWPORT,
            user_agent=USER_AGENT,
            locale="en-US",
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=60000)
        time.sleep(5)
        dismiss_popups(page)

        if not check_login(page):
            print("ERROR: Not logged in!")
            ctx.close()
            return

        print(f"\n{'='*50}")
        print(f"TRIPLE OG GLOVES — ENGAGEMENT BOT")
        print(f"{'='*50}")

        results = {}

        if args.follow:
            results["followed"] = follow_cannabis_accounts(page, args.follow)
            time.sleep(random.uniform(5, 10))

        if args.like:
            results["liked"] = like_feed_posts(page, args.like)
            time.sleep(random.uniform(5, 10))

        if args.comment:
            results["commented"] = comment_on_cannabis_posts(page, args.comment)

        print(f"\n{'='*50}")
        print(f"ENGAGEMENT COMPLETE")
        print(f"{'='*50}")
        for k, v in results.items():
            print(f"  {k}: {v}")
        print(f"{'='*50}\n")

        ctx.close()


if __name__ == "__main__":
    main()
