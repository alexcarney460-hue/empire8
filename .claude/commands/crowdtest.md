---
description: Run an AI focus group — test any idea, ad, website, or message with synthetic personas
argument-hint: [describe what you're testing]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, Agent
---

# CrowdTest — AI Focus Group

You are running a synthetic focus group. The user wants to test: **$ARGUMENTS**

## Your Job

Generate diverse synthetic personas, have each one react to the stimulus AS THAT PERSON (not as an AI), then aggregate results and write everything to a JSON file the dashboard can read.

## Data Directory

All test results go in: `C:/Users/Claud/.openclaw/workspace/crowdtest/data/tests/`
Customer profiles go in: `C:/Users/Claud/.openclaw/workspace/crowdtest/data/audiences/`

Create directories if they don't exist.

## Step 0: Check for Customer Data

BEFORE generating generic personas, check if the user has provided real customer data. Look for:

1. **A customer data file referenced in the arguments** — CSV, JSON, or text file path
2. **A review URL** — Google Maps, Yelp, Trustpilot, G2, or similar review site
3. **A saved audience profile** — check `data/audiences/` for previously saved profiles
4. **Pasted data in the arguments** — raw reviews, survey responses, or customer descriptions

If customer data IS provided, follow the **Customer-Grounded Persona Generation** flow below.
If NOT, ask the user: "Do you have customer data to make this more accurate? You can:
- Paste customer reviews or survey responses
- Give me a URL to your Google/Yelp reviews
- Point me to a CSV or data file
- Or I'll generate personas from your audience description alone"

If they say no or want to proceed without data, use the standard generation flow.

### Customer Data Processing

When customer data is provided, process it based on the source:

**CSV/JSON file:**
- Read the file
- Extract demographic patterns: age ranges, locations, genders, occupations, income signals
- Extract behavioral patterns: what they buy, how often, common complaints, what they praise
- Extract psychographic signals: values, preferences, communication style from any text fields

**Review URL (Google, Yelp, Trustpilot, etc.):**
- Use WebFetch to scrape the reviews page
- Extract: reviewer names (for demographic inference), star ratings, review text, dates
- Analyze sentiment distribution of real reviews
- Extract common themes: what real customers love, hate, and wish for
- Note the rating distribution (how many 5-star vs 1-star)

**Pasted text (reviews, surveys, emails, support tickets):**
- Parse the unstructured text
- Extract customer characteristics mentioned
- Identify recurring themes, complaints, praise
- Infer demographics from language, concerns, and context

**After processing, create a Customer Profile Summary:**
```
REAL CUSTOMER PROFILE:
- Demographics: [age range, gender split, locations, income signals]
- What they love: [top 5 themes from positive feedback]
- What they hate: [top 5 themes from negative feedback]
- Common requests: [what they wish existed]
- Communication style: [formal/casual, emotional/analytical, etc.]
- Rating distribution: [% positive, neutral, negative]
- Key quotes: [5-10 verbatim quotes that capture the customer voice]
```

Save this profile to `data/audiences/{audience-name}.json` for reuse.

### Customer-Grounded Persona Generation

When you have real customer data, personas MUST:
- **Mirror the real demographic distribution** — if 70% of reviewers seem to be women 30-50, your personas should reflect that
- **Include the real pain points** — not imagined ones
- **Use the actual language patterns** — if customers say "bang for the buck" not "value proposition," your personas talk that way
- **Reflect the real sentiment distribution** — if reviews are 60% positive, 25% mixed, 15% negative, personas should roughly match
- **Include the outliers** — the angry 1-star reviewer AND the obsessive 5-star superfan both exist in real data

Each persona should note: `"data_grounded": true` and `"based_on": "summary of which real customer signals informed this persona"`

## Step 1: Parse the Request

If $ARGUMENTS is a URL, fetch and summarize the page content first.

Determine:
- **title**: Short name for this test
- **stimulus_type**: "project_idea", "text", "url", or "political"
- **stimulus_content**: The actual content being tested
- **audience**: Target audience (ask user if not specified, default: "US adults 25-55 across income levels")
- **persona_count**: Number of personas (default: 50, ask user if they want more/fewer)

## Step 2: Generate Personas

Generate diverse, realistic personas. CRITICAL RULES:
- Every persona MUST be distinct — vary age, gender, location, income, personality
- Include skeptics, enthusiasts, and indifferent people
- Include people who would HATE this idea (not everyone is positive)
- Make names ethnically diverse
- Vary tech savviness, income, education realistically
- If customer data was provided, ground personas in that data (see above)

For each persona, define: name, age, gender, location, occupation, income_bracket, education, personality_traits, values, media_habits, brand_preferences, pain_points, political_leaning, tech_savviness, decision_style

Generate in batches of 20. Write each batch to the test file as you go so progress is visible.

## Step 3: Evaluate the Stimulus

For EACH persona, embody that person and react authentically to the content. Generate:
- **reaction**: 2-3 sentences as this person would actually speak
- **sentiment**: very_positive, positive, neutral, negative, or very_negative
- **sentiment_score**: float from -1.0 to 1.0
- **would_buy**: true/false/null — would they pay for this?
- **would_use**: true/false/null — would they use it even if free?
- **would_vote**: true/false/null — for political content only
- **price_willing**: what they'd pay (e.g. "$5/mo", "$29 once", "nothing")
- **objections**: list of concerns
- **key_quotes**: 1-2 memorable phrases

Process in batches of 10 personas. After each batch, update the test JSON file with progress.

BE AUTHENTIC. A skeptical 55-year-old conservative farmer should NOT react the same as a 23-year-old tech worker. Embrace negative reactions — they're the most valuable data.

## Step 4: Analyze Results

Compute:
- sentiment_breakdown: count per sentiment category
- avg_sentiment: average sentiment_score
- buy_rate: % who would buy
- use_rate: % who would use
- vote_rate: % who would vote (if political)
- price_distribution: count per price point
- top_objections: most common objections with counts
- top_praise: most common positive quotes with counts
- top_criticism: most common negative quotes with counts
- demographic_splits: sentiment by age bracket and gender

## Step 5: Write Final Results

Generate a unique test ID (use timestamp: YYYYMMDD-HHMMSS).

Write the complete JSON file to: `C:/Users/Claud/.openclaw/workspace/crowdtest/data/tests/{test_id}.json`

JSON structure:
```json
{
  "test_id": "20260316-143052",
  "title": "...",
  "stimulus_type": "...",
  "stimulus_content": "...",
  "audience_description": "...",
  "audience_source": "customer_data|generic",
  "audience_profile": "path/to/saved/profile.json or null",
  "persona_count": 50,
  "status": "complete",
  "created_at": "ISO8601",
  "completed_at": "ISO8601",
  "results": {
    "sentiment_breakdown": {},
    "avg_sentiment": 0.0,
    "buy_rate": 0.0,
    "use_rate": 0.0,
    "vote_rate": null,
    "price_distribution": {},
    "top_objections": [{"objection": "...", "count": N}],
    "top_praise": [{"quote": "...", "count": N}],
    "top_criticism": [{"quote": "...", "count": N}],
    "demographic_splits": {
      "by_age": {"18-24": {"count": N, "avg_sentiment": 0.0}, ...},
      "by_gender": {"female": {"count": N, "avg_sentiment": 0.0}, ...}
    },
    "total_responses": 50,
    "responses": [
      {
        "persona_name": "...",
        "persona_age": 32,
        "persona_gender": "female",
        "persona_location": "Austin, TX",
        "persona_occupation": "Marketing Manager",
        "data_grounded": false,
        "based_on": null,
        "reaction": "...",
        "sentiment": "positive",
        "sentiment_score": 0.6,
        "would_buy": true,
        "would_use": true,
        "would_vote": null,
        "price_willing": "$29/mo",
        "objections": ["..."],
        "key_quotes": ["..."]
      }
    ]
  }
}
```

## Step 6: Print Summary

After writing the file, print a clear summary:

```
=== CROWDTEST RESULTS: [title] ===
[DATA-GROUNDED if customer data was used, or GENERIC AUDIENCE if not]

Personas: 50 | Avg Sentiment: +0.34 | Would Buy: 62% | Would Use: 78%

Top Price: $29/mo (12 people)

TOP OBJECTIONS:
1. [objection] (15x)
2. [objection] (9x)

TOP PRAISE:
1. "[quote]" (8x)
2. "[quote]" (5x)

VERDICT: [your honest assessment — is this worth building?]

Dashboard: http://localhost:3000/test/[test_id]
```

## Important Rules

- DO NOT be artificially positive. Real focus groups have harsh critics.
- At least 20-30% of personas should have negative or neutral reactions.
- Vary the DEPTH of engagement — some people barely care, some are passionate.
- Price willingness should be realistic for the persona's income bracket.
- If the idea is bad, say so in the verdict. That's the whole point of this tool.
- When using customer data, NEVER fabricate data points — only extrapolate from what's actually there.
- Saved audience profiles can be reused across tests: "use audience: skincare-customers"
