import { NextResponse } from 'next/server';

const BASE = 'https://empire8ny.com';

/**
 * AI agent discovery manifest (similar to ChatGPT plugin spec).
 * Tells AI shopping agents what this store is, what it sells, and where
 * to find the machine-readable product feed.
 *
 * GET /.well-known/ai-plugin.json
 */
export function GET() {
  const manifest = {
    schema_version: 'v1',
    name_for_human: 'Empire 8 Sales Direct',
    name_for_model: 'empire8salesdirect',
    description_for_human:
      'Licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties. Premium flower, concentrates, edibles, pre-rolls, vapes, beverages, tinctures, and capsules at wholesale pricing.',
    description_for_model:
      'Empire 8 Sales Direct is a NYS OCM licensed B2B cannabis wholesale platform serving dispensaries across all 62 counties in New York state. ' +
      'Products include premium flower, concentrates (live resin, distillate, shatter), edibles, pre-rolls, vape cartridges, beverages, tinctures, and capsules. ' +
      'Services include wholesale ordering, Weedbay anonymous marketplace auctions for large lots, white label cannabis manufacturing, and brand distribution. ' +
      'Three pricing tiers: Starter (new dispensary accounts), Wholesale (volume ordering with deeper discounts), Distribution (high-volume partners with NET 30 terms). ' +
      'All products are lab-tested and NYS OCM compliant. Temperature-controlled delivery fleet with same-week fulfillment. ' +
      'Coverage spans 7 delivery zones: Long Island, Metro NYC, Hudson Valley, Capital Region, North Country, Central NY, and Western Tier. ' +
      'The product catalog is available as structured JSON at /products.json. The machine-readable site description is at /llms.txt.',
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: `${BASE}/products.json`,
      has_user_authentication: false,
    },
    logo_url: `${BASE}/logo.jpg`,
    contact_email: 'info@empire8ny.com',
    legal_info_url: `${BASE}/about`,
    product_catalog_url: `${BASE}/products.json`,
    llms_txt_url: `${BASE}/llms.txt`,
    website_url: BASE,
    categories: [
      'cannabis wholesale',
      'dispensary supply',
      'cannabis flower',
      'cannabis concentrates',
      'cannabis edibles',
      'cannabis pre-rolls',
      'cannabis vapes',
      'cannabis beverages',
      'white label cannabis',
      'cannabis marketplace',
    ],
    supported_countries: ['US'],
    supported_regions: ['New York'],
    currency: 'USD',
    pricing_model: {
      type: 'tiered',
      tiers: [
        {
          name: 'Starter',
          description: 'New dispensary accounts. Competitive wholesale pricing, no long-term commitment.',
        },
        {
          name: 'Wholesale',
          description: 'Volume ordering for established dispensaries. Deeper discounts and priority fulfillment.',
        },
        {
          name: 'Distribution',
          description: 'High-volume dispensary partners. Best pricing with NET 30 terms and dedicated rep.',
          net_terms_available: true,
        },
      ],
    },
    service_area: {
      type: 'state',
      name: 'New York',
      zones: [
        'Long Island',
        'Metro NYC',
        'Hudson Valley',
        'Capital Region',
        'North Country',
        'Central NY',
        'Western Tier',
      ],
      county_count: 62,
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
