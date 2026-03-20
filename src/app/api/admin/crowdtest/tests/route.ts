import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getSupabaseServer } from '@/lib/supabase-server';

const VALID_STIMULUS_TYPES = ['text', 'url', 'product', 'brand'] as const;
type StimulusType = typeof VALID_STIMULUS_TYPES[number];

const MIN_PERSONAS = 20;
const MAX_PERSONAS = 500;

/* -- GET /api/admin/crowdtest/tests ----------------------------------------
 * List all CrowdTest tests with pagination, newest first.
 *
 * Query params:
 *   page   (default 1)
 *   limit  (default 25, max 100)
 *   status (pending | running | completed | failed)
 * ----------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '25')));
  const status = (url.searchParams.get('status') || '').trim();
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('crowdtest_tests')
      .select(
        'id, title, stimulus_type, stimulus_content, audience_description, persona_count, status, progress_phase, progress_current, progress_total, created_at, completed_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ['pending', 'running', 'completed', 'failed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[crowdtest/tests] Query error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch tests' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[crowdtest/tests] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* -- POST /api/admin/crowdtest/tests ---------------------------------------
 * Create a new CrowdTest test.
 *
 * Body: {
 *   title: string,
 *   stimulus_type: "text" | "url" | "product" | "brand",
 *   stimulus_content: string,
 *   audience_description?: string,
 *   persona_count?: number (20-500, default 50)
 * }
 *
 * For "product" type, stimulus_content should be a product ID.
 * Product details are auto-fetched from brand_products and injected.
 *
 * For "brand" type, stimulus_content should be a brand ID.
 * Brand info + all products are auto-fetched and injected.
 * ----------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'Request body is required' },
        { status: 400 },
      );
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const stimulusType = body.stimulus_type as StimulusType;
    const rawContent = typeof body.stimulus_content === 'string' ? body.stimulus_content.trim() : '';
    const audienceDescription = typeof body.audience_description === 'string'
      ? body.audience_description.trim()
      : null;
    const personaCount = typeof body.persona_count === 'number'
      ? Math.min(MAX_PERSONAS, Math.max(MIN_PERSONAS, Math.round(body.persona_count)))
      : 50;

    // -- Validation --
    if (!title) {
      return NextResponse.json(
        { ok: false, error: 'title is required' },
        { status: 400 },
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        { ok: false, error: 'title must be 500 characters or fewer' },
        { status: 400 },
      );
    }

    if (!VALID_STIMULUS_TYPES.includes(stimulusType)) {
      return NextResponse.json(
        { ok: false, error: `stimulus_type must be one of: ${VALID_STIMULUS_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    if (!rawContent) {
      return NextResponse.json(
        { ok: false, error: 'stimulus_content is required' },
        { status: 400 },
      );
    }

    // -- Enrich stimulus content for product/brand types --
    let stimulusContent = rawContent;

    if (stimulusType === 'product') {
      const enriched = await enrichProductStimulus(supabase, rawContent);
      if (enriched.error) {
        return NextResponse.json(
          { ok: false, error: enriched.error },
          { status: 400 },
        );
      }
      stimulusContent = enriched.content;
    }

    if (stimulusType === 'brand') {
      const enriched = await enrichBrandStimulus(supabase, rawContent);
      if (enriched.error) {
        return NextResponse.json(
          { ok: false, error: enriched.error },
          { status: 400 },
        );
      }
      stimulusContent = enriched.content;
    }

    // -- Insert test record --
    const { data, error } = await supabase
      .from('crowdtest_tests')
      .insert({
        title,
        stimulus_type: stimulusType,
        stimulus_content: stimulusContent,
        audience_description: audienceDescription,
        persona_count: personaCount,
        status: 'pending',
        progress_current: 0,
        progress_total: personaCount,
      })
      .select('id, title, stimulus_type, status, persona_count, created_at')
      .single();

    if (error) {
      console.error('[crowdtest/tests] Insert error:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to create test' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[crowdtest/tests] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error' },
      { status: 500 },
    );
  }
}

/* -- Enrichment helpers --------------------------------------------------- */

interface EnrichResult {
  readonly content: string;
  readonly error?: string;
}

async function enrichProductStimulus(
  supabase: NonNullable<ReturnType<typeof getSupabaseServer>>,
  productId: string,
): Promise<EnrichResult> {
  const { data, error } = await supabase
    .from('brand_products')
    .select('id, name, description, category, unit_price_cents, unit_type, brands!inner(name)')
    .eq('id', productId)
    .single();

  if (error || !data) {
    return { content: '', error: `Product not found: ${productId}` };
  }

  const brand = (data as Record<string, unknown>).brands as { name: string } | null;
  const priceDollars = ((data.unit_price_cents as number) / 100).toFixed(2);

  const content = [
    `Product: ${data.name}`,
    `Brand: ${brand?.name ?? 'Unknown'}`,
    `Category: ${data.category}`,
    `Price: $${priceDollars} per ${data.unit_type}`,
    data.description ? `Description: ${data.description}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return { content };
}

async function enrichBrandStimulus(
  supabase: NonNullable<ReturnType<typeof getSupabaseServer>>,
  brandId: string,
): Promise<EnrichResult> {
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, name, description, website')
    .eq('id', brandId)
    .single();

  if (brandError || !brand) {
    return { content: '', error: `Brand not found: ${brandId}` };
  }

  const { data: products } = await supabase
    .from('brand_products')
    .select('name, category, unit_price_cents, unit_type, description')
    .eq('brand_id', brandId)
    .eq('is_available', true)
    .order('category')
    .limit(50);

  const productLines = (products ?? []).map((p: Record<string, unknown>) => {
    const price = ((p.unit_price_cents as number) / 100).toFixed(2);
    return `  - ${p.name} (${p.category}) $${price}/${p.unit_type}`;
  });

  const content = [
    `Brand: ${brand.name}`,
    brand.description ? `About: ${brand.description}` : null,
    brand.website ? `Website: ${brand.website}` : null,
    productLines.length > 0 ? `\nProduct Catalog:\n${productLines.join('\n')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return { content };
}
