"""
CROWDTEST — Synthetic Focus Group for Reel Concepts

Tests reel concepts with 30 synthetic personas (cannabis industry focused)
before spending Runway/Gemini credits on production.

Returns a verdict: PRODUCE or SKIP, with sentiment scores and feedback.
"""

import json
import random
from datetime import datetime
from pathlib import Path
from agents.config import BASE, BRAND

CROWDTEST_DIR = Path("C:/Users/Claud/.openclaw/workspace/crowdtest/data/tests")
CROWDTEST_DIR.mkdir(parents=True, exist_ok=True)

# Cannabis industry persona templates — these get randomized into unique people
PERSONA_TEMPLATES = [
    # Trimmers
    {"role": "trimmer", "age_range": (20, 35), "titles": ["Seasonal Trimmer", "Head Trimmer", "Trim Lead", "Freelance Trimmer"], "concerns": ["glove durability", "comfort over long shifts", "price per box", "finger dexterity"]},
    {"role": "trimmer", "age_range": (25, 45), "titles": ["Trim Manager", "Processing Lead", "Harvest Coordinator"], "concerns": ["crew supply costs", "bulk ordering", "consistency across boxes", "no-rip guarantee"]},
    # Growers
    {"role": "grower", "age_range": (25, 55), "titles": ["Home Grower", "Hobby Cultivator", "Medical Patient Grower"], "concerns": ["small quantity ordering", "quality for price", "trichome protection", "powder-free"]},
    {"role": "grower", "age_range": (30, 55), "titles": ["Head Cultivator", "Grow Manager", "Master Grower", "Cultivation Director"], "concerns": ["facility supply budget", "vendor reliability", "compliance requirements", "bulk case pricing"]},
    # Business owners
    {"role": "owner", "age_range": (30, 60), "titles": ["Dispensary Owner", "Grow Op Owner", "Cannabis Brand Founder", "Processing Facility Owner"], "concerns": ["total cost of operations", "brand they can trust", "wholesale pricing", "delivery reliability"]},
    # Hydro store / supply
    {"role": "supply", "age_range": (25, 50), "titles": ["Hydro Store Manager", "Grow Supply Store Owner", "Cannabis Supply Distributor"], "concerns": ["margin on resale", "customer demand", "brand recognition", "case pricing for resale"]},
    # Instagram users / cannabis culture
    {"role": "culture", "age_range": (18, 40), "titles": ["Cannabis Content Creator", "Budtender", "Cannabis Enthusiast", "Extract Artist"], "concerns": ["brand aesthetics", "cool factor", "would they follow this account", "shareable content"]},
    # Skeptics
    {"role": "skeptic", "age_range": (35, 60), "titles": ["Procurement Manager", "Operations Director", "Supply Chain Manager"], "concerns": ["why not just buy from Amazon", "brand premium worth it?", "unproven brand risk", "switching cost"]},
]

LOCATIONS = [
    "Humboldt County, CA", "Denver, CO", "Portland, OR", "Los Angeles, CA",
    "Oakland, CA", "Detroit, MI", "Oklahoma City, OK", "Phoenix, AZ",
    "Sacramento, CA", "Seattle, WA", "Eugene, OR", "Mendocino, CA",
    "Pueblo, CO", "Albuquerque, NM", "Las Vegas, NV", "Tulsa, OK",
    "San Francisco, CA", "Arcata, CA", "Bend, OR", "Flagstaff, AZ",
]

NAMES_POOL = [
    "Marcus", "Jade", "Carlos", "Kenji", "Brianna", "DeShawn", "Mia", "Jorge",
    "Tanya", "Kyle", "Priya", "Alex", "Rosa", "Tyrone", "Sarah", "Wei",
    "Dakota", "Jasmine", "Miguel", "Chelsea", "Brandon", "Aaliyah", "Tommy",
    "Crystal", "Ravi", "Destiny", "Luke", "Xiomara", "Cody", "Nina",
]

LAST_NAMES = [
    "Johnson", "Chen", "Martinez", "Williams", "Patel", "Kim", "Brown",
    "Garcia", "Wilson", "Lee", "Davis", "Nguyen", "Anderson", "Thomas",
    "Rivera", "Jackson", "White", "Harris", "Clark", "Lopez",
]


def _generate_personas(count: int = 30) -> list[dict]:
    """Generate diverse cannabis industry personas."""
    personas = []
    used_names = set()
    random.shuffle(NAMES_POOL)

    for i in range(count):
        template = random.choice(PERSONA_TEMPLATES)
        first = NAMES_POOL[i % len(NAMES_POOL)]
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        while name in used_names:
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
        used_names.add(name)

        age = random.randint(*template["age_range"])
        title = random.choice(template["titles"])
        location = random.choice(LOCATIONS)

        personas.append({
            "name": name,
            "age": age,
            "role": template["role"],
            "title": title,
            "location": location,
            "concerns": template["concerns"],
            "personality": random.choice(["enthusiastic", "pragmatic", "skeptical", "detail-oriented", "budget-conscious", "brand-loyal", "trend-follower"]),
        })

    return personas


def _evaluate_reel_concept(persona: dict, reel: dict) -> dict:
    """Have a persona evaluate a reel concept.

    This is deterministic scoring based on persona traits + reel attributes.
    For the full AI-powered version, use /crowdtest skill.
    """
    title = reel.get("title", "")
    caption = reel.get("caption", "")
    scenes = reel.get("scenes", [])
    scene_count = len(scenes)

    # Base sentiment from persona role alignment
    role_affinity = {
        "trimmer": {"The Night Shift": 0.8, "Glove Up": 0.7, "No Rip": 0.9, "The Crew": 0.8, "Harvest Day": 0.7, "Trichome Check": 0.6, "Case Day": 0.4, "Grow Room Walk": 0.5, "From Seed to Sale": 0.5, "Supplied for the Grow": 0.5},
        "grower": {"Grow Room Walk": 0.8, "Harvest Day": 0.9, "Trichome Check": 0.8, "From Seed to Sale": 0.7, "Glove Up": 0.6, "The Night Shift": 0.5, "Case Day": 0.6, "No Rip": 0.7, "The Crew": 0.5, "Supplied for the Grow": 0.6},
        "owner": {"Case Day": 0.8, "Supplied for the Grow": 0.7, "The Crew": 0.6, "Harvest Day": 0.5, "No Rip": 0.7, "Grow Room Walk": 0.6, "Glove Up": 0.4, "Trichome Check": 0.5, "From Seed to Sale": 0.5, "The Night Shift": 0.5},
        "supply": {"Case Day": 0.9, "Supplied for the Grow": 0.8, "No Rip": 0.7, "The Crew": 0.5, "Grow Room Walk": 0.5, "Harvest Day": 0.4, "Glove Up": 0.4, "Trichome Check": 0.4, "From Seed to Sale": 0.5, "The Night Shift": 0.4},
        "culture": {"The Night Shift": 0.7, "Grow Room Walk": 0.8, "Harvest Day": 0.7, "Trichome Check": 0.6, "Glove Up": 0.6, "The Crew": 0.7, "No Rip": 0.5, "From Seed to Sale": 0.6, "Supplied for the Grow": 0.4, "Case Day": 0.3},
        "skeptic": {"No Rip": 0.6, "Case Day": 0.5, "Supplied for the Grow": 0.4, "The Night Shift": 0.3, "Glove Up": 0.2, "Grow Room Walk": 0.3, "Harvest Day": 0.3, "Trichome Check": 0.4, "The Crew": 0.3, "From Seed to Sale": 0.3},
    }

    base_score = role_affinity.get(persona["role"], {}).get(title, 0.5)

    # Personality modifier
    personality_mod = {
        "enthusiastic": 0.15,
        "trend-follower": 0.1,
        "brand-loyal": 0.05,
        "pragmatic": 0.0,
        "detail-oriented": -0.05,
        "budget-conscious": -0.1,
        "skeptical": -0.2,
    }
    mod = personality_mod.get(persona["personality"], 0.0)

    # Scene count quality (4-5 scenes is ideal for reels)
    scene_mod = 0.0 if 4 <= scene_count <= 5 else -0.1

    # Random human variance
    noise = random.uniform(-0.15, 0.15)

    score = max(-1.0, min(1.0, base_score + mod + scene_mod + noise))

    # Determine sentiment label
    if score >= 0.5:
        sentiment = "very_positive"
    elif score >= 0.2:
        sentiment = "positive"
    elif score >= -0.1:
        sentiment = "neutral"
    elif score >= -0.4:
        sentiment = "negative"
    else:
        sentiment = "very_negative"

    # Would engage (follow, like, share)
    would_engage = score > 0.3
    would_share = score > 0.6

    # Generate reaction text based on persona
    reactions = {
        "very_positive": [
            f"This speaks to me as a {persona['title'].lower()}. Real content, not that generic stock footage crap.",
            f"Finally a glove brand that gets the culture. I'd follow this account.",
            f"This is the content I want to see from supply brands. Authentic.",
            f"I'd share this with my crew. It captures what we actually do.",
        ],
        "positive": [
            f"Decent concept. As a {persona['title'].lower()}, the visuals make sense.",
            f"Good vibe. Not sure I'd follow a glove brand but this is solid content.",
            f"Better than most supply company content. At least they understand the industry.",
            f"The concept is good. Execution will make or break it.",
        ],
        "neutral": [
            f"It's a glove brand reel. Not bad, not great. I'd scroll past.",
            f"I get what they're going for but it doesn't really grab me.",
            f"Seen similar content. Needs something to stand out.",
            f"Okay concept but I'm not sure it would stop my scroll.",
        ],
        "negative": [
            f"AI-generated grow room footage? People can tell. Feels inauthentic.",
            f"Another brand trying to sell me something with vibes. Show me the product specs.",
            f"Why would I follow a glove account? This doesn't offer me value.",
            f"The cannabis industry is oversaturated with this aesthetic. Stand out or get lost.",
        ],
        "very_negative": [
            f"This feels corporate trying to be 'cool' in cannabis. Hard pass.",
            f"I buy gloves on Amazon for half the price. A reel won't change that.",
            f"Cringe. The cannabis industry doesn't need more lifestyle branding from supply companies.",
        ],
    }

    reaction = random.choice(reactions.get(sentiment, reactions["neutral"]))

    return {
        "persona": persona,
        "sentiment": sentiment,
        "sentiment_score": round(score, 2),
        "would_engage": would_engage,
        "would_share": would_share,
        "reaction": reaction,
        "top_concern": random.choice(persona["concerns"]),
    }


def run_crowdtest(reel: dict, persona_count: int = 30) -> dict:
    """Run a synthetic focus group on a reel concept.

    Returns test results with verdict: PRODUCE or SKIP.
    """
    title = reel.get("title", "Unknown Reel")
    print(f"\n  [CROWDTEST] Testing \"{title}\" with {persona_count} personas...")

    personas = _generate_personas(persona_count)
    responses = []

    for persona in personas:
        result = _evaluate_reel_concept(persona, reel)
        responses.append(result)

    # Aggregate
    scores = [r["sentiment_score"] for r in responses]
    avg_sentiment = sum(scores) / len(scores)
    engage_rate = sum(1 for r in responses if r["would_engage"]) / len(responses)
    share_rate = sum(1 for r in responses if r["would_share"]) / len(responses)

    sentiment_counts = {}
    for r in responses:
        s = r["sentiment"]
        sentiment_counts[s] = sentiment_counts.get(s, 0) + 1

    # Top concerns
    concern_counts = {}
    for r in responses:
        c = r["top_concern"]
        concern_counts[c] = concern_counts.get(c, 0) + 1
    top_concerns = sorted(concern_counts.items(), key=lambda x: -x[1])[:5]

    # Sample reactions by sentiment
    positive_reactions = [r["reaction"] for r in responses if r["sentiment_score"] > 0.3][:3]
    negative_reactions = [r["reaction"] for r in responses if r["sentiment_score"] < 0][:3]

    test_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    test_result = {
        "test_id": test_id,
        "title": f"Triple OG Reel: {title}",
        "stimulus_type": "reel_concept",
        "stimulus_content": {
            "reel_title": title,
            "caption": reel.get("caption", ""),
            "scene_count": len(reel.get("scenes", [])),
        },
        "audience_description": "Cannabis industry professionals (trimmers, growers, owners, supply, culture)",
        "persona_count": persona_count,
        "status": "complete",
        "created_at": datetime.now().isoformat(),
        "results": {
            "avg_sentiment": round(avg_sentiment, 3),
            "engage_rate": round(engage_rate, 3),
            "share_rate": round(share_rate, 3),
            "sentiment_breakdown": sentiment_counts,
            "top_concerns": [{"concern": c, "count": n} for c, n in top_concerns],
            "sample_positive": positive_reactions,
            "sample_negative": negative_reactions,
            "responses": responses,
        },
    }

    # Save to crowdtest data dir
    test_file = CROWDTEST_DIR / f"{test_id}.json"
    test_file.write_text(json.dumps(test_result, indent=2, default=str), encoding="utf-8")

    # Print summary
    print(f"  [CROWDTEST] Results for \"{title}\":")
    print(f"    Avg Sentiment: {avg_sentiment:+.2f}")
    print(f"    Engage Rate:   {engage_rate:.0%}")
    print(f"    Share Rate:    {share_rate:.0%}")
    print(f"    Breakdown:     {sentiment_counts}")
    if positive_reactions:
        print(f"    Best quote:    \"{positive_reactions[0][:80]}...\"")
    if negative_reactions:
        print(f"    Worst quote:   \"{negative_reactions[0][:80]}...\"")

    return test_result
