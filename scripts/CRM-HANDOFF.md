# Empire 8 Sales Direct — CRM Handoff

## Supabase Project
- **Account:** alexcarney460@gmail.com
- **Project Ref:** `hpakqrnvjnzznhffoqaf`
- **URL:** https://hpakqrnvjnzznhffoqaf.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/hpakqrnvjnzznhffoqaf
- **Management API Token:** `sbp_a4cc97d896d3e75066834037994c8ebbc57bb5bb`

## CRM Tables

### `companies` — Cannabis dispensaries, grows, processors, distributors, etc.
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Auto-increment PK |
| name | text | Company name |
| domain | text | Website domain |
| phone | text | Phone number |
| city | text | City |
| state | text | State |
| address | text | Full address |
| source | text | `google_places`, `website_scrape` |
| google_place_id | text | Unique Google Places ID |
| rating | numeric | Google rating (1-5) |
| review_count | integer | Number of reviews |

### `contacts` — Leads (business owners, reviewers, scraped emails)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Auto-increment PK |
| company_id | bigint | FK → companies.id |
| firstname | text | First name |
| lastname | text | Last name |
| email | text | Email address |
| phone | text | Phone number |
| city, state | text | Location |
| role | text | owner, manager, etc. |
| source | text | `google_review`, `website_scrape` |
| lead_status | text | `NEW`, `OPEN`, `CONTACTED` |
| lifecycle_stage | text | `lead`, `customer` |
| review_text | text | Google Review excerpt |
| review_rating | integer | Review star rating |
| review_keywords | text[] | Keywords mentioned (cannabis, dispensary, etc.) |

### `lists` — Static lists
### `list_contacts` — List membership (list_id + contact_id)

## Scripts

### Lead Scraping
Lead scraping scripts target cannabis dispensaries and licensed operators. See the main HANDOFF.md for details on the cannabis/hemp license scraper pipeline.

## Target Business Types
Cannabis dispensaries, cannabis grow facilities, cannabis processors, cannabis distributors, medical marijuana dispensaries, cannabis testing labs

## Cannabis Keywords Monitored
cannabis, dispensary, marijuana, THC, CBD, flower, concentrates, edibles, pre-rolls, vape, cultivation, grow operation, cannabis retail, licensed dispensary, wholesale cannabis

## Search Focus
New York state licensed cannabis dispensaries and operators across all 62 counties.

### `scripts/enrich-consumers.mjs` — Contact enrichment (TODO)
Enriches cannabis operator contacts (name + city) with email + phone via people-search sites. Not yet created.

```bash
SUPABASE_URL=https://hpakqrnvjnzznhffoqaf.supabase.co \
SUPABASE_KEY=<service_role_key> \
node scripts/enrich-consumers.mjs
```

## Querying Data

### Via Supabase JS
```js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hpakqrnvjnzznhffoqaf.supabase.co', SERVICE_ROLE_KEY);

// All contacts with emails for outreach
const { data } = await supabase
  .from('contacts')
  .select('*, companies(*)')
  .not('email', 'is', null)
  .eq('source', 'website_scrape');

// Cannabis businesses specifically
const { data } = await supabase
  .from('companies')
  .select('*')
  .or('name.ilike.%dispensary%,name.ilike.%cannabis%,name.ilike.%grow%');

// Contacts who mentioned cannabis in reviews
const { data } = await supabase
  .from('contacts')
  .select('*')
  .contains('review_keywords', ['cannabis']);

// Contacts in a specific list
const { data } = await supabase
  .from('list_contacts')
  .select('contact_id, contacts(*)')
  .eq('list_id', 1);
```

### Via SQL
```sql
-- Top cities by business count
SELECT city, state, COUNT(*) as businesses FROM companies GROUP BY city, state ORDER BY businesses DESC LIMIT 20;

-- Most mentioned keywords
SELECT unnest(review_keywords) as keyword, COUNT(*) as mentions
FROM contacts WHERE review_keywords IS NOT NULL
GROUP BY keyword ORDER BY mentions DESC;

-- Contacts with phone numbers for SMS outreach
SELECT * FROM contacts WHERE phone IS NOT NULL AND phone != '';

-- Businesses with websites but no contacts
SELECT c.* FROM companies c
LEFT JOIN contacts ct ON ct.company_id = c.id
WHERE c.domain IS NOT NULL AND ct.id IS NULL;
```
