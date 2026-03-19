#!/usr/bin/env node
/**
 * Scrape cannabis facility emails via Brave Search.
 *
 * Searches for cannabis businesses in states we haven't covered yet,
 * extracts emails from search results and websites, appends to master CSV.
 *
 * Usage:
 *   node scripts/scrape-cannabis-emails-brave.mjs                    # All target states
 *   node scripts/scrape-cannabis-emails-brave.mjs --state CO         # Colorado only
 *   node scripts/scrape-cannabis-emails-brave.mjs --limit 200        # Max 200 leads
 *   node scripts/scrape-cannabis-emails-brave.mjs --dry-run
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MASTER_CSV = join(__dirname, '..', 'cannabis-hemp-grows-2026-03-17.csv');
const LOG_FILE = join(__dirname, '..', 'tmp', 'brave-scrape-log.jsonl');

const BRAVE_KEY = 'BSAcMxzO8AD021dICd0f-5Zq5vuJJ8F';
const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_IDX = process.argv.indexOf('--limit');
const MAX_LEADS = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 500;
const STATE_IDX = process.argv.indexOf('--state');
const ONLY_STATE = STATE_IDX !== -1 ? process.argv[STATE_IDX + 1]?.toUpperCase() : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// States with legal cannabis that we haven't scraped yet
const TARGET_STATES = [
  { code: 'CO', name: 'Colorado' },
  { code: 'MI', name: 'Michigan' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'WA', name: 'Washington' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'IL', name: 'Illinois' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'ME', name: 'Maine' },
  { code: 'MT', name: 'Montana' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MD', name: 'Maryland' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NY', name: 'New York' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'OH', name: 'Ohio' },
];

// Search queries per state — different angles to find businesses with emails
const QUERY_TEMPLATES = [
  '{state} cannabis cultivation facility email contact',
  '{state} licensed cannabis grow operation email',
  '{state} marijuana dispensary wholesale email',
  '{state} hemp farm grower email contact',
  '{state} cannabis processing facility email',
  '{state} cannabis manufacturer wholesale gloves supplies email',
  '{state} cannabis trim crew supplies contact email',
  '{state} cannabis harvest supplies wholesale email',
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const JUNK_DOMAINS = new Set([
  'example.com', 'sentry.io', 'w3.org', 'schema.org', 'googleapis.com',
  'google.com', 'facebook.com', 'twitter.com', 'instagram.com',
  'youtube.com', 'tiktok.com', 'godaddy.com', 'wixpress.com',
  'squarespace.com', 'wordpress.com', 'shopify.com', 'cloudflare.com',
  'yelp.com', 'leafly.com', 'weedmaps.com', 'linkedin.com',
  'mapquest.com', 'bbb.org', 'yellowpages.com', 'indeed.com',
  'glassdoor.com', 'craigslist.org', 'wikipedia.org', 'brave.com',
  'bing.com', 'yahoo.com', 'domain.com', 'email.com', 'disney.com',
  'resend.com', 'mailchimp.com', 'constantcontact.com',
]);

function isValidEmail(email) {
  const lower = email.toLowerCase();
  if (lower.length > 80 || lower.length < 6) return false;
  if (/\.(png|jpg|svg|webp|gif|css|js)$/.test(lower)) return false;
  const domain = lower.split('@')[1];
  if (!domain) return false;
  if (JUNK_DOMAINS.has(domain)) return false;
  if (/^(noreply|no-reply|donotreply|mailer-daemon|postmaster|webmaster|abuse|user|your|test|info@yelp|support@weedmaps|support@leafly)/.test(lower)) return false;
  return true;
}

async function searchBrave(query, retries = 1) {
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set('q', query);
  url.searchParams.set('count', '10');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_KEY,
      },
    });
    if (!res.ok) {
      if (res.status === 429 && retries > 0) {
        await sleep(10000);
        return searchBrave(query, retries - 1);
      }
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

function extractLeadsFromResults(results, stateCode, stateName) {
  if (!results?.web?.results) return [];
  const leads = [];

  for (const r of results.web.results) {
    const text = `${r.title || ''} ${r.description || ''} ${r.url || ''}`;
    const emails = (text.match(EMAIL_RE) || [])
      .map((e) => e.toLowerCase())
      .filter(isValidEmail);

    for (const email of emails) {
      // Try to extract business name from title
      let name = (r.title || '').replace(/[-|–—].*/g, '').trim();
      if (name.length > 120) name = name.slice(0, 120);
      if (!name) name = email.split('@')[1]?.split('.')[0] || 'Unknown';

      leads.push({
        name,
        email,
        state: stateCode,
        source_url: r.url || '',
      });
    }
  }

  return leads;
}

async function scrapeState(stateCode, stateName, existingEmails) {
  console.log(`\n  === ${stateName} (${stateCode}) ===`);
  const leads = [];

  for (const template of QUERY_TEMPLATES) {
    const query = template.replace('{state}', stateName);
    process.stdout.write(`    Search: "${query.slice(0, 60)}..." `);

    if (DRY_RUN) {
      console.log('→ would search');
      continue;
    }

    const results = await searchBrave(query);
    const found = extractLeadsFromResults(results, stateCode, stateName);

    // Dedup against existing + already found this session
    const newLeads = found.filter((l) => {
      if (existingEmails.has(l.email)) return false;
      existingEmails.add(l.email);
      return true;
    });

    console.log(`→ ${newLeads.length} new emails`);
    leads.push(...newLeads);

    await sleep(1500); // Rate limit
  }

  return leads;
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('VALUE SUPPLIERS — Cannabis Email Scraper (Brave)');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Max leads: ${MAX_LEADS}`);
  console.log(`  State: ${ONLY_STATE || 'ALL'}`);

  mkdirSync(join(__dirname, '..', 'tmp'), { recursive: true });

  // Load existing emails to dedup
  const existingEmails = new Set();
  if (existsSync(MASTER_CSV)) {
    const csv = readFileSync(MASTER_CSV, 'utf-8');
    const matches = csv.match(EMAIL_RE) || [];
    matches.forEach((e) => existingEmails.add(e.toLowerCase()));
  }
  console.log(`  Existing emails: ${existingEmails.size}`);

  const states = ONLY_STATE
    ? TARGET_STATES.filter((s) => s.code === ONLY_STATE)
    : TARGET_STATES;

  let allLeads = [];

  for (const state of states) {
    if (allLeads.length >= MAX_LEADS) break;
    const leads = await scrapeState(state.code, state.name, existingEmails);
    allLeads.push(...leads);
    console.log(`    ${state.code} total: ${leads.length} leads`);
  }

  // Trim to limit
  allLeads = allLeads.slice(0, MAX_LEADS);

  console.log(`\n  Total new leads: ${allLeads.length}`);

  if (allLeads.length === 0 || DRY_RUN) {
    console.log('  Nothing to save.');
    return;
  }

  // Append to master CSV
  // CSV format: Name,DBA,License Number,License Type,Status,Address,City,State,Zip,County,Phone,Email,Owner,Website,Source
  const csvLines = allLeads.map((l) => {
    const fields = [
      l.name, '', '', 'Cannabis', 'active', '', '', l.state, '', '',
      '', l.email, '', l.source_url, 'brave_search'
    ];
    return fields.map((f) => {
      if (!f) return '';
      if (f.includes(',') || f.includes('"') || f.includes('\n')) return '"' + f.replace(/"/g, '""') + '"';
      return f;
    }).join(',');
  });

  appendFileSync(MASTER_CSV, '\n' + csvLines.join('\n') + '\n');
  console.log(`  Appended ${allLeads.length} leads to ${MASTER_CSV}`);

  // Log
  for (const l of allLeads) {
    appendFileSync(LOG_FILE, JSON.stringify({ ...l, timestamp: new Date().toISOString() }) + '\n');
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('SCRAPE COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`  New leads with emails: ${allLeads.length}`);
  console.log(`  States covered: ${[...new Set(allLeads.map((l) => l.state))].join(', ')}`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
