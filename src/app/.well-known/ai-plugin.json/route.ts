import { NextResponse } from 'next/server';

const BASE = 'https://empire8salesdirect.com';

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
      'Licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties. Premium flower, concentrates, edibles, and dispensary supplies at wholesale pricing.',
    description_for_model:
      'Empire 8 Sales Direct is a licensed cannabis wholesale supplier serving dispensaries across all 62 counties in New York state. ' +
      'Products include premium flower, concentrates (live resin, distillate, shatter), edibles, pre-rolls, vape cartridges, and dispensary accessories. ' +
      'Three pricing tiers: Starter (new dispensary accounts), Wholesale (volume ordering), Distribution (high-volume partners with NET 30 terms). ' +
      'All products are lab-tested and NYS compliant with 1-2 business day processing. Delivers across New York state. ' +
      'The product catalog is available as structured JSON at /products.json for programmatic access.',
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: `${BASE}/products.json`,
      has_user_authentication: false,
    },
    logo_url: `${BASE}/logo.jpg`,
    contact_email: 'info@empire8salesdirect.com',
    legal_info_url: `${BASE}/about`,
    product_catalog_url: `${BASE}/products.json`,
    website_url: BASE,
    categories: [
      'cannabis wholesale',
      'dispensary supply',
      'cannabis flower',
      'cannabis concentrates',
      'cannabis edibles',
    ],
    supported_countries: ['US'],
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
  };

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
