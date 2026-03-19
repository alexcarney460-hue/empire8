#!/usr/bin/env node
/**
 * Enrich cannabis/hemp leads CSV with emails, phones, and websites.
 *
 * For records missing email:
 *   1. Use Brave Search to find the company website
 *   2. Scrape the website + /contact page for emails and phones
 *   3. Update the master CSV in-place
 *
 * Usage:
 *   node scripts/enrich-cannabis-leads.mjs                    # Enrich all missing
 *   node scripts/enrich-cannabis-leads.mjs --limit 100        # First 100 missing
 *   node scripts/enrich-cannabis-leads.mjs --state OR         # Oregon only
 *   node scripts/enrich-cannabis-leads.mjs --dry-run          # Preview only
 *   node scripts/enrich-cannabis-leads.mjs --offset 200       # Skip first 200
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MASTER_CSV = join(__dirname, '..', 'cannabis-hemp-grows-2026-03-17.csv');

const BRAVE_API_KEY = 'BSAcMxzO8AD021dICd0f-5Zq5vuJJ8F';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_IDX = process.argv.indexOf('--limit');
const LIMIT = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;
const STATE_IDX = process.argv.indexOf('--state');
const ONLY_STATE = STATE_IDX !== -1 ? process.argv[STATE_IDX + 1]?.toUpperCase() : null;
const OFFSET_IDX = process.argv.indexOf('--offset');
const OFFSET = OFFSET_IDX !== -1 ? parseInt(process.argv[OFFSET_IDX + 1], 10) : 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    rows.push(row);
  }
  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function writeCSV(headers, rows) {
  const escapeField = (v) => {
    const s = String(v || '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escapeField).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeField(row[h])).join(','));
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Email/phone extraction
// ---------------------------------------------------------------------------

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const TEL_RE = /tel:([+\d\-().%20 ]{7,20})/gi;

const JUNK_DOMAINS = new Set([
  'example.com', 'domain.com', 'sentry.io', 'w3.org', 'schema.org',
  'googleapis.com', 'google.com', 'facebook.com', 'twitter.com',
  'instagram.com', 'youtube.com', 'tiktok.com', 'godaddy.com',
  'wixpress.com', 'squarespace.com', 'wordpress.com', 'shopify.com',
  'cloudflare.com', 'jquery.com', 'bootstrapcdn.com', 'wix.com',
  'leafly.com', 'weedmaps.com', 'dutchie.com', 'iheartjane.com',
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
  if (/^(filler|example|user|name|your|test|noreply|no-reply|donotreply|mailer-daemon|postmaster|webmaster|abuse)/.test(lower)) return false;
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
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

function extractContactInfo(html) {
  const emails = new Set();
  const phones = new Set();

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

  return { emails: [...emails].slice(0, 5), phones: [...phones].slice(0, 3) };
}

async function scrapeWebsite(domain) {
  const pages = [
    `https://${domain}`,
    `https://${domain}/contact`,
    `https://${domain}/contact-us`,
    `https://${domain}/about`,
  ];

  const allEmails = new Set();
  const allPhones = new Set();

  for (const url of pages) {
    const html = await fetchPage(url);
    if (!html) continue;
    const { emails, phones } = extractContactInfo(html);
    emails.forEach((e) => allEmails.add(e));
    phones.forEach((p) => allPhones.add(p));
    if (allEmails.size >= 2) break;
    await sleep(200);
  }

  return { emails: [...allEmails], phones: [...allPhones] };
}

// ---------------------------------------------------------------------------
// Brave Search
// ---------------------------------------------------------------------------

async function braveSearchWebsite(companyName, state) {
  const query = `"${companyName}" ${state} cannabis website`;
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
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
        await sleep(5000);
        return null;
      }
      return null;
    }
    const data = await res.json();
    const results = data.web?.results || [];

    // Find the most likely company website (not a directory/listing)
    const skipDomains = ['leafly.com', 'weedmaps.com', 'dutchie.com', 'yelp.com', 'facebook.com',
      'instagram.com', 'linkedin.com', 'twitter.com', 'reddit.com', 'wikipedia.org',
      'google.com', 'yellowpages.com', 'bbb.org', 'cannabis.ca.gov', 'iheartjane.com'];

    for (const r of results) {
      try {
        const hostname = new URL(r.url).hostname.replace(/^www\./, '');
        if (skipDomains.some((d) => hostname.includes(d))) continue;
        return hostname;
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('VALUE SUPPLIERS — Cannabis Lead Email Enrichment');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  State: ${ONLY_STATE || 'ALL'}`);
  console.log(`  Limit: ${LIMIT || 'ALL'}`);
  console.log(`  Offset: ${OFFSET}\n`);

  // Read master CSV
  const csvText = readFileSync(MASTER_CSV, 'utf-8');
  const { headers, rows } = parseCSV(csvText);

  // Ensure Email column exists
  if (!headers.includes('Email')) headers.push('Email');
  if (!headers.includes('Owner')) headers.push('Owner');
  if (!headers.includes('Website')) headers.push('Website');

  // Find rows missing email
  let targets = rows.filter((r, i) => {
    if (r.Email && r.Email.trim()) return false; // already has email
    if (ONLY_STATE && r.State !== ONLY_STATE) return false;
    return true;
  });

  // Apply offset and limit
  if (OFFSET > 0) targets = targets.slice(OFFSET);
  if (LIMIT > 0) targets = targets.slice(0, LIMIT);

  console.log(`  Total rows: ${rows.length}`);
  console.log(`  Missing email: ${rows.filter((r) => !r.Email?.trim()).length}`);
  console.log(`  Targets this run: ${targets.length}\n`);

  if (DRY_RUN) {
    for (const t of targets.slice(0, 20)) {
      console.log(`  ${t.Name} | ${t.City}, ${t.State}`);
    }
    if (targets.length > 20) console.log(`  ... and ${targets.length - 20} more`);
    return;
  }

  let enriched = 0;
  let emailsFound = 0;
  let phonesFound = 0;
  let websitesFound = 0;

  for (let i = 0; i < targets.length; i++) {
    const row = targets[i];
    const name = row.Name || row.DBA || '';
    if (!name) continue;

    if ((i + 1) % 25 === 0 || i === 0) {
      console.log(`\n--- ${i + 1}/${targets.length} | Emails: ${emailsFound} | Phones: ${phonesFound} | Websites: ${websitesFound} ---\n`);
    }

    // Step 1: Find website via Brave if we don't have one
    let domain = (row.Website || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    if (!domain) {
      domain = await braveSearchWebsite(name, row.State);
      if (domain) {
        row.Website = `https://${domain}`;
        websitesFound++;
        process.stdout.write(`[${i + 1}] ${name} → ${domain}`);
      } else {
        process.stdout.write(`[${i + 1}] ${name} → no website found`);
      }
      await sleep(1200); // Brave rate limit
    } else {
      process.stdout.write(`[${i + 1}] ${name} → ${domain} (existing)`);
    }

    // Step 2: Scrape website for email/phone
    if (domain) {
      const { emails, phones } = await scrapeWebsite(domain);

      if (emails.length > 0) {
        row.Email = emails[0];
        emailsFound++;
        process.stdout.write(` ✓ ${emails[0]}`);
      }
      if (phones.length > 0 && !row.Phone?.trim()) {
        row.Phone = phones[0];
        phonesFound++;
      }
      enriched++;
    }

    console.log('');

    // Save progress every 50 records
    if ((i + 1) % 50 === 0) {
      writeFileSync(MASTER_CSV, writeCSV(headers, rows));
      console.log(`  --- Saved progress (${i + 1}/${targets.length}) ---`);
    }
  }

  // Final save
  writeFileSync(MASTER_CSV, writeCSV(headers, rows));

  console.log(`\n${'='.repeat(60)}`);
  console.log('ENRICHMENT COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Records processed: ${targets.length}`);
  console.log(`  Websites found: ${websitesFound}`);
  console.log(`  Emails found: ${emailsFound}`);
  console.log(`  Phones found: ${phonesFound}`);
  console.log(`  Total enriched: ${enriched}`);

  // Final stats
  const finalEmails = rows.filter((r) => r.Email?.trim()).length;
  const finalPhones = rows.filter((r) => r.Phone?.trim()).length;
  console.log(`\n  Master CSV: ${rows.length} total | ${finalEmails} emails (${Math.round(finalEmails * 100 / rows.length)}%) | ${finalPhones} phones (${Math.round(finalPhones * 100 / rows.length)}%)`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
