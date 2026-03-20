/**
 * Automate Google Search Console + Bing Webmaster Tools submission
 * Uses a temporary profile copy from Edge to preserve login sessions
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const SITE_URL = 'https://empire8salesdirect.com';
const SITEMAP_URL = 'https://empire8salesdirect.com/sitemap.xml';
const LAYOUT_PATH = resolve(import.meta.dirname, '../src/app/layout.tsx');
const EDGE_PROFILE = 'C:/Users/Claud/AppData/Local/Microsoft/Edge/User Data';
const TEMP_PROFILE = 'C:/Users/Claud/AppData/Local/Temp/edge-playwright-profile';

async function main() {
  // Copy Edge profile to temp dir so we don't conflict with running Edge
  console.log('Copying Edge profile to temp dir...');
  if (!existsSync(TEMP_PROFILE)) mkdirSync(TEMP_PROFILE, { recursive: true });

  // Copy just the essential files for auth
  const filesToCopy = ['Default/Cookies', 'Default/Login Data', 'Default/Web Data', 'Local State'];
  for (const f of filesToCopy) {
    const src = `${EDGE_PROFILE}/${f}`;
    const dst = `${TEMP_PROFILE}/${f}`;
    try {
      const dir = dst.substring(0, dst.lastIndexOf('/'));
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cpSync(src, dst, { force: true });
    } catch (e) {
      // Some files may be locked, that's ok
    }
  }

  console.log('Launching browser...');
  const browser = await chromium.launchPersistentContext(TEMP_PROFILE, {
    headless: false,
    channel: 'msedge',
    args: ['--profile-directory=Default', '--no-first-run', '--disable-sync'],
    viewport: { width: 1280, height: 900 },
    timeout: 60000,
  });

  try {
    // ═══════════════════════════════════════════
    // STEP 1: Google Search Console
    // ═══════════════════════════════════════════
    console.log('\n=== GOOGLE SEARCH CONSOLE ===');
    const gscPage = await browser.newPage();
    await gscPage.goto('https://search.google.com/search-console', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await gscPage.waitForTimeout(5000);

    let gscUrl = gscPage.url();
    console.log('GSC URL:', gscUrl);

    // If redirected to login, wait for manual login
    if (gscUrl.includes('accounts.google.com') || gscUrl.includes('signin')) {
      console.log('\n⚠ Google login required. Please log in in the browser window.');
      console.log('  Waiting up to 3 minutes...');
      try {
        await gscPage.waitForURL(url => !url.toString().includes('accounts.google.com'), { timeout: 180000 });
      } catch {
        console.log('  Login timed out. Taking screenshot...');
      }
      await gscPage.waitForTimeout(3000);
      gscUrl = gscPage.url();
      console.log('After login:', gscUrl);
    }

    // Navigate to add property
    console.log('Navigating to add property...');
    await gscPage.goto('https://search.google.com/search-console/welcome', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await gscPage.waitForTimeout(3000);

    // Take screenshot of current state
    await gscPage.screenshot({ path: 'scripts/gsc-step1.png', fullPage: true });
    console.log('Screenshot: scripts/gsc-step1.png');

    // Try to find the URL prefix input (right panel)
    // GSC welcome has two panels: Domain (left) and URL prefix (right)
    const allInputs = await gscPage.locator('input').all();
    console.log(`Found ${allInputs.length} input fields`);

    for (let i = 0; i < allInputs.length; i++) {
      const placeholder = await allInputs[i].getAttribute('placeholder').catch(() => '');
      const value = await allInputs[i].inputValue().catch(() => '');
      console.log(`  Input ${i}: placeholder="${placeholder}" value="${value}"`);
    }

    // URL prefix is typically the second input
    if (allInputs.length >= 2) {
      await allInputs[allInputs.length - 1].click();
      await allInputs[allInputs.length - 1].fill(SITE_URL);
      console.log(`Filled URL: ${SITE_URL}`);
      await gscPage.waitForTimeout(1000);

      // Click Continue
      const buttons = await gscPage.getByRole('button').all();
      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '');
        if (text.toLowerCase().includes('continue')) {
          await btn.click();
          console.log('Clicked Continue');
          break;
        }
      }
      await gscPage.waitForTimeout(5000);
    } else if (allInputs.length === 1) {
      await allInputs[0].fill(SITE_URL);
      await gscPage.waitForTimeout(1000);
      const buttons = await gscPage.getByRole('button').all();
      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '');
        if (text.toLowerCase().includes('continue') || text.toLowerCase().includes('add')) {
          await btn.click();
          break;
        }
      }
      await gscPage.waitForTimeout(5000);
    }

    await gscPage.screenshot({ path: 'scripts/gsc-step2.png', fullPage: true });
    console.log('Screenshot: scripts/gsc-step2.png');

    // Look for HTML tag verification method
    const pageText = await gscPage.textContent('body').catch(() => '');

    // Try to find and click HTML tag option
    const htmlTag = await gscPage.getByText('HTML tag').first();
    if (await htmlTag.isVisible().catch(() => false)) {
      await htmlTag.click();
      await gscPage.waitForTimeout(2000);
      console.log('Clicked HTML tag verification option');
    }

    // Try to extract verification code from page
    const codeElements = await gscPage.locator('code, .code-text, [class*="code"], input[readonly]').all();
    let verificationCode = null;
    for (const el of codeElements) {
      const text = await el.textContent().catch(() => '') || await el.inputValue().catch(() => '');
      const match = text.match(/content="([^"]+)"/);
      if (match) {
        verificationCode = match[1];
        break;
      }
    }

    if (verificationCode) {
      console.log(`✓ Google verification code: ${verificationCode}`);
      let layout = readFileSync(LAYOUT_PATH, 'utf8');
      layout = layout.replace('REPLACE_WITH_GOOGLE_VERIFICATION_CODE', verificationCode);
      writeFileSync(LAYOUT_PATH, layout);
      console.log('✓ Updated layout.tsx');
    } else {
      console.log('Could not auto-extract verification code. Check screenshots.');
    }

    await gscPage.screenshot({ path: 'scripts/gsc-step3.png', fullPage: true });
    console.log('Screenshot: scripts/gsc-step3.png');

    // Try to verify
    const verifyBtns = await gscPage.getByRole('button').all();
    for (const btn of verifyBtns) {
      const text = await btn.textContent().catch(() => '');
      if (text.toLowerCase().includes('verify')) {
        await btn.click();
        console.log('Clicked Verify');
        await gscPage.waitForTimeout(5000);
        break;
      }
    }

    await gscPage.screenshot({ path: 'scripts/gsc-final.png', fullPage: true });
    console.log('Screenshot: scripts/gsc-final.png');

    // ═══════════════════════════════════════════
    // STEP 2: Bing Webmaster Tools
    // ═══════════════════════════════════════════
    console.log('\n=== BING WEBMASTER TOOLS ===');
    const bingPage = await browser.newPage();
    await bingPage.goto('https://www.bing.com/webmasters', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await bingPage.waitForTimeout(5000);

    let bingUrl = bingPage.url();
    console.log('Bing URL:', bingUrl);

    if (bingUrl.includes('login') || bingUrl.includes('signin') || bingUrl.includes('live.com')) {
      console.log('\n⚠ Microsoft login required. Please log in in the browser window.');
      console.log('  Waiting up to 3 minutes...');
      try {
        await bingPage.waitForURL(url => url.toString().includes('webmasters'), { timeout: 180000 });
      } catch {
        console.log('  Login timed out.');
      }
      await bingPage.waitForTimeout(3000);
    }

    await bingPage.screenshot({ path: 'scripts/bing-step1.png', fullPage: true });
    console.log('Screenshot: scripts/bing-step1.png');

    // Try adding the site
    const bingInputs = await bingPage.locator('input[type="text"], input[type="url"]').all();
    console.log(`Found ${bingInputs.length} Bing inputs`);

    for (const input of bingInputs) {
      const ph = await input.getAttribute('placeholder').catch(() => '');
      if (ph.toLowerCase().includes('site') || ph.toLowerCase().includes('url') || ph.toLowerCase().includes('http')) {
        await input.fill(SITE_URL);
        console.log('Filled site URL in Bing');
        await bingPage.waitForTimeout(1000);

        // Find and click Add button
        const addBtns = await bingPage.getByRole('button').all();
        for (const btn of addBtns) {
          const text = await btn.textContent().catch(() => '');
          if (text.toLowerCase().includes('add')) {
            await btn.click();
            console.log('Clicked Add');
            await bingPage.waitForTimeout(5000);
            break;
          }
        }
        break;
      }
    }

    await bingPage.screenshot({ path: 'scripts/bing-step2.png', fullPage: true });
    console.log('Screenshot: scripts/bing-step2.png');

    // Try submitting sitemap
    console.log('Looking for sitemap submission...');
    const sitemapLink = await bingPage.getByText('Sitemaps', { exact: false }).first();
    if (await sitemapLink.isVisible().catch(() => false)) {
      await sitemapLink.click();
      await bingPage.waitForTimeout(3000);
    }

    // Try direct URL
    await bingPage.goto('https://www.bing.com/webmasters/sitemaps', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await bingPage.waitForTimeout(2000);

    const sitemapInputs = await bingPage.locator('input').all();
    for (const input of sitemapInputs) {
      const ph = await input.getAttribute('placeholder').catch(() => '');
      if (ph.toLowerCase().includes('sitemap') || ph.toLowerCase().includes('url')) {
        await input.fill(SITEMAP_URL);
        console.log('Filled sitemap URL');

        const submitBtns = await bingPage.getByRole('button').all();
        for (const btn of submitBtns) {
          const text = await btn.textContent().catch(() => '');
          if (text.toLowerCase().includes('submit')) {
            await btn.click();
            console.log('✓ Submitted sitemap to Bing!');
            await bingPage.waitForTimeout(3000);
            break;
          }
        }
        break;
      }
    }

    await bingPage.screenshot({ path: 'scripts/bing-final.png', fullPage: true });
    console.log('Screenshot: scripts/bing-final.png');

    // ═══════════════════════════════════════════
    // DONE
    // ═══════════════════════════════════════════
    console.log('\n=== COMPLETE ===');
    console.log('Screenshots saved in scripts/');
    console.log('Check the browser windows for any manual steps needed.');

    // Keep browser open so user can see/interact
    console.log('Browser will stay open for 30 seconds...');
    await new Promise(r => setTimeout(r, 30000));

  } catch (err) {
    console.error('Error:', err.message);
    // Take error screenshots
    const pages = browser.pages();
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ path: `scripts/error-page-${i}.png` }).catch(() => {});
    }
  } finally {
    await browser.close();
  }
}

main();
