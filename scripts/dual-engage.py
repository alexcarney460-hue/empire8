#!/usr/bin/env python3
"""
Dual Engagement — Triple OG Gloves + OpenFans

Alternates engagement cycles between both accounts:
  - Triple OG: follow 5, like 15, comment 18 (cannabis niche)
  - OpenFans: comment on OF creator posts (15 comments)
  - 2.5 hours between each run (staggered)

Schedule:
  0h    Triple OG engagement
  2.5h  OpenFans engagement
  5h    Triple OG engagement
  7.5h  OpenFans engagement
  10h   Triple OG engagement
  ...

Usage:
  python scripts/dual-engage.py              # Run full staggered schedule
  python scripts/dual-engage.py --cycles 6   # Run 6 total cycles (3 each)
"""

import subprocess
import sys
import time
import argparse
from datetime import datetime
from pathlib import Path

TOG_SCRIPT = str(Path(__file__).resolve().parent / "ig-engage.py")
TOG_CWD = str(Path(__file__).resolve().parent.parent)

OF_COMMENT_SCRIPT = "C:/Users/Claud/.openclaw/workspace/openfans/scripts/ig-comment.py"
OF_CWD = "C:/Users/Claud/.openclaw/workspace/openfans"

STAGGER_SECONDS = int(2.5 * 3600)  # 2.5 hours between runs


def run_tripleog():
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"\n{'='*50}")
    print(f"[{ts}] TRIPLE OG GLOVES - Engagement")
    print(f"{'='*50}")
    try:
        subprocess.run(
            [sys.executable, TOG_SCRIPT, "--follow", "5", "--like", "15", "--comment", "18"],
            timeout=1800,
            cwd=TOG_CWD,
        )
    except Exception as e:
        print(f"  Triple OG error: {e}")
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Triple OG done")


def run_openfans():
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"\n{'='*50}")
    print(f"[{ts}] OPENFANS - Comment Outreach")
    print(f"{'='*50}")
    try:
        subprocess.run(
            [sys.executable, OF_COMMENT_SCRIPT],
            timeout=1800,
            cwd=OF_CWD,
        )
    except Exception as e:
        print(f"  OpenFans error: {e}")
    print(f"[{datetime.now().strftime('%H:%M:%S')}] OpenFans done")


def main():
    parser = argparse.ArgumentParser(description="Dual Engagement Scheduler")
    parser.add_argument("--cycles", type=int, default=8, help="Total cycles (alternating)")
    args = parser.parse_args()

    print(f"\n{'='*50}")
    print(f"DUAL ENGAGEMENT SCHEDULER")
    print(f"{'='*50}")
    print(f"  Total cycles: {args.cycles}")
    print(f"  Triple OG: {args.cycles // 2 + args.cycles % 2} runs")
    print(f"  OpenFans: {args.cycles // 2} runs")
    print(f"  Interval: 2.5 hours between runs")
    print(f"{'='*50}\n")

    for i in range(args.cycles):
        if i % 2 == 0:
            run_tripleog()
        else:
            run_openfans()

        if i < args.cycles - 1:
            next_time = datetime.now()
            hours = STAGGER_SECONDS / 3600
            print(f"\n  Next run in {hours} hours...")
            time.sleep(STAGGER_SECONDS)

    print(f"\n{'='*50}")
    print(f"ALL CYCLES COMPLETE")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
