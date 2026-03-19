#!/usr/bin/env node
/**
 * Scrape cannabis business WEBSITES for emails.
 *
 * Strategy: Use Brave Search to find cannabis business websites,
 * then fetch each website and extract email addresses.
 * This works because Brave returns actual website URLs, and
 * cannabis businesses put their emails on their websites.
 *
 * Usage:
 *   node scripts/scrape-cannabis-sites.mjs --limit 1000
 *   node scripts/scrape-cannabis-sites.mjs --state CO --limit 200
 *   node scripts/scrape-cannabis-sites.mjs --dry-run
 */

import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MASTER_CSV = join(__dirname, '..', 'cannabis-hemp-grows-2026-03-17.csv');
const LOG_FILE = join(__dirname, '..', 'tmp', 'site-scrape-log.jsonl');

const BRAVE_KEY = 'BSAcMxzO8AD021dICd0f-5Zq5vuJJ8F';
const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_IDX = process.argv.indexOf('--limit');
const MAX_LEADS = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 500;
const STATE_IDX = process.argv.indexOf('--state');
const ONLY_STATE = STATE_IDX !== -1 ? process.argv[STATE_IDX + 1]?.toUpperCase() : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const JUNK_DOMAINS = new Set([
  'example.com','sentry.io','w3.org','schema.org','googleapis.com',
  'google.com','facebook.com','twitter.com','instagram.com','youtube.com',
  'tiktok.com','godaddy.com','wixpress.com','squarespace.com','wordpress.com',
  'shopify.com','cloudflare.com','yelp.com','leafly.com','weedmaps.com',
  'linkedin.com','mapquest.com','bbb.org','yellowpages.com','indeed.com',
  'glassdoor.com','craigslist.org','wikipedia.org','domain.com','email.com',
  'disney.com','mailchimp.com','constantcontact.com','hubspot.com',
  'typeform.com','zendesk.com','intercom.io','hotjar.com','ga.com',
  'recaptcha.net','gstatic.com','doubleclick.net','brave.com',
]);

function isValidEmail(email) {
  const lower = email.toLowerCase();
  if (lower.length > 60 || lower.length < 6) return false;
  if (/\.(png|jpg|svg|webp|gif|css|js|woff|ttf|map)$/.test(lower)) return false;
  const domain = lower.split('@')[1];
  if (!domain) return false;
  if (JUNK_DOMAINS.has(domain)) return false;
  for (const junk of JUNK_DOMAINS) { if (domain.endsWith('.' + junk)) return false; }
  if (/^(noreply|no-reply|donotreply|mailer-daemon|postmaster|webmaster|abuse|privacy|legal|robot|bot|crawler|spider|test|user|your|info@yelp|support@weedmaps)/.test(lower)) return false;
  // Must have a reasonable TLD
  if (!/\.(com|net|org|co|io|biz|us|ca|info)$/.test(lower)) return false;
  return true;
}

// Queries that find actual cannabis business websites (not directories)
const SEARCH_QUERIES = [
  // Direct business searches by city
  '{state} cannabis dispensary contact us',
  '{state} marijuana grow facility contact',
  '{state} cannabis cultivation company website',
  '{state} hemp farm contact email',
  '{state} cannabis wholesale distributor contact',
  '{state} cannabis processing company',
  '{state} marijuana manufacturer contact',
  '{state} cannabis delivery service contact',
  // Specific city searches
  '{city} {state} cannabis dispensary',
  '{city} {state} marijuana grow',
];

// Cities to search per state
const STATE_CITIES = {
  CO: ['Denver','Colorado Springs','Aurora','Boulder','Fort Collins','Pueblo','Trinidad'],
  MI: ['Detroit','Ann Arbor','Lansing','Grand Rapids','Kalamazoo','Traverse City','Battle Creek'],
  OK: ['Oklahoma City','Tulsa','Norman','Edmond','Stillwater','Lawton','Broken Arrow'],
  WA: ['Seattle','Tacoma','Spokane','Vancouver','Olympia','Bellingham','Yakima'],
  MA: ['Boston','Worcester','Springfield','Cambridge','Salem','Northampton','Amherst'],
  IL: ['Chicago','Springfield','Peoria','Champaign','Rockford','Collinsville','Aurora'],
  AZ: ['Phoenix','Tucson','Mesa','Scottsdale','Tempe','Flagstaff','Sedona'],
  NV: ['Las Vegas','Reno','Henderson','Sparks','Carson City','Pahrump','Mesquite'],
  NM: ['Albuquerque','Santa Fe','Las Cruces','Rio Rancho','Roswell','Farmington'],
  ME: ['Portland','Bangor','Lewiston','Augusta','South Portland','Biddeford'],
  MO: ['Kansas City','St Louis','Springfield','Columbia','Independence','Jefferson City'],
  MD: ['Baltimore','Annapolis','Rockville','Frederick','Columbia','Silver Spring'],
  NJ: ['Newark','Jersey City','Trenton','Paterson','Elizabeth','Camden'],
  NY: ['New York','Buffalo','Rochester','Albany','Syracuse','Yonkers','Ithaca'],
  OH: ['Columbus','Cleveland','Cincinnati','Toledo','Akron','Dayton'],
  CT: ['Hartford','New Haven','Bridgeport','Stamford','Waterbury','Norwalk'],
  MT: ['Billings','Missoula','Helena','Great Falls','Bozeman','Butte','Kalispell'],
  VT: ['Burlington','Montpelier','Brattleboro','Rutland','Bennington'],
  MN: ['Minneapolis','St Paul','Duluth','Rochester','Bloomington','Plymouth'],
  VA: ['Richmond','Virginia Beach','Norfolk','Arlington','Alexandria','Roanoke'],
};

async function searchBrave(query, retries = 1) {
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set('q', query);
  url.searchParams.set('count', '20');
  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_KEY },
    });
    if (!res.ok) {
      if (res.status === 429 && retries > 0) { await sleep(10000); return searchBrave(query, 0); }
      return null;
    }
    return await res.json();
  } catch { return null; }
}

async function scrapeWebsite(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const html = await res.text();
    return [...new Set((html.substring(0, 80000).match(EMAIL_RE) || []).map(e => e.toLowerCase()))].filter(isValidEmail);
  } catch { return []; }
}

async function processSearchResults(results, stateCode, existingEmails, allLeads) {
  if (!results?.web?.results) return 0;
  let found = 0;

  for (const r of results.web.results) {
    if (allLeads.length >= MAX_LEADS) break;

    const siteUrl = r.url;
    if (!siteUrl || !siteUrl.startsWith('http')) continue;

    // Skip known directories
    const domain = new URL(siteUrl).hostname.toLowerCase();
    if (['yelp.com','weedmaps.com','leafly.com','yellowpages.com','bbb.org',
         'facebook.com','instagram.com','linkedin.com','twitter.com',
         'reddit.com','google.com','wikipedia.org','mapquest.com',
         'dutchie.com','iheartjane.com','wheresweed.com'].some(d => domain.includes(d))) continue;

    // Scrape the website for emails
    const emails = await scrapeWebsite(siteUrl);
    await sleep(500);

    for (const email of emails) {
      if (existingEmails.has(email)) continue;
      existingEmails.add(email);

      let name = (r.title || '').replace(/[-|–—:].*/g, '').replace(/\s*(Contact|Home|About|Menu|Welcome).*/i, '').trim();
      if (name.length > 100) name = name.slice(0, 100);
      if (!name) name = domain.replace('www.', '').split('.')[0];

      allLeads.push({ name, email, state: stateCode, website: siteUrl, source: 'brave_site_scrape' });
      found++;
      process.stdout.write(`  ✓ ${email} (${name.slice(0,30)})\n`);
    }
  }
  return found;
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('VALUE SUPPLIERS — Cannabis Site Email Scraper');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Max leads: ${MAX_LEADS}`);

  mkdirSync(join(__dirname, '..', 'tmp'), { recursive: true });

  const existingEmails = new Set();
  if (existsSync(MASTER_CSV)) {
    const csv = readFileSync(MASTER_CSV, 'utf-8');
    (csv.match(EMAIL_RE) || []).forEach(e => existingEmails.add(e.toLowerCase()));
  }
  // Also add sent log emails
  const sentLog = join(__dirname, '..', 'tmp', 'outreach-sent.jsonl');
  if (existsSync(sentLog)) {
    const lines = readFileSync(sentLog, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) { try { existingEmails.add(JSON.parse(line).email); } catch {} }
  }
  console.log(`  Existing emails to skip: ${existingEmails.size}`);

  const states = ONLY_STATE
    ? Object.entries(STATE_CITIES).filter(([code]) => code === ONLY_STATE)
    : Object.entries(STATE_CITIES);

  const allLeads = [];

  for (const [stateCode, cities] of states) {
    if (allLeads.length >= MAX_LEADS) break;
    console.log(`\n  === ${stateCode} ===`);

    // State-level queries
    for (const tpl of SEARCH_QUERIES.slice(0, 7)) {
      if (allLeads.length >= MAX_LEADS) break;
      const query = tpl.replace('{state}', stateCode);
      if (DRY_RUN) { console.log(`    Would search: ${query}`); continue; }

      const results = await searchBrave(query);
      const found = await processSearchResults(results, stateCode, existingEmails, allLeads);
      await sleep(1500);
    }

    // City-level queries
    for (const city of cities) {
      if (allLeads.length >= MAX_LEADS) break;
      for (const tpl of SEARCH_QUERIES.slice(7)) {
        if (allLeads.length >= MAX_LEADS) break;
        const query = tpl.replace('{city}', city).replace('{state}', stateCode);
        if (DRY_RUN) { console.log(`    Would search: ${query}`); continue; }

        const results = await searchBrave(query);
        const found = await processSearchResults(results, stateCode, existingEmails, allLeads);
        await sleep(1500);
      }
    }

    console.log(`    ${stateCode} subtotal: ${allLeads.filter(l => l.state === stateCode).length} leads`);
  }

  if (allLeads.length > 0 && !DRY_RUN) {
    // Append to master CSV
    const csvLines = allLeads.map(l => {
      const fields = [l.name,'','','Cannabis','active','','',l.state,'','','',l.email,'',l.website,'brave_site_scrape'];
      return fields.map(f => { if (!f) return ''; if (f.includes(',') || f.includes('"')) return '"' + f.replace(/"/g, '""') + '"'; return f; }).join(',');
    });
    appendFileSync(MASTER_CSV, '\n' + csvLines.join('\n'));
    console.log(`\n  Appended ${allLeads.length} leads to CSV`);

    for (const l of allLeads) {
      appendFileSync(LOG_FILE, JSON.stringify({ ...l, timestamp: new Date().toISOString() }) + '\n');
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`DONE: ${allLeads.length} new leads with emails`);
  console.log(`States: ${[...new Set(allLeads.map(l => l.state))].join(', ')}`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
