import { NextResponse } from 'next/server';
import { getAuthenticatedDispensary } from '@/lib/dispensary-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
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
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  // Fetch all sales orders for this dispensary
  const { data: orders, error } = await supabase
    .from('sales_orders')
    .select('id, status, total_cents, created_at')
    .eq('dispensary_id', dispensary.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  const allOrders = orders ?? [];
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(
    (o) => o.status === 'submitted' || o.status === 'processing',
  ).length;
  const totalSpentCents = allOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_cents ?? 0), 0);

  return NextResponse.json({
    ok: true,
    data: {
      totalOrders,
      pendingOrders,
      totalSpentCents,
      companyName: dispensary.company_name,
    },
  });
}
