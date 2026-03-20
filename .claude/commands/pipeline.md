---
description: Full content pipeline — from idea to published reel with audience validation. Chains Koda Stack skills with CrowdTest.
argument-hint: [your content idea or topic]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Agent, Skill
---

# /pipeline — The Content Pipeline

You are a pipeline orchestrator. You run the full content production workflow from idea to published reel, using specialized skills at each stage. CrowdTest validates the brief with a synthetic audience BEFORE creative concepting begins — so bad ideas die early and good ideas get sharper.

## Pipeline Stages

```
1. SCOUT      → /trends (optional — find what's hot)
2. PLAN       → /brief (structure the idea)
3. VALIDATE   → /crowdtest (test the brief with synthetic audience)
4. DIRECT     → /concept (3 creative directions from validated brief)
5. WRITE      → /script (punchy short-form script)
6. ART        → /art-direction (visual language)
7. BOARD      → /storyboard (shot-by-shot deck)
8. PRODUCE    → /generate (AI image/video prompts)
9. EDIT       → /assemble (render the reel)
10. PUBLISH   → /publish (caption + posting strategy)
11. MULTIPLY  → /repurpose (adapt to other platforms)
```

## How to Run

The user says `/pipeline [idea]`. You orchestrate each stage sequentially.

### Stage 1: SCOUT (optional)
If the idea is vague or the user asks for trends, invoke:
```
/koda-stack:skills:trends [niche/platform]
```
Use the output to sharpen the idea before briefing.

### Stage 2: PLAN
Invoke the Planner to structure the idea into a brief:
```
/koda-stack:skills:brief [the idea]
```
Output: A structured BRIEF with topic, angle, audience, platform, format, tone, key message, constraints.

### Stage 3: VALIDATE (CrowdTest)
**This is the gate.** Before spending creative energy, test the brief with a synthetic audience grounded in REAL customer data from the Empire 8 CRM.

**Step 3a: Pull customer data from the CRM.**
Before generating personas, query the Empire 8 Supabase CRM for real customer context:

```javascript
// Supabase: https://ypqmcakzjvmtcypkyhce.supabase.co
// Pull contacts with company data for persona grounding
const { data: contacts } = await supabase
  .from('contacts')
  .select('firstname, lastname, city, state, source, lead_status, company:companies(name, license_type, city, county)')
  .limit(200);
```

Use this data to:
- Ground personas in real license types (dispensary owners, cultivators, processors, distributors)
- Match the geographic distribution (Brooklyn, Manhattan, Rochester, Buffalo, etc.)
- Reflect the actual mix of business types from the NY OCM registry
- Use real company names as context for persona backgrounds

**Step 3b: Run CrowdTest with CRM-grounded personas.**
Take the BRIEF output and invoke:
```
/crowdtest [the brief's key message + angle] — use audience: empire8 NY dispensary owners. Ground personas in CRM data from empire8ny.com Supabase (ypqmcakzjvmtcypkyhce). License types: Retail Dispensary, Cultivator, Processor, Distributor, Microbusiness. Cities: Brooklyn, New York, Rochester, Buffalo, Bronx, Albany, Syracuse. These are licensed cannabis operators buying wholesale.
```

Use 20 personas (fast validation, not a full 50-persona deep test). Focus on:
- Would they watch this? (use_rate)
- Does the angle resonate? (avg_sentiment)
- What objections come up? (top_objections)

**Decision gate:**
- **avg_sentiment > 0.3 AND use_rate > 60%** → Proceed to concepting. Include top objections as creative constraints.
- **avg_sentiment 0.0–0.3 OR use_rate 40–60%** → Show results to user. Ask: revise the brief, pivot the angle, or proceed anyway?
- **avg_sentiment < 0.0 OR use_rate < 40%** → Flag as weak. Recommend revising the idea. Show why it failed and what the crowd wanted instead.

Print a quick summary after validation:
```
=== BRIEF VALIDATION ===
Sentiment: +0.42 | Would Watch: 72% | Verdict: PROCEED

Top insight: [most useful feedback from the crowd]
Creative constraint added: [objection turned into a challenge for the concept phase]
```

### Stage 4: DIRECT
With a validated (or user-approved) brief, invoke the Creative Director:
```
/koda-stack:skills:concept [the validated brief + any constraints from crowdtest]
```
Output: 3 distinct creative concepts (A/B/C).

Present all 3 to the user. Wait for them to pick one (or ask you to pick).

### Stage 5: WRITE
Invoke the Scriptwriter with the chosen concept:
```
/koda-stack:skills:script [chosen concept]
```
Output: 5-block script (hook → pre-CTA → walkthrough → transition → CTA).

### Stage 6: ART
Invoke the Art Director with the script:
```
/koda-stack:skills:art-direction [the script + concept visual world]
```
Output: Palette, mood, lighting, composition, references.

### Stage 7: BOARD
Invoke the Storyboarder:
```
/koda-stack:skills:storyboard [script + art direction]
```
Output: Shot deck with timing, types, descriptions, text overlays.

### Stage 8: PRODUCE
Invoke the Producer:
```
/koda-stack:skills:generate [shot deck + art direction]
```
Output: Optimized AI generation prompts for each shot.

### Stage 9: EDIT
Invoke the Editor:
```
/koda-stack:skills:assemble [shot deck + generated assets]
```
Output: Rendered video file.

### Stage 10: PUBLISH
Invoke the Social Manager:
```
/koda-stack:skills:publish [script + reel context]
```
Output: Caption, hashtags, posting time, CTA reminder.

### Stage 11: MULTIPLY
Invoke the Content Multiplier:
```
/koda-stack:skills:repurpose [script + caption]
```
Output: Adapted content for X, LinkedIn, YouTube Shorts, carousel, stories.

## Orchestration Rules

1. **Always read CLAUDE.md first** — every skill depends on it for brand context
2. **Run stages sequentially** — each stage needs the previous stage's output
3. **Pause for user input at these gates:**
   - After Stage 3 (VALIDATE) — if sentiment is mid or low
   - After Stage 4 (DIRECT) — user picks a concept
   - After Stage 8 (PRODUCE) — user approves prompts before generating
4. **Pass context forward** — each skill invocation should include relevant output from previous stages
5. **If any stage fails or the user wants to revise, loop back to that stage** — don't restart from scratch
6. **Track progress** — print a status line before each stage:
   ```
   [3/11] VALIDATE — Testing brief with 20-persona focus group...
   ```
7. **CrowdTest constraints flow downstream** — if the crowd flags an objection, it becomes a creative constraint for the concept phase. If they love a specific angle, reinforce it.

## Quick Modes

- `/pipeline [idea]` — Full pipeline (all 11 stages)
- `/pipeline [idea] --skip-trends` — Skip stage 1, go straight to brief
- `/pipeline [idea] --skip-validate` — Skip crowdtest (for speed)
- `/pipeline [idea] --to-script` — Stop after stage 5 (plan through script only)
- `/pipeline [idea] --to-board` — Stop after stage 7 (plan through storyboard)

## Example

User: `/pipeline how to use AI to trim cannabis faster`

```
[1/11] SCOUT — Skipped (idea is specific enough)
[2/11] PLAN — Structuring brief...
  → BRIEF: "AI-Assisted Cannabis Trimming" | Angle: comparison of manual vs AI sorting
[3/11] VALIDATE — Testing with 20 personas...
  → Sentiment: +0.51 | Would Watch: 78% | PROCEED
  → Constraint: "Show the actual time savings, not just the concept"
[4/11] DIRECT — Generating 3 concepts...
  → Concept A: "The 10x Trim" | Concept B: "Old School vs New School" | Concept C: "The Lazy Grower"
  → User picks: B
[5/11] WRITE — Writing script...
  → 118 words, 5 blocks, CTA keyword: TRIM
[6/11] ART — Defining visual direction...
[7/11] BOARD — Building shot deck...
  → 12 shots, 34 seconds total
[8/11] PRODUCE — Generating prompts...
[9/11] EDIT — Assembling reel...
[10/11] PUBLISH — Writing caption...
[11/11] MULTIPLY — Repurposing for X, LinkedIn, carousel...

DONE. Reel ready for review.
```
