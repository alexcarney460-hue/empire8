import { getSupabaseServer } from '@/lib/supabase-server';

interface Contact {
  id: number;
  email: string | null;
  phone: string | null;
  firstname: string | null;
  lastname: string | null;
  city: string | null;
  state: string | null;
  company_id: number | null;
}

interface Company {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
}

const FALLBACKS: Record<string, string> = {
  first_name: 'there',
  company_name: '',
  city: 'your area',
  state: '',
};

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

/**
 * Replace {{token}} placeholders with contact/company data.
 * When `escapeForHtml` is true, all token values are HTML-escaped
 * to prevent injection in email HTML bodies.
 */
export function mergeTokens(
  template: string,
  contact: Contact,
  company: Company | null,
  escapeForHtml = false,
): string {
  const rawTokens: Record<string, string> = {
    first_name: contact.firstname || FALLBACKS.first_name,
    last_name: contact.lastname || '',
    email: contact.email || '',
    phone: contact.phone || '',
    city: contact.city || company?.city || FALLBACKS.city,
    state: contact.state || company?.state || FALLBACKS.state,
    company_name: company?.name || FALLBACKS.company_name,
  };

  const tokens = escapeForHtml
    ? Object.fromEntries(Object.entries(rawTokens).map(([k, v]) => [k, escapeHtml(v)]))
    : rawTokens;

  let result = template;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), value);
  }

  // Clean up empty references (e.g., "Hi , " -> "Hi, " or "at  " -> "at ")
  result = result.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',');

  return result;
}

/** Queue personalized sends for a campaign step */
export async function queueSendsForStep(
  campaignId: string,
  stepId: string,
  segmentId: string,
  channel: 'email' | 'sms',
  subject: string | null,
  bodyHtml: string | null,
  bodyText: string
): Promise<{ queued: number; skipped: number }> {
  const supabase = getSupabaseServer();
  if (!supabase) throw new Error('DB unavailable');

  // Get opted-out emails/phones
  const optOutEmails = new Set<string>();
  const optOutPhones = new Set<string>();

  const { data: optOuts } = await supabase
    .from('opt_outs')
    .select('email, phone, channel')
    .or(`channel.eq.${channel},channel.eq.all`);

  for (const o of optOuts || []) {
    if (o.email) optOutEmails.add(o.email.toLowerCase());
    if (o.phone) optOutPhones.add(o.phone);
  }

  // Get contacts in segment (via filter_criteria)
  const { data: segData } = await supabase
    .from('segments')
    .select('filter_criteria, is_dynamic')
    .eq('id', segmentId)
    .single();

  if (!segData) throw new Error('Segment not found');

  // Build contact query based on filters
  const filters = segData.filter_criteria as Record<string, unknown>;
  let contactQuery = supabase.from('contacts').select('id, email, phone, firstname, lastname, city, state, company_id');

  if (channel === 'email') {
    contactQuery = contactQuery.not('email', 'is', null);
  } else {
    contactQuery = contactQuery.not('phone', 'is', null);
  }

  if (Array.isArray(filters.lead_status) && filters.lead_status.length > 0) {
    contactQuery = contactQuery.in('lead_status', filters.lead_status as string[]);
  }
  if (Array.isArray(filters.states) && filters.states.length > 0) {
    contactQuery = contactQuery.in('state', filters.states as string[]);
  }

  const { data: contacts } = await contactQuery.limit(5000);
  if (!contacts || contacts.length === 0) return { queued: 0, skipped: 0 };

  // Batch-load companies
  const companyIdSet = new Set<number>();
  for (const c of contacts) { if (c.company_id) companyIdSet.add(c.company_id); }
  const companyIds = Array.from(companyIdSet);
  const companyMap = new Map<number, Company>();

  for (let i = 0; i < companyIds.length; i += 50) {
    const batch = companyIds.slice(i, i + 50);
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, city, state')
      .in('id', batch);
    for (const c of companies || []) {
      companyMap.set(c.id, c);
    }
  }

  let queued = 0;
  let skipped = 0;
  const sendBatch: Array<Record<string, unknown>> = [];

  for (const contact of contacts) {
    // Check opt-outs
    if (channel === 'email' && contact.email && optOutEmails.has(contact.email.toLowerCase())) {
      skipped++;
      continue;
    }
    if (channel === 'sms' && contact.phone && optOutPhones.has(contact.phone)) {
      skipped++;
      continue;
    }

    const company = contact.company_id ? companyMap.get(contact.company_id) || null : null;

    const personalizedSubject = subject ? mergeTokens(subject, contact, company, false) : null;
    const personalizedHtml = bodyHtml ? mergeTokens(bodyHtml, contact, company, true) : null;
    const personalizedText = mergeTokens(bodyText, contact, company, false);

    sendBatch.push({
      campaign_id: campaignId,
      step_id: stepId,
      contact_id: contact.id,
      company_id: contact.company_id,
      channel,
      to_email: channel === 'email' ? contact.email : null,
      to_phone: channel === 'sms' ? contact.phone : null,
      subject: personalizedSubject,
      body_html: personalizedHtml,
      body_text: personalizedText,
      status: 'pending_review',
    });
    queued++;

    // Insert in batches of 100
    if (sendBatch.length >= 100) {
      const { error: insertErr } = await supabase.from('sends').insert(sendBatch);
      if (insertErr) {
        console.error('[Personalizer] Batch insert error:', insertErr.message);
      }
      sendBatch.length = 0;
    }
  }

  // Insert remaining
  if (sendBatch.length > 0) {
    const { error: insertErr } = await supabase.from('sends').insert(sendBatch);
    if (insertErr) {
      console.error('[Personalizer] Final batch insert error:', insertErr.message);
    }
  }

  return { queued, skipped };
}
