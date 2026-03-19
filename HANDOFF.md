# Value Suppliers -- Project Handoff

Last updated: 2026-03-16

---

## Project Overview

**Value Suppliers** (valuesuppliers.co) is a wholesale glove e-commerce store built on Next.js, deployed on Vercel. Payments are processed through Square, shipping labels are auto-purchased via Shippo, and customer/order data lives in Supabase.

- **Domain**: valuesuppliers.co
- **Business**: Wholesale disposable gloves (nitrile, latex, vinyl) + trimming accessories
- **Warehouse**: 1401 N Clovis Ave STE #103, Clovis, CA 93727

---

## Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.1.6 |
| React | React | 19.2.3 |
| Payments | Square SDK | v44.0.0 |
| Shipping | Shippo SDK | v2.18.0 |
| Database/CRM | Supabase | @supabase/supabase-js v2.98.0 |
| Auth (admin) | next-auth | v4.24.13 |
| Icons | lucide-react | v0.564.0 |
| CSS | Tailwind CSS | v4 |
| AI (chat/support) | @anthropic-ai/sdk | v0.78.0 |
| Language | TypeScript | v5 |

### Deployment

- **Host**: Vercel (git-triggered deploys from `main` branch)
- **Supabase project ID**: `hpakqrnvjnzznhffoqaf` (account: alexcarney460)

---

## Payment Flow (Square)

Square is used in **Production** mode. The checkout flow works as follows:

1. Customer adds items to cart (client-side `CartContext`)
2. Customer enters zip code in `CartDrawer` -> fetches live Shippo rates from `POST /api/shipping/estimate`
3. Customer selects a shipping rate
4. "Proceed to Checkout" calls `POST /api/checkout/session`
5. Server creates a Square payment link via `squareClient.checkout.paymentLinks.create`
   - All cart items are line items on the Square order
   - The selected shipping rate is added as an additional line item
   - `askForShippingAddress: true` collects the delivery address on Square's hosted page
   - Redirect URL after payment: `/checkout/success`
6. Customer pays on Square's hosted checkout page
7. Square fires a webhook to `/api/square/webhook`

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `payment.created` / `payment.updated` | Check `status === 'COMPLETED'`, then create order in Supabase, fetch line items from Square API, auto-ship via Shippo |
| `order.fulfillment.updated` | Update order status in Supabase |
| `subscription.created` / `subscription.updated` | Update subscription status |
| `invoice.payment_made` | Log subscription renewal |
| `invoice.payment_failed` | Log payment failure (dunning needed) |

**CRITICAL**: Square has NO `payment.completed` event. The webhook listens for `payment.created` and `payment.updated`, then checks `payment.status === 'COMPLETED'` before processing.

### Webhook Deduplication

The webhook deduplicates by `square_payment_id` -- before creating an order, it queries Supabase for an existing order with the same payment ID.

### Subscribe & Save (Autoship)

The cart supports two purchase modes: `one-time` and `autoship`. Mixed carts are blocked -- one-time and subscription items cannot be purchased together. Autoship items get a 10% discount (`AUTOSHIP_DISCOUNT = 0.10` in `square.ts`).

---

## Shipping Flow (Shippo)

### Pre-Checkout: Live Rate Quoting

1. `CartDrawer` collects the customer's zip code
2. `POST /api/shipping/estimate` calls `getRatesForZip()` in `shippo.ts`
3. `getRatesForZip()` builds multiple parcel strategies (see below), fires them all in parallel, deduplicates by carrier+service keeping the cheapest
4. Customer sees up to 6 rate options and selects one
5. The selected rate (carrier, service, price) is passed to the checkout session and added as a line item on the Square order

### Post-Payment: Auto-Ship

When the webhook receives a completed payment:

1. Estimates order weight from `order_items` product names matched to `DEFAULT_WEIGHTS`, or falls back to `$total * 0.5 lbs`
2. Calls `autoShipOrder()` which:
   - Builds multiple parcel strategies for the weight
   - Creates Shippo shipments for each strategy in parallel
   - Collects ALL rates across ALL strategies
   - Sorts by price and picks the absolute cheapest
   - Purchases the label (PDF format)
3. Updates the Supabase order with: `label_url`, `tracking_number`, `tracking_url`, `shippo_shipment_id`, `shippo_transaction_id`, `shipping_carrier`, `shipping_service`, `shipped_at`
4. If auto-ship fails, the order is still saved with status `paid` (shipping failure does not break the webhook)

### Parcel Strategies

`buildParcelStrategies()` in `shippo.ts` generates multiple packaging options for a given weight:

| Strategy | Condition | Description |
|----------|-----------|-------------|
| Single parcel with dimensions | Always | 16x12xH inches, height scales with weight |
| USPS Medium Flat Rate | Weight <= 20 lbs | `USPS_MediumFlatRateBox1` template |
| USPS Large Flat Rate | Weight <= 30 lbs | `USPS_LargeFlatRateBox` template |
| 2-parcel split | Weight > 20 lbs | Split weight in half |
| 3-parcel split | Weight > 40 lbs | Split weight in thirds |

### Fallback Weight Estimation

`shipping.ts` contains `calculateShipping()` with tiered flat-rate estimates. This is a **legacy fallback** -- the customer-facing cart now uses live Shippo rates. The `DEFAULT_WEIGHTS` map is still used by the webhook for weight estimation when auto-shipping.

**Free shipping has been completely removed.**

---

## Admin Dashboard

### Packing & Shipping Dashboard

**URL**: `/admin/shipping`

Displays orders with auto-purchased labels. For each order it shows:
- Ship-to address
- Carrier and tracking number
- Pack list (line items)
- "Print Label" button (opens Shippo label PDF)
- "Track" button (links to carrier tracking)

### Known Bug in Shipping Dashboard

The `/api/admin/accounting/orders` endpoint selects:
```
id, contact_id, email, status, total, items, shipping_address, created_at, updated_at
```

This is **missing** the shipping-specific columns that the shipping dashboard needs:
```
label_url, tracking_number, tracking_url, shipping_carrier, shipping_service,
shipping_name, shipping_address_line1, shipping_address_line2,
shipping_city, shipping_state, shipping_zip, shipping_country, shipped_at
```

The dashboard currently works around this by fetching individual orders from `/api/admin/crm/orders/[id]` (which does `select('*, order_items(*)')`) to get line items, but the main list query needs its SELECT updated to include shipping fields.

---

## Environment Variables (Vercel Production)

All env vars are set in Vercel. **Do NOT store secrets in code.**

| Variable | Purpose |
|----------|---------|
| `SQUARE_ACCESS_TOKEN` | Square API token (production) |
| `SQUARE_LOCATION_ID` | Square location ID |
| `SQUARE_ENVIRONMENT` | Set to `production` |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | HMAC key for verifying webhook payloads |
| `SQUARE_WEBHOOK_URL` | Full webhook URL (used in signature verification) |
| `SHIPPO_API_KEY` | Shippo API key |
| `SUPABASE_URL` | Supabase project URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client-side) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-side) |
| `ADMIN_ANALYTICS_TOKEN` | Token for admin API auth (server-side) |
| `NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN` | Same token exposed to admin UI |
| `RESEND_API_KEY` | Resend API key for transactional emails (order confirmation, shipping notification) |

**CRITICAL**: All Vercel env vars were pasted with trailing newlines. Every `process.env.X` read uses `.trim()` to handle this. If you add new env var reads, always `.trim()`.

---

## Database Schema (Supabase)

### `orders` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | int (PK) | Auto-increment |
| `contact_id` | int (FK) | References `contacts.id` |
| `square_order_id` | text | Square order ID |
| `square_payment_id` | text | Square payment ID (used for dedup) |
| `status` | text | `paid`, `shipped`, `processing`, `cancelled`, `paused` |
| `total` | numeric | Order total in USD (dollars, not cents) |
| `currency` | text | `USD` |
| `email` | text | Buyer email |
| `shipping_name` | text | Recipient name |
| `shipping_address_line1` | text | Street address |
| `shipping_address_line2` | text | Apt/suite |
| `shipping_city` | text | City |
| `shipping_state` | text | State |
| `shipping_zip` | text | Zip code |
| `shipping_country` | text | Country code |
| `tracking_number` | text | Carrier tracking number |
| `tracking_url` | text | Carrier tracking URL |
| `label_url` | text | Shippo label PDF URL |
| `shippo_shipment_id` | text | Shippo shipment ID |
| `shippo_transaction_id` | text | Shippo transaction ID |
| `shipping_carrier` | text | e.g. `USPS`, `UPS`, `FedEx` |
| `shipping_service` | text | e.g. `Priority Mail` |
| `shipped_at` | timestamptz | When label was purchased |
| `notes` | text | Receipt URL, etc. |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### `order_items` table

| Column | Type |
|--------|------|
| `id` | int (PK) |
| `order_id` | int (FK -> orders.id) |
| `product_name` | text |
| `sku` | text |
| `quantity` | int |
| `unit_price` | numeric |
| `total_price` | numeric |

### `contacts` table

CRM contacts. Created or updated on purchase. Key fields: `id`, `email`, `firstname`, `lastname`, `phone`, `source`, `lead_status`, `lifecycle_stage`.

---

## Key Files

### Core Libraries
| File | Purpose |
|------|---------|
| `src/lib/square.ts` | Square client init, location ID, autoship config |
| `src/lib/shippo.ts` | Shippo client, warehouse address, parcel strategies, rate fetching, label purchasing, auto-ship, tracking |
| `src/lib/shipping.ts` | Legacy weight-based shipping tiers, `DEFAULT_WEIGHTS` map (still used by webhook for weight estimation) |
| `src/lib/supabase-server.ts` | Server-side Supabase client |

### API Routes
| File | Purpose |
|------|---------|
| `src/app/api/square/webhook/route.ts` | Square webhook handler -- processes payments, creates orders, triggers auto-ship |
| `src/app/api/checkout/session/route.ts` | Creates Square payment links from cart items + selected shipping rate |
| `src/app/api/shipping/estimate/route.ts` | Returns live Shippo rates for a zip code + cart weight |
| `src/app/api/admin/accounting/orders/route.ts` | Admin: list orders (has SELECT bug, see Known Issues) |
| `src/app/api/admin/crm/orders/[id]/route.ts` | Admin: get/update single order with line items |

### Frontend
| File | Purpose |
|------|---------|
| `src/components/CartDrawer.tsx` | Slide-out cart with zip-based live shipping rate selection |
| `src/context/CartContext.tsx` | Cart state (items, quantities, one-time vs autoship) |
| `src/app/admin/shipping/page.tsx` | Admin packing dashboard -- shows orders with labels to print |

---

## Known Issues and TODO

### Bugs

1. ~~**Admin orders endpoint missing shipping fields**~~ **FIXED** -- The `/api/admin/accounting/orders/route.ts` SELECT query has been updated to include all shipping-specific columns (`label_url`, `tracking_number`, `tracking_url`, `shipping_carrier`, `shipping_service`, `shipping_name`, `shipping_address_line1`, etc.).

### In Progress / Planned Features

2. **Auto-print agent** -- Local agent that watches Supabase for new labels and automatically prints them to a connected shipping label printer. Design choice: "Option 2" (local agent polling for new labels). Not yet built.

3. **Customer email notifications** -- Transactional emails via Resend for order confirmation and shipping notification with tracking info. Requires `RESEND_API_KEY` env var. Being built -- will trigger from the webhook after auto-ship succeeds.

### Resolved Cleanup

4. ~~**Webhook logging**~~ **CLEANED UP** -- Debug `console.log` statements removed from webhook handler and all API routes. Error logging (`console.error`) retained but sanitized to avoid logging full error objects or sensitive data.

5. **Free shipping removed** -- Free shipping was intentionally removed per user request. Do not re-add.

---

## Marketing Campaign — Triple OG Gloves

### Overview

The product brand for social media marketing is **Triple OG Gloves** — cannabis-specific branding for the 5 mil nitrile gloves sold through ValueSuppliers.co. The site stays as ValueSuppliers.co; Triple OG is the product brand used in social content.

### Landing Page

- **URL**: `/triple-og` -- dark, edgy landing page for social media traffic
- Sections: hero, social proof stats, product benefits, specs, use cases, pricing tiers, CTA
- Links back to `/catalog` for purchases and `/wholesale` for applications

### Social Content Calendar

- **File**: `scripts/seed-marketing-content.mjs`
- 14 Instagram posts over 2 weeks (Reels, Carousels, Static, Stories)
- Each post has full reel scripts, carousel slide breakdowns, image prompts, captions, and hashtag sets
- Preview: `node scripts/seed-marketing-content.mjs --preview`
- Seed to admin queue: `node scripts/seed-marketing-content.mjs`
- All content avoids Tier 1 shadowban-risk hashtags, focuses on education and lifestyle

### Product Video Reels (Runway Gen-4)

- **File**: `scripts/generate-product-reels.py`
- 8 shot definitions matched to content calendar posts (glove snap, stretch test, case hero, trim room, etc.)
- Uses Runway Gen-4 Turbo API (image-to-video) with AVIF-to-JPEG conversion via ffmpeg
- API key: `C:/Users/Claud/Desktop/keys/runwayapi.txt`
- **Needs Runway credits** to generate — pipeline tested and working
- Usage: `python scripts/generate-product-reels.py --list` or `--all` or `--shot glove-snap`

---

## Lead Generation & CRM Pipeline

### Cannabis/Hemp License Scraper

- **Master CSV**: `cannabis-hemp-grows-2026-03-17.csv` — ~7,300 licensed facilities across 34 states
- **CA DCC API scraper**: `scripts/scrape-ca-dcc-api.py` — intercepts Azure API, gets full data (name, address, email, phone, owner) for ~6,754 CA licenses. Paginated, 500/page.
- **Multi-state Brave Search scraper**: `scripts/scrape-cannabis-licenses.mjs` — Socrata APIs (NY) + Brave Search (30 states) for cultivators, labs, bakeries, distributors
- **OR OLCC**: Tableau CSV export via `curl -sk` (SSL cert issue on their end)
- **WA LCB**: Excel download from lcb.wa.gov/records/frequently-requested-lists (retailers + labs only; producers are in Socrata which has DNS issues from some networks)
- **Playwright scraper**: `scripts/scrape-state-licenses-playwright.py` — browser automation for CA DCC with screenshot verification

### Data Quality

| Metric | Count |
|--------|-------|
| Total facilities | ~7,300 |
| With email | ~81% |
| With phone | ~81% |
| With owner name | ~77% (CA data) |
| States covered | 34 |

### Email Enrichment

- **File**: `scripts/enrich-cannabis-leads.mjs`
- For records missing email: Brave Search → find website → scrape /contact page → extract email/phone
- ~48% hit rate on website scraping
- Saves progress every 50 records, updates master CSV in-place
- Usage: `node scripts/enrich-cannabis-leads.mjs --limit 500 --state OR`

### Outreach Email System

- **API**: `POST /api/admin/marketing/outreach` — preview, send-batch, stats
- **CLI**: `scripts/send-outreach-batch.mjs` — batch sender reading from master CSV
- **Unsubscribe**: `GET /api/unsubscribe?email=xxx` — CAN-SPAM compliant, marks lead as unsubscribed
- **Templates**: 4 auto-selected by license type (intro/grow, lab, distributor, manufacturer)
- **Personalization**: owner first name, company name, city, county from CSV data
- **Plain text** emails (better deliverability for cold outreach)
- **Dedup**: JSONL sent log at `tmp/outreach-sent.jsonl`
- **Rate limiting**: 350ms between sends, backs off on 429s
- **From address**: `grow@mail.valuesuppliers.co` (subdomain to protect main domain)
- **BLOCKED**: Resend domain `mail.valuesuppliers.co` not yet verified. Need to add DNS records in Resend dashboard (resend.com/domains). The current API key is send-only (can't manage domains via API).

Usage:
```bash
# Preview
RESEND_API_KEY=xxx node scripts/send-outreach-batch.mjs --preview

# Dry run
RESEND_API_KEY=xxx node scripts/send-outreach-batch.mjs --dry-run --limit 50

# Send batch
RESEND_API_KEY=xxx node scripts/send-outreach-batch.mjs --limit 200

# CA only
RESEND_API_KEY=xxx node scripts/send-outreach-batch.mjs --state CA --limit 500
```

---

## Gotchas

1. **Vercel env var trailing newlines** -- All `process.env.X` reads MUST use `.trim()`. This is already done everywhere but keep it in mind when adding new env var usage.

2. **Square has NO `payment.completed` event** -- The webhook listens for `payment.created` and `payment.updated`, then checks `payment.status === 'COMPLETED'`. Do not try to subscribe to `payment.completed`.

3. **Shippo ParcelSpec union type** -- The `parcels` array passed to `shippoClient.shipments.create()` uses an `any` cast on the `.map()` callback because Shippo's TypeScript types define a union of template-based vs dimension-based parcels that doesn't play nicely with `.map()`.

4. **Shippo trackingStatus.get() argument order** -- The method signature is `get(trackingNumber, carrier)`, NOT `get(carrier, trackingNumber)`.

5. **Weight estimation fallback** -- If line items can't be matched to `DEFAULT_WEIGHTS` by slug, the webhook falls back to `total_dollars * 0.5` as a rough weight estimate. Minimum 5 lbs.

6. **Square webhook signature verification** -- Uses HMAC-SHA256 with `notificationUrl + body` as the message. The `SQUARE_WEBHOOK_URL` env var must exactly match the URL Square sends to, including protocol and path.

7. **Mixed cart restriction** -- One-time and autoship items cannot be in the same cart. The frontend blocks checkout and the backend returns a 400 error if both are present.

8. **Resend API key is send-only** -- Cannot manage domains or view analytics via API. Domain verification must be done in the Resend web dashboard at resend.com/domains.

9. **CA DCC API endpoint** -- `https://as-dcc-pub-cann-w-p-002.azurewebsites.net/licenses/filteredSearch` — discovered by intercepting network requests from search.cannabis.ca.gov. May change if CA updates their backend.

10. **WA/OR Socrata DNS** -- `data.lcb.wa.gov` and `data.olcc.state.or.us` don't resolve from some networks. OR workaround: `curl -sk` (skip SSL). WA workaround: download Excel from lcb.wa.gov directly.
