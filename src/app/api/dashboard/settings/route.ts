import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const dispensary = await getAuthenticatedDispensary();
    if (!dispensary) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Service unavailable' },
        { status: 503 },
      );
    }

    const body = await req.json();

    // Validate and sanitize input
    const contactName = typeof body.contact_name === 'string' ? body.contact_name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const addressStreet = typeof body.address_street === 'string' ? body.address_street.trim() : '';
    const addressCity = typeof body.address_city === 'string' ? body.address_city.trim() : '';
    const addressState = typeof body.address_state === 'string' ? body.address_state.trim() : '';
    const addressZip = typeof body.address_zip === 'string' ? body.address_zip.trim() : '';

    if (!contactName) {
      return NextResponse.json(
        { ok: false, error: 'Contact name is required.' },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from('dispensary_accounts')
      .update({
        contact_name: contactName,
        phone: phone || null,
        address_street: addressStreet || null,
        address_city: addressCity || null,
        address_state: addressState || 'NY',
        address_zip: addressZip || null,
      })
      .eq('id', dispensary.id);

    if (updateError) {
      console.error('[dashboard/settings] Update failed:', updateError.message);
      return NextResponse.json(
        { ok: false, error: 'An internal error occurred.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[dashboard/settings] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: 'An internal error occurred.' },
      { status: 500 },
    );
  }
}
