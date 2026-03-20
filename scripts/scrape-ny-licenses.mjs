#!/usr/bin/env node
/**
 * NY Cannabis License Registry Scraper
 *
 * Pulls all license holders from the NY OCM open data portal (data.ny.gov),
 * groups by license type into separate CRM lists, and loads into the
 * Empire 8 Sales Direct Supabase CRM.
 *
 * Data source: https://data.ny.gov/resource/jskf-tt3q.json
 * Fields: entity_name, dba, primary_contact_name, license_type, license_number,
 *         license_status, address_line_1, city, state, zip_code, county, phone (rare)
 *
 * Usage:
 *   node scripts/scrape-ny-licenses.mjs              # Full run
 *   node scripts/scrape-ny-licenses.mjs --dry-run    # Preview only
 *   node scripts/scrape-ny-licenses.mjs --csv-only   # Save CSV, skip Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = 'https://ypqmcakzjvmtcypkyhce.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const NY_OCM_API = 'https://data.ny.gov/resource/jskf-tt3q.json';
const BATCH_SIZE = 50;

const DRY_RUN = process.argv.includes('--dry-run');
const CSV_ONLY = process.argv.includes('--csv-only');

const supabase = (!DRY_RUN && !CSV_ONLY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Step 1: Fetch all NY licenses from Socrata API
// ---------------------------------------------------------------------------

async function fetchAllNYLicenses() {
  const all = [];
  let offset = 0;
  const limit = 5000;

  console.log('Fetching NY OCM licenses from data.ny.gov...');

  while (true) {
    const url = `${NY_OCM_API}?$limit=${limit}&$offset=${offset}&$order=license_number`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      break;
    }
    const batch = await res.json();
    if (!batch.length) break;

    all.push(...batch);
    console.log(`  Fetched ${all.length} records...`);
    offset += limit;

    if (batch.length < limit) break;
    await sleep(500); // Be polite to the API
  }

  console.log(`Total records fetched: ${all.length}`);
  return all;
}

// ---------------------------------------------------------------------------
// Step 2: Normalize records
// ---------------------------------------------------------------------------

function normalize(raw) {
  return {
    name: (raw.entity_name || raw.dba || '').trim().slice(0, 250),
    dba: (raw.dba || '').trim().slice(0, 250) || null,
    license_number: (raw.license_number || '').trim() || null,
    license_type: (raw.license_type || '').trim() || null,
    license_status: (raw.license_status || '').trim() || null,
    address: (raw.address_line_1 || '').trim() || null,
    city: (raw.city || '').trim() || null,
    state: 'NY',
    zip: (raw.zip_code || '').trim() || null,
    county: (raw.county || '').trim() || null,
    phone: (raw.phone || '').trim() || null,
    contact_name: (raw.primary_contact_name || '').trim() || null,
    source: 'ny_ocm_registry',
    source_url: 'https://data.ny.gov/resource/jskf-tt3q',
    // Extra fields for CSV export but not CRM:
    _region: (raw.region || '').trim() || null,
    _business_purpose: (raw.business_purpose || '').trim() || null,
    _see_category: (raw.see_category || '').trim() || null,
    _operational_status: (raw.operational_status || '').trim() || null,
    _issued_date: raw.issued_date || null,
    _expiration_date: raw.expiration_date || null,
  };
}

// ---------------------------------------------------------------------------
// Step 3: Group by license type
// ---------------------------------------------------------------------------

function groupByType(records) {
  const groups = {};
  for (const r of records) {
    const type = r.license_type || 'Unknown';
    if (!groups[type]) groups[type] = [];
    groups[type].push(r);
  }
  return groups;
}

// Short name for list creation
function shortType(licenseType) {
  return licenseType
    .replace(/Adult-Use\s+/i, '')
    .replace(/Conditional\s+/i, 'Cond. ')
    .replace(/License$/i, '')
    .trim();
}

// ---------------------------------------------------------------------------
// Step 4: Export to CSV
// ---------------------------------------------------------------------------

function exportCSV(groups) {
  const dataDir = join(__dirname, '..', 'data');
  mkdirSync(dataDir, { recursive: true });

  const allRows = [];
  const headers = [
    'name', 'dba', 'license_number', 'license_type', 'license_status',
    'contact_name', 'phone', 'address', 'city', 'state', 'zip', 'county',
    'region', 'business_purpose', 'see_category', 'operational_status',
    'issued_date', 'expiration_date',
  ];

  for (const [type, records] of Object.entries(groups)) {
    // Individual CSV per license type
    const safeType = type.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().replace(/-+$/, '');
    const rows = records.map((r) =>
      headers.map((h) => {
        const val = h.startsWith('_') ? r[h] : (r[h] || r[`_${h}`] || '');
        return `"${String(val || '').replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const path = join(dataDir, `ny-licenses-${safeType}.csv`);
    writeFileSync(path, csv);
    console.log(`  CSV: ${path} (${records.length} records)`);

    allRows.push(...rows);
  }

  // Master CSV with all license types
  const masterCsv = [headers.join(','), ...allRows].join('\n');
  const masterPath = join(dataDir, 'ny-licenses-all.csv');
  writeFileSync(masterPath, masterCsv);
  console.log(`  Master CSV: ${masterPath} (${allRows.length} records)`);
}

// ---------------------------------------------------------------------------
// Step 5: Push to Supabase CRM
// ---------------------------------------------------------------------------

async function pushToSupabase(groups) {
  if (!supabase) {
    console.log('Supabase client not available (dry-run or csv-only mode)');
    return;
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const [licenseType, records] of Object.entries(groups)) {
    console.log(`\nProcessing: ${licenseType} (${records.length} records)`);

    // --- Create list for this license type ---
    const listName = `NY — ${shortType(licenseType)}`;
    let listId;

    const { data: existingList } = await supabase
      .from('lists')
      .select('id')
      .eq('name', listName)
      .limit(1)
      .single();

    if (existingList) {
      listId = existingList.id;
      console.log(`  List exists: "${listName}" (${listId})`);
    } else {
      const { data: newList, error: listErr } = await supabase
        .from('lists')
        .insert({
          name: listName,
          type: 'static',
          description: `NY OCM licensed ${shortType(licenseType)} operators. Source: data.ny.gov. Imported ${new Date().toISOString().slice(0, 10)}.`,
        })
        .select('id')
        .single();

      if (listErr) {
        console.error(`  Failed to create list "${listName}":`, listErr.message);
        continue;
      }
      listId = newList.id;
      console.log(`  Created list: "${listName}" (${listId})`);
    }

    // --- Insert companies in batches ---
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const companyRows = batch.map((r) => ({
        name: r.name,
        dba: r.dba,
        phone: r.phone,
        city: r.city,
        state: r.state,
        address: r.address,
        zip: r.zip,
        county: r.county,
        industry: 'Cannabis',
        license_number: r.license_number,
        license_type: r.license_type,
        license_status: r.license_status,
        contact_name: r.contact_name,
        source: r.source,
        source_url: r.source_url,
        rating: 'cold',
      }));

      const { data: inserted, error: insertErr } = await supabase
        .from('companies')
        .upsert(companyRows, { onConflict: 'name', ignoreDuplicates: true })
        .select('id, name');

      if (insertErr) {
        console.error(`  Batch insert error:`, insertErr.message);
        // Try individual inserts as fallback
        for (const row of companyRows) {
          const { data: single, error: singleErr } = await supabase
            .from('companies')
            .upsert(row, { onConflict: 'name', ignoreDuplicates: true })
            .select('id');

          if (singleErr) {
            totalSkipped++;
          } else if (single?.[0]) {
            totalInserted++;
            // Add to list
            try {
              await supabase.from('list_companies').upsert(
                { list_id: listId, company_id: single[0].id },
                { onConflict: 'list_id,company_id', ignoreDuplicates: true }
              );
            } catch { /* ignore dupes */ }
          }
        }
        continue;
      }

      const insertedIds = inserted || [];
      totalInserted += insertedIds.length;

      // Add companies to the license type list
      if (insertedIds.length > 0) {
        const listRows = insertedIds.map((c) => ({
          list_id: listId,
          company_id: c.id,
        }));

        // list_companies has unique(list_id, company_id), ignore dupes
        for (const lr of listRows) {
          try {
            await supabase.from('list_companies').insert(lr);
          } catch { /* ignore dupes */ }
        }
      }

      if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= records.length) {
        console.log(`  Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`);
      }

      await sleep(200); // Rate limit
    }

    // --- Create contacts from primary_contact_name ---
    const withContact = records.filter((r) => r.contact_name);
    if (withContact.length > 0) {
      console.log(`  Creating ${withContact.length} contacts from primary_contact_name...`);

      for (let i = 0; i < withContact.length; i += BATCH_SIZE) {
        const batch = withContact.slice(i, i + BATCH_SIZE);

        for (const r of batch) {
          // Find the company we just inserted
          const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('name', r.name)
            .limit(1)
            .single();

          if (!company) continue;

          const nameParts = r.contact_name.split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          try {
            await supabase.from('contacts').insert({
              firstname: firstName,
              lastname: lastName,
              phone: r.phone || null,
              company_id: company.id,
              city: r.city,
              state: 'NY',
              source: 'ny_ocm_registry',
              lead_status: 'NEW',
              lifecycle_stage: 'lead',
            });
          } catch { /* ignore dupes */ }
        }

        await sleep(200);
      }
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Companies inserted/updated: ${totalInserted}`);
  console.log(`Skipped (duplicates/errors): ${totalSkipped}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== NY Cannabis License Registry Scraper ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : CSV_ONLY ? 'CSV ONLY' : 'FULL (CSV + Supabase)'}`);
  console.log('');

  // Fetch
  const raw = await fetchAllNYLicenses();
  if (!raw.length) {
    console.error('No records fetched. Exiting.');
    process.exit(1);
  }

  // Normalize
  const records = raw.map(normalize).filter((r) => r.name);
  console.log(`\nNormalized: ${records.length} records (${raw.length - records.length} skipped — no name)`);

  // Group by license type
  const groups = groupByType(records);
  console.log('\nLicense types:');
  for (const [type, recs] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${type}: ${recs.length}`);
  }

  // Export CSV
  console.log('\nExporting CSVs...');
  exportCSV(groups);

  // Push to CRM
  if (!DRY_RUN && !CSV_ONLY) {
    console.log('\nPushing to Empire 8 CRM (Supabase)...');
    await pushToSupabase(groups);
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
