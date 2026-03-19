#!/usr/bin/env python3
"""
Triple OG Gloves — Reel Production & Posting Pipeline

Full workflow per reel:
  1. CrowdTest — focus group the reel concept with 50 synthetic personas
  2. Review — only proceed if CrowdTest passes threshold
  3. Produce — generate AI images + FFmpeg render
  4. Post — upload to Instagram via Playwright

Usage:
  py scripts/reel-pipeline.py                    # full pipeline: crowdtest + produce + post
  py scripts/reel-pipeline.py --no-post          # crowdtest + produce only, don't post
  py scripts/reel-pipeline.py --no-crowdtest     # skip crowdtest, straight to produce
  py scripts/reel-pipeline.py --crowdtest-only   # ONLY run crowdtest, don't produce
  py scripts/reel-pipeline.py --start 3          # start from reel 3
  py scripts/reel-pipeline.py --only 5           # process only reel 5
  py scripts/reel-pipeline.py --preview          # produce reel 1 and open it
  py scripts/reel-pipeline.py --threshold 0.3    # min avg_sentiment to proceed (default 0.2)
"""

import sys
import os
import time
import json
import argparse
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents import producer, publisher
from agents.crowdtest import run_crowdtest

RATE_LIMIT_SECONDS = 70 * 60  # 70 minutes between posts
DEFAULT_CROWDTEST_THRESHOLD = 0.2  # minimum avg_sentiment to proceed with production
LOG_FILE = Path(__file__).resolve().parent.parent / "logs" / "reel-pipeline.jsonl"
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)


# =============================================================================
# 10 REEL DEFINITIONS — Scene-by-scene with AI image prompts
# Inspired by @theharvestcompany: real trim work, product in action, culture
# =============================================================================

REELS = [
    # -- REEL 1: The Night Shift -------------------------------------------------
    {
        "title": "The Night Shift",
        "caption": (
            "trim never sleeps.\n\n"
            "when harvest hits, your crew runs 16-hour days. "
            "your gloves better keep up.\n\n"
            "Triple OG Gloves. built for the marathon, not the sprint.\n\n"
            "valuesuppliers.co | link in bio\n\n"
            "#cannabis #trimming #harvest #growlife #cannabiscommunity "
            "#tripleoggloves #nitrilegloves #trimseason #cannabisindustry"
        ),
        "scenes": [
            {
                "visual_description": "Professional cannabis trim room at night, bright overhead LED panel lighting on long stainless steel tables. Multiple workers in black nitrile gloves trimming dense frosty cannabis buds with curved shears. Amber resin on glove fingertips. Organized workstations with trimming trays. Clean white walls, sealed epoxy floor.",
                "visual_mood": "late night production shift, bright clinical lighting, licensed facility",
                "duration": 3.5,
                "color_mood": "clean_white",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Extreme close-up of hands in black nitrile gloves trimming a dense cannabis bud with curved trimming shears. Amber resin coating the glove fingertips. Trichome crystals glistening on deep green and purple calyxes. Orange pistil hairs curling inward. Sugar leaf being snipped flush with bud surface.",
                "visual_mood": "photorealistic macro detail, bright neutral white task lighting, shallow depth of field",
                "duration": 3.0,
                "color_mood": "harvest_gold",
                "zoom_speed": 0.001,
            },
            {
                "visual_description": "Wide cinematic shot of a licensed commercial trim room. Long stainless steel tables in rows, 6-8 trimmer stations each with organized trays and bins. Turkey bags of untrimmed bud on one side, finished trimmed product on the other. Bright LED panels overhead, clean white walls, sealed concrete floor. Clinical laboratory atmosphere.",
                "visual_mood": "wide establishing shot, licensed commercial facility, industrial scale",
                "duration": 3.0,
                "color_mood": "clean_white",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "Black nitrile gloved hands holding a perfectly trimmed premium cannabis nug up to bright task lighting. Dense compact nugget with deep green and purple calyxes, heavy intact trichome crystal frost like powdered sugar, dark rust-orange pistil hairs. Dramatic backlight catching trichome sparkle with soft halo. Clean trim room background blurred.",
                "visual_mood": "hero product moment, top-shelf bud reveal, dramatic backlight on trichomes",
                "duration": 3.0,
                "color_mood": "harvest_gold",
                "zoom_speed": 0.0007,
            },
        ],
    },

    # -- REEL 2: Glove Up --------------------------------------------------------
    {
        "title": "Glove Up",
        "caption": (
            "first thing every morning. glove up.\n\n"
            "you wouldn't touch your plants bare-handed. "
            "trichomes don't lie — they stick to everything.\n\n"
            "5mil nitrile. no powder. no latex. no compromise.\n\n"
            "valuesuppliers.co | link in bio\n\n"
            "#glovesup #cannabis #trimlife #nitrilegloves #growroom "
            "#tripleoggloves #cannabiscultivation #harvestseason"
        ),
        "scenes": [
            {
                "visual_description": "Bright commercial cannabis facility entrance, sealed epoxy floor, white walls. A hand reaches for a matte black box of nitrile gloves on an organized stainless steel supply shelf near the door. Clean industrial environment like a food-processing plant.",
                "visual_mood": "morning ritual in a licensed facility, bright neutral LED overhead lighting, clinical clean",
                "duration": 3.0,
                "color_mood": "clean_white",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Extreme close-up of hands snapping on premium black nitrile gloves, matte finish, form-fitting, thin enough to show finger contour and knuckle detail. The stretch and snap of 5mil nitrile material. Clean white background.",
                "visual_mood": "slow motion ASMR detail, satisfying tactile snap, clinical precision",
                "duration": 2.5,
                "color_mood": "clean_white",
                "zoom_speed": 0.001,
            },
            {
                "visual_description": "Black nitrile gloved hands gently inspecting a dense flowering cannabis cola in a professional indoor grow room. The bud has tight stacked calyxes covered in glandular trichome frost like powdered sugar, with amber-orange pistil hairs curling inward. Full-spectrum LED bar lights overhead emit bright white light with subtle pink hue. Uniform canopy of frosty colas pushed through white SCROG trellis netting visible in background. Mylar-lined white walls.",
                "visual_mood": "careful quality inspection, bright licensed facility, premium top-shelf cannabis",
                "duration": 3.0,
                "color_mood": "grow_light",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Clean industrial supply room with stainless steel shelving. Cases of black nitrile glove boxes neatly stacked and labeled. Sealed concrete floor, overhead LED panels, organized inventory. The supply chain behind a licensed commercial cannabis operation.",
                "visual_mood": "organized industrial warehouse, professional inventory, clean bright lighting",
                "duration": 2.5,
                "color_mood": "clean_white",
                "zoom_speed": 0.0005,
            },
        ],
    },

    # -- REEL 3: Case Day --------------------------------------------------------
    {
        "title": "Case Day",
        "caption": (
            "case day hits different when you know you're set for the season.\n\n"
            "1 case = 10 boxes = 1,000 gloves.\n"
            "that's a LOT of trim sessions.\n\n"
            "bulk pricing at valuesuppliers.co\n\n"
            "#bulkorder #cannabissupply #trimroom #gloves #growop "
            "#tripleoggloves #wholesale #cannabisbusiness"
        ),
        "scenes": [
            {
                "visual_description": "A delivery truck backing up to a cannabis facility loading dock. Cases being unloaded. The excitement of fresh supply arriving.",
                "visual_mood": "delivery day energy, industrial loading dock, morning light",
                "duration": 3.0,
                "color_mood": "clean_white",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Close-up of cases of nitrile gloves being stacked on a shelf in a supply room. Each case clearly labeled. Organized, professional storage.",
                "visual_mood": "organized supply, warehouse shelving, clean labels",
                "duration": 2.5,
                "color_mood": "dark_warehouse",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "Hands opening a fresh case, pulling out boxes of gloves. The satisfying reveal of a full case. Product unboxing moment.",
                "visual_mood": "unboxing satisfaction, product reveal, clean packaging",
                "duration": 3.0,
                "color_mood": "warm_amber",
                "zoom_speed": 0.001,
            },
            {
                "visual_description": "Wide shot of a fully stocked supply shelf in a grow operation — gloves, scissors, turkey bags, everything a trim team needs. Ready for harvest.",
                "visual_mood": "fully stocked, ready for war, professional prep",
                "duration": 3.0,
                "color_mood": "forest_green",
                "zoom_speed": 0.0005,
            },
        ],
    },

    # -- REEL 4: Trichome Check ---------------------------------------------------
    {
        "title": "Trichome Check",
        "caption": (
            "checking trichomes with bare hands?\n"
            "that's how you lose terps before they ever hit the jar.\n\n"
            "protect the product. protect the profit.\n\n"
            "Triple OG Gloves — because every trichome counts.\n\n"
            "valuesuppliers.co\n\n"
            "#trichomes #cannabis #terps #qualitycontrol #trimming "
            "#tripleoggloves #cannabisquality #harvest"
        ),
        "scenes": [
            {
                "visual_description": "Extreme macro close-up of cannabis trichomes on a dense bud surface. Field of mushroom-shaped glandular trichomes with milky-white and amber bulbous heads on clear stalks. Crystalline structures catching bright LED light. Swollen calyxes beneath covered in frost like powdered sugar.",
                "visual_mood": "photorealistic botanical macro, crystalline trichome detail, bright neutral lighting",
                "duration": 3.5,
                "color_mood": "clean_white",
                "zoom_speed": 0.0009,
            },
            {
                "visual_description": "Black nitrile gloved hands holding a chrome jeweler's loupe pressed close to a dense frosty cannabis cola, inspecting trichome development. Milky-white trichome heads visible. Bright overhead LED panel lighting in a clean licensed facility. Quality control inspection moment.",
                "visual_mood": "precision quality inspection, scientific examination, licensed facility",
                "duration": 3.0,
                "color_mood": "clean_white",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Close-up of black nitrile gloved fingertips coated in translucent amber-gold resin after handling cannabis buds. The sticky finger hash buildup glistening under task lighting. A dense trichome-covered bud held between thumb and forefinger. The resin proves the bud quality.",
                "visual_mood": "amber resin evidence, sticky trichome transfer, proof of potency",
                "duration": 3.0,
                "color_mood": "harvest_gold",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "Glass mason jar being sealed, filled with perfectly trimmed premium cannabis nugs. Dense compact nuggets with deep green and purple calyxes, heavy trichome frost, tight manicured trim. Dark matte background, studio lighting catching crystal sparkle through the glass.",
                "visual_mood": "final premium product, top-shelf presentation, satisfying completion",
                "duration": 2.5,
                "color_mood": "warm_amber",
                "zoom_speed": 0.0006,
            },
        ],
    },

    # -- REEL 5: The Crew ---------------------------------------------------------
    {
        "title": "The Crew",
        "caption": (
            "a trim crew is only as good as their setup.\n\n"
            "sharp scissors. good music. and gloves that don't rip "
            "halfway through the first pound.\n\n"
            "Triple OG keeps the whole crew moving.\n\n"
            "valuesuppliers.co | bulk pricing for operations\n\n"
            "#trimcrew #cannabis #teamwork #harvest #growlife "
            "#tripleoggloves #cannabiswork #trimseason"
        ),
        "scenes": [
            {
                "visual_description": "Multiple pairs of gloved hands working around a trim table — scissors moving, buds being processed. Teamwork, rhythm, production line energy.",
                "visual_mood": "team energy, production rhythm, multiple workers in sync",
                "duration": 3.0,
                "color_mood": "warm_amber",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Close-up of trim scissors cutting a fan leaf with precision. Gloved hand steadying the bud. The craft of trimming.",
                "visual_mood": "precision craft, close detail, skilled hands at work",
                "duration": 2.5,
                "color_mood": "harvest_gold",
                "zoom_speed": 0.001,
            },
            {
                "visual_description": "A trim tray full of finished buds — perfectly manicured, consistent quality. The result of good tools and good gloves.",
                "visual_mood": "finished product display, pride in work, clean presentation",
                "duration": 3.0,
                "color_mood": "forest_green",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Overhead shot of the trim table — organized stations, each with their own glove box, scissors, and tray. A well-run operation.",
                "visual_mood": "overhead organization, professional setup, birds eye view",
                "duration": 3.0,
                "color_mood": "clean_white",
                "zoom_speed": 0.0005,
            },
        ],
    },

    # -- REEL 6: No Rip ----------------------------------------------------------
    {
        "title": "No Rip",
        "caption": (
            "cheap gloves rip. period.\n\n"
            "halfway through a trim session, you're fishing latex shreds "
            "out of your flower. not a vibe.\n\n"
            "5mil nitrile. built to last the whole shift.\n\n"
            "valuesuppliers.co\n\n"
            "#nitrile #quality #trimming #cannabis #nolatexa "
            "#tripleoggloves #professionalgrade #cannabissupply"
        ),
        "scenes": [
            {
                "visual_description": "Close-up of a thin cheap blue latex glove ripping at the fingertip while handling a sticky cannabis bud. Torn glove fragment on the bud. Frustration moment in a bright trim room. Clinical overhead lighting.",
                "visual_mood": "the problem moment, cheap glove failure, bright clinical lighting",
                "duration": 2.5,
                "color_mood": "clean_white",
                "zoom_speed": 0.0009,
            },
            {
                "visual_description": "Side-by-side comparison: thin cheap blue glove vs thick premium black 5mil nitrile glove being stretched by two hands. The black nitrile is visibly thicker and more durable. Clean white background, studio lighting.",
                "visual_mood": "quality comparison, stretch test, clear visual difference",
                "duration": 3.0,
                "color_mood": "clean_white",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Hands in premium black nitrile gloves aggressively trimming dense trichome-covered cannabis buds with curved shears. Fast confident precise snips. Amber resin building up on glove fingertips. Not a single tear. Bright LED task lighting in a licensed trim facility.",
                "visual_mood": "durability in action, fast professional trim work, gloves performing",
                "duration": 3.0,
                "color_mood": "harvest_gold",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "End of shift: same pair of black nitrile gloves being peeled off hands. The gloves are coated in thick amber-gold resin but completely intact, no tears. The finger hash buildup proves hours of work. Satisfying peel-off moment. Clean trim room background.",
                "visual_mood": "end of shift proof, ASMR glove removal, resin-coated but unbroken",
                "duration": 2.5,
                "color_mood": "warm_amber",
                "zoom_speed": 0.0006,
            },
        ],
    },

    # -- REEL 7: Grow Room Walk ---------------------------------------------------
    {
        "title": "Grow Room Walk",
        "caption": (
            "walk through any serious grow and you'll see the same thing.\n\n"
            "rows of plants. walls of light. and a box of nitrile at every station.\n\n"
            "if you're running an operation, you need supply you can count on.\n\n"
            "valuesuppliers.co | wholesale + distribution available\n\n"
            "#growroom #cannabis #indoor #cultivation #led "
            "#tripleoggloves #cannabisfacility #commercialgrow"
        ),
        "scenes": [
            {
                "visual_description": "Cinematic POV walkthrough entering a professional indoor cannabis grow facility. Rows of flowering plants with uniform dense canopy of frosty colas pushed through white SCROG trellis nets. Full-spectrum LED bar lights overhead emitting bright white light with subtle pink hue. Mylar-lined white walls, clean sealed epoxy floor, irrigation lines visible. Rows extending into depth with vanishing point perspective.",
                "visual_mood": "entering a licensed commercial facility, bright LED white-pink glow, impressive scale",
                "duration": 3.5,
                "color_mood": "grow_light",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "Black nitrile gloved hands gently inspecting a flowering cannabis cola under full-spectrum LED lighting. Dense trichome-covered bud with deep green calyxes and amber-orange pistils. Checking trichome development with careful precision. Uniform canopy of plants in background.",
                "visual_mood": "quality inspection in licensed grow room, bright LED lighting, professional cultivation",
                "duration": 3.0,
                "color_mood": "grow_light",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "Organized supply station on stainless steel shelf at grow room entrance. Black nitrile glove boxes, spray bottles, pH meters, trimming shears, all neatly arranged. Clean white wall behind. Bright overhead LED lighting. Ready for whoever walks in.",
                "visual_mood": "organized supply station, industrial precision, licensed facility",
                "duration": 2.5,
                "color_mood": "clean_white",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Wide cinematic shot of a massive licensed flowering room. Hundreds of cannabis plants in uniform rows, dense frosty canopy at equal height. LED bar lights in parallel rows overhead creating vanishing point. Mylar walls reflecting light. Clean sealed floor. The scale of a serious commercial cannabis operation.",
                "visual_mood": "massive commercial scale, impressive canopy sea, industrial agriculture",
                "duration": 3.0,
                "color_mood": "grow_light",
                "zoom_speed": 0.0004,
            },
        ],
    },

    # -- REEL 8: Harvest Day ------------------------------------------------------
    {
        "title": "Harvest Day",
        "caption": (
            "harvest day. months of work come down to this.\n\n"
            "you planned. you fed. you watched. you waited.\n"
            "now it's time to cut.\n\n"
            "don't fumble the bag with cheap supplies.\n\n"
            "valuesuppliers.co | stocked and ready\n\n"
            "#harvest #cannabis #chopday #trimming #grower "
            "#tripleoggloves #harvestday #cannabisharvest"
        ),
        "scenes": [
            {
                "visual_description": "Massive mature cannabis cola 8-14 inches long, dense stacked calyxes covered in heavy trichome frost, deep green and dark purple colors, burnt orange pistil hairs curling inward. The plant is in a licensed indoor grow room under full-spectrum LED bar lights. Ready for harvest. Dramatic side lighting catching crystal trichome sparkle.",
                "visual_mood": "the payoff, top-shelf mature cola, dramatic trichome sparkle",
                "duration": 3.0,
                "color_mood": "harvest_gold",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Black nitrile gloved hands using large harvesting shears to cut a main cannabis cola from the plant. The decisive clean cut through the thick woody stem. Dense frosty bud separating from the plant. Bright licensed grow facility, LED lights overhead, clean white walls.",
                "visual_mood": "the harvest cut, decisive professional action, licensed facility",
                "duration": 3.0,
                "color_mood": "warm_amber",
                "zoom_speed": 0.0009,
            },
            {
                "visual_description": "Fresh-cut cannabis branches hanging upside down on drying lines in a climate-controlled dark room. Rows of dense colas drying at 60F 60% humidity. Industrial dehumidifiers visible. Organized, clean, temperature-controlled curing environment.",
                "visual_mood": "professional drying room, organized climate control, next phase",
                "duration": 2.5,
                "color_mood": "dark_warehouse",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Stainless steel trim table being set up in a clean licensed facility. Fresh boxes of black nitrile gloves opened, curved trimming shears laid out in rows, stainless steel trays positioned at each station. Bright overhead LED panels. Prepping for the trim operation ahead. Clinical precision.",
                "visual_mood": "battle prep, licensed facility setup, industrial organization",
                "duration": 3.0,
                "color_mood": "clean_white",
                "zoom_speed": 0.0008,
            },
        ],
    },

    # -- REEL 9: From Seed to Sale ------------------------------------------------
    {
        "title": "From Seed to Sale",
        "caption": (
            "from seed to sale, gloves touch every step.\n\n"
            "planting. transplanting. defoliating. harvesting. trimming. packaging.\n\n"
            "one supply that runs through the entire operation.\n\n"
            "Triple OG Gloves — from seed to sale.\n\n"
            "valuesuppliers.co\n\n"
            "#seedtosale #cannabis #fullcycle #cultivation #processing "
            "#tripleoggloves #cannabislife #growerlife"
        ),
        "scenes": [
            {
                "visual_description": "Gloved hands gently placing a cannabis seedling into a pot. The beginning of the journey. Small, delicate, full of potential.",
                "visual_mood": "new beginnings, gentle care, nurturing start",
                "duration": 2.5,
                "color_mood": "grow_light",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "Gloved hands defoliating a vegetative cannabis plant — removing fan leaves for better light penetration. Mid-cycle maintenance.",
                "visual_mood": "active cultivation, mid-growth, skilled pruning",
                "duration": 2.5,
                "color_mood": "forest_green",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Gloved hands trimming a harvested cannabis bud with precision scissors. The detailed trim work. Resin visible on glove fingertips.",
                "visual_mood": "harvest trim, precision work, the craft",
                "duration": 3.0,
                "color_mood": "harvest_gold",
                "zoom_speed": 0.0009,
            },
            {
                "visual_description": "Gloved hands placing finished, packaged cannabis into a display case or shipping box. The final step — ready for sale. Professional packaging.",
                "visual_mood": "final product, packaged and ready, completion",
                "duration": 2.5,
                "color_mood": "clean_white",
                "zoom_speed": 0.0006,
            },
        ],
    },

    # -- REEL 10: Supplied for the Grow -------------------------------------------
    {
        "title": "Supplied for the Grow",
        "caption": (
            "you've got the genetics. the lights. the nutrients. the team.\n\n"
            "but if your supply game is weak, none of it matters.\n\n"
            "Triple OG Gloves. professional grade nitrile.\n"
            "case pricing. fast shipping. no minimums.\n\n"
            "valuesuppliers.co | Supplied for the Grow.\n\n"
            "#suppliedforthegrow #cannabis #professional #nitrile "
            "#tripleoggloves #cannabissupply #growsupply #valuesuppliers"
        ),
        "scenes": [
            {
                "visual_description": "Epic wide shot of a large-scale cannabis operation — multiple grow rooms visible through glass walls, professional facility, impressive scale.",
                "visual_mood": "scale and ambition, professional facility, impressive operation",
                "duration": 3.0,
                "color_mood": "forest_green",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "Close-up montage style: gloved hand checking a plant, gloved hand trimming, gloved hand packaging — the glove is the constant through every step.",
                "visual_mood": "the through-line, gloves in every scene, the constant supply",
                "duration": 3.0,
                "color_mood": "warm_amber",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "Cases of Triple OG gloves stacked in a warehouse — professional supply, bulk inventory, ready to ship. The supply chain behind the operation.",
                "visual_mood": "supply chain power, warehouse stock, bulk inventory",
                "duration": 2.5,
                "color_mood": "dark_warehouse",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Final hero shot: a single black nitrile gloved hand holding a perfect cannabis bud, backlit dramatically. The intersection of supply and craft.",
                "visual_mood": "hero shot, dramatic backlight, the money shot",
                "duration": 3.5,
                "color_mood": "harvest_gold",
                "zoom_speed": 0.0006,
            },
        ],
    },
]


def main():
    parser = argparse.ArgumentParser(description="Triple OG Gloves — Reel Pipeline")
    parser.add_argument("--no-post", action="store_true", help="Produce only, don't post")
    parser.add_argument("--no-crowdtest", action="store_true", help="Skip crowdtest, straight to produce")
    parser.add_argument("--crowdtest-only", action="store_true", help="Only run crowdtest, don't produce")
    parser.add_argument("--threshold", type=float, default=DEFAULT_CROWDTEST_THRESHOLD, help="Min avg_sentiment to proceed (default 0.2)")
    parser.add_argument("--personas", type=int, default=30, help="Number of crowdtest personas (default 30)")
    parser.add_argument("--start", type=int, default=1, help="Start from reel N")
    parser.add_argument("--only", type=int, help="Process only reel N")
    parser.add_argument("--preview", action="store_true", help="Produce reel 1 and open it")
    args = parser.parse_args()

    if args.only:
        reels = [REELS[args.only - 1]]
        start_idx = args.only
    else:
        reels = REELS[args.start - 1:]
        start_idx = args.start

    if args.preview:
        reels = [REELS[0]]
        start_idx = 1
        args.no_post = True

    total = len(reels)
    crowdtest_enabled = not args.no_crowdtest
    print(f"\n{'='*60}")
    print(f"TRIPLE OG GLOVES — REEL PIPELINE")
    print(f"{'='*60}")
    print(f"  Reels to process: {total}")
    print(f"  CrowdTest:        {'ON (threshold {:.2f})'.format(args.threshold) if crowdtest_enabled else 'OFF'}")
    print(f"  Produce video:    {'NO (crowdtest only)' if args.crowdtest_only else 'YES'}")
    print(f"  Post to Instagram: {'NO' if args.no_post or args.crowdtest_only else 'YES'}")
    print(f"  Rate limit: {RATE_LIMIT_SECONDS // 60} min between posts")
    print(f"{'='*60}\n")

    results = []

    for i, reel in enumerate(reels):
        reel_num = start_idx + i
        title = reel["title"]
        print(f"\n{'='*60}")
        print(f"  REEL {reel_num}/10: \"{title}\"")
        print(f"{'='*60}")

        result = {"reel": reel_num, "title": title}

        # ── STEP 1: CROWDTEST ──────────────────────────────────────
        if crowdtest_enabled:
            print(f"\n  STEP 1/3: CROWDTEST")
            ct_result = run_crowdtest(reel, persona_count=args.personas)
            avg = ct_result["results"]["avg_sentiment"]
            engage = ct_result["results"]["engage_rate"]
            share = ct_result["results"]["share_rate"]

            result["crowdtest"] = {
                "test_id": ct_result["test_id"],
                "avg_sentiment": avg,
                "engage_rate": engage,
                "share_rate": share,
                "verdict": "PRODUCE" if avg >= args.threshold else "SKIP",
            }

            if avg < args.threshold:
                print(f"\n  VERDICT: SKIP (sentiment {avg:+.2f} < threshold {args.threshold:+.2f})")
                print(f"  Skipping production to save Runway credits.")
                result["produced"] = False
                result["posted"] = False
                results.append(result)
                continue
            else:
                print(f"\n  VERDICT: PRODUCE (sentiment {avg:+.2f} >= threshold {args.threshold:+.2f})")

        if args.crowdtest_only:
            result["produced"] = False
            result["posted"] = False
            results.append(result)
            continue

        # ── STEP 2: PRODUCE ────────────────────────────────────────
        print(f"\n  STEP 2/3: PRODUCE")
        reel_info = producer.run(reel)
        if not reel_info:
            print(f"  FAILED to produce reel {reel_num}")
            result["produced"] = False
            result["posted"] = False
            results.append(result)
            continue

        result["produced"] = True
        result["file"] = reel_info["file"]
        result["size_kb"] = reel_info.get("size_kb", 0)

        if args.preview:
            print(f"\n  Preview: {reel_info['file']}")
            print(f"  Open this file to preview the reel.")
            result["posted"] = False
            results.append(result)
            break

        # ── STEP 3: POST ──────────────────────────────────────────
        if not args.no_post:
            print(f"\n  STEP 3/3: POST TO INSTAGRAM")
            post_result = publisher.run(reel_info, reel["caption"])
            result["posted"] = post_result.get("ok", False)
            result["post_result"] = post_result
        else:
            result["posted"] = False
            print(f"\n  STEP 3/3: SKIPPED (--no-post)")

        results.append(result)

        # Log result
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            **result,
        }
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry, default=str) + "\n")

        # Rate limit between posts
        if not args.no_post and i < total - 1 and result.get("posted"):
            print(f"\n  Waiting {RATE_LIMIT_SECONDS // 60} minutes before next post...")
            time.sleep(RATE_LIMIT_SECONDS)

    # ── SUMMARY ────────────────────────────────────────────────────
    tested = sum(1 for r in results if r.get("crowdtest"))
    approved = sum(1 for r in results if r.get("crowdtest", {}).get("verdict") == "PRODUCE")
    produced = sum(1 for r in results if r.get("produced"))
    posted = sum(1 for r in results if r.get("posted"))

    print(f"\n{'='*60}")
    print(f"PIPELINE COMPLETE")
    print(f"{'='*60}")
    if tested:
        print(f"  CrowdTested: {tested} | Approved: {approved} | Skipped: {tested - approved}")
    print(f"  Produced: {produced}/{total}")
    print(f"  Posted: {posted}/{total}")

    # Show ranking if crowdtest was run
    if tested:
        print(f"\n  CROWDTEST RANKING:")
        ranked = sorted(
            [r for r in results if r.get("crowdtest")],
            key=lambda x: x["crowdtest"]["avg_sentiment"],
            reverse=True,
        )
        for rank, r in enumerate(ranked, 1):
            ct = r["crowdtest"]
            verdict = ct["verdict"]
            emoji = "PASS" if verdict == "PRODUCE" else "FAIL"
            print(f"    {rank}. [{emoji}] \"{r['title']}\" — sentiment: {ct['avg_sentiment']:+.2f}, engage: {ct['engage_rate']:.0%}, share: {ct['share_rate']:.0%}")

    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
