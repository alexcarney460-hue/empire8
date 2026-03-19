# Value Suppliers — CRM Handoff

## Supabase Project
- **Account:** alexcarney460@gmail.com
- **Project Ref:** `hpakqrnvjnzznhffoqaf`
- **URL:** https://hpakqrnvjnzznhffoqaf.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/hpakqrnvjnzznhffoqaf
- **Management API Token:** `sbp_a4cc97d896d3e75066834037994c8ebbc57bb5bb`

## CRM Tables

### `companies` — Cannabis grows, dispensaries, tattoo shops, salons, auto shops, etc.
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
| review_keywords | text[] | Keywords mentioned (gloves, nitrile, etc.) |

### `lists` — Static lists
### `list_contacts` — List membership (list_id + contact_id)

## Scripts

### `scripts/scrape-glove-leads.mjs` — Main lead scraper
Scrapes businesses that use disposable gloves via Google Places across 110+ US cities, mines reviews for glove/PPE keyword mentions, scrapes websites for emails/phones, and pushes everything to Supabase.

**Phases:**
1. Search Google Places for businesses (38 query types × 110+ cities)
2. Mine reviews for glove/PPE keywords (30+ keywords)
3. Push companies to Supabase + scrape websites for emails
4. Create glove buyer contacts from reviewers
5. Create "Glove Buyers" list

```bash
GOOGLE_PLACES_API_KEY=AIzaSyCche2EK4cijAZNntMEs48vCYbpZdpKhrU \
SUPABASE_URL=https://hpakqrnvjnzznhffoqaf.supabase.co \
SUPABASE_KEY=<service_role_key> \
MAX_LEADS=20000 \
node scripts/scrape-glove-leads.mjs
```

**Options:**
- `MAX_LEADS=20000` — Target number of businesses
- `DRY_RUN=true` — Scrape without writing to DB

**Output files:**
- `glove-buyer-businesses.csv` — All businesses found
- `glove-buyer-reviewers.csv` — All glove-related reviewer contacts

## Target Business Types
Cannabis dispensaries, cannabis grow facilities, hydroponics stores, tattoo shops, auto detailing/body shops, dental offices, veterinary clinics, nail salons, hair salons, barber shops, commercial kitchens, catering companies, food trucks, janitorial supply stores, testing laboratories, manufacturing facilities, medical clinics, urgent care clinics, paint shops

## Glove/PPE Keywords Monitored
gloves, nitrile, latex gloves, vinyl gloves, disposable gloves, exam gloves, PPE, trimming, cannabis trim, grow operation, cultivation, dispensary supplies, food safe, food handling, tattoo supplies, cleaning supplies, janitorial supplies, auto detailing, salon supplies, lab supplies, bulk supplies, wholesale supplies, case pricing

## Search Queries Used
cannabis dispensary, marijuana dispensary, cannabis grow facility, cannabis cultivation, indoor grow operation, hydroponics store, tattoo shop, tattoo parlor, auto detailing shop, auto body shop, mechanic shop, dental office, dental clinic, veterinary clinic, nail salon, hair salon, barber shop, commercial kitchen, catering company, janitorial supply store, testing laboratory, manufacturing facility, and more (38 total)

## 110+ Target Cities
Heavy on cannabis-legal states: California (15 cities incl. Humboldt, Mendocino), Colorado (5), Oregon (5), Washington (5), Michigan (5), plus all major US metros. Oklahoma heavily represented (4 cities) due to large cannabis market.

## API Keys
- **Google Places API Key:** `AIzaSyCche2EK4cijAZNntMEs48vCYbpZdpKhrU`

### `scripts/enrich-consumers.mjs` — Reviewer contact enrichment (TODO)
Enriches glove-related reviewer contacts (name + city) with email + phone via 3 free people-search sites in parallel: FastPeopleSearch, TruePeopleSearch, ThatsThem. Not yet created — adapt from Viking Labs or Fresno Pool Care template.

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

// Contacts who mentioned gloves in reviews
const { data } = await supabase
  .from('contacts')
  .select('*')
  .contains('review_keywords', ['gloves']);

// Contacts in "Glove Buyers" list
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
