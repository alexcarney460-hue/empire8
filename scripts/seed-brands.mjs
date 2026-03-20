#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Seed script: inserts brands and products into Supabase
// Usage: node scripts/seed-brands.mjs
//
// Environment variables (reads from .env.local if present):
//   SUPABASE_URL              — project URL
//   SUPABASE_SERVICE_ROLE_KEY — service-role key (NOT the anon key)
// ---------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Load .env.local if it exists
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local not found — rely on environment variables
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// Resolve Supabase credentials
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Missing environment variables.\n' +
    'Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.\n' +
    'You can place them in .env.local at the project root.',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Static data (mirrors src/lib/brands-data.ts)
// We inline it here so the seed script has zero build-step dependencies.
// ---------------------------------------------------------------------------

const BRANDS = [
  {
    id: 'brand_empire_extracts',
    name: 'Empire Extracts',
    slug: 'empire-extracts',
    logo_url: null,
    description: 'Premium concentrates and vape cartridges crafted in small batches across New York State. Known for high-potency live resin and solventless extractions.',
    contact_email: 'wholesale@empireextracts.com',
    website_url: 'https://empireextracts.com',
    active: true,
  },
  {
    id: 'brand_hudson_valley_flower',
    name: 'Hudson Valley Flower Co.',
    slug: 'hudson-valley-flower-co',
    logo_url: null,
    description: 'Craft flower and infused pre-rolls grown in the Hudson Valley. Sun-assisted greenhouse cultivation with a focus on terpene-rich, small-batch genetics.',
    contact_email: 'orders@hudsonvalleyflower.com',
    website_url: 'https://hudsonvalleyflower.com',
    active: true,
  },
  {
    id: 'brand_brooklyn_botanics',
    name: 'Brooklyn Botanics',
    slug: 'brooklyn-botanics',
    logo_url: null,
    description: 'Artisanal edibles and cannabis-infused beverages inspired by Brooklyn\u2019s food scene. Precise dosing, chef-driven recipes, and locally sourced ingredients.',
    contact_email: 'hello@brooklynbotanics.com',
    website_url: 'https://brooklynbotanics.com',
    active: true,
  },
  {
    id: 'brand_upstate_roots',
    name: 'Upstate Roots',
    slug: 'upstate-roots',
    logo_url: null,
    description: 'Full-spectrum tinctures and capsules formulated for consistency and bioavailability. Lab-tested, physician-informed product line from upstate New York.',
    contact_email: 'wholesale@upstateroots.com',
    website_url: 'https://upstateroots.com',
    active: true,
  },
  {
    id: 'brand_capital_cure',
    name: 'Capital Cure',
    slug: 'capital-cure',
    logo_url: null,
    description: 'Medical-grade flower and concentrates from the Capital Region. Rigorous testing standards and cultivar-specific processing for therapeutic outcomes.',
    contact_email: 'sales@capitalcure.com',
    website_url: null,
    active: true,
  },
  {
    id: 'brand_five_boroughs',
    name: 'Five Boroughs Cannabis',
    slug: 'five-boroughs-cannabis',
    logo_url: null,
    description: 'A multi-category brand built for the New York dispensary. Flower, vapes, pre-rolls, and edibles \u2014 everything a retail shelf needs from a single partner.',
    contact_email: 'partners@fiveboroughscannabis.com',
    website_url: 'https://fiveboroughscannabis.com',
    active: true,
  },
];

const PRODUCTS = [
  // Empire Extracts
  { id: 'prod_ee_live_resin_1g', brand_id: 'brand_empire_extracts', name: 'Live Resin Badder 1g', slug: 'live-resin-badder-1g', description: 'Single-source live resin badder with full terpene retention. Strain-specific batches.', category: 'Concentrates', image_url: null, unit_price_cents: 3500, unit_type: 'unit', min_order_qty: 12, active: true },
  { id: 'prod_ee_rosin_1g', brand_id: 'brand_empire_extracts', name: 'Solventless Rosin 1g', slug: 'solventless-rosin-1g', description: 'Hash rosin pressed from ice-water hash. No solvents, no additives.', category: 'Concentrates', image_url: null, unit_price_cents: 5500, unit_type: 'unit', min_order_qty: 12, active: true },
  { id: 'prod_ee_shatter_1g', brand_id: 'brand_empire_extracts', name: 'Shatter 1g', slug: 'shatter-1g', description: 'BHO shatter with consistent clarity and snap. High THC potency.', category: 'Concentrates', image_url: null, unit_price_cents: 2500, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_ee_cart_1g', brand_id: 'brand_empire_extracts', name: 'Live Resin Cartridge 1g', slug: 'live-resin-cartridge-1g', description: '510-thread cartridge filled with strain-specific live resin distillate. Ceramic coil.', category: 'Vapes', image_url: null, unit_price_cents: 2800, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_ee_cart_half', brand_id: 'brand_empire_extracts', name: 'Distillate Cartridge 0.5g', slug: 'distillate-cartridge-half', description: 'Classic distillate cart with botanical terpenes. Affordable entry point.', category: 'Vapes', image_url: null, unit_price_cents: 1500, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_ee_disposable', brand_id: 'brand_empire_extracts', name: 'All-in-One Disposable 1g', slug: 'all-in-one-disposable-1g', description: 'Rechargeable disposable pen with live resin. Draw-activated, no buttons.', category: 'Vapes', image_url: null, unit_price_cents: 2200, unit_type: 'unit', min_order_qty: 24, active: true },

  // Hudson Valley Flower Co.
  { id: 'prod_hv_premium_oz', brand_id: 'brand_hudson_valley_flower', name: 'Premium Flower 1oz', slug: 'premium-flower-1oz', description: 'Top-shelf, hand-trimmed flower in strain-specific jars. Greenhouse-grown.', category: 'Flower', image_url: null, unit_price_cents: 27500, unit_type: 'oz', min_order_qty: 6, active: true },
  { id: 'prod_hv_smalls_oz', brand_id: 'brand_hudson_valley_flower', name: 'Smalls 1oz', slug: 'smalls-1oz', description: 'Small buds from the same premium genetics. Great value for dispensary shelves.', category: 'Flower', image_url: null, unit_price_cents: 17500, unit_type: 'oz', min_order_qty: 12, active: true },
  { id: 'prod_hv_half_oz', brand_id: 'brand_hudson_valley_flower', name: 'Half Ounce Jar', slug: 'half-ounce-jar', description: 'Consumer-ready half-ounce jar with tamper-evident seal and humidity pack.', category: 'Flower', image_url: null, unit_price_cents: 15000, unit_type: 'unit', min_order_qty: 12, active: true },
  { id: 'prod_hv_preroll_single', brand_id: 'brand_hudson_valley_flower', name: 'Infused Pre-Roll Single 1g', slug: 'infused-preroll-single', description: 'Flower-only pre-roll infused with kief. Individual tube packaging.', category: 'Pre-Rolls', image_url: null, unit_price_cents: 800, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_hv_preroll_5pk', brand_id: 'brand_hudson_valley_flower', name: 'Pre-Roll 5-Pack (0.5g each)', slug: 'preroll-5-pack', description: 'Five half-gram pre-rolls in a branded slide box. Mixed strain option available.', category: 'Pre-Rolls', image_url: null, unit_price_cents: 4500, unit_type: 'pack', min_order_qty: 12, active: true },

  // Brooklyn Botanics
  { id: 'prod_bb_gummies_10pk', brand_id: 'brand_brooklyn_botanics', name: 'Gummies 10-Pack (100mg)', slug: 'gummies-10-pack-100mg', description: 'Vegan fruit gummies, 10mg per piece. Assorted tropical flavors.', category: 'Edibles', image_url: null, unit_price_cents: 1200, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_bb_chocolate_bar', brand_id: 'brand_brooklyn_botanics', name: 'Dark Chocolate Bar (100mg)', slug: 'dark-chocolate-bar-100mg', description: 'Single-origin dark chocolate scored into 10mg segments. Bean-to-bar craft.', category: 'Edibles', image_url: null, unit_price_cents: 1500, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_bb_caramels', brand_id: 'brand_brooklyn_botanics', name: 'Sea Salt Caramels 5-Pack (50mg)', slug: 'sea-salt-caramels-5pk', description: 'Individually wrapped caramels with fleur de sel. 10mg each.', category: 'Edibles', image_url: null, unit_price_cents: 1000, unit_type: 'pack', min_order_qty: 24, active: true },
  { id: 'prod_bb_seltzer_lemon', brand_id: 'brand_brooklyn_botanics', name: 'Lemon Ginger Seltzer (10mg)', slug: 'lemon-ginger-seltzer-10mg', description: 'Sparkling cannabis seltzer with real ginger and lemon. Zero sugar, fast onset.', category: 'Beverages', image_url: null, unit_price_cents: 700, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_bb_seltzer_berry', brand_id: 'brand_brooklyn_botanics', name: 'Mixed Berry Seltzer (10mg)', slug: 'mixed-berry-seltzer-10mg', description: 'Berry-flavored cannabis seltzer with nano-emulsion for rapid absorption.', category: 'Beverages', image_url: null, unit_price_cents: 700, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_bb_cold_brew', brand_id: 'brand_brooklyn_botanics', name: 'Cold Brew Coffee (20mg)', slug: 'cold-brew-coffee-20mg', description: 'Nitrogen-infused cold brew with 20mg THC. Brooklyn-roasted beans.', category: 'Beverages', image_url: null, unit_price_cents: 1100, unit_type: 'bottle', min_order_qty: 12, active: true },

  // Upstate Roots
  { id: 'prod_ur_tincture_1000', brand_id: 'brand_upstate_roots', name: 'Full-Spectrum Tincture 1000mg', slug: 'full-spectrum-tincture-1000mg', description: '30mL dropper bottle with 1000mg THC. MCT oil base, unflavored.', category: 'Tinctures', image_url: null, unit_price_cents: 4000, unit_type: 'bottle', min_order_qty: 12, active: true },
  { id: 'prod_ur_tincture_500', brand_id: 'brand_upstate_roots', name: 'Balanced Tincture 500mg (1:1 THC:CBD)', slug: 'balanced-tincture-500mg', description: '30mL dropper with equal parts THC and CBD. Ideal for new consumers.', category: 'Tinctures', image_url: null, unit_price_cents: 3000, unit_type: 'bottle', min_order_qty: 12, active: true },
  { id: 'prod_ur_caps_30', brand_id: 'brand_upstate_roots', name: 'THC Capsules 30ct (10mg each)', slug: 'thc-capsules-30ct', description: 'Precisely dosed gel capsules. 10mg THC per cap, 300mg per bottle.', category: 'Capsules', image_url: null, unit_price_cents: 2500, unit_type: 'bottle', min_order_qty: 12, active: true },
  { id: 'prod_ur_caps_cbd', brand_id: 'brand_upstate_roots', name: 'CBD Capsules 30ct (25mg each)', slug: 'cbd-capsules-30ct', description: 'Full-spectrum CBD capsules. 25mg per cap, third-party tested.', category: 'Capsules', image_url: null, unit_price_cents: 1800, unit_type: 'bottle', min_order_qty: 12, active: true },

  // Capital Cure
  { id: 'prod_cc_med_flower_oz', brand_id: 'brand_capital_cure', name: 'Medical Grade Flower 1oz', slug: 'medical-grade-flower-1oz', description: 'Indoor-grown, hand-trimmed flower meeting medical testing standards. COA included.', category: 'Flower', image_url: null, unit_price_cents: 30000, unit_type: 'oz', min_order_qty: 6, active: true },
  { id: 'prod_cc_ground_half', brand_id: 'brand_capital_cure', name: 'Ground Flower 14g', slug: 'ground-flower-14g', description: 'Pre-ground flower for easy consumption. Packaged with humidity control.', category: 'Flower', image_url: null, unit_price_cents: 8500, unit_type: 'unit', min_order_qty: 12, active: true },
  { id: 'prod_cc_rso', brand_id: 'brand_capital_cure', name: 'RSO Syringe 1g', slug: 'rso-syringe-1g', description: 'Rick Simpson Oil in a measured syringe. Full-spectrum, high potency.', category: 'Concentrates', image_url: null, unit_price_cents: 4000, unit_type: 'unit', min_order_qty: 12, active: true },
  { id: 'prod_cc_crumble', brand_id: 'brand_capital_cure', name: 'Crumble 1g', slug: 'crumble-1g', description: 'Dry, easy-to-handle concentrate with high cannabinoid content.', category: 'Concentrates', image_url: null, unit_price_cents: 2800, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_cc_diamonds', brand_id: 'brand_capital_cure', name: 'THCa Diamonds 1g', slug: 'thca-diamonds-1g', description: 'Crystalline THCa with terp sauce. Maximum potency for experienced consumers.', category: 'Concentrates', image_url: null, unit_price_cents: 6000, unit_type: 'unit', min_order_qty: 12, active: true },

  // Five Boroughs Cannabis
  { id: 'prod_fb_flower_oz', brand_id: 'brand_five_boroughs', name: 'NYC Flower 1oz', slug: 'nyc-flower-1oz', description: 'Versatile everyday flower grown for consistency. Multiple strains available.', category: 'Flower', image_url: null, unit_price_cents: 22000, unit_type: 'oz', min_order_qty: 6, active: true },
  { id: 'prod_fb_flower_eighth', brand_id: 'brand_five_boroughs', name: 'Flower Eighth (3.5g)', slug: 'flower-eighth', description: 'Consumer-ready eighth jar with child-resistant lid. Branded packaging.', category: 'Flower', image_url: null, unit_price_cents: 9500, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_fb_cart', brand_id: 'brand_five_boroughs', name: 'Distillate Cart 1g', slug: 'distillate-cart-1g', description: 'High-potency distillate cartridge. 510-thread, strain-specific terpenes.', category: 'Vapes', image_url: null, unit_price_cents: 2000, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_fb_disposable', brand_id: 'brand_five_boroughs', name: 'Disposable Vape 0.5g', slug: 'disposable-vape-half', description: 'Compact disposable pen. Draw-activated, pocket-friendly design.', category: 'Vapes', image_url: null, unit_price_cents: 1500, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_fb_preroll_3pk', brand_id: 'brand_five_boroughs', name: 'Pre-Roll 3-Pack (1g each)', slug: 'preroll-3-pack', description: 'Three full-gram pre-rolls in a branded tin. Shareable format.', category: 'Pre-Rolls', image_url: null, unit_price_cents: 4000, unit_type: 'pack', min_order_qty: 12, active: true },
  { id: 'prod_fb_preroll_single', brand_id: 'brand_five_boroughs', name: 'Single Pre-Roll 1g', slug: 'single-preroll-1g', description: 'Individual pre-roll in a doob tube. Impulse-buy price point.', category: 'Pre-Rolls', image_url: null, unit_price_cents: 600, unit_type: 'unit', min_order_qty: 48, active: true },
  { id: 'prod_fb_gummies', brand_id: 'brand_five_boroughs', name: 'Gummies 10-Pack (100mg)', slug: 'fb-gummies-10-pack', description: 'Classic gummy bears in five fruit flavors. 10mg per piece.', category: 'Edibles', image_url: null, unit_price_cents: 1000, unit_type: 'unit', min_order_qty: 24, active: true },
  { id: 'prod_fb_mints', brand_id: 'brand_five_boroughs', name: 'Peppermint Mints Tin (100mg)', slug: 'peppermint-mints-100mg', description: 'Discreet mint tin with 20 micro-dosed mints at 5mg each.', category: 'Edibles', image_url: null, unit_price_cents: 800, unit_type: 'unit', min_order_qty: 24, active: true },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function seed() {
  console.log(`Seeding ${BRANDS.length} brands and ${PRODUCTS.length} products...\n`);

  // Upsert brands
  const { error: brandsError } = await supabase
    .from('brands')
    .upsert(BRANDS, { onConflict: 'id' });

  if (brandsError) {
    console.error('Failed to upsert brands:', brandsError.message);
    process.exit(1);
  }

  console.log(`  Brands upserted: ${BRANDS.length}`);

  // Upsert products
  const { error: productsError } = await supabase
    .from('brand_products')
    .upsert(PRODUCTS, { onConflict: 'id' });

  if (productsError) {
    console.error('Failed to upsert products:', productsError.message);
    process.exit(1);
  }

  console.log(`  Products upserted: ${PRODUCTS.length}`);

  // Verify
  const { count: brandCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true });

  const { count: productCount } = await supabase
    .from('brand_products')
    .select('*', { count: 'exact', head: true });

  console.log(`\nVerification — brands in DB: ${brandCount}, products in DB: ${productCount}`);
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
