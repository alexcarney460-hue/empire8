#!/usr/bin/env node
/**
 * Enrich NY cannabis license companies with emails/phones/websites.
 *
 * Strategy: For each company missing a domain, search Google via scraping
 * for "[business name] [city] NY cannabis", find the website, then scrape
 * the website's contact/about pages for emails and phones.
 *
 * No API keys needed — uses direct website scraping.
 *
 * Usage:
 *   node scripts/enrich-ny-google.mjs                  # Enrich all
 *   node scripts/enrich-ny-google.mjs --limit 50       # First 50
 *   node scripts/enrich-ny-google.mjs --dry-run        # Preview only
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ypqmcakzjvmtcypkyhce.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwcW1jYWt6anZtdGN5cGt5aGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk2NDA0NCwiZXhwIjoyMDg5NTQwMDQ0fQ.o8WPfoSfaTZ6vOz-kHTKhpXSjJf1WLknC_0fJOy5eBk';

const APIFY_TOKEN = '';  // Will read from file

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
  'example.com', 'sentry.io', 'w3.org', 'schema.org',
  'googleapis.com', 'google.com', 'facebook.com', 'twitter.com',
  'instagram.com', 'youtube.com', 'tiktok.com', 'godaddy.com',
  'wixpress.com', 'squarespace.com', 'wordpress.com', 'shopify.com',
  'cloudflare.com', 'wix.com', 'leafly.com', 'weedmaps.com',
  'dutchie.com', 'iheartjane.com', 'indeed.com', 'yelp.com',
  'bbb.org', 'linkedin.com', 'yellowpages.com', 'mapquest.com',
  'cannabis.ny.gov', 'data.ny.gov', 'craigslist.org',
  'duckduckgo.com', 'duck.com', 'opengovny.com', 'opencorporates.com',
  'bizapedia.com', 'dnb.com', 'zoominfo.com', 'chamberofcommerce.com',
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
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
// DuckDuckGo search (no API key needed)
// ---------------------------------------------------------------------------

async function duckSearch(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await fetchPage(url, 10000);
  if (!html) return [];

  // Extract result URLs from DuckDuckGo HTML results
  const results = [];
  const linkRe = /class="result__a"[^>]*href="([^"]+)"/g;
  let match;
  while ((match = linkRe.exec(html)) !== null) {
    let href = match[1];
    // DDG wraps URLs in redirect — extract the actual URL
    const udParam = href.match(/uddg=([^&]+)/);
    if (udParam) {
      href = decodeURIComponent(udParam[1]);
    }
    results.push(href);
  }
  return results.slice(0, 8);
}

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    for (const junk of JUNK_DOMAINS) {
      if (hostname === junk || hostname.endsWith('.' + junk)) return null;
    }
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
  const query = `${name} ${city} NY cannabis`;

  const results = await duckSearch(query);
  if (!results.length) return null;

  // Find the best domain
  let domain = null;
  for (const url of results) {
    const d = extractDomain(url);
    if (d) { domain = d; break; }
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
    await sleep(300);
  }

  return {
    domain,
    emails: [...allEmails],
    phones: [...allPhones],
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== NY Cannabis License Enrichment (DuckDuckGo + Scrape) ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'FULL'}`);

  let query = supabase
    .from('companies')
    .select('id, name, dba, city, state, phone, contact_name, domain')
    .eq('source', 'ny_ocm_registry')
    .is('domain', null)
    .order('created_at', { ascending: true });

  if (LIMIT) query = query.limit(LIMIT);
  else query = query.limit(2100);

  const { data: companies, error } = await query;
  if (error) { console.error('Fetch error:', error.message); process.exit(1); }

  console.log(`Companies to enrich: ${companies.length}\n`);
  if (!companies.length) { console.log('Nothing to do!'); return; }

  let enriched = 0, emailsFound = 0, phonesFound = 0, noResult = 0;

  for (let i = 0; i < companies.length; i++) {
    const co = companies[i];
    const label = `[${i + 1}/${companies.length}] ${(co.dba || co.name).slice(0, 40)}`;

    const result = await enrichCompany(co);

    if (!result) {
      noResult++;
      console.log(`  ${label} — no website found`);
      if (!DRY_RUN) {
        await supabase.from('companies').update({ domain: '_none_' }).eq('id', co.id);
      }
      await sleep(2000); // Rate limit DuckDuckGo
      continue;
    }

    const email = result.emails[0] || null;
    const phone = result.phones[0] || co.phone || null;

    console.log(`  ${label} — ${result.domain} | ${email || 'no email'} | ${phone || 'no phone'}`);

    if (email) emailsFound++;
    if (phone && !co.phone) phonesFound++;
    enriched++;

    if (!DRY_RUN) {
      await supabase.from('companies').update({
        domain: result.domain,
        phone: phone || co.phone,
      }).eq('id', co.id);

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

    await sleep(2500); // Rate limit DuckDuckGo
    if ((i + 1) % 25 === 0) {
      console.log(`\n--- Progress: ${i + 1}/${companies.length} | Enriched: ${enriched} | Emails: ${emailsFound} | Phones: ${phonesFound} ---\n`);
    }
  }

  console.log('\n=== DONE ===');
  console.log(`Processed: ${companies.length}`);
  console.log(`Enriched: ${enriched}`);
  console.log(`Emails found: ${emailsFound}`);
  console.log(`Phones found: ${phonesFound}`);
  console.log(`No website: ${noResult}`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
