/**
 * Seed the marketing queue with 2 weeks of Triple OG Gloves social content.
 * Run: node scripts/seed-marketing-content.mjs
 *
 * Requires NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN env var or falls back to .env.local
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try loading .env.local for the admin token
let ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
if (!ADMIN_TOKEN) {
  try {
    const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
    const match = envFile.match(/NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN=(.+)/);
    if (match) ADMIN_TOKEN = match[1].trim();
  } catch { /* no .env.local */ }
}

const BASE_URL = process.env.SITE_URL ?? 'https://valuesuppliers.co';

// ── HASHTAG SETS ──────────────────────────────────────────────────────
const HASHTAG_SETS = {
  trim: '#trimlife #harvestseason #cannabisgrow #cannabisgrowers #growsupplies #growroomsetup #nitrilegloves #PPE #indoorgrow #plantlife',
  product: '#nitrilegloves #disposablegloves #trimgloves #growsupplies #cannabisindustry #horticulture #PPE #bulkgloves #professionalgrade',
  culture: '#growyourown #cannabiscommunity #cannabisculture #organicgrowing #homegrown #gardenlife #urbanfarming #trimlife #harvestseason',
  education: '#growsupplies #cannabisindustry #horticulture #indoorgrow #growroomsetup #trimlife #protip #growtent #nitrilegloves',
};

// ── CONTENT CALENDAR ──────────────────────────────────────────────────
// 14 posts over 2 weeks (Mon/Wed/Fri + 1 bonus Sunday)
const CONTENT = [
  // ── WEEK 1 ──
  {
    title: 'Triple OG Launch — Brand Intro Reel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['reel', 'launch', 'brand', 'triple-og'],
    body: `🎬 REEL SCRIPT (15-30s):

HOOK (0-3s): Close-up of black nitrile gloves snapping onto hands. Text overlay: "Meet Triple OG."

BODY (3-20s):
- Hands trimming with scissors, tight close-up on sugar leaves
- Quick cuts: glove stretch test, finger dexterity, handling sticky trim
- Text overlays cycling: "5 mil nitrile" → "No stick" → "No tear" → "12-hour tested"
- Show the case/box packaging

CTA (20-30s): Text: "Built for the trim. Link in bio."
Audio: Trending lo-fi beat or instrumental hip-hop

CAPTION:
No stick. No tear. No compromise.

Triple OG Gloves — 5 mil nitrile built for crews who trim all day.

Case pricing starts at $60.
Link in bio.

${HASHTAG_SETS.trim}`,
    scheduled_at: '2026-03-17T10:00:00',
  },
  {
    title: 'Nitrile vs Latex vs Vinyl — Education Carousel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['carousel', 'education', 'comparison', 'triple-og'],
    body: `📸 CAROUSEL (5 slides):

Slide 1 (Cover): "Which Glove Is Best for Trimming?" — dark background, amber text, glove icons
Slide 2: LATEX — "Cheap but tears easy. Allergies are real. Not ideal for long sessions."
Slide 3: VINYL — "Budget option. Loose fit, poor grip. Falls apart with resin."
Slide 4: NITRILE — "The move. Chemical resistant. Resin-resistant. Durable. 5 mil is the sweet spot."
Slide 5: "Triple OG = 5 mil Nitrile. Built for the trim. valuesuppliers.co/triple-og"

CAPTION:
Your glove choice matters more than you think.

Latex tears. Vinyl slips. Nitrile holds up.

5 mil is the sweet spot — thick enough for stems, thin enough for sugar leaves. That's why we built Triple OG around it.

Save this for your next restock.

${HASHTAG_SETS.education}`,
    scheduled_at: '2026-03-19T12:00:00',
  },
  {
    title: 'Glove Snap Test — Quick Reel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['reel', 'product-demo', 'satisfying', 'triple-og'],
    body: `🎬 REEL SCRIPT (8-15s):

HOOK: Slow-motion glove snap onto wrist. Satisfying ASMR snap sound.
BODY: 3 quick cuts — stretch test, finger flex, grip test on a wet stem.
CTA: Text overlay: "5 mil. No tear. Triple OG."

Audio: Trending sound or ASMR-style (no music, just snap + ambient)

CAPTION:
The snap that starts the shift.

5 mil nitrile. Micro-textured grip. Built for 12-hour days.

Triple OG Gloves — valuesuppliers.co

${HASHTAG_SETS.product}`,
    scheduled_at: '2026-03-21T11:00:00',
  },
  {
    title: 'Trim Room Setup — Lifestyle Static',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['static', 'lifestyle', 'workspace', 'triple-og'],
    body: `📸 STATIC POST:

IMAGE DIRECTION: Flat lay or overhead shot of a trim station setup — scissors, trim tray, Triple OG box open with gloves visible, a few trimmed nugs arranged professionally. Dark surface (black or dark wood). Moody lighting, slight amber tones.

CAPTION:
The setup before the session.

Every trim room needs a system. Ours starts with the right glove.

Triple OG — 5 mil nitrile, 100/box, case pricing available.

What's your trim station essential? Drop it below.

${HASHTAG_SETS.culture}`,
    scheduled_at: '2026-03-23T14:00:00',
  },

  // ── WEEK 2 ──
  {
    title: '5 Mistakes Trimmers Make — Education Carousel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['carousel', 'education', 'tips', 'triple-og'],
    body: `📸 CAROUSEL (6 slides):

Slide 1 (Cover): "5 Mistakes Trimmers Make (That Cost You Time & Product)" — bold text, dark bg
Slide 2: "Using cheap gloves that rip mid-session" — icon: torn glove
Slide 3: "Not changing gloves often enough" — icon: sticky residue
Slide 4: "Wrong thickness — too thin tears, too thick kills dexterity" — icon: scale
Slide 5: "No case pricing — paying box-by-box adds up fast" — icon: dollar sign
Slide 6: "Fix: Triple OG 5 mil Nitrile. Case pricing from $60. valuesuppliers.co/triple-og" — CTA

CAPTION:
Your trim crew is making at least one of these.

The biggest cost in a trim room isn't labor — it's lost product from bad tools and slow changeovers.

Start with the right glove. Save this for later.

${HASHTAG_SETS.education}`,
    scheduled_at: '2026-03-24T10:00:00',
  },
  {
    title: 'Case Unboxing — Quick Reel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['reel', 'unboxing', 'satisfying', 'triple-og'],
    body: `🎬 REEL SCRIPT (15-20s):

HOOK (0-3s): Overhead shot — knife cutting open a sealed case. Text: "Fresh case day."
BODY (3-15s):
- Open the case, reveal 10 boxes neatly stacked
- Pull out one box, open it
- Fan out the gloves
- Quick cut to snapping one on
CTA: Text overlay: "1,000 gloves. $80/case retail. $60 distribution."

Audio: Lo-fi or trending chill beat

CAPTION:
Fresh case day hits different.

10 boxes. 1,000 gloves. One less thing to worry about this harvest.

Triple OG — stocked and ready to ship.
valuesuppliers.co

${HASHTAG_SETS.product}`,
    scheduled_at: '2026-03-26T12:00:00',
  },
  {
    title: 'How to Pick the Right Glove Size — Education Reel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['reel', 'education', 'sizing', 'triple-og'],
    body: `🎬 REEL SCRIPT (20-30s):

HOOK: "Wearing the wrong size glove? You're losing speed."
BODY:
- Show hand measurement with measuring tape across palm
- Text overlays with size chart: S (6-7"), M (7-8"), L (8-9"), XL (9-10"), XXL (10-11")
- Side by side: too-big glove (baggy, slow) vs right-fit glove (snug, fast)
- Close-up of precision trimming with perfect fit
CTA: "Triple OG — S to XXL. Link in bio."

CAPTION:
Wrong size = slow hands = lost product.

A glove that's too big bunches up. Too small and you fatigue in an hour. Get the fit right and your speed goes up immediately.

Triple OG comes in S through XXL. Check the size guide at the link in bio.

${HASHTAG_SETS.education}`,
    scheduled_at: '2026-03-28T11:00:00',
  },
  {
    title: 'The Math on Cheap Gloves — Static Post',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['static', 'education', 'cost-comparison', 'triple-og'],
    body: `📸 STATIC POST:

IMAGE DIRECTION: Clean infographic-style image. Dark background (#0A0A0A). Amber accent text. Simple math layout:

"Cheap gloves: $6/box × 15 boxes/week (they rip) = $90/week"
"Triple OG: $8/box × 10 boxes/week (they last) = $80/week"
"That's $520 saved per year — and less downtime."

Bottom: Triple OG logo + valuesuppliers.co

CAPTION:
The cheapest glove is never the cheapest glove.

When your crew tears through 50% more boxes because the gloves rip every 20 minutes, you're not saving — you're bleeding.

Triple OG 5 mil nitrile lasts the session. Do the math.

Wholesale pricing at valuesuppliers.co/wholesale

${HASHTAG_SETS.product}`,
    scheduled_at: '2026-03-30T10:00:00',
  },
  {
    title: 'Day in the Life — Trim Crew Reel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['reel', 'lifestyle', 'day-in-the-life', 'triple-og'],
    body: `🎬 REEL SCRIPT (30s):

HOOK (0-3s): Alarm clock / sunrise. Text: "5 AM. Trim day."
BODY (3-25s):
- Coffee pour
- Drive to facility
- Walk in, glove up (Triple OG box visible)
- Quick cuts of trim work — scissors, stems, leaves falling
- Weigh-in / packaging
- End of day — pile of trimmed product
CTA (25-30s): Remove gloves. Text: "12 hours. Zero tears. Triple OG."

Audio: Motivational lo-fi or cinematic build

CAPTION:
This is what a real trim day looks like.

5 AM start. 12-hour session. The only thing that shouldn't slow you down is your gloves.

Triple OG — built for the shift, not the shelf.

${HASHTAG_SETS.culture}`,
    scheduled_at: '2026-03-31T14:00:00',
  },
  {
    title: 'Wholesale vs Retail Breakdown — Carousel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['carousel', 'education', 'pricing', 'triple-og'],
    body: `📸 CAROUSEL (4 slides):

Slide 1 (Cover): "Stop Paying Retail for Gloves." — bold, dark bg
Slide 2: "RETAIL: $80/case — Great for testing. 1-29 cases, no application needed."
Slide 3: "WHOLESALE: $70/case — Apply once, save $10/case on every 30+ case order. That's $300+ saved on a 30-case order."
Slide 4: "DISTRIBUTION: $60/case — 120+ cases, NET 30 terms, dedicated rep. Built for operations. Apply at valuesuppliers.co/distribution"

CAPTION:
If you're still buying gloves by the box, we need to talk.

Wholesale accounts save $10/case. Distribution saves $20/case. The application takes 2 minutes.

Which tier fits your operation? Comment below and we'll point you in the right direction.

${HASHTAG_SETS.product}`,
    scheduled_at: '2026-04-02T10:00:00',
  },
  {
    title: 'Resin Resistance Test — Quick Reel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['reel', 'product-demo', 'durability', 'triple-og'],
    body: `🎬 REEL SCRIPT (12-18s):

HOOK: Gloved hand covered in sticky resin. Text: "The real test."
BODY:
- Try to pick up scissors — they don't stick
- Wipe hand on paper towel — resin comes off clean
- Back to trimming immediately
CTA: Text overlay: "5 mil nitrile. Resin-resistant. Triple OG."

Audio: Satisfying ASMR / trending sound

CAPTION:
Resin is part of the job. Your gloves shouldn't fight you over it.

5 mil nitrile resists buildup so you spend less time peeling off stuck gloves and more time trimming.

Triple OG — built for real work.

${HASHTAG_SETS.trim}`,
    scheduled_at: '2026-04-04T12:00:00',
  },
  {
    title: 'Quick Poll — Stories Engagement',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['story', 'engagement', 'poll', 'triple-og'],
    body: `📱 INSTAGRAM STORY SEQUENCE (3 slides):

Story 1: Poll — "How many gloves does your crew go through per session?"
Options: "1-2 boxes" / "3-5 boxes" / "A whole case" / "Don't even ask"

Story 2: Poll — "What's your biggest trim room complaint?"
Options: "Gloves tearing" / "Hand fatigue" / "Running out mid-session" / "Bad grip"

Story 3: "We built Triple OG to fix all four. Swipe up → valuesuppliers.co/triple-og"
Background: Product image with amber glow

CAPTION: (n/a — stories don't need captions)

Posting note: Run this between Reel posts for engagement boost. Stories drive algorithm signals.`,
    scheduled_at: '2026-03-25T16:00:00',
  },
  {
    title: 'Follow Us CTA — Community Building Static',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['static', 'community', 'cta', 'triple-og'],
    body: `📸 STATIC POST:

IMAGE DIRECTION: Bold text graphic on dark background (#0A0A0A).
Main text: "We're building the go-to brand for trim crews."
Sub text: "Follow for tips, gear reviews, and case pricing drops."
Bottom: @tripleoggloves + amber accent line

CAPTION:
We're not trying to be everything to everyone.

Triple OG is for the people who show up at 5 AM with scissors and a playlist. The ones who go through cases, not boxes.

If that's you — follow along. We're just getting started.

Case pricing + wholesale info at valuesuppliers.co

${HASHTAG_SETS.culture}`,
    scheduled_at: '2026-04-06T14:00:00',
  },
  {
    title: 'Trim Tip: Change Gloves Every 30 Min — Quick Reel',
    type: 'social_media',
    platform: 'Instagram',
    tags: ['reel', 'education', 'tip', 'triple-og'],
    body: `🎬 REEL SCRIPT (12-15s):

HOOK: Text on screen: "Pro tip your crew probably ignores:"
BODY:
- Timer graphic: 30:00 counting down
- Show resin-caked glove — slow, sticky fingers
- Snap — fresh glove on. Instant speed difference.
- Text: "Change every 30 min. Your speed stays up."
CTA: "100 gloves/box. 10 boxes/case. Triple OG."

Audio: Quick trending sound

CAPTION:
The fastest way to speed up your trim crew: make them change gloves every 30 minutes.

Sounds simple. Most crews don't do it. Resin builds up, grip drops, speed tanks.

At 100 gloves per box, a single box covers a full day of changes for one trimmer.

Triple OG — valuesuppliers.co

${HASHTAG_SETS.education}`,
    scheduled_at: '2026-04-07T10:00:00',
  },
];

// ── SEED FUNCTION ──────────────────────────────────────────────────────

async function seedContent() {
  console.log(`\nSeeding ${CONTENT.length} content items to ${BASE_URL}/api/admin/marketing/queue\n`);

  let success = 0;
  let failed = 0;

  for (const item of CONTENT) {
    const payload = {
      title: item.title,
      type: item.type,
      body: item.body,
      platform: item.platform ?? null,
      tags: item.tags ?? [],
      scheduled_at: item.scheduled_at ?? null,
      status: item.scheduled_at ? 'scheduled' : 'draft',
    };

    try {
      const res = await fetch(`${BASE_URL}/api/admin/marketing/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.ok) {
        console.log(`  ✓ ${item.title}`);
        success++;
      } else {
        console.log(`  ✗ ${item.title} — ${json.error ?? 'unknown error'}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ✗ ${item.title} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} created, ${failed} failed.\n`);
}

// If running directly, also output the content as a preview
const preview = process.argv.includes('--preview');
if (preview) {
  console.log('='.repeat(72));
  console.log('TRIPLE OG GLOVES — 2-WEEK CONTENT CALENDAR');
  console.log('='.repeat(72));
  for (const item of CONTENT) {
    const date = item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unscheduled';
    const tag = item.tags?.[0] ?? '';
    console.log(`\n${'─'.repeat(72)}`);
    console.log(`📅 ${date}  |  ${tag.toUpperCase()}  |  ${item.title}`);
    console.log(`${'─'.repeat(72)}`);
    console.log(item.body);
  }
  console.log(`\n${'='.repeat(72)}\n`);
} else {
  seedContent();
}
