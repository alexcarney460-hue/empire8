import { NextResponse } from 'next/server';
import PRODUCTS from '@/lib/products';

const BASE = 'https://empire8ny.com';

/**
 * Machine-readable product feed optimized for AI shopping agents.
 * Returns all products with full pricing tiers, specifications, and availability.
 *
 * GET /products.json
 */
export function GET() {
  const products = PRODUCTS.map((p) => {
    const pricingTiers: Record<string, unknown>[] = [
      {
        tier: 'retail',
        price: p.casePrice ?? p.price,
        currency: 'USD',
        unit: p.unit.replace(/^\/\s*/, ''),
        minQuantity: 1,
        ...(p.casePrice != null ? { maxQuantity: 29 } : {}),
      },
    ];

    if (p.wholesalePrice != null) {
      pricingTiers.push({
        tier: 'wholesale',
        price: p.wholesalePrice,
        currency: 'USD',
        unit: 'case',
        minQuantity: 30,
        maxQuantity: 119,
        requiresApproval: true,
      });
    }

    if (p.distributorPrice != null) {
      pricingTiers.push({
        tier: 'distribution',
        price: p.distributorPrice,
        currency: 'USD',
        unit: 'case',
        minQuantity: 120,
        requiresApproval: true,
        netTermsAvailable: true,
      });
    }

    const specifications: Record<string, string> = {};
    for (const spec of p.specs) {
      specifications[spec.label.toLowerCase().replace(/\s+/g, '_')] = spec.value;
    }

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortName: p.shortName,
      description: p.description,
      tagline: p.tagline,
      category: p.category,
      url: `${BASE}/catalog/${p.slug}`,
      image: `${BASE}${p.img}`,
      images: p.images.map((img) => `${BASE}${img}`),
      availability: p.inStock ? 'in_stock' : 'out_of_stock',
      pricing: pricingTiers,
      specifications,
      features: p.features,
      useCases: p.useCases,
      ...(p.caseBoxCount != null
        ? {
            caseDetails: {
              boxesPerCase: p.caseBoxCount,
              glovesPerCase: p.caseGloveCount,
              pricePerBox: p.boxPrice,
            },
          }
        : {}),
      relatedProducts: p.relatedSlugs.map((s) => `${BASE}/catalog/${s}`),
    };
  });

  const feed = {
    store: {
      name: 'Empire 8 Sales Direct',
      url: BASE,
      description:
        'Professional-grade disposable gloves and cannabis trimming supplies. Retail, wholesale, and distribution pricing.',
      contact: 'info@empire8ny.com',
      shipsTo: 'US (48 contiguous states)',
      processingTime: '1-2 business days',
    },
    generatedAt: new Date().toISOString(),
    productCount: products.length,
    categories: ['Gloves', 'Trimmers', 'Accessories'],
    pricingModel: {
      retail: { description: 'Standard pricing, no minimum order', minCases: 1 },
      wholesale: { description: 'Approved accounts, 30+ cases per order, save $10/case', minCases: 30 },
      distribution: { description: 'Approved accounts, 120+ cases, NET 30 terms, save $20/case', minCases: 120 },
    },
    products,
  };

  return NextResponse.json(feed, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
