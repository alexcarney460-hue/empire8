#!/usr/bin/env node
/**
 * Enrich NY cannabis license companies in Empire 8 CRM with emails,
 * phones, and websites via Brave Search + website scraping.
 *
 * Reads companies from Supabase where source = 'ny_ocm_registry' and
 * domain IS NULL (not yet enriched), finds their website via Brave Search,
 * scrapes contact pages for emails/phones, and updates the company + contact.
 *
 * Usage:
 *   node scripts/enrich-ny-crm.mjs                  # Enrich all
 *   node scripts/enrich-ny-crm.mjs --limit 50       # First 50
 *   node scripts/enrich-ny-crm.mjs --dry-run        # Preview only
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = 'https://ypqmcakzjvmtcypkyhce.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwcW1jYWt6anZtdGN5cGt5aGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk2NDA0NCwiZXhwIjoyMDg5NTQwMDQ0fQ.o8WPfoSfaTZ6vOz-kHTKhpXSjJf1WLknC_0fJOy5eBk';

const BRAVE_API_KEY = 'BSAcMxzO8AD021dICd0f-5Zq5vuJJ8F';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_IDX = process.argv.indexOf('--limit');
const LIMIT = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Email / phone extraction
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
  'indeed.com', 'yelp.com', 'bbb.org', 'linkedin.com',
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

// ---------------------------------------------------------------------------
// Brave Search
// ---------------------------------------------------------------------------

async function braveSearch(query) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
  try {
    const res = await fetch(url, {
      headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.web?.results || [];
  } catch {
    return [];
  }
}

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    // Skip marketplace/directory sites
    const skip = ['leafly.com', 'weedmaps.com', 'dutchie.com', 'iheartjane.com',
      'yelp.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com',
      'bbb.org', 'yellowpages.com', 'mapquest.com', 'google.com', 'cannabis.ny.gov',
      'data.ny.gov', 'indeed.com'];
    if (skip.some((s) => hostname === s || hostname.endsWith('.' + s))) return null;
    return hostname;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main enrichment logic
// ---------------------------------------------------------------------------

async function enrichCompany(company) {
  const name = company.dba || company.name;
  const city = company.city || '';
  // Use DBA if available (more recognizable), fall back to entity name
  // Include address for disambiguation of generic names
  const addr = company.address ? ` ${company.address}` : '';
  const query = `"${name}"${addr} ${city} NY cannabis dispensary`;

  const results = await braveSearch(query);
  if (!results.length) return null;

  // Find the best domain (first non-directory result)
  let domain = null;
  let websiteUrl = null;
  for (const r of results) {
    const d = extractDomain(r.url);
    if (d) {
      domain = d;
      websiteUrl = r.url;
      break;
    }
  }

  if (!domain) return null;

  // Scrape the website for emails and phones
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

  return {
    domain,
    website: websiteUrl,
    emails: [...allEmails],
    phones: [...allPhones],
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== NY Cannabis License Email Enrichment ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'FULL'}`);
  console.log('');

  // Fetch companies needing enrichment (no domain yet)
  let query = supabase
    .from('companies')
    .select('id, name, dba, city, state, phone, contact_name, domain')
    .eq('source', 'ny_ocm_registry')
    .is('domain', null)
    .order('created_at', { ascending: true });

  if (LIMIT) query = query.limit(LIMIT);
  else query = query.limit(2100);

  const { data: companies, error } = await query;
  if (error) {
    console.error('Failed to fetch companies:', error.message);
    process.exit(1);
  }

  console.log(`Companies to enrich: ${companies.length}`);
  if (!companies.length) {
    console.log('Nothing to do!');
    return;
  }

  let enriched = 0;
  let emailsFound = 0;
  let phonesFound = 0;
  let noResult = 0;

  for (let i = 0; i < companies.length; i++) {
    const co = companies[i];
    const label = `[${i + 1}/${companies.length}] ${co.dba || co.name}`;

    const result = await enrichCompany(co);

    if (!result) {
      noResult++;
      console.log(`  ${label} — no website found`);
      // Mark as attempted so we don't retry
      if (!DRY_RUN) {
        await supabase.from('companies').update({ domain: '_none_' }).eq('id', co.id);
      }
      await sleep(1200); // Brave rate limit
      continue;
    }

    const email = result.emails[0] || null;
    const phone = result.phones[0] || co.phone || null;

    console.log(`  ${label} — ${result.domain} | ${email || 'no email'} | ${phone || 'no phone'}`);

    if (email) emailsFound++;
    if (phone && !co.phone) phonesFound++;
    enriched++;

    if (!DRY_RUN) {
      // Update company
      await supabase.from('companies').update({
        domain: result.domain,
        phone: phone || co.phone,
      }).eq('id', co.id);

      // Update linked contact with email
      if (email) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('company_id', co.id)
          .is('email', null)
          .limit(1);

        if (contacts?.[0]) {
          await supabase.from('contacts').update({
            email,
            phone: phone || undefined,
          }).eq('id', contacts[0].id);
        }
      }
    }

    // Brave rate limit: ~1 req/sec for free tier
    await sleep(1200);

    // Progress every 50
    if ((i + 1) % 50 === 0) {
      console.log(`\n--- Progress: ${i + 1}/${companies.length} | Enriched: ${enriched} | Emails: ${emailsFound} | Phones: ${phonesFound} ---\n`);
    }
  }

  console.log('\n=== DONE ===');
  console.log(`Total processed: ${companies.length}`);
  console.log(`Enriched (website found): ${enriched}`);
  console.log(`Emails found: ${emailsFound}`);
  console.log(`Phones found: ${phonesFound}`);
  console.log(`No website found: ${noResult}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
