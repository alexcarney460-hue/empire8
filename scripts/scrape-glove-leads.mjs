#!/usr/bin/env node
/**
 * Glove Buyer Lead Scraper for Value Suppliers
 *
 * Phase 1: Scrape businesses that use disposable gloves (cannabis grows,
 *          dispensaries, tattoo shops, auto shops, dental offices, food service,
 *          janitorial, labs, salons, etc.) via Google Places → push as companies.
 * Phase 2: Mine Google Reviews for mentions of gloves, PPE, nitrile, etc.
 *          → push as contacts in a "Glove Buyers" list.
 * Phase 3: Scrape business websites for emails/phones, enrich contacts.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=xxx SUPABASE_URL=xxx SUPABASE_KEY=xxx node scripts/scrape-glove-leads.mjs
 *
 * Optional:
 *   DRY_RUN=true
 *   MAX_LEADS=20000
 */

import { createClient } from '@supabase/supabase-js';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DRY_RUN = process.env.DRY_RUN === 'true';
const MAX_LEADS = parseInt(process.env.MAX_LEADS || '20000', 10);

if (!GOOGLE_API_KEY) { console.error('Missing GOOGLE_PLACES_API_KEY'); process.exit(1); }
if (!SUPABASE_URL && !DRY_RUN) { console.error('Missing SUPABASE_URL'); process.exit(1); }
if (!SUPABASE_KEY && !DRY_RUN) { console.error('Missing SUPABASE_KEY'); process.exit(1); }

const supabase = (!DRY_RUN && SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Glove/PPE keywords for review mining ---
const GLOVE_KEYWORDS = [
  'gloves', 'glove', 'nitrile', 'latex gloves', 'vinyl gloves',
  'disposable gloves', 'exam gloves', 'medical gloves',
  'ppe', 'personal protective equipment',
  'trimming', 'trim crew', 'harvest', 'cannabis trim',
  'grow operation', 'cultivation', 'growing facility',
  'dispensary supplies', 'shop supplies',
  'food safe', 'food handling', 'food prep',
  'tattoo supplies', 'ink supplies',
  'cleaning supplies', 'janitorial supplies',
  'auto detailing', 'mechanic supplies',
  'salon supplies', 'beauty supplies',
  'lab supplies', 'laboratory',
  'bulk supplies', 'wholesale supplies', 'case pricing',
];

const KEYWORD_RE = new RegExp(
  GLOVE_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// --- Search queries for Google Places ---
const SEARCH_QUERIES = [
  // Cannabis (primary market)
  'cannabis dispensary',
  'marijuana dispensary',
  'cannabis grow facility',
  'cannabis cultivation',
  'indoor grow operation',
  'hydroponics store',
  'hydroponic supply store',
  'cannabis processing facility',
  'hemp farm',
  'CBD store',
  // Tattoo & Body Art
  'tattoo shop',
  'tattoo parlor',
  'tattoo studio',
  'piercing studio',
  // Auto & Detailing
  'auto detailing shop',
  'auto body shop',
  'mechanic shop',
  'car wash detail',
  // Food Service
  'commercial kitchen',
  'catering company',
  'food truck',
  'bakery wholesale',
  // Medical & Dental
  'dental office',
  'dental clinic',
  'veterinary clinic',
  'medical clinic',
  'urgent care clinic',
  // Beauty & Personal Care
  'nail salon',
  'hair salon',
  'beauty salon',
  'barber shop',
  'spa',
  // Cleaning & Janitorial
  'janitorial supply store',
  'cleaning service commercial',
  'industrial cleaning supply',
  // Labs & Manufacturing
  'testing laboratory',
  'manufacturing facility',
  'paint shop',
];

// Major US cities — cannabis-legal states weighted heavier
const CITIES = [
  // California (huge cannabis market)
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Sacramento, CA', lat: 38.5816, lng: -121.4944 },
  { name: 'San Jose, CA', lat: 37.3382, lng: -121.8863 },
  { name: 'Oakland, CA', lat: 37.8044, lng: -122.2712 },
  { name: 'Fresno, CA', lat: 36.7378, lng: -119.7871 },
  { name: 'Long Beach, CA', lat: 33.7701, lng: -118.1937 },
  { name: 'Riverside, CA', lat: 33.9806, lng: -117.3755 },
  { name: 'Bakersfield, CA', lat: 35.3733, lng: -119.0187 },
  { name: 'Santa Rosa, CA', lat: 38.4405, lng: -122.7141 },
  { name: 'Humboldt County, CA', lat: 40.7450, lng: -123.8695 },
  { name: 'Mendocino, CA', lat: 39.3077, lng: -123.7995 },
  { name: 'Palm Springs, CA', lat: 33.8303, lng: -116.5453 },
  { name: 'Santa Barbara, CA', lat: 34.4208, lng: -119.6982 },
  // Colorado
  { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Colorado Springs, CO', lat: 38.8339, lng: -104.8214 },
  { name: 'Boulder, CO', lat: 40.0150, lng: -105.2705 },
  { name: 'Fort Collins, CO', lat: 40.5853, lng: -105.0844 },
  { name: 'Pueblo, CO', lat: 38.2544, lng: -104.6091 },
  // Oregon
  { name: 'Portland, OR', lat: 45.5152, lng: -122.6784 },
  { name: 'Eugene, OR', lat: 44.0521, lng: -123.0868 },
  { name: 'Bend, OR', lat: 44.0582, lng: -121.3153 },
  { name: 'Medford, OR', lat: 42.3265, lng: -122.8756 },
  { name: 'Salem, OR', lat: 44.9429, lng: -123.0351 },
  // Washington
  { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Tacoma, WA', lat: 47.2529, lng: -122.4443 },
  { name: 'Spokane, WA', lat: 47.6588, lng: -117.4260 },
  { name: 'Bellevue, WA', lat: 47.6101, lng: -122.2015 },
  { name: 'Olympia, WA', lat: 47.0379, lng: -122.9007 },
  // Michigan
  { name: 'Detroit, MI', lat: 42.3314, lng: -83.0458 },
  { name: 'Grand Rapids, MI', lat: 42.9634, lng: -85.6681 },
  { name: 'Ann Arbor, MI', lat: 42.2808, lng: -83.7430 },
  { name: 'Lansing, MI', lat: 42.7325, lng: -84.5555 },
  { name: 'Traverse City, MI', lat: 44.7631, lng: -85.6206 },
  // Illinois
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Springfield, IL', lat: 39.7817, lng: -89.6501 },
  { name: 'Naperville, IL', lat: 41.7508, lng: -88.1535 },
  // Massachusetts
  { name: 'Boston, MA', lat: 42.3601, lng: -71.0589 },
  { name: 'Worcester, MA', lat: 42.2626, lng: -71.8023 },
  { name: 'Springfield, MA', lat: 42.1015, lng: -72.5898 },
  // Nevada
  { name: 'Las Vegas, NV', lat: 36.1699, lng: -115.1398 },
  { name: 'Reno, NV', lat: 39.5296, lng: -119.8138 },
  // Arizona
  { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Scottsdale, AZ', lat: 33.4942, lng: -111.9261 },
  { name: 'Tucson, AZ', lat: 32.2226, lng: -110.9747 },
  { name: 'Mesa, AZ', lat: 33.4152, lng: -111.8315 },
  // Florida
  { name: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
  { name: 'Orlando, FL', lat: 28.5383, lng: -81.3792 },
  { name: 'Tampa, FL', lat: 27.9506, lng: -82.4572 },
  { name: 'Jacksonville, FL', lat: 30.3322, lng: -81.6557 },
  { name: 'Fort Lauderdale, FL', lat: 26.1224, lng: -80.1373 },
  // Texas
  { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  { name: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { name: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  { name: 'Fort Worth, TX', lat: 32.7555, lng: -97.3308 },
  { name: 'El Paso, TX', lat: 31.7619, lng: -106.4850 },
  // New York
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Buffalo, NY', lat: 42.8864, lng: -78.8784 },
  { name: 'Rochester, NY', lat: 43.1566, lng: -77.6088 },
  { name: 'Albany, NY', lat: 42.6526, lng: -73.7562 },
  { name: 'Long Island, NY', lat: 40.7891, lng: -73.1350 },
  // Northeast
  { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
  { name: 'Pittsburgh, PA', lat: 40.4406, lng: -79.9959 },
  { name: 'Washington, DC', lat: 38.9072, lng: -77.0369 },
  { name: 'Baltimore, MD', lat: 39.2904, lng: -76.6122 },
  { name: 'Hartford, CT', lat: 41.7658, lng: -72.6734 },
  { name: 'Newark, NJ', lat: 40.7357, lng: -74.1724 },
  { name: 'Providence, RI', lat: 41.8240, lng: -71.4128 },
  // Southeast
  { name: 'Atlanta, GA', lat: 33.7490, lng: -84.3880 },
  { name: 'Charlotte, NC', lat: 35.2271, lng: -80.8431 },
  { name: 'Nashville, TN', lat: 36.1627, lng: -86.7816 },
  { name: 'Raleigh, NC', lat: 35.7796, lng: -78.6382 },
  { name: 'Charleston, SC', lat: 32.7765, lng: -79.9311 },
  { name: 'New Orleans, LA', lat: 29.9511, lng: -90.0715 },
  { name: 'Birmingham, AL', lat: 33.5207, lng: -86.8025 },
  // Midwest
  { name: 'Columbus, OH', lat: 39.9612, lng: -82.9988 },
  { name: 'Cincinnati, OH', lat: 39.1031, lng: -84.5120 },
  { name: 'Cleveland, OH', lat: 41.4993, lng: -81.6944 },
  { name: 'Indianapolis, IN', lat: 39.7684, lng: -86.1581 },
  { name: 'Minneapolis, MN', lat: 44.9778, lng: -93.2650 },
  { name: 'St. Louis, MO', lat: 38.6270, lng: -90.1994 },
  { name: 'Kansas City, MO', lat: 39.0997, lng: -94.5786 },
  { name: 'Milwaukee, WI', lat: 43.0389, lng: -87.9065 },
  { name: 'Omaha, NE', lat: 41.2565, lng: -95.9345 },
  // Mountain/West
  { name: 'Salt Lake City, UT', lat: 40.7608, lng: -111.8910 },
  { name: 'Albuquerque, NM', lat: 35.0844, lng: -106.6504 },
  { name: 'Boise, ID', lat: 43.6150, lng: -116.2023 },
  // South
  { name: 'Louisville, KY', lat: 38.2527, lng: -85.7585 },
  { name: 'Memphis, TN', lat: 35.1495, lng: -90.0490 },
  { name: 'Oklahoma City, OK', lat: 35.4676, lng: -97.5164 },
  { name: 'Tulsa, OK', lat: 36.1540, lng: -95.9928 },
  // Oklahoma (huge cannabis market)
  { name: 'Norman, OK', lat: 35.2226, lng: -97.4395 },
  { name: 'Edmond, OK', lat: 35.6528, lng: -97.4781 },
  // Maine (cannabis)
  { name: 'Portland, ME', lat: 43.6591, lng: -70.2568 },
  { name: 'Bangor, ME', lat: 44.8012, lng: -68.7778 },
  // Missouri (cannabis)
  { name: 'Columbia, MO', lat: 38.9517, lng: -92.3341 },
  // Hawaii
  { name: 'Honolulu, HI', lat: 21.3069, lng: -157.8583 },
  // Alaska
  { name: 'Anchorage, AK', lat: 61.2181, lng: -149.9003 },
  // Montana
  { name: 'Billings, MT', lat: 45.7833, lng: -108.5007 },
  { name: 'Missoula, MT', lat: 46.8721, lng: -113.9940 },
  // Vermont
  { name: 'Burlington, VT', lat: 44.4759, lng: -73.2121 },
  // New Jersey
  { name: 'Jersey City, NJ', lat: 40.7178, lng: -74.0431 },
  { name: 'Trenton, NJ', lat: 40.2171, lng: -74.7429 },
  // Connecticut
  { name: 'New Haven, CT', lat: 41.3083, lng: -72.9279 },
  // Virginia
  { name: 'Richmond, VA', lat: 37.5407, lng: -77.4360 },
  { name: 'Virginia Beach, VA', lat: 36.8529, lng: -75.9780 },
];

// --- Email/phone extraction ---
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const TEL_RE = /tel:([+\d\-().%20 ]{7,20})/gi;

const JUNK_DOMAINS = new Set([
  'example.com', 'domain.com', 'sentry.io', 'w3.org', 'schema.org',
  'googleapis.com', 'google.com', 'facebook.com', 'twitter.com',
  'instagram.com', 'youtube.com', 'tiktok.com', 'godaddy.com',
  'wixpress.com', 'squarespace.com', 'wordpress.com', 'shopify.com',
  'cloudflare.com', 'jquery.com', 'bootstrapcdn.com',
]);

function isValidEmail(email) {
  const lower = email.toLowerCase();
  if (lower.length > 80) return false;
  if (/\.(png|jpg|svg|webp|gif|css|js)$/.test(lower)) return false;
  const domain = lower.split('@')[1];
  if (!domain) return false;
  for (const junk of JUNK_DOMAINS) {
    if (domain === junk || domain.endsWith('.' + junk)) return false;
  }
  if (/^(filler|example|user|name|your|test|noreply|no-reply)/.test(lower)) return false;
  return true;
}

function cleanPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return null;
}

async function fetchPage(url, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ValueSuppliers Lead Enrichment)' },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function scrapeContactInfo(domain) {
  if (!domain) return { emails: [], phones: [] };

  const pages = [
    `https://${domain}`,
    `https://${domain}/contact`,
    `https://${domain}/contact-us`,
    `https://${domain}/about`,
    `https://www.${domain}`,
    `https://www.${domain}/contact`,
  ];

  const emails = new Set();
  const phones = new Set();

  for (const url of pages) {
    const html = await fetchPage(url);
    if (!html) continue;

    const emailMatches = html.match(EMAIL_RE) || [];
    for (const e of emailMatches) {
      if (isValidEmail(e)) emails.add(e.toLowerCase());
    }

    let m;
    while ((m = TEL_RE.exec(html)) !== null) {
      const cleaned = cleanPhone(m[1]);
      if (cleaned) phones.add(cleaned);
    }

    const stripped = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                         .replace(/<[^>]+>/g, ' ');
    const phoneMatches = stripped.match(PHONE_RE) || [];
    for (const p of phoneMatches) {
      const cleaned = cleanPhone(p);
      if (cleaned) phones.add(cleaned);
    }

    if (emails.size >= 3 && phones.size >= 1) break;
    await sleep(200);
  }

  return { emails: [...emails].slice(0, 5), phones: [...phones].slice(0, 3) };
}

// --- Google Places API (New) ---

async function searchPlaces(query, lat, lng) {
  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 50000.0,
      },
    },
    maxResultCount: 20,
  };

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.reviews,places.addressComponents',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

function extractStateCity(addressComponents) {
  let city = '', state = '';
  for (const comp of addressComponents || []) {
    for (const type of comp.types || []) {
      if (type === 'locality') city = comp.longText || '';
      if (type === 'administrative_area_level_1') state = comp.shortText || '';
    }
  }
  return { city, state };
}

function extractDomain(websiteUri) {
  if (!websiteUri) return '';
  try {
    return new URL(websiteUri).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// --- Supabase helpers ---

async function insertCompany(biz) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('companies').upsert({
    name: biz.name,
    domain: biz.domain || null,
    phone: biz.phone || null,
    city: biz.city || null,
    state: biz.state || null,
    address: biz.address || null,
    source: 'google_places',
    google_place_id: biz.placeId,
    rating: biz.rating || null,
    review_count: biz.reviewCount || 0,
  }, { onConflict: 'google_place_id' }).select('id').single();
  if (error) { return null; }
  return data?.id || null;
}

async function insertContact(props) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('contacts').insert(props).select('id').single();
  if (error) return null;
  return data?.id || null;
}

async function createList(name, description) {
  if (!supabase) return null;
  const { data } = await supabase.from('lists')
    .upsert({ name, description }, { onConflict: 'name' })
    .select('id').single();
  return data?.id || null;
}

async function addToList(listId, contactIds) {
  if (!supabase || !listId || contactIds.length === 0) return;
  const entries = contactIds.map(id => ({ list_id: listId, contact_id: id }));
  for (let i = 0; i < entries.length; i += 500) {
    const batch = entries.slice(i, i + 500);
    await supabase.from('list_contacts').upsert(batch, { onConflict: 'list_id,contact_id' });
  }
}

// --- Main ---

async function main() {
  console.log(`\nValue Suppliers — Glove Buyer Lead Scraper`);
  console.log(`   Cities: ${CITIES.length} | Queries: ${SEARCH_QUERIES.length}`);
  console.log(`   Target: ${MAX_LEADS} leads`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Database: Supabase\n`);

  const seenPlaces = new Set();
  const allBusinesses = [];
  const allReviewers = [];
  let reviewsScanned = 0;

  // ========== PHASE 1 & 2: Search businesses + mine reviews ==========
  console.log('=== PHASE 1 & 2: Scraping businesses + mining reviews ===\n');

  for (const city of CITIES) {
    if (allBusinesses.length >= MAX_LEADS) break;

    for (const query of SEARCH_QUERIES) {
      if (allBusinesses.length >= MAX_LEADS) break;

      const data = await searchPlaces(query, city.lat, city.lng);

      if (data.error) {
        if (data.error.code === 429) {
          console.log('  Rate limited, waiting 30s...');
          await sleep(30000);
        }
        continue;
      }

      let newThisQuery = 0;

      for (const place of data.places || []) {
        if (allBusinesses.length >= MAX_LEADS) break;
        if (seenPlaces.has(place.id)) continue;
        seenPlaces.add(place.id);

        const bizName = place.displayName?.text || 'Unknown';
        const { city: bizCity, state: bizState } = extractStateCity(place.addressComponents);
        const domain = extractDomain(place.websiteUri);
        const phone = place.nationalPhoneNumber || '';

        const biz = {
          name: bizName,
          city: bizCity,
          state: bizState,
          address: place.formattedAddress || '',
          phone,
          domain,
          website: place.websiteUri || '',
          placeId: place.id,
        };

        allBusinesses.push(biz);
        newThisQuery++;

        // Mine reviews for glove/supply mentions
        const reviews = place.reviews || [];
        for (const review of reviews) {
          reviewsScanned++;
          const text = review.text?.text || '';
          const authorName = review.authorAttribution?.displayName || '';
          const rating = review.rating || 0;

          if (!KEYWORD_RE.test(text)) continue;

          const mentioned = GLOVE_KEYWORDS.filter(kw => text.toLowerCase().includes(kw));

          allReviewers.push({
            authorName,
            reviewText: text.slice(0, 500),
            rating,
            bizName,
            bizCity,
            bizState,
            bizPhone: phone,
            keywords: mentioned,
            placeId: place.id,
          });
        }
      }

      if (newThisQuery > 0) {
        console.log(`[${allBusinesses.length}] "${query}" — ${city.name} (+${newThisQuery} businesses, ${allReviewers.length} glove-related reviewers)`);
      }

      await sleep(300);
    }
  }

  console.log(`\n=== PHASE 1 & 2 RESULTS ===`);
  console.log(`  Businesses found: ${allBusinesses.length}`);
  console.log(`  Reviews scanned: ${reviewsScanned}`);
  console.log(`  Glove-related reviews: ${allReviewers.length}`);

  // ========== PHASE 3: Push businesses to Supabase + scrape for emails ==========
  console.log(`\n=== PHASE 3: Pushing businesses to Supabase + email enrichment ===\n`);

  let companiesCreated = 0;
  let contactsCreated = 0;
  let emailsFound = 0;
  const allContactIds = [];

  // Batch insert companies
  for (let i = 0; i < allBusinesses.length; i += 200) {
    const batch = allBusinesses.slice(i, i + 200).map(c => ({
      name: c.name,
      domain: c.domain || null,
      phone: c.phone || null,
      city: c.city || null,
      state: c.state || null,
      address: c.address || null,
      source: 'google_places',
      google_place_id: c.placeId,
    }));

    if (!DRY_RUN && supabase) {
      const { data, error } = await supabase.from('companies')
        .upsert(batch, { onConflict: 'google_place_id' })
        .select('id, google_place_id');
      if (data) {
        companiesCreated += data.length;
        for (const row of data) {
          const biz = allBusinesses.find(c => c.placeId === row.google_place_id);
          if (biz) biz.companyId = row.id;
        }
      }
      if (error) console.log(`  Company batch error: ${error.message}`);
    } else {
      companiesCreated += batch.length;
    }

    if ((i + 200) % 1000 === 0 || i + 200 >= allBusinesses.length) {
      console.log(`  Companies: ${companiesCreated}/${allBusinesses.length}`);
    }
  }

  // Scrape websites for emails and create contacts
  for (let i = 0; i < allBusinesses.length; i++) {
    const biz = allBusinesses[i];

    if ((i + 1) % 100 === 0) {
      console.log(`\n--- Enriching: ${i + 1}/${allBusinesses.length} | Contacts: ${contactsCreated} | Emails: ${emailsFound} ---\n`);
    }

    if (biz.domain) {
      const { emails, phones } = await scrapeContactInfo(biz.domain);

      if (emails.length > 0) {
        emailsFound += emails.length;
        process.stdout.write(`[${i + 1}] ${biz.name} (${biz.domain}) — ${emails.length} emails `);

        if (!DRY_RUN) {
          for (const email of emails.slice(0, 3)) {
            const contactId = await insertContact({
              company_id: biz.companyId || null,
              email,
              phone: phones[0] || biz.phone || null,
              city: biz.city || null,
              state: biz.state || null,
              source: 'website_scrape',
              lead_status: 'NEW',
              lifecycle_stage: 'lead',
            });

            if (contactId) {
              contactsCreated++;
              allContactIds.push(contactId);
            }
          }
        }
        console.log('');
      }
    }
  }

  // ========== PHASE 4: Push reviewers as contacts ==========
  console.log(`\n=== PHASE 4: Creating glove buyer contacts from reviews ===\n`);

  let reviewerContactsCreated = 0;

  for (let i = 0; i < allReviewers.length; i += 200) {
    const batch = allReviewers.slice(i, i + 200).map(r => {
      const nameParts = (r.authorName || '').trim().split(/\s+/);
      const biz = allBusinesses.find(c => c.placeId === r.placeId);
      return {
        company_id: biz?.companyId || null,
        firstname: nameParts[0] || null,
        lastname: nameParts.slice(1).join(' ') || null,
        phone: r.bizPhone || null,
        city: r.bizCity || null,
        state: r.bizState || null,
        source: 'google_review',
        lead_status: 'NEW',
        lifecycle_stage: 'lead',
        review_text: r.reviewText || null,
        review_rating: r.rating || null,
        review_keywords: r.keywords.length > 0 ? r.keywords : null,
      };
    }).filter(r => r.firstname);

    if (!DRY_RUN && supabase) {
      const { data, error } = await supabase.from('contacts').insert(batch).select('id');
      if (data) {
        reviewerContactsCreated += data.length;
        allContactIds.push(...data.map(d => d.id));
      }
      if (error) console.log(`  Reviewer batch error: ${error.message}`);
    } else {
      reviewerContactsCreated += batch.length;
    }

    if ((i + 200) % 500 === 0 || i + 200 >= allReviewers.length) {
      console.log(`  Reviewer contacts: ${reviewerContactsCreated}/${allReviewers.length}`);
    }
  }

  // ========== PHASE 5: Create lists ==========
  if (!DRY_RUN && allContactIds.length > 0) {
    console.log(`\n=== PHASE 5: Creating "Glove Buyers" list ===\n`);

    const listId = await createList('Glove Buyers', 'Businesses and reviewers that use disposable gloves');
    if (listId) {
      await addToList(listId, allContactIds);
      console.log(`  List created (ID: ${listId}) with ${allContactIds.length} contacts`);
    }
  }

  // ========== Save CSV ==========
  const fs = await import('fs');

  const bizCsv = ['Name,City,State,Phone,Domain,Address'];
  for (const c of allBusinesses) {
    bizCsv.push(`"${c.name}","${c.city}","${c.state}","${c.phone}","${c.domain}","${c.address}"`);
  }
  const bizPath = new URL('../glove-buyer-businesses.csv', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
  fs.writeFileSync(bizPath, bizCsv.join('\n'));
  console.log(`\n  Businesses CSV: ${bizPath}`);

  if (allReviewers.length > 0) {
    const revCsv = ['Reviewer,Business,City,State,Rating,Keywords,Review Excerpt'];
    for (const r of allReviewers) {
      const excerpt = r.reviewText.replace(/"/g, "'").replace(/\n/g, ' ');
      revCsv.push(`"${r.authorName}","${r.bizName}","${r.bizCity}","${r.bizState}",${r.rating},"${r.keywords.join('; ')}","${excerpt}"`);
    }
    const revPath = new URL('../glove-buyer-reviewers.csv', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
    fs.writeFileSync(revPath, revCsv.join('\n'));
    console.log(`  Reviewers CSV: ${revPath}`);
  }

  // ========== Final report ==========
  console.log(`\n========== VALUE SUPPLIERS — FINAL RESULTS ==========`);
  console.log(`  Businesses scraped: ${allBusinesses.length}`);
  console.log(`  Companies in Supabase: ${companiesCreated}`);
  console.log(`  Emails found & contacts created: ${contactsCreated}`);
  console.log(`  Glove-related reviewers found: ${allReviewers.length}`);
  console.log(`  Reviewer contacts created: ${reviewerContactsCreated}`);
  console.log(`  Total contacts in "Glove Buyers" list: ${allContactIds.length}`);

  // Keyword frequency
  const kwCounts = {};
  for (const r of allReviewers) {
    for (const kw of r.keywords) {
      kwCounts[kw] = (kwCounts[kw] || 0) + 1;
    }
  }
  const topKw = Object.entries(kwCounts).sort((a, b) => b[1] - a[1]);
  if (topKw.length > 0) {
    console.log(`\n========== TOP KEYWORDS ==========`);
    for (const [kw, count] of topKw.slice(0, 20)) {
      console.log(`  "${kw}" — ${count} mentions`);
    }
  }
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
