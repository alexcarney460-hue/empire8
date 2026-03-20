// ---------------------------------------------------------------------------
// Static brand + product seed data for Empire 8
// Used as fallback when Supabase is unavailable and as source for the seed script
// ---------------------------------------------------------------------------

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string;
  contactEmail: string;
  website: string | null;
}

export interface BrandProduct {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  imageUrl: string | null;
  unitPriceCents: number;
  unitType: string;
  minOrderQty: number;
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export const BRANDS: readonly Brand[] = [
  {
    id: 'brand_empire_extracts',
    name: 'Empire Extracts',
    slug: 'empire-extracts',
    logoUrl: null,
    description:
      'Premium concentrates and vape cartridges crafted in small batches across New York State. Known for high-potency live resin and solventless extractions.',
    contactEmail: 'wholesale@empireextracts.com',
    website: 'https://empireextracts.com',
  },
  {
    id: 'brand_hudson_valley_flower',
    name: 'Hudson Valley Flower Co.',
    slug: 'hudson-valley-flower-co',
    logoUrl: null,
    description:
      'Craft flower and infused pre-rolls grown in the Hudson Valley. Sun-assisted greenhouse cultivation with a focus on terpene-rich, small-batch genetics.',
    contactEmail: 'orders@hudsonvalleyflower.com',
    website: 'https://hudsonvalleyflower.com',
  },
  {
    id: 'brand_brooklyn_botanics',
    name: 'Brooklyn Botanics',
    slug: 'brooklyn-botanics',
    logoUrl: null,
    description:
      'Artisanal edibles and cannabis-infused beverages inspired by Brooklyn\u2019s food scene. Precise dosing, chef-driven recipes, and locally sourced ingredients.',
    contactEmail: 'hello@brooklynbotanics.com',
    website: 'https://brooklynbotanics.com',
  },
  {
    id: 'brand_upstate_roots',
    name: 'Upstate Roots',
    slug: 'upstate-roots',
    logoUrl: null,
    description:
      'Full-spectrum tinctures and capsules formulated for consistency and bioavailability. Lab-tested, physician-informed product line from upstate New York.',
    contactEmail: 'wholesale@upstateroots.com',
    website: 'https://upstateroots.com',
  },
  {
    id: 'brand_capital_cure',
    name: 'Capital Cure',
    slug: 'capital-cure',
    logoUrl: null,
    description:
      'Medical-grade flower and concentrates from the Capital Region. Rigorous testing standards and cultivar-specific processing for therapeutic outcomes.',
    contactEmail: 'sales@capitalcure.com',
    website: null,
  },
  {
    id: 'brand_five_boroughs',
    name: 'Five Boroughs Cannabis',
    slug: 'five-boroughs-cannabis',
    logoUrl: null,
    description:
      'A multi-category brand built for the New York dispensary. Flower, vapes, pre-rolls, and edibles \u2014 everything a retail shelf needs from a single partner.',
    contactEmail: 'partners@fiveboroughscannabis.com',
    website: 'https://fiveboroughscannabis.com',
  },
] as const;

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const PRODUCTS: readonly BrandProduct[] = [
  // ---- Empire Extracts (6 products: Concentrates + Vapes) -----------------
  {
    id: 'prod_ee_live_resin_1g',
    brandId: 'brand_empire_extracts',
    name: 'Live Resin Badder 1g',
    slug: 'live-resin-badder-1g',
    description: 'Single-source live resin badder with full terpene retention. Strain-specific batches.',
    category: 'Concentrates',
    imageUrl: null,
    unitPriceCents: 3500,
    unitType: 'unit',
    minOrderQty: 12,
  },
  {
    id: 'prod_ee_rosin_1g',
    brandId: 'brand_empire_extracts',
    name: 'Solventless Rosin 1g',
    slug: 'solventless-rosin-1g',
    description: 'Hash rosin pressed from ice-water hash. No solvents, no additives.',
    category: 'Concentrates',
    imageUrl: null,
    unitPriceCents: 5500,
    unitType: 'unit',
    minOrderQty: 12,
  },
  {
    id: 'prod_ee_shatter_1g',
    brandId: 'brand_empire_extracts',
    name: 'Shatter 1g',
    slug: 'shatter-1g',
    description: 'BHO shatter with consistent clarity and snap. High THC potency.',
    category: 'Concentrates',
    imageUrl: null,
    unitPriceCents: 2500,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_ee_cart_1g',
    brandId: 'brand_empire_extracts',
    name: 'Live Resin Cartridge 1g',
    slug: 'live-resin-cartridge-1g',
    description: '510-thread cartridge filled with strain-specific live resin distillate. Ceramic coil.',
    category: 'Vapes',
    imageUrl: null,
    unitPriceCents: 2800,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_ee_cart_half',
    brandId: 'brand_empire_extracts',
    name: 'Distillate Cartridge 0.5g',
    slug: 'distillate-cartridge-half',
    description: 'Classic distillate cart with botanical terpenes. Affordable entry point.',
    category: 'Vapes',
    imageUrl: null,
    unitPriceCents: 1500,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_ee_disposable',
    brandId: 'brand_empire_extracts',
    name: 'All-in-One Disposable 1g',
    slug: 'all-in-one-disposable-1g',
    description: 'Rechargeable disposable pen with live resin. Draw-activated, no buttons.',
    category: 'Vapes',
    imageUrl: null,
    unitPriceCents: 2200,
    unitType: 'unit',
    minOrderQty: 24,
  },

  // ---- Hudson Valley Flower Co. (5 products: Flower + Pre-Rolls) ----------
  {
    id: 'prod_hv_premium_oz',
    brandId: 'brand_hudson_valley_flower',
    name: 'Premium Flower 1oz',
    slug: 'premium-flower-1oz',
    description: 'Top-shelf, hand-trimmed flower in strain-specific jars. Greenhouse-grown.',
    category: 'Flower',
    imageUrl: null,
    unitPriceCents: 27500,
    unitType: 'oz',
    minOrderQty: 6,
  },
  {
    id: 'prod_hv_smalls_oz',
    brandId: 'brand_hudson_valley_flower',
    name: 'Smalls 1oz',
    slug: 'smalls-1oz',
    description: 'Small buds from the same premium genetics. Great value for dispensary shelves.',
    category: 'Flower',
    imageUrl: null,
    unitPriceCents: 17500,
    unitType: 'oz',
    minOrderQty: 12,
  },
  {
    id: 'prod_hv_half_oz',
    brandId: 'brand_hudson_valley_flower',
    name: 'Half Ounce Jar',
    slug: 'half-ounce-jar',
    description: 'Consumer-ready half-ounce jar with tamper-evident seal and humidity pack.',
    category: 'Flower',
    imageUrl: null,
    unitPriceCents: 15000,
    unitType: 'unit',
    minOrderQty: 12,
  },
  {
    id: 'prod_hv_preroll_single',
    brandId: 'brand_hudson_valley_flower',
    name: 'Infused Pre-Roll Single 1g',
    slug: 'infused-preroll-single',
    description: 'Flower-only pre-roll infused with kief. Individual tube packaging.',
    category: 'Pre-Rolls',
    imageUrl: null,
    unitPriceCents: 800,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_hv_preroll_5pk',
    brandId: 'brand_hudson_valley_flower',
    name: 'Pre-Roll 5-Pack (0.5g each)',
    slug: 'preroll-5-pack',
    description: 'Five half-gram pre-rolls in a branded slide box. Mixed strain option available.',
    category: 'Pre-Rolls',
    imageUrl: null,
    unitPriceCents: 4500,
    unitType: 'pack',
    minOrderQty: 12,
  },

  // ---- Brooklyn Botanics (6 products: Edibles + Beverages) ----------------
  {
    id: 'prod_bb_gummies_10pk',
    brandId: 'brand_brooklyn_botanics',
    name: 'Gummies 10-Pack (100mg)',
    slug: 'gummies-10-pack-100mg',
    description: 'Vegan fruit gummies, 10mg per piece. Assorted tropical flavors.',
    category: 'Edibles',
    imageUrl: null,
    unitPriceCents: 1200,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_bb_chocolate_bar',
    brandId: 'brand_brooklyn_botanics',
    name: 'Dark Chocolate Bar (100mg)',
    slug: 'dark-chocolate-bar-100mg',
    description: 'Single-origin dark chocolate scored into 10mg segments. Bean-to-bar craft.',
    category: 'Edibles',
    imageUrl: null,
    unitPriceCents: 1500,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_bb_caramels',
    brandId: 'brand_brooklyn_botanics',
    name: 'Sea Salt Caramels 5-Pack (50mg)',
    slug: 'sea-salt-caramels-5pk',
    description: 'Individually wrapped caramels with fleur de sel. 10mg each.',
    category: 'Edibles',
    imageUrl: null,
    unitPriceCents: 1000,
    unitType: 'pack',
    minOrderQty: 24,
  },
  {
    id: 'prod_bb_seltzer_lemon',
    brandId: 'brand_brooklyn_botanics',
    name: 'Lemon Ginger Seltzer (10mg)',
    slug: 'lemon-ginger-seltzer-10mg',
    description: 'Sparkling cannabis seltzer with real ginger and lemon. Zero sugar, fast onset.',
    category: 'Beverages',
    imageUrl: null,
    unitPriceCents: 700,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_bb_seltzer_berry',
    brandId: 'brand_brooklyn_botanics',
    name: 'Mixed Berry Seltzer (10mg)',
    slug: 'mixed-berry-seltzer-10mg',
    description: 'Berry-flavored cannabis seltzer with nano-emulsion for rapid absorption.',
    category: 'Beverages',
    imageUrl: null,
    unitPriceCents: 700,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_bb_cold_brew',
    brandId: 'brand_brooklyn_botanics',
    name: 'Cold Brew Coffee (20mg)',
    slug: 'cold-brew-coffee-20mg',
    description: 'Nitrogen-infused cold brew with 20mg THC. Brooklyn-roasted beans.',
    category: 'Beverages',
    imageUrl: null,
    unitPriceCents: 1100,
    unitType: 'bottle',
    minOrderQty: 12,
  },

  // ---- Upstate Roots (4 products: Tinctures + Capsules) -------------------
  {
    id: 'prod_ur_tincture_1000',
    brandId: 'brand_upstate_roots',
    name: 'Full-Spectrum Tincture 1000mg',
    slug: 'full-spectrum-tincture-1000mg',
    description: '30mL dropper bottle with 1000mg THC. MCT oil base, unflavored.',
    category: 'Tinctures',
    imageUrl: null,
    unitPriceCents: 4000,
    unitType: 'bottle',
    minOrderQty: 12,
  },
  {
    id: 'prod_ur_tincture_500',
    brandId: 'brand_upstate_roots',
    name: 'Balanced Tincture 500mg (1:1 THC:CBD)',
    slug: 'balanced-tincture-500mg',
    description: '30mL dropper with equal parts THC and CBD. Ideal for new consumers.',
    category: 'Tinctures',
    imageUrl: null,
    unitPriceCents: 3000,
    unitType: 'bottle',
    minOrderQty: 12,
  },
  {
    id: 'prod_ur_caps_30',
    brandId: 'brand_upstate_roots',
    name: 'THC Capsules 30ct (10mg each)',
    slug: 'thc-capsules-30ct',
    description: 'Precisely dosed gel capsules. 10mg THC per cap, 300mg per bottle.',
    category: 'Capsules',
    imageUrl: null,
    unitPriceCents: 2500,
    unitType: 'bottle',
    minOrderQty: 12,
  },
  {
    id: 'prod_ur_caps_cbd',
    brandId: 'brand_upstate_roots',
    name: 'CBD Capsules 30ct (25mg each)',
    slug: 'cbd-capsules-30ct',
    description: 'Full-spectrum CBD capsules. 25mg per cap, third-party tested.',
    category: 'Capsules',
    imageUrl: null,
    unitPriceCents: 1800,
    unitType: 'bottle',
    minOrderQty: 12,
  },

  // ---- Capital Cure (5 products: Flower + Concentrates) -------------------
  {
    id: 'prod_cc_med_flower_oz',
    brandId: 'brand_capital_cure',
    name: 'Medical Grade Flower 1oz',
    slug: 'medical-grade-flower-1oz',
    description: 'Indoor-grown, hand-trimmed flower meeting medical testing standards. COA included.',
    category: 'Flower',
    imageUrl: null,
    unitPriceCents: 30000,
    unitType: 'oz',
    minOrderQty: 6,
  },
  {
    id: 'prod_cc_ground_half',
    brandId: 'brand_capital_cure',
    name: 'Ground Flower 14g',
    slug: 'ground-flower-14g',
    description: 'Pre-ground flower for easy consumption. Packaged with humidity control.',
    category: 'Flower',
    imageUrl: null,
    unitPriceCents: 8500,
    unitType: 'unit',
    minOrderQty: 12,
  },
  {
    id: 'prod_cc_rso',
    brandId: 'brand_capital_cure',
    name: 'RSO Syringe 1g',
    slug: 'rso-syringe-1g',
    description: 'Rick Simpson Oil in a measured syringe. Full-spectrum, high potency.',
    category: 'Concentrates',
    imageUrl: null,
    unitPriceCents: 4000,
    unitType: 'unit',
    minOrderQty: 12,
  },
  {
    id: 'prod_cc_crumble',
    brandId: 'brand_capital_cure',
    name: 'Crumble 1g',
    slug: 'crumble-1g',
    description: 'Dry, easy-to-handle concentrate with high cannabinoid content.',
    category: 'Concentrates',
    imageUrl: null,
    unitPriceCents: 2800,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_cc_diamonds',
    brandId: 'brand_capital_cure',
    name: 'THCa Diamonds 1g',
    slug: 'thca-diamonds-1g',
    description: 'Crystalline THCa with terp sauce. Maximum potency for experienced consumers.',
    category: 'Concentrates',
    imageUrl: null,
    unitPriceCents: 6000,
    unitType: 'unit',
    minOrderQty: 12,
  },

  // ---- Five Boroughs Cannabis (8 products: Flower, Vapes, Pre-Rolls, Edibles)
  {
    id: 'prod_fb_flower_oz',
    brandId: 'brand_five_boroughs',
    name: 'NYC Flower 1oz',
    slug: 'nyc-flower-1oz',
    description: 'Versatile everyday flower grown for consistency. Multiple strains available.',
    category: 'Flower',
    imageUrl: null,
    unitPriceCents: 22000,
    unitType: 'oz',
    minOrderQty: 6,
  },
  {
    id: 'prod_fb_flower_eighth',
    brandId: 'brand_five_boroughs',
    name: 'Flower Eighth (3.5g)',
    slug: 'flower-eighth',
    description: 'Consumer-ready eighth jar with child-resistant lid. Branded packaging.',
    category: 'Flower',
    imageUrl: null,
    unitPriceCents: 9500,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_fb_cart',
    brandId: 'brand_five_boroughs',
    name: 'Distillate Cart 1g',
    slug: 'distillate-cart-1g',
    description: 'High-potency distillate cartridge. 510-thread, strain-specific terpenes.',
    category: 'Vapes',
    imageUrl: null,
    unitPriceCents: 2000,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_fb_disposable',
    brandId: 'brand_five_boroughs',
    name: 'Disposable Vape 0.5g',
    slug: 'disposable-vape-half',
    description: 'Compact disposable pen. Draw-activated, pocket-friendly design.',
    category: 'Vapes',
    imageUrl: null,
    unitPriceCents: 1500,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_fb_preroll_3pk',
    brandId: 'brand_five_boroughs',
    name: 'Pre-Roll 3-Pack (1g each)',
    slug: 'preroll-3-pack',
    description: 'Three full-gram pre-rolls in a branded tin. Shareable format.',
    category: 'Pre-Rolls',
    imageUrl: null,
    unitPriceCents: 4000,
    unitType: 'pack',
    minOrderQty: 12,
  },
  {
    id: 'prod_fb_preroll_single',
    brandId: 'brand_five_boroughs',
    name: 'Single Pre-Roll 1g',
    slug: 'single-preroll-1g',
    description: 'Individual pre-roll in a doob tube. Impulse-buy price point.',
    category: 'Pre-Rolls',
    imageUrl: null,
    unitPriceCents: 600,
    unitType: 'unit',
    minOrderQty: 48,
  },
  {
    id: 'prod_fb_gummies',
    brandId: 'brand_five_boroughs',
    name: 'Gummies 10-Pack (100mg)',
    slug: 'fb-gummies-10-pack',
    description: 'Classic gummy bears in five fruit flavors. 10mg per piece.',
    category: 'Edibles',
    imageUrl: null,
    unitPriceCents: 1000,
    unitType: 'unit',
    minOrderQty: 24,
  },
  {
    id: 'prod_fb_mints',
    brandId: 'brand_five_boroughs',
    name: 'Peppermint Mints Tin (100mg)',
    slug: 'peppermint-mints-100mg',
    description: 'Discreet mint tin with 20 micro-dosed mints at 5mg each.',
    category: 'Edibles',
    imageUrl: null,
    unitPriceCents: 800,
    unitType: 'unit',
    minOrderQty: 24,
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers for API fallback (snake_case shape matching Supabase columns)
// ---------------------------------------------------------------------------

export interface BrandRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
  category: string | null;
  active: boolean;
}

export interface ProductRow {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  image_url: string | null;
  unit_price_cents: number;
  unit_type: string;
  min_order_qty: number;
  active: boolean;
}

function brandToRow(b: Brand): BrandRow {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    logo_url: b.logoUrl,
    website_url: b.website,
    category: null,
    active: true,
  };
}

function productToRow(p: BrandProduct): ProductRow {
  return {
    id: p.id,
    brand_id: p.brandId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    image_url: p.imageUrl,
    unit_price_cents: p.unitPriceCents,
    unit_type: p.unitType,
    min_order_qty: p.minOrderQty,
    active: true,
  };
}

/** All brands in Supabase-compatible row format */
export function getStaticBrandRows(): readonly BrandRow[] {
  return BRANDS.map(brandToRow);
}

/** All products in Supabase-compatible row format */
export function getStaticProductRows(): readonly ProductRow[] {
  return PRODUCTS.map(productToRow);
}

/** Single brand by slug (row format) */
export function getStaticBrandBySlug(slug: string): BrandRow | undefined {
  const brand = BRANDS.find((b) => b.slug === slug);
  return brand ? brandToRow(brand) : undefined;
}

/** Products for a given brand ID (row format) */
export function getStaticProductsByBrandId(brandId: string): readonly ProductRow[] {
  return PRODUCTS.filter((p) => p.brandId === brandId).map(productToRow);
}
