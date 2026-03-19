import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, email, total, status, created_at, updated_at')
      .eq('status', 'refunded')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const refunds = data ?? [];
    const totalRefunded = refunds.reduce((sum, r) => sum + (Number(r.total) || 0), 0);

    return NextResponse.json({
      ok: true,
      data: refunds,
      summary: {
        count: refunds.length,
        total_refunded: Math.round(totalRefunded * 100) / 100,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
