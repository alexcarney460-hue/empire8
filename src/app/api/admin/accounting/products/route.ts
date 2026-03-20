import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

interface SalesOrderItem {
  brand_name: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sales_order_id: string;
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase)
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });

  try {
    const { data: items, error } = await supabase
      .from('sales_order_items')
      .select('brand_name, product_name, quantity, unit_price, total_price, sales_order_id');

    if (error) throw error;

    // Aggregate by brand
    const brandMap: Record<string, {
      brand_name: string;
      total_revenue: number;
      order_ids: Set<string>;
      productRevenue: Record<string, number>;
    }> = {};

    // Aggregate by product
    const productMap: Record<string, {
      product_name: string;
      brand_name: string;
      total_revenue: number;
      units_sold: number;
    }> = {};

    for (const item of (items ?? []) as SalesOrderItem[]) {
      const brand = item.brand_name || 'Unknown Brand';
      const product = item.product_name || 'Unknown Product';
      const qty = item.quantity || 1;
      const revenue = item.total_price || qty * (item.unit_price || 0);

      // Brand aggregation
      if (!brandMap[brand]) {
        brandMap[brand] = {
          brand_name: brand,
          total_revenue: 0,
          order_ids: new Set(),
          productRevenue: {},
        };
      }
      brandMap[brand].total_revenue += revenue;
      brandMap[brand].order_ids.add(item.sales_order_id);
      brandMap[brand].productRevenue[product] =
        (brandMap[brand].productRevenue[product] || 0) + revenue;

      // Product aggregation
      const productKey = `${brand}::${product}`;
      if (!productMap[productKey]) {
        productMap[productKey] = {
          product_name: product,
          brand_name: brand,
          total_revenue: 0,
          units_sold: 0,
        };
      }
      productMap[productKey].total_revenue += revenue;
      productMap[productKey].units_sold += qty;
    }

    // Build brand rows with top product
    const brands = Object.values(brandMap)
      .map((b) => {
        const topProduct = Object.entries(b.productRevenue)
          .sort(([, a], [, z]) => z - a)[0];
        return {
          brand_name: b.brand_name,
          total_revenue: Math.round(b.total_revenue * 100) / 100,
          order_count: b.order_ids.size,
          top_product: topProduct ? topProduct[0] : '--',
        };
      })
      .sort((a, b) => b.total_revenue - a.total_revenue);

    const products = Object.values(productMap)
      .map((p) => ({
        ...p,
        total_revenue: Math.round(p.total_revenue * 100) / 100,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue);

    return NextResponse.json({
      ok: true,
      data: { brands, products },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
