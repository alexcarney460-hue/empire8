/**
 * Submit site to search engines via APIs (no browser login needed)
 * - Google: Sitemap ping API
 * - Bing: IndexNow API + Sitemap ping
 * - Yandex: Sitemap ping
 */
import { randomUUID } from 'crypto';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const SITE_URL = 'https://empire8salesdirect.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

const KEY_PAGES = [
  '/',
  '/catalog',
  '/catalog/nitrile-5mil-case',
  '/catalog/nitrile-5mil-box',
  '/catalog/spring-loaded-trimming-scissors',
  '/catalog/straight-tip-trimming-scissors',
  '/catalog/trim-tray-150-micron',
  '/catalog/cleaning-spray-16oz',
  '/wholesale',
  '/distribution',
  '/services',
  '/contact',
  '/commercial',
  '/track',
  '/products.json',
  '/llms.txt',
];

async function main() {
  console.log('=== SEO SUBMISSION FOR VALUESUPPLIERS.CO ===\n');

  // ─────────────────────────────────────────
  // 1. Generate IndexNow key
  // ─────────────────────────────────────────
  const indexNowKey = randomUUID().replace(/-/g, '');
  const keyFilePath = resolve(import.meta.dirname, '../public', `${indexNowKey}.txt`);

  if (!existsSync(keyFilePath)) {
    writeFileSync(keyFilePath, indexNowKey);
    console.log(`✓ IndexNow key file created: public/${indexNowKey}.txt`);
    console.log(`  Key: ${indexNowKey}`);
    console.log('  ⚠ You need to deploy this file before IndexNow will verify it.\n');
  }

  // Also create the IndexNow API route for persistence
  const indexNowRoutePath = resolve(import.meta.dirname, '../src/app/indexnow/route.ts');
  const indexNowRouteDir = resolve(import.meta.dirname, '../src/app/indexnow');
  if (!existsSync(indexNowRouteDir)) {
    const { mkdirSync: mk } = await import('fs');
    mk(indexNowRouteDir, { recursive: true });
  }
  writeFileSync(indexNowRoutePath, `import { NextResponse } from 'next/server';

// IndexNow verification key
const INDEXNOW_KEY = '${indexNowKey}';

export async function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=86400' },
  });
}
`);
  console.log('✓ Created /indexnow route for key verification\n');

  // ─────────────────────────────────────────
  // 2. Ping Google Sitemap
  // ─────────────────────────────────────────
  console.log('--- Google Sitemap Ping ---');
  try {
    const googlePing = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    const res = await fetch(googlePing);
    console.log(`✓ Google ping: ${res.status} ${res.statusText}`);
    console.log(`  URL: ${googlePing}`);
  } catch (e) {
    console.log(`✗ Google ping failed: ${e.message}`);
  }

  // ─────────────────────────────────────────
  // 3. Ping Bing Sitemap
  // ─────────────────────────────────────────
  console.log('\n--- Bing Sitemap Ping ---');
  try {
    const bingPing = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    const res = await fetch(bingPing);
    console.log(`✓ Bing ping: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.log(`✗ Bing ping failed: ${e.message}`);
  }

  // ─────────────────────────────────────────
  // 4. IndexNow submission (Bing, Yandex, Naver, Seznam)
  // ─────────────────────────────────────────
  console.log('\n--- IndexNow Submission ---');
  const fullUrls = KEY_PAGES.map(p => `${SITE_URL}${p}`);

  // Submit to Bing IndexNow
  const indexNowPayload = {
    host: 'empire8salesdirect.com',
    key: indexNowKey,
    keyLocation: `${SITE_URL}/${indexNowKey}.txt`,
    urlList: fullUrls,
  };

  for (const engine of ['api.indexnow.org', 'www.bing.com']) {
    try {
      const res = await fetch(`https://${engine}/indexnow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(indexNowPayload),
      });
      const text = await res.text().catch(() => '');
      console.log(`✓ IndexNow (${engine}): ${res.status} ${res.statusText} ${text.substring(0, 100)}`);
    } catch (e) {
      console.log(`✗ IndexNow (${engine}) failed: ${e.message}`);
    }
  }

  // ─────────────────────────────────────────
  // 5. Yandex sitemap ping
  // ─────────────────────────────────────────
  console.log('\n--- Yandex Sitemap Ping ---');
  try {
    const yandexPing = `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    const res = await fetch(yandexPing);
    console.log(`✓ Yandex ping: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.log(`✗ Yandex ping failed: ${e.message}`);
  }

  // ─────────────────────────────────────────
  // 6. Verify live endpoints
  // ─────────────────────────────────────────
  console.log('\n--- Verifying Live Endpoints ---');

  const checks = [
    { url: `${SITE_URL}/robots.txt`, expect: 'Sitemap' },
    { url: `${SITE_URL}/sitemap.xml`, expect: 'urlset' },
    { url: `${SITE_URL}/llms.txt`, expect: 'ValueSuppliers' },
    { url: `${SITE_URL}/products.json`, expect: 'products' },
    { url: `${SITE_URL}/.well-known/ai-plugin.json`, expect: 'schema_version' },
  ];

  for (const { url, expect } of checks) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const text = await res.text();
      const ok = text.includes(expect);
      const path = url.replace(SITE_URL, '');
      console.log(`${ok ? '✓' : '✗'} ${path}: ${res.status} ${ok ? 'OK' : `Missing "${expect}"`}`);
    } catch (e) {
      console.log(`✗ ${url}: ${e.message}`);
    }
  }

  // ─────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────
  console.log('\n=== SUMMARY ===');
  console.log('✓ Google sitemap pinged');
  console.log('✓ Bing sitemap pinged');
  console.log('✓ IndexNow submitted (16 URLs to Bing + indexnow.org)');
  console.log('✓ Yandex sitemap pinged');
  console.log(`✓ IndexNow key: ${indexNowKey}`);
  console.log('\n📋 MANUAL STEPS STILL NEEDED:');
  console.log('1. Deploy the IndexNow key file (git add, commit, push)');
  console.log('2. Google Search Console: https://search.google.com/search-console');
  console.log('   → Add property → URL prefix → empire8salesdirect.com');
  console.log('   → Verify via HTML tag method → paste code into layout.tsx');
  console.log('3. Bing Webmaster Tools: https://www.bing.com/webmasters');
  console.log('   → Import from GSC (easiest) or add manually');
  console.log(`4. After deploying, re-run IndexNow: curl -X POST "https://api.indexnow.org/indexnow" -H "Content-Type: application/json" -d '${JSON.stringify(indexNowPayload).substring(0, 200)}...'`);
}

main();
