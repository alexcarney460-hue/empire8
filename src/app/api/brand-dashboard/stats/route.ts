import { NextResponse } from 'next/server';
import { getAuthenticatedBrand } from '@/lib/brand-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getAuthenticatedBrand();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const { brandAccount, brandId } = auth;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  // Fetch product count (only if brand_id is linked)
  let totalProducts = 0;
  if (brandId) {
    const { count } = await supabase
      .from('brand_products')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId);
    totalProducts = count ?? 0;
  }

  // Fetch active lots
  const { count: activeLots } = await supabase
    .from('weedbay_lots')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', brandAccount.id)
    .eq('status', 'active');

  // Fetch orders containing this brand's products
  let ordersReceived = 0;
  let revenueCents = 0;

  if (brandId) {
    const { data: orderItems } = await supabase
      .from('sales_order_items')
      .select('sales_order_id, line_total_cents')
      .eq('brand_id', brandId);

    const allItems = orderItems ?? [];
    const uniqueOrderIds = new Set(allItems.map((i) => i.sales_order_id));
    ordersReceived = uniqueOrderIds.size;
    revenueCents = allItems.reduce(
      (sum, item) => sum + (item.line_total_cents ?? 0),
      0,
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      companyName: brandAccount.company_name,
      totalProducts,
      activeLots: activeLots ?? 0,
      ordersReceived,
      revenueCents,
    },
  });
}
