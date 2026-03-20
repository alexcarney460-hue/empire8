import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedBrand } from '@/lib/brand-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/* ── GET -- Fetch brand account info ────────────────────────────────── */

export async function GET() {
  const auth = await getAuthenticatedBrand();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ ok: true, data: auth.brandAccount });
}

/* ── PUT -- Update editable fields ──────────────────────────────────── */

export async function PUT(req: NextRequest) {
  const auth = await getAuthenticatedBrand();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { brandAccount } = auth;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const allowedFields = ['contact_name', 'phone', 'website', 'description'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const val = body[field];
      updates[field] = typeof val === 'string' ? (val.trim() || null) : val;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 });
  }

  // Validate contact_name if provided
  if (updates.contact_name !== undefined && !updates.contact_name) {
    return NextResponse.json({ ok: false, error: 'Contact name cannot be empty' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('brand_accounts')
    .update(updates)
    .eq('id', brandAccount.id)
    .select()
    .single();

  if (error) {
    console.error('[brand-dashboard/settings] update error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to update settings' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
