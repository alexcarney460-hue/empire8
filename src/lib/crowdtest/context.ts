import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * Build a rich context string describing Empire 8's business for injection
 * into CrowdTest persona simulations. Queries live database state so
 * personas understand the current ecosystem.
 */
export async function buildEmpire8Context(): Promise<string> {
  const supabase = getSupabaseServer();

  if (!supabase) {
    return getStaticFallbackContext();
  }

  const [brandsResult, productsResult, dispensaryResult, ordersResult] =
    await Promise.all([
      supabase
        .from('brands')
        .select('name, description, category')
        .eq('is_active', true)
        .order('name'),

      supabase
        .from('brand_products')
        .select('name, category, unit_price_cents, unit_type, brands!inner(name)')
        .eq('is_available', true)
        .order('category')
        .limit(100),

      supabase
        .from('dispensary_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true),

      supabase
        .from('sales_orders')
        .select('id, total_cents', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo()),
    ]);

  const sections: string[] = [];

  // Company overview
  sections.push(
    'COMPANY: Empire 8 Sales Direct',
    'Industry: Cannabis wholesale distribution',
    'Location: New York State',
    'Role: Wholesale supplier connecting cannabis brands with licensed dispensaries',
    '',
  );

  // Active brands
  const brands = brandsResult.data ?? [];
  if (brands.length > 0) {
    sections.push(`ACTIVE BRANDS (${brands.length}):`);
    for (const brand of brands) {
      const desc = brand.description ? ` -- ${brand.description}` : '';
      const cat = brand.category ? ` [${brand.category}]` : '';
      sections.push(`  - ${brand.name}${cat}${desc}`);
    }
    sections.push('');
  }

  // Product catalog summary
  const products = productsResult.data ?? [];
  if (products.length > 0) {
    const categories = new Map<string, number>();
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const p of products) {
      const cat = (p.category as string) || 'Other';
      categories.set(cat, (categories.get(cat) ?? 0) + 1);
      const price = p.unit_price_cents as number;
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    }

    sections.push(`PRODUCT CATALOG (${products.length} active products):`);
    for (const [cat, count] of Array.from(categories.entries()).sort()) {
      sections.push(`  - ${cat}: ${count} products`);
    }
    if (minPrice !== Infinity) {
      sections.push(
        `  Price range: $${(minPrice / 100).toFixed(2)} - $${(maxPrice / 100).toFixed(2)}`,
      );
    }
    sections.push('');
  }

  // Dispensary network
  const dispensaryCount = dispensaryResult.count ?? 0;
  if (dispensaryCount > 0) {
    sections.push(`DISPENSARY NETWORK: ${dispensaryCount} approved dispensary accounts`);
    sections.push('');
  }

  // Recent order volume
  const orders = ordersResult.data ?? [];
  const orderCount = ordersResult.count ?? 0;
  if (orderCount > 0) {
    const totalRevenue = orders.reduce(
      (sum: number, o: Record<string, unknown>) => sum + ((o.total_cents as number) || 0),
      0,
    );
    sections.push('RECENT ACTIVITY (last 30 days):');
    sections.push(`  - Orders: ${orderCount}`);
    if (totalRevenue > 0) {
      sections.push(`  - Revenue: $${(totalRevenue / 100).toLocaleString()}`);
    }
    sections.push('');
  }

  // Market context
  sections.push(
    'MARKET CONTEXT:',
    '  - New York adult-use cannabis market (legalized 2021, retail sales began 2023)',
    '  - Growing licensed dispensary network across the state',
    '  - Competitive wholesale market with emphasis on product quality and compliance',
    '  - All products must meet NYS Cannabis Control Board regulations',
  );

  return sections.join('\n');
}

/* -- Helpers -------------------------------------------------------------- */

function thirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function getStaticFallbackContext(): string {
  return [
    'COMPANY: Empire 8 Sales Direct',
    'Industry: Cannabis wholesale distribution',
    'Location: New York State',
    'Role: Wholesale supplier connecting cannabis brands with licensed dispensaries',
    '',
    'MARKET CONTEXT:',
    '  - New York adult-use cannabis market (legalized 2021, retail sales began 2023)',
    '  - Growing licensed dispensary network across the state',
    '  - Competitive wholesale market with emphasis on product quality and compliance',
    '  - All products must meet NYS Cannabis Control Board regulations',
  ].join('\n');
}
