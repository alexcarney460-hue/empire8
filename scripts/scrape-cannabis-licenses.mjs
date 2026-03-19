#!/usr/bin/env node
/**
 * Cannabis & Hemp Licensed Grow Facility Scraper
 *
 * Scrapes licensed cannabis cultivation and hemp grow facilities from
 * public state databases and pushes them to the ValueSuppliers CRM.
 *
 * Phase 1: Open data portals (Socrata API — WA, NY, OR) + direct CSV (ME, MA, MN, NV)
 * Phase 2: Brave Search for states without open data
 * Phase 3: Push to Supabase CRM as companies + create "Licensed Grows" list
 *
 * Usage:
 *   node scripts/scrape-cannabis-licenses.mjs                  # Full run
 *   node scripts/scrape-cannabis-licenses.mjs --dry-run        # Preview only
 *   node scripts/scrape-cannabis-licenses.mjs --phase 1        # Open data only
 *   node scripts/scrape-cannabis-licenses.mjs --phase 2        # Brave Search only
 *   node scripts/scrape-cannabis-licenses.mjs --state CA       # Single state
 *   node scripts/scrape-cannabis-licenses.mjs --csv-only       # Save CSV, skip Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BRAVE_API_KEY = 'BSAcMxzO8AD021dICd0f-5Zq5vuJJ8F';
const SUPABASE_URL = 'https://hpakqrnvjnzznhffoqaf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const DRY_RUN = process.argv.includes('--dry-run');
const CSV_ONLY = process.argv.includes('--csv-only');
const PHASE_FLAG = process.argv.indexOf('--phase');
const PHASE = PHASE_FLAG !== -1 ? parseInt(process.argv[PHASE_FLAG + 1], 10) : 0;
const STATE_FLAG = process.argv.indexOf('--state');
const SINGLE_STATE = STATE_FLAG !== -1 ? process.argv[STATE_FLAG + 1]?.toUpperCase() : null;

const supabase = (!DRY_RUN && !CSV_ONLY && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Normalized facility record
function makeFacility(raw) {
  return {
    name: (raw.name || '').trim().slice(0, 250),
    dba: (raw.dba || '').trim().slice(0, 250) || null,
    license_number: (raw.license_number || '').trim() || null,
    license_type: (raw.license_type || '').trim() || null,
    license_status: (raw.license_status || 'active').trim().toLowerCase() || null,
    address: (raw.address || '').trim() || null,
    city: (raw.city || '').trim() || null,
    state: (raw.state || '').trim().toUpperCase() || null,
    zip: (raw.zip || '').trim() || null,
    county: (raw.county || '').trim() || null,
    phone: (raw.phone || '').trim() || null,
    website: (raw.website || '').trim() || null,
    source: raw.source || 'state_database',
    source_url: raw.source_url || null,
  };
}

// ---------------------------------------------------------------------------
// Phase 1: Open Data Portals (Socrata API + direct downloads)
// ---------------------------------------------------------------------------

// Socrata datasets return JSON by default, append $limit for all records
const SOCRATA_SOURCES = [
  {
    state: 'WA',
    name: 'Washington LCB',
    url: 'https://data.lcb.wa.gov/resource/u3zh-ri66.json',
    params: '$where=privilege like "%MARIJUANA%"&$limit=50000',
    map: (r) => ({
      name: r.tradename || r.name || '',
      dba: r.tradename || '',
      license_number: r.license || '',
      license_type: r.privilege || '',
      license_status: (r.status || 'active').toLowerCase(),
      address: r.address || '',
      city: r.city || '',
      state: 'WA',
      zip: r.zip || '',
      county: r.county || '',
      phone: '',
      source: 'wa_lcb_open_data',
      source_url: 'https://data.lcb.wa.gov/resource/u3zh-ri66',
    }),
    filter: (r) => {
      const priv = (r.privilege || '').toUpperCase();
      return priv.includes('PRODUCER') || priv.includes('PROCESSOR') || priv.includes('GROW')
        || priv.includes('LAB') || priv.includes('TEST') || priv.includes('DISTRIBUT')
        || priv.includes('MANUFACTUR') || priv.includes('MARIJUANA');
    },
  },
  {
    state: 'NY',
    name: 'New York OCM',
    url: 'https://data.ny.gov/resource/jskf-tt3q.json',
    params: '$limit=50000',
    map: (r) => ({
      name: r.business_name || r.dba || '',
      dba: r.dba || '',
      license_number: r.license_number || r.license_no || '',
      license_type: r.license_type || '',
      license_status: (r.license_status || r.status || 'active').toLowerCase(),
      address: [r.street_1, r.street_2].filter(Boolean).join(', '),
      city: r.city || '',
      state: 'NY',
      zip: r.zip || r.zip_code || '',
      county: r.county || '',
      phone: '',
      source: 'ny_ocm_open_data',
      source_url: 'https://data.ny.gov/resource/jskf-tt3q',
    }),
    filter: (r) => {
      const type = (r.license_type || '').toUpperCase();
      return type.includes('CULTIV') || type.includes('GROW') || type.includes('PROCESSOR')
        || type.includes('NURSERY') || type.includes('DISTRIBUT') || type.includes('TEST')
        || type.includes('LAB') || type.includes('MANUFACTUR') || type.includes('ADULT');
    },
  },
];

async function fetchSocrata(source) {
  const url = `${source.url}?${source.params}`;
  console.log(`  Fetching ${source.name}...`);
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      console.log(`    ERROR: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    console.log(`    Raw records: ${data.length}`);

    const filtered = source.filter ? data.filter(source.filter) : data;
    console.log(`    After filter (grow/cultivation): ${filtered.length}`);

    return filtered.map(source.map).map(makeFacility);
  } catch (err) {
    console.log(`    ERROR: ${err.message}`);
    return [];
  }
}

// California DCC — their search API
async function fetchCaliforniaDCC() {
  console.log('  Fetching California DCC...');
  const results = [];
  const licenseTypes = ['Cultivator', 'Processor', 'Nursery'];

  for (const licType of licenseTypes) {
    try {
      // CA DCC search API — search with cultivation license types
      const url = `https://as-cdt-pub-vip-cannabis-ww-p-002.azurewebsites.net/licenses/filteredSearch?pageSize=10000&searchQuery=&licenseType=${encodeURIComponent(licType)}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        console.log(`    CA DCC ${licType}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const items = data?.data || data || [];
      console.log(`    CA DCC ${licType}: ${Array.isArray(items) ? items.length : 0} records`);

      if (Array.isArray(items)) {
        for (const r of items) {
          results.push(makeFacility({
            name: r.businessName || r.businessDba || '',
            dba: r.businessDba || '',
            license_number: r.licenseNumber || '',
            license_type: r.licenseType || licType,
            license_status: (r.licenseStatus || 'active').toLowerCase(),
            address: r.premiseAddress || '',
            city: r.premiseCity || '',
            state: 'CA',
            zip: r.premiseZip || '',
            county: r.premiseCounty || '',
            source: 'ca_dcc',
            source_url: 'https://search.cannabis.ca.gov/',
          }));
        }
      }
      await sleep(500);
    } catch (err) {
      console.log(`    CA DCC ${licType} error: ${err.message}`);
    }
  }
  return results;
}

// Oregon OLCC — Socrata open data
async function fetchOregon() {
  console.log('  Fetching Oregon OLCC...');
  try {
    // Try the known OLCC open data endpoint
    const url = 'https://data.olcc.state.or.us/resource/6v5b-pqdi.json?$limit=50000';
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      console.log(`    Oregon: HTTP ${res.status}, trying alternate...`);
      // Fallback to Brave search
      return [];
    }
    const data = await res.json();
    console.log(`    Oregon raw: ${data.length}`);

    return data
      .filter((r) => {
        const type = (r.license_type || r.category || '').toUpperCase();
        return type.includes('PRODUC') || type.includes('GROW') || type.includes('CULTIV')
          || type.includes('PROCESS') || type.includes('WHOLESALE');
      })
      .map((r) =>
        makeFacility({
          name: r.business_name || r.trade_name || '',
          dba: r.trade_name || '',
          license_number: r.license_no || r.license_number || '',
          license_type: r.license_type || r.category || '',
          license_status: (r.status || 'active').toLowerCase(),
          address: r.address || r.street_address || '',
          city: r.city || '',
          state: 'OR',
          zip: r.zip || r.zip_code || '',
          county: r.county || '',
          source: 'or_olcc_open_data',
          source_url: 'https://data.olcc.state.or.us/',
        })
      );
  } catch (err) {
    console.log(`    Oregon error: ${err.message}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Brave Search for states without open data
// ---------------------------------------------------------------------------

const BRAVE_STATES = [
  // ── BIG 3 (APIs failed, Brave fallback) ──
  { code: 'CA', name: 'California', queries: [
    'licensed cannabis cultivator California',
    'California DCC licensed grow facility',
    'cannabis cultivation license California list',
    'California cannabis testing laboratory licensed',
    'cannabis distribution license California',
    'licensed cannabis edibles manufacturer California',
    'cannabis bakery license California',
    'hemp farm California licensed',
  ]},
  { code: 'WA', name: 'Washington', queries: [
    'licensed cannabis producer Washington state',
    'Washington LCB marijuana producer license',
    'cannabis cultivation license Washington list',
    'cannabis testing lab Washington state licensed',
    'cannabis processor Washington licensed',
    'cannabis distributor Washington licensed',
  ]},
  { code: 'OR', name: 'Oregon', queries: [
    'licensed cannabis producer Oregon',
    'Oregon OLCC marijuana producer license',
    'cannabis grow facility Oregon licensed',
    'cannabis testing laboratory Oregon licensed',
    'cannabis processor Oregon licensed',
    'cannabis wholesale distributor Oregon',
  ]},
  // ── Remaining states: cultivation + labs + distribution + edibles ──
  { code: 'CO', name: 'Colorado', queries: [
    'licensed cannabis cultivator Colorado',
    'marijuana grow facility Colorado license',
    'cannabis testing laboratory Colorado licensed',
    'cannabis edibles manufacturer Colorado',
    'cannabis distribution license Colorado',
  ]},
  { code: 'MI', name: 'Michigan', queries: [
    'licensed cannabis grower Michigan',
    'Michigan cannabis cultivation license',
    'cannabis testing lab Michigan licensed',
    'cannabis processor Michigan edibles',
    'cannabis distribution Michigan license',
  ]},
  { code: 'OK', name: 'Oklahoma', queries: [
    'licensed cannabis grower Oklahoma',
    'Oklahoma OMMA cultivation license',
    'cannabis testing lab Oklahoma OMMA',
    'cannabis processor Oklahoma licensed',
    'cannabis distribution Oklahoma license',
  ]},
  { code: 'IL', name: 'Illinois', queries: [
    'licensed cannabis cultivator Illinois',
    'Illinois cannabis grow license',
    'cannabis testing laboratory Illinois',
    'cannabis infuser license Illinois edibles',
    'cannabis transporter distributor Illinois',
  ]},
  { code: 'MA', name: 'Massachusetts', queries: [
    'licensed cannabis cultivator Massachusetts',
    'cannabis testing lab Massachusetts CCC',
    'cannabis manufacturer edibles Massachusetts',
    'cannabis transporter Massachusetts licensed',
  ]},
  { code: 'ME', name: 'Maine', queries: [
    'licensed cannabis cultivator Maine',
    'cannabis testing facility Maine',
    'cannabis manufacturing Maine licensed',
  ]},
  { code: 'MO', name: 'Missouri', queries: [
    'licensed cannabis cultivation Missouri',
    'cannabis testing lab Missouri',
    'cannabis manufacturer infused products Missouri',
    'cannabis distribution Missouri licensed',
  ]},
  { code: 'NJ', name: 'New Jersey', queries: [
    'licensed cannabis cultivator New Jersey',
    'cannabis testing lab New Jersey CRC',
    'cannabis manufacturer New Jersey',
    'cannabis distributor New Jersey licensed',
  ]},
  { code: 'AZ', name: 'Arizona', queries: [
    'licensed cannabis cultivator Arizona',
    'cannabis testing lab Arizona',
    'cannabis manufacturer edibles Arizona',
  ]},
  { code: 'MT', name: 'Montana', queries: [
    'licensed cannabis cultivator Montana',
    'cannabis testing lab Montana',
    'cannabis manufacturer Montana',
  ]},
  { code: 'NV', name: 'Nevada', queries: [
    'licensed cannabis cultivator Nevada',
    'cannabis testing lab Nevada CCB',
    'cannabis production facility Nevada',
    'cannabis distribution license Nevada',
  ]},
  { code: 'NM', name: 'New Mexico', queries: [
    'licensed cannabis producer New Mexico',
    'cannabis testing lab New Mexico',
    'cannabis manufacturer edibles New Mexico',
  ]},
  { code: 'CT', name: 'Connecticut', queries: [
    'licensed cannabis cultivator Connecticut',
    'cannabis testing lab Connecticut',
    'cannabis food manufacturer Connecticut',
  ]},
  { code: 'VT', name: 'Vermont', queries: [
    'licensed cannabis cultivator Vermont',
    'cannabis testing lab Vermont',
    'cannabis manufacturer Vermont',
  ]},
  { code: 'MD', name: 'Maryland', queries: [
    'licensed cannabis grower Maryland',
    'cannabis testing lab Maryland',
    'cannabis processor manufacturer Maryland',
  ]},
  { code: 'MN', name: 'Minnesota', queries: [
    'licensed cannabis cultivator Minnesota',
    'cannabis testing lab Minnesota',
    'cannabis edibles manufacturer Minnesota',
  ]},
  { code: 'OH', name: 'Ohio', queries: [
    'licensed cannabis cultivator Ohio',
    'cannabis testing lab Ohio',
    'cannabis processor Ohio licensed',
  ]},
  { code: 'VA', name: 'Virginia', queries: [
    'licensed cannabis cultivator Virginia',
    'cannabis pharmaceutical processor Virginia',
  ]},
  { code: 'RI', name: 'Rhode Island', queries: [
    'licensed cannabis cultivator Rhode Island',
    'cannabis testing lab Rhode Island',
    'cannabis manufacturer Rhode Island',
  ]},
  { code: 'DE', name: 'Delaware', queries: [
    'licensed cannabis cultivator Delaware',
    'cannabis testing lab Delaware',
  ]},
  // ── Hemp states ──
  { code: 'KY', name: 'Kentucky', queries: ['licensed hemp farm Kentucky', 'hemp processor Kentucky'] },
  { code: 'TN', name: 'Tennessee', queries: ['licensed hemp farm Tennessee', 'hemp processor Tennessee'] },
  { code: 'NC', name: 'North Carolina', queries: ['licensed hemp grower North Carolina', 'hemp processor North Carolina'] },
  { code: 'TX', name: 'Texas', queries: ['licensed hemp farm Texas', 'hemp processor manufacturer Texas'] },
  { code: 'FL', name: 'Florida', queries: [
    'licensed hemp grower Florida',
    'Florida medical cannabis cultivator',
    'cannabis testing lab Florida',
    'cannabis distributor MMTC Florida',
  ]},
  { code: 'PA', name: 'Pennsylvania', queries: [
    'licensed cannabis grower Pennsylvania',
    'cannabis testing lab Pennsylvania',
    'cannabis processor Pennsylvania',
  ]},
  { code: 'GA', name: 'Georgia', queries: ['licensed hemp farm Georgia', 'hemp processor Georgia'] },
  { code: 'IN', name: 'Indiana', queries: ['licensed hemp grower Indiana', 'hemp processor Indiana'] },
  { code: 'WI', name: 'Wisconsin', queries: ['licensed hemp farm Wisconsin', 'hemp processor Wisconsin'] },
  { code: 'SC', name: 'South Carolina', queries: ['licensed hemp farm South Carolina', 'hemp processor South Carolina'] },
];

async function braveSearch(query) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=20`;
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      if (res.status === 429) {
        console.log('    Brave rate limited, waiting 5s...');
        await sleep(5000);
      }
      return [];
    }
    const data = await res.json();
    return data.web?.results || [];
  } catch (err) {
    console.log(`    Brave error: ${err.message}`);
    return [];
  }
}

function extractBusinessFromBraveResult(result, stateCode) {
  const title = result.title || '';
  const desc = result.description || '';
  const url = result.url || '';

  // Skip non-business results
  if (/reddit|wikipedia|leafly|weedmaps|news|article|blog/i.test(url)) return null;
  if (title.length < 3) return null;

  // Try to extract a business name (before common separators)
  let name = title
    .replace(/\s*[-|–—]\s*.*/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*(LLC|Inc|Corp|Ltd|Co)\b\.?/gi, '')
    .trim();

  if (name.length < 3 || name.length > 120) return null;
  if (/^(how|what|where|when|top|best|list|guide|news)/i.test(name)) return null;

  let domain = '';
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}

  return makeFacility({
    name,
    license_type: 'cultivation',
    license_status: 'active',
    state: stateCode,
    website: url,
    source: 'brave_search',
    source_url: url,
  });
}

async function fetchBraveForState(stateInfo) {
  const results = [];
  const seen = new Set();

  for (const query of stateInfo.queries) {
    console.log(`    "${query}"`);
    const hits = await braveSearch(query);

    for (const hit of hits) {
      const biz = extractBusinessFromBraveResult(hit, stateInfo.code);
      if (!biz || seen.has(biz.name.toLowerCase())) continue;
      seen.add(biz.name.toLowerCase());
      results.push(biz);
    }

    await sleep(1200); // Brave rate limit: ~1 req/sec on free tier
  }

  return results;
}

// ---------------------------------------------------------------------------
// Phase 3: Push to Supabase CRM
// ---------------------------------------------------------------------------

async function pushToSupabase(facilities) {
  if (!supabase) {
    console.log('  Supabase not configured — skipping push');
    return;
  }

  console.log(`\n  Pushing ${facilities.length} facilities to Supabase...\n`);

  let companiesCreated = 0;
  const companyIds = [];

  // Batch upsert companies
  for (let i = 0; i < facilities.length; i += 200) {
    const batch = facilities.slice(i, i + 200).map((f) => ({
      name: f.name,
      domain: f.website ? (() => { try { return new URL(f.website).hostname.replace(/^www\./, ''); } catch { return null; } })() : null,
      phone: f.phone || null,
      city: f.city || null,
      state: f.state || null,
      address: f.address || null,
      source: f.source,
      lead_status: 'NEW',
      license_number: f.license_number || null,
      license_type: f.license_type || null,
    }));

    const { data, error } = await supabase.from('companies')
      .upsert(batch, { onConflict: 'name,state' })
      .select('id');

    if (data) {
      companiesCreated += data.length;
      companyIds.push(...data.map((d) => d.id));
    }
    if (error) console.log(`    Batch error: ${error.message}`);

    if ((i + 200) % 1000 === 0 || i + 200 >= facilities.length) {
      console.log(`    Companies: ${companiesCreated}/${facilities.length}`);
    }
  }

  // Create "Licensed Grows" list
  if (companyIds.length > 0) {
    console.log(`\n  Creating "Licensed Cannabis & Hemp Operations" list...`);
    const { data: listData } = await supabase.from('lists')
      .upsert({
        name: 'Licensed Cannabis & Hemp Operations',
        description: `Licensed cannabis/hemp operations: cultivators, testing labs, edibles/bakeries, distributors, and processors. ${facilities.length} facilities across ${new Set(facilities.map(f => f.state)).size} states.`,
      }, { onConflict: 'name' })
      .select('id')
      .single();

    if (listData?.id) {
      console.log(`  List ID: ${listData.id}`);
    }
  }

  return companiesCreated;
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

function saveCSV(facilities) {
  const outputDir = join(__dirname, '..');
  const timestamp = new Date().toISOString().slice(0, 10);

  const header = 'Name,DBA,License Number,License Type,Status,Address,City,State,Zip,County,Phone,Website,Source';
  const rows = facilities.map((f) => {
    const esc = (v) => `"${(v || '').replace(/"/g, '""')}"`;
    return [f.name, f.dba, f.license_number, f.license_type, f.license_status,
            f.address, f.city, f.state, f.zip, f.county, f.phone, f.website, f.source]
      .map(esc).join(',');
  });

  const csvPath = join(outputDir, `cannabis-hemp-grows-${timestamp}.csv`);
  writeFileSync(csvPath, [header, ...rows].join('\n'));
  console.log(`\n  CSV saved: ${csvPath}`);
  return csvPath;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('VALUE SUPPLIERS — Cannabis & Hemp Grow License Scraper');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : CSV_ONLY ? 'CSV ONLY' : 'LIVE (Supabase)'}`);
  console.log(`  Phase: ${PHASE || 'ALL'}`);
  console.log(`  State: ${SINGLE_STATE || 'ALL'}\n`);

  const allFacilities = [];
  const stateCounts = {};

  // ═══════════ PHASE 1: Open Data ═══════════
  if (PHASE === 0 || PHASE === 1) {
    console.log('━━━ PHASE 1: Open Data Portals ━━━\n');

    // California DCC
    if (!SINGLE_STATE || SINGLE_STATE === 'CA') {
      const ca = await fetchCaliforniaDCC();
      allFacilities.push(...ca);
      stateCounts.CA = ca.length;
      console.log(`    CA total: ${ca.length}\n`);
    }

    // Socrata sources (WA, NY)
    for (const source of SOCRATA_SOURCES) {
      if (SINGLE_STATE && SINGLE_STATE !== source.state) continue;
      const records = await fetchSocrata(source);
      allFacilities.push(...records);
      stateCounts[source.state] = records.length;
      console.log(`    ${source.state} total: ${records.length}\n`);
      await sleep(300);
    }

    // Oregon
    if (!SINGLE_STATE || SINGLE_STATE === 'OR') {
      const or = await fetchOregon();
      allFacilities.push(...or);
      stateCounts.OR = or.length;
      console.log(`    OR total: ${or.length}\n`);
    }

    console.log(`  Phase 1 total: ${allFacilities.length} facilities\n`);
  }

  // ═══════════ PHASE 2: Brave Search ═══════════
  if (PHASE === 0 || PHASE === 2) {
    console.log('━━━ PHASE 2: Brave Search (states without open data) ━━━\n');

    const states = SINGLE_STATE
      ? BRAVE_STATES.filter((s) => s.code === SINGLE_STATE)
      : BRAVE_STATES;

    for (const stateInfo of states) {
      console.log(`  ${stateInfo.name} (${stateInfo.code}):`);
      const results = await fetchBraveForState(stateInfo);
      allFacilities.push(...results);
      stateCounts[stateInfo.code] = (stateCounts[stateInfo.code] || 0) + results.length;
      console.log(`    ${stateInfo.code} found: ${results.length}\n`);
    }

    console.log(`  Phase 2 total: ${allFacilities.length} facilities\n`);
  }

  // ═══════════ Dedup ═══════════
  const seen = new Set();
  const deduped = [];
  for (const f of allFacilities) {
    const key = `${f.name.toLowerCase()}|${f.state}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(f);
  }
  console.log(`  Total after dedup: ${deduped.length} (removed ${allFacilities.length - deduped.length} dupes)\n`);

  // ═══════════ Save CSV ═══════════
  const csvPath = saveCSV(deduped);

  // ═══════════ Phase 3: Push to Supabase ═══════════
  if (!DRY_RUN && !CSV_ONLY) {
    console.log('\n━━━ PHASE 3: Push to Supabase CRM ━━━');
    const created = await pushToSupabase(deduped);
    console.log(`\n  Companies created/updated: ${created}`);
  }

  // ═══════════ Final Report ═══════════
  console.log(`\n${'='.repeat(60)}`);
  console.log('FINAL REPORT');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total facilities: ${deduped.length}`);
  console.log(`  States covered: ${Object.keys(stateCounts).length}`);
  console.log(`  CSV: ${csvPath}`);
  console.log(`\n  By state:`);

  const sorted = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);
  for (const [state, count] of sorted) {
    console.log(`    ${state}: ${count}`);
  }
  console.log(`${'='.repeat(60)}\n`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
