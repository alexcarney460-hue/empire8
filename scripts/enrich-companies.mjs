#!/usr/bin/env node
/**
 * Company Website Enrichment — Value Suppliers
 *
 * Scrapes company websites for emails/phones and creates contacts
 * for companies that don't yet have any linked contacts.
 *
 * Usage:
 *   SUPABASE_URL=xxx SUPABASE_KEY=xxx node scripts/enrich-companies.mjs
 *
 * Options:
 *   BATCH_SIZE=0       — 0 = all (default)
 *   OFFSET=0           — skip first N companies (for resuming)
 *   DRY_RUN=true
 *   MIN_DELAY=300      — ms between website requests (default 300)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '0', 10);
const OFFSET = parseInt(process.env.OFFSET || '0', 10);
const MIN_DELAY = parseInt(process.env.MIN_DELAY || '300', 10);

if (!SUPABASE_URL && !DRY_RUN) { console.error('Missing SUPABASE_URL'); process.exit(1); }
if (!SUPABASE_KEY && !DRY_RUN) { console.error('Missing SUPABASE_KEY'); process.exit(1); }

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
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
  'googletagmanager.com', 'newrelic.com',
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

async function main() {
  console.log(`\nValue Suppliers — Company Website Enrichment`);
  console.log(`   Offset: ${OFFSET} | Batch: ${BATCH_SIZE || 'ALL'}`);
  console.log(`   Delay: ${MIN_DELAY}ms between companies`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  // Get company IDs that already have contacts
  console.log('Loading existing contact → company mappings...');
  const existingCompanyIds = new Set();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('contacts')
      .select('company_id')
      .not('company_id', 'is', null)
      .range(from, from + 999);
    if (error) { console.error('Fetch error:', error.message); break; }
    if (!data || data.length === 0) break;
    for (const c of data) existingCompanyIds.add(c.company_id);
    from += 1000;
    if (data.length < 1000) break;
  }
  console.log(`  ${existingCompanyIds.size} companies already have contacts\n`);

  // Get companies with domains that don't have contacts yet
  console.log('Loading companies needing enrichment...');
  const companies = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, domain, phone, city, state')
      .not('domain', 'is', null)
      .range(from, from + 999);
    if (error) { console.error('Fetch error:', error.message); break; }
    if (!data || data.length === 0) break;
    for (const c of data) {
      if (!existingCompanyIds.has(c.id) && c.domain) {
        companies.push(c);
      }
    }
    from += 1000;
    if (data.length < 1000) break;
  }

  console.log(`  ${companies.length} companies with domains need enrichment\n`);

  const toProcess = BATCH_SIZE > 0
    ? companies.slice(OFFSET, OFFSET + BATCH_SIZE)
    : companies.slice(OFFSET);

  let processed = 0;
  let contactsCreated = 0;
  let emailsFound = 0;
  let phonesFound = 0;
  let skipped = 0;

  for (const company of toProcess) {
    processed++;

    if (processed % 100 === 0) {
      console.log(`\n===== Progress: ${processed}/${toProcess.length} | Contacts: ${contactsCreated} | Emails: ${emailsFound} | Skipped: ${skipped} =====\n`);
    }

    process.stdout.write(`[${processed}/${toProcess.length}] ${company.name} (${company.domain})... `);

    const { emails, phones } = await scrapeContactInfo(company.domain);

    if (emails.length === 0) {
      console.log('no emails');
      skipped++;
      await sleep(MIN_DELAY);
      continue;
    }

    emailsFound += emails.length;
    if (phones.length > 0) phonesFound += phones.length;

    console.log(`${emails.length} emails, ${phones.length} phones`);

    if (!DRY_RUN) {
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

  console.log(`\n========== ENRICHMENT RESULTS ==========`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Contacts created: ${contactsCreated}`);
  console.log(`  Emails found: ${emailsFound}`);
  console.log(`  Phones found: ${phonesFound}`);
  console.log(`  Skipped (no email): ${skipped}`);
  console.log(`  Hit rate: ${((processed - skipped) / Math.max(processed, 1) * 100).toFixed(1)}%`);
  console.log(`  Resume with: OFFSET=${OFFSET + processed}`);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
