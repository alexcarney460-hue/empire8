import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * Batch outreach email sender.
 *
 * POST /api/admin/marketing/outreach
 *
 * Body:
 *   { action: "send-batch", campaign_id: string, limit?: number }
 *   { action: "preview", template: string, to: string }
 *   { action: "stats" }
 *   { action: "import-csv" }  — import leads from master CSV into outreach_leads table
 *
 * Sends personalized cold emails via Resend using a subdomain
 * (outreach@mail.empire8salesdirect.com) to protect the main domain.
 *
 * Rate limited: max 100/batch via API, use the CLI script for higher volume.
 */

const OUTREACH_FROM = 'Empire 8 Sales Direct <outreach@mail.empire8salesdirect.com>';
const UNSUBSCRIBE_URL = 'https://empire8salesdirect.com/api/unsubscribe';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

interface LeadData {
  email: string;
  name: string;
  company: string;
  city: string;
  state: string;
  county: string;
  license_type: string;
}

function buildOutreachEmail(lead: LeadData, template: string): { subject: string; html: string; text: string } {
  const firstName = lead.name.split(/[,\s]/)[0] || 'there';
  const company = lead.company || lead.name;
  const loc = [lead.city, lead.county ? `${lead.county} County` : '', lead.state].filter(Boolean).join(', ');

  const templates: Record<string, { subject: string; text: string }> = {
    intro: {
      subject: `gloves for ${company}?`,
      text: `Hey ${firstName},

Saw you guys are licensed in ${loc}.

We supply 5 mil nitrile gloves at $60-80/case (1,000 gloves per case) — most grows and labs in ${lead.state} are restocking with us monthly.

Would it make sense to send you a sample case?

— Alex
Empire 8 Sales Direct
info@empire8salesdirect.com
empire8salesdirect.com`,
    },
    followup_1: {
      subject: `re: gloves for ${company}?`,
      text: `Quick follow up — we ship same week and do NET 30 for operations ordering 30+ cases.

Most trim crews go through 10-20 cases/month. Happy to put together a quote if you want to compare against your current supplier.

— Alex
Empire 8 Sales Direct`,
    },
    followup_2: {
      subject: `last one from me`,
      text: `${firstName} — not trying to clog your inbox.

If gloves aren't a priority right now, no worries. But if your crew burns through nitrile, we're probably cheaper than whoever you're buying from.

empire8salesdirect.com/wholesale if you ever want to check pricing.

— Alex`,
    },
    lab: {
      subject: `lab gloves for ${company}?`,
      text: `Hey ${firstName},

Noticed ${company} is a licensed testing lab in ${loc}.

We supply exam-grade 5 mil nitrile gloves — ASTM certified, powder-free, available in XS through XXL. Case pricing starts at $80/case (1,000 gloves), with wholesale at $70 for 30+ cases.

Most labs we work with restock monthly. Want me to send pricing for your volume?

— Alex
Empire 8 Sales Direct
info@empire8salesdirect.com`,
    },
    distributor: {
      subject: `glove supply for ${company}`,
      text: `Hey ${firstName},

${company} showed up on our radar as a licensed distributor in ${lead.state}.

If you're moving product that needs PPE — we do distribution pricing at $60/case (120+ cases) with NET 30 terms. 5 mil nitrile, case of 1,000.

Worth a conversation?

— Alex
Empire 8 Sales Direct
info@empire8salesdirect.com`,
    },
  };

  const t = templates[template] || templates.intro;

  // Plain text email (no HTML for cold outreach — lands better)
  const unsubLine = `\n\n---\nTo stop receiving these emails: ${UNSUBSCRIBE_URL}?email=${encodeURIComponent(lead.email)}`;

  return {
    subject: t.subject,
    text: t.text + unsubLine,
    html: `<pre style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap;">${t.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><p style="font-size:11px;color:#999;margin-top:24px;"><a href="${UNSUBSCRIBE_URL}?email=${encodeURIComponent(lead.email)}" style="color:#999;">Unsubscribe</a> | Empire 8 Sales Direct, New York, NY 10001</p>`,
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  const body = await req.json();
  const { action } = body;

  // ── PREVIEW ──
  if (action === 'preview') {
    const { template = 'intro', to } = body;
    const lead: LeadData = {
      email: to || 'test@example.com',
      name: 'Test Company LLC',
      company: 'Test Company',
      city: 'Sacramento',
      state: 'CA',
      county: 'Sacramento',
      license_type: 'Cultivator',
    };
    const email = buildOutreachEmail(lead, template);
    return NextResponse.json({ ok: true, email });
  }

  // ── STATS ──
  if (action === 'stats') {
    const { data: leads } = await supabase
      .from('outreach_leads')
      .select('status', { count: 'exact', head: false });

    const counts: Record<string, number> = {};
    for (const row of leads || []) {
      const s = row.status || 'pending';
      counts[s] = (counts[s] || 0) + 1;
    }
    return NextResponse.json({ ok: true, counts, total: leads?.length || 0 });
  }

  // ── SEND BATCH ──
  if (action === 'send-batch') {
    const resend = getResend();
    if (!resend) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not configured' }, { status: 500 });

    const { campaign_id = 'outreach-v1', template = 'intro', limit = 50 } = body;
    const batchLimit = Math.min(limit, 100); // cap at 100 per API call

    // Get pending leads
    const { data: leads, error: fetchErr } = await supabase
      .from('outreach_leads')
      .select('*')
      .eq('status', 'pending')
      .limit(batchLimit);

    if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
    if (!leads || leads.length === 0) return NextResponse.json({ ok: true, sent: 0, message: 'No pending leads' });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      // Pick template based on license type
      let tpl = template;
      const licType = (lead.license_type || '').toUpperCase();
      if (licType.includes('LAB') || licType.includes('TEST')) tpl = 'lab';
      else if (licType.includes('DISTRIBUT') || licType.includes('WHOLESALE')) tpl = 'distributor';

      const emailData = buildOutreachEmail({
        email: lead.email,
        name: lead.owner || lead.name || '',
        company: lead.name || '',
        city: lead.city || '',
        state: lead.state || '',
        county: lead.county || '',
        license_type: lead.license_type || '',
      }, tpl);

      try {
        const { error: sendErr } = await resend.emails.send({
          from: OUTREACH_FROM,
          to: lead.email,
          subject: emailData.subject,
          text: emailData.text,
          html: emailData.html,
          headers: {
            'List-Unsubscribe': `<${UNSUBSCRIBE_URL}?email=${encodeURIComponent(lead.email)}>`,
          },
        });

        if (sendErr) {
          errors.push(`${lead.email}: ${sendErr.message}`);
          await supabase.from('outreach_leads').update({
            status: 'failed',
            last_error: sendErr.message,
            last_sent_at: new Date().toISOString(),
          }).eq('id', lead.id);
          failed++;
        } else {
          await supabase.from('outreach_leads').update({
            status: 'sent',
            template_used: tpl,
            campaign_id,
            sent_count: (lead.sent_count || 0) + 1,
            last_sent_at: new Date().toISOString(),
          }).eq('id', lead.id);
          sent++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        errors.push(`${lead.email}: ${msg}`);
        failed++;
      }

      // Small delay between sends
      await new Promise((r) => setTimeout(r, 100));
    }

    return NextResponse.json({ ok: true, sent, failed, errors: errors.slice(0, 10) });
  }

  return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
}
