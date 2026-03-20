import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export const revalidate = 30; // cache for 30 seconds

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type PublicInventoryItem = {
  slug: string;
  status: InventoryStatus;
};

/**
 * Public endpoint: returns stock status per product (no exact counts exposed).
 * GET /api/inventory
 */
export async function GET() {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      // If DB is unavailable, assume everything is in stock (graceful degradation)
      return NextResponse.json({ ok: true, inventory: [] });
    }

    const { data, error } = await supabase
      .from('products')
      .select('slug, quantity_on_hand, low_stock_threshold')
      .order('id', { ascending: true });

    if (error || !data) {
      return NextResponse.json({ ok: true, inventory: [] });
    }

    const inventory: PublicInventoryItem[] = data.map((row) => {
      const qty = row.quantity_on_hand ?? 0;
      const threshold = row.low_stock_threshold ?? 10;

      let status: InventoryStatus = 'in_stock';
      if (qty <= 0) {
        status = 'out_of_stock';
      } else if (qty <= threshold) {
        status = 'low_stock';
      }

      return { slug: row.slug, status };
    });

    return NextResponse.json({ ok: true, inventory });
  } catch (err) {
    console.error('[public-inventory] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'An internal error occurred.' }, { status: 500 });
  }
}
