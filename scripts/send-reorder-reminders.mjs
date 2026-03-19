#!/usr/bin/env node
/**
 * Reorder Reminder Emails — Value Suppliers
 *
 * Queries Supabase for customers who ordered 21+ days ago but haven't
 * reordered. Sends a friendly reorder nudge via Resend.
 *
 * THE HIGHEST-ROI AUTOMATION IN THE PORTFOLIO:
 * - Existing customers convert at 25-40% vs 0.5-2% cold
 * - Gloves are consumable — everyone needs more within 30-60 days
 * - $0 cost per email, $70+ revenue per reorder
 *
 * Usage:
 *   RESEND_API_KEY=xxx node scripts/send-reorder-reminders.mjs
 *   RESEND_API_KEY=xxx node scripts/send-reorder-reminders.mjs --dry-run
 *   RESEND_API_KEY=xxx node scripts/send-reorder-reminders.mjs --preview
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpakqrnvjnzznhffoqaf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwYWtxcm52am56em5oZmZvcWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc0NzkzNiwiZXhwIjoyMDg4MzIzOTM2fQ.wjir9dufHp_IGLp4ALYqSrCXTeJbTP7oc1Ho145-xnc';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

const DRY_RUN = process.argv.includes('--dry-run');
const PREVIEW = process.argv.includes('--preview');

const FROM = 'Bee | Value Suppliers <bee@mail.valuesuppliers.co>';
const REPLY_TO = 'Bee@valuesuppliersdirect.com';
const UNSUB_BASE = 'https://valuesuppliers.co/api/unsubscribe';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Reminder templates by timing
// ---------------------------------------------------------------------------

const TEMPLATES = {
  // Day 21 — soft nudge
  day21: {
    subject: 'running low on gloves?',
    body: (data) => `Hey ${data.firstName},

It's been about 3 weeks since your order shipped. If your crew is going through gloves at the usual rate, you're probably getting close to needing a restock.

Same pricing, ships same week: valuesuppliers.co/catalog

If you want to lock in a monthly delivery and save 10%, check out Subscribe & Save on the product page — no commitment, cancel anytime.

— Bee
Value Suppliers
Bee@valuesuppliersdirect.com
valuesuppliers.co`,
  },

  // Day 45 — stronger nudge with offer
  day45: {
    subject: 're: your glove order — quick restock?',
    body: (data) => `Hey ${data.firstName},

Been about 6 weeks since your last order. Just wanted to check in — are you stocked up or running thin?

If you need to restock, use code REORDER10 for 10% off your next case order. Good for the next 7 days.

Reorder here: valuesuppliers.co/catalog

— Bee
Value Suppliers
Bee@valuesuppliersdirect.com`,
  },

  // Day 75 — win-back
  day75: {
    subject: 'still need gloves?',
    body: (data) => `Hey ${data.firstName},

It's been a while since your last order. If you've switched suppliers or just haven't needed gloves, totally understand — I'll stop emailing.

But if you're still buying gloves and want to come back, here's 15% off your next order: code COMEBACK15

valuesuppliers.co/catalog

Either way, appreciate the business.

— Bee
Value Suppliers`,
  },
};

// ---------------------------------------------------------------------------
// Query eligible customers
// ---------------------------------------------------------------------------

async function getReorderCandidates() {
  // Get all shipped/paid orders with customer info
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, email, shipping_name, total, created_at, status')
    .in('status', ['shipped', 'paid', 'delivered'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase query error:', error.message);
    return [];
  }

  if (!orders || orders.length === 0) {
    console.log('  No orders found');
    return [];
  }

  // Group by email — find customers who ordered but haven't reordered
  const customerMap = new Map();
  for (const order of orders) {
    if (!order.email) continue;
    const email = order.email.toLowerCase();
    if (!customerMap.has(email)) {
      customerMap.set(email, {
        email,
        firstName: (order.shipping_name || 'there').split(/[,\s]/)[0],
        orders: [],
      });
    }
    customerMap.get(email).orders.push(order);
  }

  const now = Date.now();
  const DAY = 86400000;
  const candidates = [];

  for (const [email, customer] of customerMap) {
    // Sort orders by date, newest first
    customer.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const lastOrder = customer.orders[0];
    const daysSinceOrder = Math.floor((now - new Date(lastOrder.created_at).getTime()) / DAY);

    // Only one order total (never reordered) — more likely to need a nudge
    const neverReordered = customer.orders.length === 1;

    let template = null;
    if (daysSinceOrder >= 18 && daysSinceOrder <= 28) {
      template = 'day21';
    } else if (daysSinceOrder >= 40 && daysSinceOrder <= 52) {
      template = 'day45';
    } else if (daysSinceOrder >= 70 && daysSinceOrder <= 85) {
      template = 'day75';
    }

    if (template) {
      candidates.push({
        ...customer,
        daysSinceOrder,
        template,
        lastOrderTotal: lastOrder.total,
        orderCount: customer.orders.length,
      });
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Send via Resend
// ---------------------------------------------------------------------------

async function sendReminder(candidate) {
  const tpl = TEMPLATES[candidate.template];
  const emailBody = tpl.body(candidate);
  const unsubUrl = `${UNSUB_BASE}?email=${encodeURIComponent(candidate.email)}`;
  const footer = `\n\n---\nTo stop receiving these emails: ${unsubUrl}`;

  const htmlBody = `<pre style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.7;color:#1a1a1a;white-space:pre-wrap;max-width:600px;">${emailBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><p style="font-size:11px;color:#999;margin-top:32px;"><a href="${unsubUrl}" style="color:#999;">Unsubscribe</a> · Value Suppliers, 1401 N Clovis Ave STE #103, Clovis, CA 93727</p>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      reply_to: REPLY_TO,
      to: candidate.email,
      subject: tpl.subject,
      text: emailBody + footer,
      html: htmlBody,
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
  console.log('VALUE SUPPLIERS — Reorder Reminder Emails');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : PREVIEW ? 'PREVIEW' : 'LIVE'}`);

  if (!RESEND_API_KEY && !DRY_RUN && !PREVIEW) {
    console.error('  ERROR: RESEND_API_KEY not set');
    process.exit(1);
  }

  const candidates = await getReorderCandidates();
  console.log(`  Reorder candidates: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log('  No customers due for reorder reminders');
    return;
  }

  // Group by template
  const byTemplate = {};
  for (const c of candidates) {
    byTemplate[c.template] = (byTemplate[c.template] || 0) + 1;
  }
  for (const [tpl, count] of Object.entries(byTemplate)) {
    console.log(`    ${tpl}: ${count} customers`);
  }

  if (PREVIEW) {
    const c = candidates[0];
    const tpl = TEMPLATES[c.template];
    console.log(`\nTO: ${c.email}`);
    console.log(`SUBJECT: ${tpl.subject}`);
    console.log(`TEMPLATE: ${c.template} (${c.daysSinceOrder} days since order)`);
    console.log(`${'─'.repeat(50)}`);
    console.log(tpl.body(c));
    return;
  }

  if (DRY_RUN) {
    for (const c of candidates) {
      console.log(`  [${c.template}] ${c.email} — ${c.daysSinceOrder}d ago, $${c.lastOrderTotal}, ${c.orderCount} order(s)`);
    }
    return;
  }

  // Send
  let sent = 0;
  let failed = 0;

  for (const c of candidates) {
    try {
      await sendReminder(c);
      sent++;
      console.log(`  [${sent}] ✓ ${c.email} (${c.template}, ${c.daysSinceOrder}d)`);
    } catch (err) {
      failed++;
      console.log(`  ✗ ${c.email} — ${err.message}`);
    }
    await sleep(500);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`DONE: ${sent} sent, ${failed} failed`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
