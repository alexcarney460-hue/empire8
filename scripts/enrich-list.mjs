#!/usr/bin/env node
/**
 * List-targeted Company Enrichment — Value Suppliers
 *
 * Enriches companies in a specific CRM list:
 * 1. Companies WITH domains → scrape website for emails/phones
 * 2. Companies WITHOUT domains → Brave Search for website + email
 *
 * Usage:
 *   SUPABASE_URL=xxx SUPABASE_KEY=xxx BRAVE_KEY=xxx LIST_ID=1 node scripts/enrich-list.mjs
 *
 * Options:
 *   LIST_ID=1          — required, the CRM list to enrich
 *   BATCH_SIZE=0       — 0 = all (default)
 *   OFFSET=0           — skip first N companies (for resuming)
 *   DRY_RUN=true
 *   MIN_DELAY=400      — ms between requests (default 400)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BRAVE_KEY = process.env.BRAVE_KEY;
const LIST_ID = process.env.LIST_ID;
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '0', 10);
const OFFSET = parseInt(process.env.OFFSET || '0', 10);
const MIN_DELAY = parseInt(process.env.MIN_DELAY || '400', 10);

if (!LIST_ID) { console.error('Missing LIST_ID'); process.exit(1); }
if (!SUPABASE_URL) { console.error('Missing SUPABASE_URL'); process.exit(1); }
if (!SUPABASE_KEY) { console.error('Missing SUPABASE_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const TEL_RE = /tel:([+\d\-().%20 ]{7,20})/gi;

const JUNK_DOMAINS = new Set([
  'example.com', 'domain.com', 'sentry.io', 'w3.org', 'schema.org',
  'googleapis.com', 'google.com', 'facebook.com', 'twitter.com',
  'instagram.com', 'youtube.com', 'tiktok.com', 'godaddy.com',
  'wixpress.com', 'squarespace.com', 'wordpress.com', 'shopify.com',
  'cloudflare.com', 'jquery.com', 'bootstrapcdn.com', 'onesignal.com',
  'googletagmanager.com', 'newrelic.com', 'yelp.com', 'leafly.com',
  'weedmaps.com', 'linkedin.com', 'mapquest.com', 'bbb.org',
  'yellowpages.com', 'manta.com', 'dnb.com', 'buzzfile.com',
]);

const JUNK_EMAIL_PREFIXES = /^(filler|example|user|name|your|test|noreply|no-reply|donotreply|mailer-daemon|postmaster|webmaster|abuse|privacy|legal|support@weedmaps|support@leafly)/;

function isValidEmail(email) {
  const lower = email.toLowerCase();
  if (lower.length > 80) return false;
  if (/\.(png|jpg|svg|webp|gif|css|js)$/.test(lower)) return false;
  const domain = lower.split('@')[1];
  if (!domain) return false;
  for (const junk of JUNK_DOMAINS) {
    if (domain === junk || domain.endsWith('.' + junk)) return false;
  }
  if (JUNK_EMAIL_PREFIXES.test(lower)) return false;
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

function extractFromHtml(html) {
  const emails = new Set();
  const phones = new Set();

  const emailMatches = html.match(EMAIL_RE) || [];
  for (const e of emailMatches) {
    if (isValidEmail(e)) emails.add(e.toLowerCase());
  }

  let m;
  const telReCopy = new RegExp(TEL_RE.source, TEL_RE.flags);
  while ((m = telReCopy.exec(html)) !== null) {
    const cleaned = cleanPhone(m[1]);
    if (cleaned) phones.add(cleaned);
  }

  const stripped = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
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
  if (!domain) return { emails: [], phones: [] };

  const pages = [
    `https://${domain}`,
    `https://${domain}/contact`,
    `https://${domain}/contact-us`,
    `https://${domain}/about`,
    `https://www.${domain}`,
    `https://www.${domain}/contact`,
  ];

  const allEmails = new Set();
  const allPhones = new Set();

  for (const url of pages) {
    const html = await fetchPage(url);
    if (!html) continue;

    const { emails, phones } = extractFromHtml(html);
    emails.forEach(e => allEmails.add(e));
    phones.forEach(p => allPhones.add(p));

    if (allEmails.size >= 3 && allPhones.size >= 1) break;
    await sleep(200);
  }

  return { emails: [...allEmails].slice(0, 5), phones: [...allPhones].slice(0, 3) };
}

async function braveSearch(query) {
  if (!BRAVE_KEY) return [];
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_KEY,
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.web?.results || [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function findViaSearch(companyName, city, state) {
  const query = `"${companyName}" ${city || ''} ${state || ''} email contact`;
  const results = await braveSearch(query);

  const emails = new Set();
  const phones = new Set();
  let foundDomain = null;

  // Extract from search result descriptions
  for (const r of results) {
    const text = (r.description || '') + ' ' + (r.title || '') + ' ' + (r.url || '');
    const emailMatches = text.match(EMAIL_RE) || [];
    for (const e of emailMatches) {
      if (isValidEmail(e)) emails.add(e.toLowerCase());
    }
    const phoneMatches = text.match(PHONE_RE) || [];
    for (const p of phoneMatches) {
      const cleaned = cleanPhone(p);
      if (cleaned) phones.add(cleaned);
    }

    // Try to find the company's own website (not directory sites)
    if (!foundDomain && r.url) {
      try {
        const hostname = new URL(r.url).hostname.replace(/^www\./, '');
        if (!JUNK_DOMAINS.has(hostname) && !hostname.includes('yelp') && !hostname.includes('mapquest')) {
          foundDomain = hostname;
        }
      } catch { /* skip */ }
    }
  }

  // If we found a domain, try scraping it
  if (foundDomain && emails.size === 0) {
    const scraped = await scrapeWebsite(foundDomain);
    scraped.emails.forEach(e => emails.add(e));
    scraped.phones.forEach(p => phones.add(p));
  }

  return {
    emails: [...emails].slice(0, 5),
    phones: [...phones].slice(0, 3),
    domain: foundDomain,
  };
}

async function main() {
  // Get list info
  const { data: listData, error: listErr } = await supabase
    .from('lists')
    .select('id, name')
    .eq('id', LIST_ID)
    .single();

  if (listErr || !listData) {
    console.error(`List ${LIST_ID} not found`);
    process.exit(1);
  }

  console.log(`\nValue Suppliers — List Enrichment: "${listData.name}" (ID: ${LIST_ID})`);
  console.log(`   Offset: ${OFFSET} | Batch: ${BATCH_SIZE || 'ALL'}`);
  console.log(`   Delay: ${MIN_DELAY}ms | Brave: ${BRAVE_KEY ? 'YES' : 'NO'}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  // Get all company IDs in this list
  console.log('Loading list members...');
  const companyIds = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('list_companies')
      .select('company_id')
      .eq('list_id', LIST_ID)
      .range(from, from + 999);
    if (error) { console.error('Fetch error:', error.message); break; }
    if (!data || data.length === 0) break;
    for (const row of data) companyIds.push(row.company_id);
    from += 1000;
    if (data.length < 1000) break;
  }
  console.log(`  ${companyIds.length} companies in list\n`);

  if (companyIds.length === 0) {
    console.log('No companies to enrich.');
    return;
  }

  // Get existing contacts (company_id → has email?)
  console.log('Loading existing contacts...');
  const companiesWithEmail = new Set();
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('contacts')
      .select('company_id, email')
      .not('company_id', 'is', null)
      .not('email', 'is', null)
      .range(from, from + 999);
    if (error) { console.error('Fetch error:', error.message); break; }
    if (!data || data.length === 0) break;
    for (const c of data) {
      if (c.email && c.email.trim()) companiesWithEmail.add(c.company_id);
    }
    from += 1000;
    if (data.length < 1000) break;
  }

  // Filter to only companies in our list that need emails
  const needsEnrichment = companyIds.filter(id => !companiesWithEmail.has(id));
  console.log(`  ${companiesWithEmail.size} companies already have email contacts`);
  console.log(`  ${needsEnrichment.length} companies need enrichment\n`);

  // Fetch company details in batches
  console.log('Loading company details...');
  const companies = [];
  for (let i = 0; i < needsEnrichment.length; i += 50) {
    const batch = needsEnrichment.slice(i, i + 50);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, domain, phone, city, state')
      .in('id', batch);
    if (error) { console.error('Fetch error:', error.message); continue; }
    if (data) companies.push(...data);
  }

  console.log(`  ${companies.length} companies to process\n`);

  const toProcess = BATCH_SIZE > 0
    ? companies.slice(OFFSET, OFFSET + BATCH_SIZE)
    : companies.slice(OFFSET);

  let processed = 0;
  let contactsCreated = 0;
  let emailsFound = 0;
  let phonesFound = 0;
  let domainsFound = 0;
  let skipped = 0;

  for (const company of toProcess) {
    processed++;

    if (processed % 50 === 0) {
      console.log(`\n===== Progress: ${processed}/${toProcess.length} | Contacts: ${contactsCreated} | Emails: ${emailsFound} | Domains: ${domainsFound} | Skipped: ${skipped} =====\n`);
    }

    process.stdout.write(`[${processed}/${toProcess.length}] ${company.name} `);

    let emails = [];
    let phones = [];

    if (company.domain) {
      // Has domain — scrape website
      process.stdout.write(`(${company.domain})... `);
      const result = await scrapeWebsite(company.domain);
      emails = result.emails;
      phones = result.phones;
    } else if (BRAVE_KEY) {
      // No domain — use Brave Search
      process.stdout.write(`(searching)... `);
      const result = await findViaSearch(company.name, company.city, company.state);
      emails = result.emails;
      phones = result.phones;

      // Update company domain if found
      if (result.domain && !DRY_RUN) {
        await supabase.from('companies').update({ domain: result.domain }).eq('id', company.id);
        domainsFound++;
        process.stdout.write(`[domain: ${result.domain}] `);
      }
    } else {
      process.stdout.write(`(no domain, no Brave key)... `);
    }

    if (emails.length === 0) {
      console.log('no emails');
      skipped++;
      await sleep(MIN_DELAY);
      continue;
    }

    emailsFound += emails.length;
    phonesFound += phones.length;
    console.log(`${emails.length} emails, ${phones.length} phones`);

    if (!DRY_RUN) {
      // Create contact records
      for (const email of emails.slice(0, 3)) {
        const { error } = await supabase.from('contacts').insert({
          company_id: company.id,
          email,
          phone: phones[0] || company.phone || null,
          city: company.city || null,
          state: company.state || null,
          source: 'website_scrape',
          lead_status: 'NEW',
          lifecycle_stage: 'lead',
        });
        if (!error) contactsCreated++;
        else if (!error.message?.includes('duplicate')) console.log(`    Insert error: ${error.message}`);
      }
    }

    await sleep(MIN_DELAY);
  }

  console.log(`\n========== LIST ENRICHMENT RESULTS ==========`);
  console.log(`  List: "${listData.name}" (ID: ${LIST_ID})`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Contacts created: ${contactsCreated}`);
  console.log(`  Emails found: ${emailsFound}`);
  console.log(`  Phones found: ${phonesFound}`);
  console.log(`  Domains discovered: ${domainsFound}`);
  console.log(`  Skipped (no email): ${skipped}`);
  console.log(`  Hit rate: ${((processed - skipped) / Math.max(processed, 1) * 100).toFixed(1)}%`);
  console.log(`  Resume with: OFFSET=${OFFSET + processed}`);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
