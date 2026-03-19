#!/usr/bin/env python3
"""
Triple OG Gloves — Daily Autopilot

Runs the full daily Instagram routine on a schedule:
  - Posts static images 70 min apart
  - Runs engagement (follow 5, like 15, comment 18) every 5 hours
  - Logs everything

Usage:
  python scripts/daily-autopilot.py                    # Run full day
  python scripts/daily-autopilot.py --posts-only       # Only post images
  python scripts/daily-autopilot.py --engage-only      # Only run engagement
  python scripts/daily-autopilot.py --once             # One engagement cycle only
"""

import sys
import time
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

BASE = Path(__file__).resolve().parent.parent
ENGAGE_SCRIPT = str(BASE / "scripts" / "ig-engage.py")
POST_SCRIPT = str(BASE / "scripts" / "post-static-batch.py")

POST_DELAY_MIN = 70
ENGAGE_INTERVAL_HOURS = 5


def run_engagement():
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"\n[{ts}] Running engagement cycle (follow 5, like 15, comment 18)...")
    result = subprocess.run(
        [sys.executable, ENGAGE_SCRIPT, "--follow", "5", "--like", "15", "--comment", "18"],
        capture_output=False,
        timeout=1800,
        cwd=str(BASE),
    )
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Engagement done (rc={result.returncode})")


def run_post(start_index):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"\n[{ts}] Posting image #{start_index + 1}...")
    result = subprocess.run(
        [sys.executable, POST_SCRIPT, "--count", "1", "--start", str(start_index), "--no-delay"],
        capture_output=False,
        timeout=300,
        cwd=str(BASE),
    )
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Post done (rc={result.returncode})")


def main():
    parser = argparse.ArgumentParser(description="Daily Autopilot")
    parser.add_argument("--posts-only", action="store_true")
    parser.add_argument("--engage-only", action="store_true")
    parser.add_argument("--once", action="store_true", help="Run one engagement cycle and exit")
    parser.add_argument("--start-post", type=int, default=0, help="Start from post index")
    parser.add_argument("--max-posts", type=int, default=5, help="Max posts today")
    args = parser.parse_args()

    if args.once:
        run_engagement()
        return

    print(f"\n{'='*50}")
    print(f"TRIPLE OG GLOVES - DAILY AUTOPILOT")
    print(f"{'='*50}")
    print(f"  Posts: {args.max_posts} (70 min apart)")
    print(f"  Engagement: every {ENGAGE_INTERVAL_HOURS} hours")
    print(f"  Starting post index: {args.start_post}")
    print(f"{'='*50}\n")

    posts_done = 0
    last_engage = 0  # seconds since last engagement
    post_index = args.start_post

    # Run engagement first
    if not args.posts_only:
        run_engagement()
        last_engage = 0

    while posts_done < args.max_posts:
        # Post
        if not args.engage_only:
            run_post(post_index)
            posts_done += 1
            post_index += 1

            if posts_done < args.max_posts:
                print(f"\n  Waiting {POST_DELAY_MIN} minutes before next post...")
                for minute in range(POST_DELAY_MIN):
                    time.sleep(60)
                    last_engage += 60

                    # Check if it's time for engagement
                    if not args.posts_only and last_engage >= ENGAGE_INTERVAL_HOURS * 3600:
                        run_engagement()
                        last_engage = 0

                    if (minute + 1) % 10 == 0:
                        print(f"    {minute + 1}/{POST_DELAY_MIN} min...")
        else:
            # Engage only mode — run once and exit
            break

    # Final engagement if we haven't done one recently
    if not args.posts_only and last_engage > 3600:
        run_engagement()

    print(f"\n{'='*50}")
    print(f"AUTOPILOT COMPLETE")
    print(f"  Posts: {posts_done}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
