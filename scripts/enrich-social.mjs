#!/usr/bin/env node
/**
 * Value Suppliers — Social Media Enrichment (Facebook + Instagram)
 *
 * Searches Google for company Facebook/Instagram pages, then scrapes
 * email/phone from the page content. Creates contacts for companies
 * that don't yet have any linked contacts.
 *
 * Usage:
 *   SUPABASE_URL=xxx SUPABASE_KEY=xxx node scripts/enrich-social.mjs
 *
 * Options:
 *   BATCH_SIZE=0       — 0 = all (default)
 *   OFFSET=0           — skip first N companies (for resuming)
 *   DRY_RUN=true
 *   MIN_DELAY=2000     — ms between Google searches (default 2000)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '0', 10);
const OFFSET = parseInt(process.env.OFFSET || '0', 10);
const MIN_DELAY = parseInt(process.env.MIN_DELAY || '2000', 10);

if (!SUPABASE_URL && !DRY_RUN) { console.error('Missing SUPABASE_URL'); process.exit(1); }
if (!SUPABASE_KEY && !DRY_RUN) { console.error('Missing SUPABASE_KEY'); process.exit(1); }

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

const JUNK_DOMAINS = new Set([
  'example.com', 'sentry.io', 'w3.org', 'schema.org', 'googleapis.com',
  'google.com', 'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com',
  'tiktok.com', 'godaddy.com', 'wixpress.com', 'squarespace.com',
  'wordpress.com', 'shopify.com', 'cloudflare.com', 'fbcdn.net',
  'fbsbx.com', 'tfbnw.net', 'cdninstagram.com',
]);

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function isValidEmail(email) {
  const lower = email.toLowerCase();
  if (lower.length > 80) return false;
  if (/\.(png|jpg|svg|webp|gif|css|js)$/.test(lower)) return false;
  const domain = lower.split('@')[1];
  if (!domain) return false;
  for (const junk of JUNK_DOMAINS) {
    if (domain === junk || domain.endsWith('.' + junk)) return false;
  }
  if (/^(filler|example|user|name|your|test|noreply|no-reply|donotreply|mailer-daemon|postmaster|webmaster|abuse|privacy|legal|support@facebook|support@instagram)/.test(lower)) return false;
  return true;
}

function cleanPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return null;
}

async function fetchPage(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
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

// Search Google for a company's Facebook or Instagram page
async function googleSearch(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://www.google.com/search?q=${encoded}&num=5&hl=en`;
  const html = await fetchPage(url, 12000);
  if (!html) return [];

  // Extract URLs from Google results
  const urlRe = /href="\/url\?q=(https?:\/\/[^"&]+)/g;
  const urls = [];
  let m;
  while ((m = urlRe.exec(html)) !== null) {
    try {
      urls.push(decodeURIComponent(m[1]));
    } catch { /* skip bad urls */ }
  }
  return urls;
}

// Extract emails and phones from a Facebook or Instagram page
function extractContactInfo(html) {
  const emails = new Set();
  const phones = new Set();

  // Strip scripts/styles for cleaner extraction
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Find emails
  const emailMatches = cleaned.match(EMAIL_RE) || [];
  for (const e of emailMatches) {
    if (isValidEmail(e)) emails.add(e.toLowerCase());
  }

  // Find phones from tel: links
  const telRe = /tel:([+\d\-().%20 ]{7,20})/gi;
  let m;
  while ((m = telRe.exec(cleaned)) !== null) {
    const p = cleanPhone(m[1]);
    if (p) phones.add(p);
  }

  // Find phones from text
  const stripped = cleaned.replace(/<[^>]+>/g, ' ');
  const phoneMatches = stripped.match(PHONE_RE) || [];
  for (const p of phoneMatches) {
    const cleaned2 = cleanPhone(p);
    if (cleaned2) phones.add(cleaned2);
  }

  return { emails: [...emails].slice(0, 5), phones: [...phones].slice(0, 3) };
}

async function findSocialContacts(companyName, city, state) {
  const emails = new Set();
  const phones = new Set();
  let fbUrl = null;
  let igUrl = null;

  // Search for Facebook page
  const fbQuery = `"${companyName}" ${city} ${state} site:facebook.com`;
  const fbResults = await googleSearch(fbQuery);

  for (const url of fbResults) {
    if (url.includes('facebook.com') && !url.includes('/login') && !url.includes('/help')) {
      fbUrl = url;
      // Try to fetch the Facebook page "about" section
      const aboutUrl = url.replace(/\/?$/, '/about');
      const html = await fetchPage(aboutUrl);
      if (html) {
        const info = extractContactInfo(html);
        info.emails.forEach(e => emails.add(e));
        info.phones.forEach(p => phones.add(p));
      }
      // Also try the main page
      if (emails.size === 0) {
        const mainHtml = await fetchPage(url);
        if (mainHtml) {
          const info = extractContactInfo(mainHtml);
          info.emails.forEach(e => emails.add(e));
          info.phones.forEach(p => phones.add(p));
        }
      }
      break;
    }
  }

  await sleep(800 + Math.random() * 400);

  // Search for Instagram page
  const igQuery = `"${companyName}" ${city} ${state} site:instagram.com`;
  const igResults = await googleSearch(igQuery);

  for (const url of igResults) {
    if (url.includes('instagram.com') && !url.includes('/explore') && !url.includes('/accounts')) {
      igUrl = url;
      const html = await fetchPage(url);
      if (html) {
        const info = extractContactInfo(html);
        info.emails.forEach(e => emails.add(e));
        info.phones.forEach(p => phones.add(p));

        // Instagram bio often has email in JSON data
        const bioEmailRe = /"business_email"\s*:\s*"([^"]+)"/g;
        let bm;
        while ((bm = bioEmailRe.exec(html)) !== null) {
          if (isValidEmail(bm[1])) emails.add(bm[1].toLowerCase());
        }
        const bioPhoneRe = /"business_phone_number"\s*:\s*"([^"]+)"/g;
        while ((bm = bioPhoneRe.exec(html)) !== null) {
          const p = cleanPhone(bm[1]);
          if (p) phones.add(p);
        }
      }
      break;
    }
  }

  return {
    emails: [...emails].slice(0, 5),
    phones: [...phones].slice(0, 3),
    fbUrl,
    igUrl,
  };
}

async function main() {
  console.log(`\nValue Suppliers — Social Media Enrichment (Facebook + Instagram)`);
  console.log(`   Offset: ${OFFSET} | Batch: ${BATCH_SIZE || 'ALL'}`);
  console.log(`   Delay: ${MIN_DELAY}ms between companies`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  // Get company IDs that already have contacts
  console.log('Loading existing contact -> company mappings...');
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

  // Get companies without contacts
  console.log('Loading companies needing enrichment...');
  const companies = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, domain, phone, city, state')
      .range(from, from + 999);
    if (error) { console.error('Fetch error:', error.message); break; }
    if (!data || data.length === 0) break;
    for (const c of data) {
      if (!existingCompanyIds.has(c.id)) {
        companies.push(c);
      }
    }
    from += 1000;
    if (data.length < 1000) break;
  }

  console.log(`  ${companies.length} companies need enrichment\n`);

  const toProcess = BATCH_SIZE > 0
    ? companies.slice(OFFSET, OFFSET + BATCH_SIZE)
    : companies.slice(OFFSET);

  let processed = 0;
  let contactsCreated = 0;
  let emailsFound = 0;
  let phonesFound = 0;
  let skipped = 0;
  let fbFound = 0;
  let igFound = 0;

  for (const company of toProcess) {
    processed++;

    if (processed % 50 === 0) {
      console.log(`\n===== Progress: ${processed}/${toProcess.length} | Contacts: ${contactsCreated} | Emails: ${emailsFound} | FB: ${fbFound} | IG: ${igFound} | Skipped: ${skipped} =====\n`);
    }

    process.stdout.write(`[${processed}/${toProcess.length}] ${company.name} (${company.city}, ${company.state})... `);

    const { emails, phones, fbUrl, igUrl } = await findSocialContacts(
      company.name,
      company.city || '',
      company.state || ''
    );

    if (fbUrl) fbFound++;
    if (igUrl) igFound++;

    if (emails.length === 0 && phones.length === 0) {
      console.log(`no contact info${fbUrl ? ' (FB found)' : ''}${igUrl ? ' (IG found)' : ''}`);
      skipped++;
      await sleep(MIN_DELAY + Math.random() * 1000);
      continue;
    }

    emailsFound += emails.length;
    phonesFound += phones.length;

    console.log(`${emails.length} emails, ${phones.length} phones${fbUrl ? ' [FB]' : ''}${igUrl ? ' [IG]' : ''}`);

    if (!DRY_RUN) {
      if (emails.length > 0) {
        for (const email of emails.slice(0, 3)) {
          const { error } = await supabase.from('contacts').insert({
            company_id: company.id,
            email,
            phone: phones[0] || company.phone || null,
            city: company.city || null,
            state: company.state || null,
            source: 'social_scrape',
            lead_status: 'NEW',
            lifecycle_stage: 'lead',
          });
          if (!error) contactsCreated++;
          else if (!error.message?.includes('duplicate')) console.log(`    Insert error: ${error.message}`);
        }
      } else if (phones.length > 0) {
        // No email but found a phone number — still useful for B2B outreach
        const { error } = await supabase.from('contacts').insert({
          company_id: company.id,
          phone: phones[0],
          city: company.city || null,
          state: company.state || null,
          source: 'social_scrape',
          lead_status: 'NEW',
          lifecycle_stage: 'lead',
        });
        if (!error) contactsCreated++;
        else if (!error.message?.includes('duplicate')) console.log(`    Insert error: ${error.message}`);
      }
    }

    await sleep(MIN_DELAY + Math.random() * 1000);
  }

  console.log(`\n========== SOCIAL ENRICHMENT RESULTS ==========`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Contacts created: ${contactsCreated}`);
  console.log(`  Emails found: ${emailsFound}`);
  console.log(`  Phones found: ${phonesFound}`);
  console.log(`  Facebook pages found: ${fbFound}`);
  console.log(`  Instagram pages found: ${igFound}`);
  console.log(`  Skipped (no info): ${skipped}`);
  console.log(`  Hit rate: ${((processed - skipped) / Math.max(processed, 1) * 100).toFixed(1)}%`);
  console.log(`  Resume with: OFFSET=${OFFSET + processed}`);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
