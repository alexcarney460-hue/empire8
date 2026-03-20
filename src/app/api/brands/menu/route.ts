import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type ProductInput = {
  name: string;
  category: string;
  description?: string;
  unit_price_cents: number;
  unit_type?: string;
  min_order_qty?: number;
};

function validateProduct(
  product: Record<string, unknown>,
  index: number,
): { valid: true; data: ProductInput } | { valid: false; error: string } {
  const name =
    typeof product.name === 'string' ? product.name.trim() : '';
  if (!name) {
    return { valid: false, error: `Product ${index + 1}: missing name` };
  }

  const category =
    typeof product.category === 'string' ? product.category.trim() : '';
  if (!category) {
    return { valid: false, error: `Product ${index + 1}: missing category` };
  }

  const priceCents = Number(product.unit_price_cents);
  if (isNaN(priceCents) || priceCents < 0) {
    return { valid: false, error: `Product ${index + 1}: invalid unit_price_cents` };
  }

  const minQty = product.min_order_qty !== undefined
    ? Number(product.min_order_qty)
    : 1;
  if (isNaN(minQty) || minQty < 1) {
    return { valid: false, error: `Product ${index + 1}: invalid min_order_qty (must be >= 1)` };
  }

  return {
    valid: true,
    data: {
      name,
      category,
      description:
        typeof product.description === 'string'
          ? product.description.trim()
          : undefined,
      unit_price_cents: Math.floor(priceCents),
      unit_type:
        typeof product.unit_type === 'string' && product.unit_type.trim()
          ? product.unit_type.trim()
          : 'unit',
      min_order_qty: Math.floor(minQty),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  POST  -  Public brand menu upload via API key                      */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const apiKey = body.api_key;
  const brandSlug = body.brand_slug;
  const products = body.products;

  // --- Validate required fields ---
  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'api_key is required' },
      { status: 400 },
    );
  }

  if (!brandSlug || typeof brandSlug !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'brand_slug is required' },
      { status: 400 },
    );
  }

  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'products array is required and must not be empty' },
      { status: 400 },
    );
  }

  // --- Validate API key against crowdtest_api_keys table ---
  const { data: keyRecord, error: keyError } = await supabase
    .from('crowdtest_api_keys')
    .select('id, is_active')
    .eq('api_key', apiKey.trim())
    .maybeSingle();

  if (keyError || !keyRecord) {
    return NextResponse.json(
      { ok: false, error: 'Invalid API key' },
      { status: 401 },
    );
  }

  if (!keyRecord.is_active) {
    return NextResponse.json(
      { ok: false, error: 'API key is deactivated' },
      { status: 403 },
    );
  }

  // --- Resolve brand ---
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, name')
    .eq('slug', brandSlug.trim())
    .eq('is_active', true)
    .maybeSingle();

  if (brandError || !brand) {
    return NextResponse.json(
      { ok: false, error: 'Brand not found or is inactive' },
      { status: 404 },
    );
  }

  // --- Process products ---
  const errors: string[] = [];
  let rowsAdded = 0;
  let rowsUpdated = 0;

  for (let i = 0; i < products.length; i++) {
    const result = validateProduct(products[i] as Record<string, unknown>, i);
    if (!result.valid) {
      errors.push(result.error);
      continue;
    }

    const { data: validProduct } = result;
    const slug = generateSlug(validProduct.name);

    // Check if product already exists (match on brand_id + slug)
    const { data: existing } = await supabase
      .from('brand_products')
      .select('id')
      .eq('brand_id', brand.id)
      .eq('slug', slug)
      .maybeSingle();

    const productPayload = {
      name: validProduct.name,
      slug,
      category: validProduct.category,
      description: validProduct.description || null,
      unit_price_cents: validProduct.unit_price_cents,
      unit_type: validProduct.unit_type,
      min_order_qty: validProduct.min_order_qty,
      brand_id: brand.id,
      is_available: true,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from('brand_products')
        .update({
          name: productPayload.name,
          category: productPayload.category,
          description: productPayload.description,
          unit_price_cents: productPayload.unit_price_cents,
          unit_type: productPayload.unit_type,
          min_order_qty: productPayload.min_order_qty,
        })
        .eq('id', existing.id);

      if (updateError) {
        errors.push(`Product ${i + 1}: update failed - ${updateError.message}`);
      } else {
        rowsUpdated++;
      }
    } else {
      const { error: insertError } = await supabase
        .from('brand_products')
        .insert(productPayload);

      if (insertError) {
        errors.push(`Product ${i + 1}: insert failed - ${insertError.message}`);
      } else {
        rowsAdded++;
      }
    }
  }

  // --- Record upload log ---
  const uploadRecord = {
    brand_id: brand.id,
    filename: `api-${brandSlug}-${Date.now()}`,
    rows_processed: products.length,
    rows_added: rowsAdded,
    rows_updated: rowsUpdated,
    errors_count: errors.length,
    error_details: errors.length > 0 ? errors : null,
    method: 'api',
    status: errors.length === 0 ? 'success' : rowsAdded + rowsUpdated > 0 ? 'partial' : 'failed',
  };

  const { error: uploadLogError } = await supabase
    .from('brand_menu_uploads')
    .insert(uploadRecord);

  if (uploadLogError) {
    console.error('[Brand Menu API] Failed to record upload log:', uploadLogError.message);
  }

  return NextResponse.json({
    ok: true,
    brand: brand.name,
    rows_processed: products.length,
    rows_added: rowsAdded,
    rows_updated: rowsUpdated,
    errors,
  });
}
