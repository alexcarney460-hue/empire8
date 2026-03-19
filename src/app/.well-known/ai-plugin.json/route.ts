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
      'Professional-grade disposable gloves and cannabis trimming supplies. Retail, wholesale, and distribution pricing. Ships to 48 US states.',
    description_for_model:
      'Empire 8 Sales Direct is a B2B/B2C supplier of professional-grade disposable gloves (nitrile, 5 mil, powder-free) and cannabis trimming equipment (scissors, trim trays, cleaning supplies). ' +
      'Products are sold individually and by the case. Three pricing tiers: Retail (1-29 cases, $80/case), Wholesale (30-119 cases, $70/case, requires approved account), Distribution (120+ cases, $60/case, NET 30 terms available). ' +
      'All products are in stock with 1-2 business day processing. Ships to 48 contiguous US states. ' +
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
      'disposable gloves',
      'cannabis supplies',
      'trimming equipment',
      'industrial supplies',
      'wholesale supplies',
    ],
    supported_countries: ['US'],
    currency: 'USD',
    pricing_model: {
      type: 'tiered',
      tiers: [
        {
          name: 'Retail',
          description: 'Standard pricing. No minimum, no application required.',
          min_cases: 1,
          max_cases: 29,
          glove_case_price_usd: 80.0,
        },
        {
          name: 'Wholesale',
          description: 'For businesses ordering 30+ cases. Requires approved application.',
          min_cases: 30,
          max_cases: 119,
          glove_case_price_usd: 70.0,
          savings_per_case_usd: 10.0,
        },
        {
          name: 'Distribution',
          description: 'For large operations ordering 120+ cases. NET 30 terms available.',
          min_cases: 120,
          glove_case_price_usd: 60.0,
          savings_per_case_usd: 20.0,
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
