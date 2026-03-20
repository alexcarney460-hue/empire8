import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
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

type CsvRow = {
  name: string;
  category: string;
  description: string;
  unit_price_cents: string;
  unit_type: string;
  min_order_qty: string;
};

const REQUIRED_COLUMNS = [
  'name',
  'category',
  'description',
  'unit_price_cents',
  'unit_type',
  'min_order_qty',
] as const;

/**
 * RFC 4180-compliant CSV line parser.
 * Handles quoted fields containing commas, newlines, and escaped quotes.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }

  return { headers, rows };
}

function validateRow(
  row: Record<string, string>,
  lineNumber: number,
): { valid: true; data: CsvRow } | { valid: false; error: string } {
  const name = row['name']?.trim();
  if (!name) {
    return { valid: false, error: `Row ${lineNumber}: missing product name` };
  }

  const category = row['category']?.trim();
  if (!category) {
    return { valid: false, error: `Row ${lineNumber}: missing category` };
  }

  const priceCents = parseInt(row['unit_price_cents'] ?? '', 10);
  if (isNaN(priceCents) || priceCents < 0) {
    return { valid: false, error: `Row ${lineNumber}: invalid unit_price_cents` };
  }

  const minQty = parseInt(row['min_order_qty'] ?? '1', 10);
  if (isNaN(minQty) || minQty < 1) {
    return { valid: false, error: `Row ${lineNumber}: invalid min_order_qty (must be >= 1)` };
  }

  return {
    valid: true,
    data: {
      name,
      category,
      description: row['description']?.trim() ?? '',
      unit_price_cents: String(priceCents),
      unit_type: row['unit_type']?.trim() || 'unit',
      min_order_qty: String(minQty),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  POST  -  Upload CSV menu for a brand                               */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Expected multipart form data' },
      { status: 400 },
    );
  }

  const brandId = formData.get('brand_id');
  if (!brandId || typeof brandId !== 'string' || !brandId.trim()) {
    return NextResponse.json(
      { ok: false, error: 'brand_id is required' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: 'A CSV file is required' },
      { status: 400 },
    );
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return NextResponse.json(
      { ok: false, error: 'File must be a .csv file' },
      { status: 400 },
    );
  }

  // 5 MB limit
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, error: 'File exceeds 5 MB limit' },
      { status: 400 },
    );
  }

  // Verify brand exists and is active
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, name')
    .eq('id', brandId.trim())
    .eq('is_active', true)
    .maybeSingle();

  if (brandError || !brand) {
    return NextResponse.json(
      { ok: false, error: 'Brand not found or is inactive' },
      { status: 400 },
    );
  }

  // Parse CSV content
  const rawText = await file.text();
  const { headers, rows } = parseCsv(rawText);

  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'CSV file contains no data rows' },
      { status: 400 },
    );
  }

  // Validate required columns are present
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => col !== 'description' && !headers.includes(col),
  );
  if (missingColumns.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Missing required CSV columns: ${missingColumns.join(', ')}` },
      { status: 400 },
    );
  }

  // Process rows
  const errors: string[] = [];
  let rowsAdded = 0;
  let rowsUpdated = 0;

  for (let i = 0; i < rows.length; i++) {
    const result = validateRow(rows[i], i + 2); // +2 for 1-indexed + header row
    if (!result.valid) {
      errors.push(result.error);
      continue;
    }

    const { data: validRow } = result;
    const slug = generateSlug(validRow.name);

    // Check if product already exists for this brand (match on brand_id + slug)
    const { data: existing } = await supabase
      .from('brand_products')
      .select('id')
      .eq('brand_id', brandId.trim())
      .eq('slug', slug)
      .maybeSingle();

    const productPayload = {
      name: validRow.name,
      slug,
      category: validRow.category,
      description: validRow.description || null,
      unit_price_cents: parseInt(validRow.unit_price_cents, 10),
      unit_type: validRow.unit_type,
      min_order_qty: parseInt(validRow.min_order_qty, 10),
      brand_id: brandId.trim(),
      is_available: true,
    };

    if (existing) {
      // Update existing product
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
        errors.push(`Row ${i + 2}: failed to update "${validRow.name}" - ${updateError.message}`);
      } else {
        rowsUpdated++;
      }
    } else {
      // Insert new product
      const { error: insertError } = await supabase
        .from('brand_products')
        .insert(productPayload);

      if (insertError) {
        errors.push(`Row ${i + 2}: failed to insert "${validRow.name}" - ${insertError.message}`);
      } else {
        rowsAdded++;
      }
    }
  }

  // Record the upload
  const uploadRecord = {
    brand_id: brandId.trim(),
    filename: file.name,
    rows_processed: rows.length,
    rows_added: rowsAdded,
    rows_updated: rowsUpdated,
    errors_count: errors.length,
    error_details: errors.length > 0 ? errors : null,
    method: 'csv',
    status: errors.length === 0 ? 'success' : rowsAdded + rowsUpdated > 0 ? 'partial' : 'failed',
  };

  const { error: uploadLogError } = await supabase
    .from('brand_menu_uploads')
    .insert(uploadRecord);

  if (uploadLogError) {
    console.error('[Menu Upload] Failed to record upload log:', uploadLogError.message);
  }

  return NextResponse.json({
    ok: true,
    rows_processed: rows.length,
    rows_added: rowsAdded,
    rows_updated: rowsUpdated,
    errors,
  });
}

/* ------------------------------------------------------------------ */
/*  GET  -  List recent menu uploads                                   */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('brand_menu_uploads')
    .select('*, brands(name)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Menu Upload] list error:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to fetch uploads' }, { status: 500 });
  }

  const uploads = (data ?? []).map((row) => {
    const { brands: brand, ...rest } = row;
    return {
      ...rest,
      brand_name: brand && typeof brand === 'object' && 'name' in brand
        ? (brand as { name: string }).name
        : null,
    };
  });

  return NextResponse.json({ ok: true, uploads });
}
