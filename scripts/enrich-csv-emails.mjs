#!/usr/bin/env node
/**
 * Enrich CSV leads that are missing emails using Brave Search API.
 *
 * Reads the master CSV, finds rows without emails, searches Brave for
 * "business name city state email" and extracts email addresses from results.
 * Updates the CSV in place with found emails.
 *
 * Usage:
 *   node scripts/enrich-csv-emails.mjs                     # Enrich up to 500
 *   node scripts/enrich-csv-emails.mjs --limit 1000        # Enrich up to 1000
 *   node scripts/enrich-csv-emails.mjs --dry-run            # Preview only
 *   node scripts/enrich-csv-emails.mjs --offset 500         # Skip first 500 missing
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MASTER_CSV = join(__dirname, '..', 'cannabis-hemp-grows-2026-03-17.csv');
const ENRICHMENT_LOG = join(__dirname, '..', 'tmp', 'enrichment-log.jsonl');

const BRAVE_KEY = 'BSAcMxzO8AD021dICd0f-5Zq5vuJJ8F';
const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_IDX = process.argv.indexOf('--limit');
const LIMIT = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 500;
const OFFSET_IDX = process.argv.indexOf('--offset');
const OFFSET = OFFSET_IDX !== -1 ? parseInt(process.argv[OFFSET_IDX + 1], 10) : 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// CSV parsing (handles quoted fields)
// ---------------------------------------------------------------------------

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += ch;
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = { _lineIndex: i };
    for (let j = 0; j < headers.length; j++) row[headers[j]] = values[j] || '';
    rows.push(row);
  }
  return { headers, rows, rawLines: lines };
}

function escapeCSVField(val) {
  if (!val) return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

// ---------------------------------------------------------------------------
// Email extraction
// ---------------------------------------------------------------------------

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const JUNK_DOMAINS = new Set([
  'example.com', 'sentry.io', 'w3.org', 'schema.org', 'googleapis.com',
  'google.com', 'facebook.com', 'twitter.com', 'instagram.com',
  'youtube.com', 'tiktok.com', 'godaddy.com', 'wixpress.com',
  'squarespace.com', 'wordpress.com', 'shopify.com', 'cloudflare.com',
  'yelp.com', 'leafly.com', 'weedmaps.com', 'linkedin.com',
  'mapquest.com', 'bbb.org', 'yellowpages.com', 'indeed.com',
  'glassdoor.com', 'craigslist.org', 'wikipedia.org', 'brave.com',
  'bing.com', 'yahoo.com', 'gmail.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'icloud.com', 'protonmail.com',
]);

const JUNK_PREFIXES = /^(noreply|no-reply|donotreply|mailer-daemon|postmaster|webmaster|abuse|privacy|legal|support@weedmaps|support@leafly|info@yelp|info@bbb)/;

function extractEmails(text) {
  const matches = text.match(EMAIL_RE) || [];
  return [...new Set(matches.map((e) => e.toLowerCase()))].filter((email) => {
    if (email.length > 80) return false;
    if (/\.(png|jpg|svg|webp|gif|css|js)$/.test(email)) return false;
    const domain = email.split('@')[1];
    if (!domain) return false;
    if (JUNK_DOMAINS.has(domain)) return false;
    if (JUNK_PREFIXES.test(email)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Brave Search
// ---------------------------------------------------------------------------

async function searchBrave(query, retries = 2) {
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set('q', query);
  url.searchParams.set('count', '5');

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
  } catch (err) {
    return null;
  }
}

function extractEmailsFromResults(results) {
  if (!results?.web?.results) return [];
  const allText = results.web.results
    .map((r) => `${r.title || ''} ${r.description || ''} ${r.url || ''}`)
    .join(' ');
  return extractEmails(allText);
}

// ---------------------------------------------------------------------------
// Website scraping (direct fetch for email)
// ---------------------------------------------------------------------------

async function scrapeWebsiteEmail(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const html = await res.text();
    return extractEmails(html.substring(0, 100000)); // First 100KB only
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main enrichment
// ---------------------------------------------------------------------------

async function enrichLead(lead) {
  const name = (lead.Name || '').trim();
  const dba = (lead.DBA || '').trim();
  const city = (lead.City || '').trim();
  const state = (lead.State || '').trim();
  const website = (lead.Website || '').trim();

  const searchName = dba || name;
  if (!searchName) return null;

  let foundEmails = [];

  // Strategy 1: If we have a website, scrape it directly
  if (website && website.startsWith('http')) {
    foundEmails = await scrapeWebsiteEmail(website);
    if (foundEmails.length > 0) {
      return { email: foundEmails[0], source: 'website_scrape' };
    }
    // Also try /contact page
    try {
      const contactUrl = new URL('/contact', website).toString();
      const contactEmails = await scrapeWebsiteEmail(contactUrl);
      if (contactEmails.length > 0) {
        return { email: contactEmails[0], source: 'website_contact' };
      }
    } catch {}
  }

  // Strategy 2: Brave Search for business email
  const query = `"${searchName}" ${city} ${state} email contact`;
  const results = await searchBrave(query);
  foundEmails = extractEmailsFromResults(results);

  if (foundEmails.length > 0) {
    return { email: foundEmails[0], source: 'brave_search' };
  }

  // Strategy 3: Try without quotes
  if (foundEmails.length === 0) {
    const query2 = `${searchName} ${state} cannabis email`;
    const results2 = await searchBrave(query2);
    foundEmails = extractEmailsFromResults(results2);
    if (foundEmails.length > 0) {
      return { email: foundEmails[0], source: 'brave_search_broad' };
    }
  }

  return null;
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('VALUE SUPPLIERS — CSV Email Enrichment');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE (will update CSV)'}`);
  console.log(`  Limit: ${LIMIT}`);
  console.log(`  Offset: ${OFFSET}`);

  const csvText = readFileSync(MASTER_CSV, 'utf-8');
  const { headers, rows, rawLines } = parseCSV(csvText);

  // Find the Email column index
  const emailIdx = headers.indexOf('Email');
  if (emailIdx === -1) {
    console.error('  ERROR: No "Email" column in CSV');
    process.exit(1);
  }

  // Filter to rows missing emails
  const needsEmail = rows.filter((r) => {
    const email = (r.Email || '').trim();
    return !email || !email.includes('@');
  });

  console.log(`  Total rows: ${rows.length}`);
  console.log(`  Missing email: ${needsEmail.length}`);
  console.log(`  Have email: ${rows.length - needsEmail.length}`);

  // Already enriched (from log)
  const alreadyTried = new Set();
  if (existsSync(ENRICHMENT_LOG)) {
    const lines = readFileSync(ENRICHMENT_LOG, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        alreadyTried.add(entry.license || entry.name);
      } catch {}
    }
  }

  const targets = needsEmail
    .filter((r) => !alreadyTried.has(r['License Number'] || r.Name))
    .slice(OFFSET, OFFSET + LIMIT);

  console.log(`  Already tried: ${alreadyTried.size}`);
  console.log(`  Targets this run: ${targets.length}\n`);

  if (targets.length === 0) {
    console.log('  No leads to enrich!');
    return;
  }

  let found = 0;
  let notFound = 0;
  const updates = []; // { lineIndex, email }

  for (let i = 0; i < targets.length; i++) {
    const lead = targets[i];
    const displayName = lead.DBA || lead.Name || 'Unknown';

    process.stdout.write(`  [${i + 1}/${targets.length}] ${displayName.substring(0, 40).padEnd(40)} `);

    if (DRY_RUN) {
      console.log(`→ would search`);
      continue;
    }

    const result = await enrichLead(lead);

    // Log attempt
    appendFileSync(ENRICHMENT_LOG, JSON.stringify({
      license: lead['License Number'] || '',
      name: lead.Name,
      found: !!result,
      email: result?.email || null,
      source: result?.source || null,
      timestamp: new Date().toISOString(),
    }) + '\n');

    if (result) {
      found++;
      console.log(`✓ ${result.email} (${result.source})`);
      updates.push({ lineIndex: lead._lineIndex, email: result.email });
    } else {
      notFound++;
      console.log(`✗ no email found`);
    }

    // Rate limit: 2s between leads (each lead may use 1-2 Brave searches)
    await sleep(2000);

    if ((i + 1) % 50 === 0) {
      console.log(`\n  --- Progress: ${found} found, ${notFound} not found ---\n`);
    }
  }

  // Update CSV with found emails
  if (updates.length > 0 && !DRY_RUN) {
    console.log(`\n  Updating CSV with ${updates.length} new emails...`);
    const lines = csvText.split('\n');
    for (const { lineIndex, email } of updates) {
      const fields = parseCSVLine(lines[lineIndex]);
      fields[emailIdx] = email;
      lines[lineIndex] = fields.map(escapeCSVField).join(',');
    }
    writeFileSync(MASTER_CSV, lines.join('\n'), 'utf-8');
    console.log('  CSV updated!');
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('ENRICHMENT COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Found: ${found}`);
  console.log(`  Not found: ${notFound}`);
  console.log(`  Hit rate: ${targets.length > 0 ? ((found / targets.length) * 100).toFixed(1) : 0}%`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
