#!/usr/bin/env node
/**
 * Follow-up Email Sequence — Value Suppliers
 *
 * Sends follow-up emails to leads who were already cold-emailed
 * but haven't ordered. 80% of sales require 5+ touchpoints.
 *
 * Reads the sent log to find leads who were contacted X days ago,
 * sends the appropriate follow-up based on timing.
 *
 * Usage:
 *   RESEND_API_KEY=xxx node scripts/send-followups.mjs
 *   RESEND_API_KEY=xxx node scripts/send-followups.mjs --dry-run
 *   RESEND_API_KEY=xxx node scripts/send-followups.mjs --preview
 *   RESEND_API_KEY=xxx node scripts/send-followups.mjs --step 1     # Only send step 1
 */

import { readFileSync, appendFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SENT_LOG = join(__dirname, '..', 'tmp', 'outreach-sent.jsonl');
const FOLLOWUP_LOG = join(__dirname, '..', 'tmp', 'followup-sent.jsonl');
const UNSUB_FILE = join(__dirname, '..', 'tmp', 'unsubscribed.txt');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const DRY_RUN = process.argv.includes('--dry-run');
const PREVIEW = process.argv.includes('--preview');
const STEP_IDX = process.argv.indexOf('--step');
const ONLY_STEP = STEP_IDX !== -1 ? parseInt(process.argv[STEP_IDX + 1], 10) : null;
const LIMIT_IDX = process.argv.indexOf('--limit');
const LIMIT = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 200;

const FROM = 'Bee | Value Suppliers <bee@mail.valuesuppliers.co>';
const REPLY_TO = 'Bee@valuesuppliersdirect.com';
const UNSUB_BASE = 'https://valuesuppliers.co/api/unsubscribe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DAY_MS = 86400000;

// ---------------------------------------------------------------------------
// Follow-up templates
// ---------------------------------------------------------------------------

const FOLLOWUPS = [
  {
    step: 1,
    dayMin: 3,
    dayMax: 5,
    subject: (lead) => `re: gloves for ${lead.company || 'your operation'}?`,
    body: (lead) => `Hey ${lead.firstName},

Just bumping this up — wanted to make sure it didn't get buried.

We supply 5 mil nitrile gloves at case pricing ($60-80/case, 1,000 gloves). Most operations restock with us monthly.

Happy to put together a quick quote if you want to see what the pricing looks like for your volume. No commitment, no minimum.

— Bee
Value Suppliers
Bee@valuesuppliersdirect.com`,
  },
  {
    step: 2,
    dayMin: 7,
    dayMax: 10,
    subject: (lead) => `quick question about your glove supply`,
    body: (lead) => `Hey ${lead.firstName},

Curious — what are you currently paying per case for nitrile gloves?

Most operations we talk to in ${lead.state || 'your area'} were paying $100-120/case from their distributor before switching to us. Our case pricing runs $60-80 depending on volume.

That's $20-40 savings per case. On 10 cases/month, that adds up fast.

Want me to run the numbers for your specific volume?

— Bee
Value Suppliers
Bee@valuesuppliersdirect.com
valuesuppliers.co`,
  },
  {
    step: 3,
    dayMin: 14,
    dayMax: 18,
    subject: (lead) => `$60/case — harvest season pricing`,
    body: (lead) => `Hey ${lead.firstName},

Harvest season is around the corner and we're locking in bulk pricing for operations that want to stock up early.

$60/case for 30+ cases (that's $6/box, 1,000 gloves per case). Ships same week.

If your team goes through 5+ cases a month, this saves you serious money over the year.

Let me know if you want to set up an account — takes 2 minutes.

— Bee
Value Suppliers
Bee@valuesuppliersdirect.com
valuesuppliers.co`,
  },
  {
    step: 4,
    dayMin: 30,
    dayMax: 35,
    subject: (lead) => `last one from me`,
    body: (lead) => `Hey ${lead.firstName},

I've reached out a few times about glove supply for your operation. If gloves aren't something you need right now, totally understand — I'll take you off my list.

But if you do buy gloves and just haven't gotten around to checking us out, here's the quick pitch: 5 mil nitrile, $60-80/case (1,000 gloves), ships same week, no minimum order.

Either way, appreciate your time.

— Bee
Value Suppliers`,
  },
];

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

function loadSentLog() {
  if (!existsSync(SENT_LOG)) return [];
  return readFileSync(SENT_LOG, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => { try { return JSON.parse(line); } catch { return null; } })
    .filter((e) => e && e.email && !e.status);
}

function loadFollowupLog() {
  if (!existsSync(FOLLOWUP_LOG)) return new Map();
  const map = new Map();
  readFileSync(FOLLOWUP_LOG, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {
      try {
        const e = JSON.parse(line);
        const key = `${e.email}:${e.step}`;
        map.set(key, e);
      } catch {}
    });
  return map;
}

function loadUnsubs() {
  if (!existsSync(UNSUB_FILE)) return new Set();
  return new Set(
    readFileSync(UNSUB_FILE, 'utf-8').split('\n').filter(Boolean).map((e) => e.trim().toLowerCase())
  );
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

async function sendFollowup(email, followup, lead) {
  const unsubUrl = `${UNSUB_BASE}?email=${encodeURIComponent(email)}`;
  const text = followup.body(lead) + `\n\n---\nTo stop receiving these: ${unsubUrl}`;
  const html = `<pre style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.7;color:#1a1a1a;white-space:pre-wrap;max-width:600px;">${followup.body(lead).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><p style="font-size:11px;color:#999;margin-top:32px;"><a href="${unsubUrl}" style="color:#999;">Unsubscribe</a> · Value Suppliers, 1401 N Clovis Ave STE #103, Clovis, CA 93727</p>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      reply_to: REPLY_TO,
      to: email,
      subject: followup.subject(lead),
      text,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('VALUE SUPPLIERS — Follow-up Email Sequence');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : PREVIEW ? 'PREVIEW' : 'LIVE'}`);
  console.log(`  Step: ${ONLY_STEP || 'ALL'}`);
  console.log(`  Limit: ${LIMIT}`);

  if (!RESEND_API_KEY && !DRY_RUN && !PREVIEW) {
    console.error('  ERROR: RESEND_API_KEY not set');
    process.exit(1);
  }

  const sentEntries = loadSentLog();
  const followupsSent = loadFollowupLog();
  const unsubs = loadUnsubs();

  console.log(`  Original sends: ${sentEntries.length}`);
  console.log(`  Follow-ups already sent: ${followupsSent.size}`);
  console.log(`  Unsubscribed: ${unsubs.size}`);

  // Group by email — find earliest send date per lead
  const leadMap = new Map();
  for (const entry of sentEntries) {
    const email = entry.email.toLowerCase();
    if (unsubs.has(email)) continue;
    if (!leadMap.has(email)) {
      leadMap.set(email, {
        email,
        firstName: (entry.name || 'there').split(/[,\s]/)[0],
        company: entry.name || '',
        state: entry.state || '',
        firstSentAt: entry.timestamp,
      });
    }
  }

  const now = Date.now();
  const toSend = [];

  for (const [email, lead] of leadMap) {
    const daysSinceSend = Math.floor((now - new Date(lead.firstSentAt).getTime()) / DAY_MS);

    for (const followup of FOLLOWUPS) {
      if (ONLY_STEP && followup.step !== ONLY_STEP) continue;

      const key = `${email}:${followup.step}`;
      if (followupsSent.has(key)) continue; // Already sent this step

      if (daysSinceSend >= followup.dayMin && daysSinceSend <= followup.dayMax) {
        toSend.push({ email, lead, followup, daysSinceSend });
      }
    }
  }

  // Limit
  const batch = toSend.slice(0, LIMIT);

  // Group by step for display
  const byStep = {};
  for (const item of batch) {
    byStep[item.followup.step] = (byStep[item.followup.step] || 0) + 1;
  }

  console.log(`  Eligible follow-ups: ${toSend.length}`);
  console.log(`  Sending this batch: ${batch.length}`);
  for (const [step, count] of Object.entries(byStep)) {
    console.log(`    Step ${step}: ${count} emails`);
  }

  if (batch.length === 0) {
    console.log('\n  No follow-ups due right now.');
    return;
  }

  if (PREVIEW) {
    const item = batch[0];
    console.log(`\nTO: ${item.email}`);
    console.log(`SUBJECT: ${item.followup.subject(item.lead)}`);
    console.log(`STEP: ${item.followup.step} (${item.daysSinceSend} days since original)`);
    console.log(`${'─'.repeat(50)}`);
    console.log(item.followup.body(item.lead));
    return;
  }

  if (DRY_RUN) {
    for (const item of batch.slice(0, 20)) {
      console.log(`  [step ${item.followup.step}] ${item.email} (${item.daysSinceSend}d ago)`);
    }
    if (batch.length > 20) console.log(`  ... and ${batch.length - 20} more`);
    return;
  }

  // Send
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < batch.length; i++) {
    const { email, lead, followup, daysSinceSend } = batch[i];
    try {
      await sendFollowup(email, followup, lead);
      sent++;
      process.stdout.write(`  [${sent}] ✓ step ${followup.step} → ${email}\n`);

      appendFileSync(FOLLOWUP_LOG, JSON.stringify({
        email,
        step: followup.step,
        subject: followup.subject(lead),
        daysSinceSend,
        timestamp: new Date().toISOString(),
      }) + '\n');
    } catch (err) {
      failed++;
      console.log(`  ✗ ${email} — ${err.message}`);
      if (err.message?.includes('429')) {
        console.log('  Rate limited — waiting 60s...');
        await sleep(60000);
      }
    }

    await sleep(350);

    if ((i + 1) % 50 === 0) {
      console.log(`\n  --- Progress: ${sent} sent, ${failed} failed ---\n`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`DONE: ${sent} sent, ${failed} failed`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
