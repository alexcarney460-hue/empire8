import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const TRACKING_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'referrer',
  'landing_page',
  'session_duration',
  'pages_viewed',
] as const;

const VALID_TYPES = ['contact', 'wholesale', 'distribution', 'affiliate'] as const;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`forms:${ip}`, 5, 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many submissions. Please try again later.' }, { status: 429 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const formType = body.form_type as string;
  if (!formType || !VALID_TYPES.includes(formType as typeof VALID_TYPES[number])) {
    return NextResponse.json({ ok: false, error: 'Invalid form_type' }, { status: 400 });
  }

  const email = ((body.email as string) || '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: 'Email is required' }, { status: 400 });
  }

  const firstName = ((body.first_name as string) || '').trim();
  const lastName = ((body.last_name as string) || '').trim();
  const phone = ((body.phone as string) || '').trim();
  const companyName = ((body.company_name as string) || '').trim();
  const city = ((body.city as string) || '').trim();
  const state = ((body.state as string) || '').trim();

  try {
    // 1. Find or create contact in CRM
    let contactId: number | null = null;
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .limit(1)
      .single();

    if (existing) {
      contactId = existing.id;
      // Update contact with any new info
      const updates: Record<string, unknown> = {};
      if (firstName) updates.firstname = firstName;
      if (lastName) updates.lastname = lastName;
      if (phone) updates.phone = phone;
      if (Object.keys(updates).length > 0) {
        await supabase.from('contacts').update(updates).eq('id', contactId);
      }
    } else {
      // Determine source based on form type
      // If a UTM source was provided, use it as the source; otherwise fall back to form type
      const utmSource = ((body.utm_source as string) || '').trim();
      const sourceMap: Record<string, string> = {
        contact: 'contact_form',
        wholesale: 'wholesale_application',
        distribution: 'distribution_application',
        affiliate: 'affiliate_application',
      };
      const lifecycleMap: Record<string, string> = {
        contact: 'lead',
        wholesale: 'mql',
        distribution: 'mql',
        affiliate: 'lead',
      };

      const { data: newContact, error: insertErr } = await supabase.from('contacts').insert({
        firstname: firstName || null,
        lastname: lastName || null,
        email,
        phone: phone || null,
        city: city || null,
        state: state || null,
        source: utmSource || sourceMap[formType],
        lead_status: 'NEW',
        lifecycle_stage: lifecycleMap[formType],
      }).select('id').single();

      if (insertErr) {
        console.error('[forms] contact insert error:', insertErr.message);
      } else {
        contactId = newContact?.id ?? null;
      }
    }

    // 2. Find or create company if business name provided
    let companyId: number | null = null;
    if (companyName) {
      const { data: existingCo } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', companyName)
        .limit(1)
        .single();

      if (existingCo) {
        companyId = existingCo.id;
      } else {
        const domain = email.split('@')[1];
        const { data: newCo } = await supabase.from('companies').insert({
          name: companyName,
          domain: domain || null,
          phone: phone || null,
        }).select('id').single();
        companyId = newCo?.id ?? null;
      }

      // Link contact to company
      if (contactId && companyId) {
        await supabase.from('contacts').update({ company_id: companyId }).eq('id', contactId);
      }
    }

    // 3. Extract tracking data and form data separately
    const { form_type: _, ...rawFormData } = body;
    const trackingData: Record<string, unknown> = {};
    const formData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(rawFormData)) {
      if ((TRACKING_FIELDS as readonly string[]).includes(key)) {
        trackingData[key] = value;
      } else {
        formData[key] = value;
      }
    }

    // Merge tracking data into the JSONB data column alongside form fields
    const mergedData = { ...formData, _tracking: trackingData };

    const { error: subErr } = await supabase.from('form_submissions').insert({
      form_type: formType,
      contact_id: contactId,
      company_id: companyId,
      email,
      data: mergedData,
    });

    if (subErr) {
      console.error('[forms] submission insert error:', subErr.message);
      return NextResponse.json({ ok: false, error: 'Failed to save submission' }, { status: 500 });
    }

    // 4. Create activity record if contact exists
    if (contactId) {
      try {
        await supabase.from('activities').insert({
          contact_id: contactId,
          company_id: companyId,
          type: 'form_submission',
          subject: `${formType} form submitted`,
          body: JSON.stringify(mergedData),
        });
      } catch { /* activities table might not have these columns */ }
    }

    // 5. Send email notification (fire-and-forget, never block the response)
    if (resend) {
      const subjectLine = `New ${formType} submission: ${firstName || ''} ${lastName || ''}`.trim();
      const trackingSummary = Object.entries(trackingData)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n') || 'No tracking data';

      resend.emails.send({
        from: 'Empire 8 Sales Direct <notifications@empire8salesdirect.com>',
        to: 'gardenablaze@gmail.com',
        subject: subjectLine,
        text: [
          `New ${formType} form submission`,
          '',
          `Name: ${firstName} ${lastName}`,
          `Email: ${email}`,
          `Phone: ${phone || 'N/A'}`,
          `Company: ${companyName || 'N/A'}`,
          `Type: ${formType}`,
          '',
          '--- Tracking ---',
          trackingSummary,
          '',
          '--- Full Data ---',
          JSON.stringify(formData, null, 2),
        ].join('\n'),
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'unknown';
        console.error('[forms] email notification failed:', msg);
      });
    }

    return NextResponse.json({ ok: true, contact_id: contactId, company_id: companyId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[forms] error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
