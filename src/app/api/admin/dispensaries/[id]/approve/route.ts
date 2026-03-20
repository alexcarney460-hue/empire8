import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ ok: false, error: 'Missing dispensary ID' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  // Verify dispensary exists
  const { data: existing, error: fetchError } = await supabase
    .from('dispensary_accounts')
    .select('id, is_approved')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('[Admin] dispensary approve fetch error:', fetchError.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Dispensary not found' }, { status: 404 });
  }

  if (existing.is_approved) {
    return NextResponse.json({ ok: true, message: 'Already approved' });
  }

  const { data, error } = await supabase
    .from('dispensary_accounts')
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[Admin] dispensary approve error:', error.message);
    return NextResponse.json({ ok: false, error: 'An internal error occurred' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
