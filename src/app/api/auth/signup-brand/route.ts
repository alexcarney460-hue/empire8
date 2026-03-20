import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

type BrandSignupPayload = {
  user_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  license_type?: string;
  website?: string;
  description?: string;
};

const BRAND_LICENSE_TYPES = [
  'processor',
  'cultivator',
  'microbusiness',
] as const;

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 requests per minute per IP
    const ip = getClientIp(req);
    if (!rateLimit(`signup-brand:${ip}`, 3, 60_000)) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Partial<BrandSignupPayload>;

    // Validate required fields
    const requiredFields: (keyof BrandSignupPayload)[] = [
      'user_id',
      'company_name',
      'contact_name',
      'email',
    ];

    const missing = requiredFields.filter((f) => {
      const val = body[f];
      return typeof val !== 'string' || !val.trim();
    });

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const payload = body as BrandSignupPayload;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    // Validate license type if provided
    if (
      payload.license_type &&
      !BRAND_LICENSE_TYPES.includes(payload.license_type as typeof BRAND_LICENSE_TYPES[number])
    ) {
      return NextResponse.json(
        { error: `Invalid license type. Must be one of: ${BRAND_LICENSE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate website URL format if provided
    if (payload.website) {
      try {
        new URL(payload.website);
      } catch {
        return NextResponse.json(
          { error: 'Invalid website URL. Please include https://' },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable.' },
        { status: 503 }
      );
    }

    // Check if a brand_accounts row already exists for this user
    const { data: existingAccount } = await supabase
      .from('brand_accounts')
      .select('id')
      .eq('user_id', payload.user_id)
      .maybeSingle();

    if (existingAccount) {
      return NextResponse.json(
        { error: 'A brand account already exists for this user.' },
        { status: 409 }
      );
    }

    // Auto-create a brands row if the brand name does not exist yet
    let brandId: string | null = null;
    const brandSlug = payload.company_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', brandSlug)
      .maybeSingle();

    if (existingBrand) {
      brandId = (existingBrand as { id: string }).id;
    } else {
      // Create an inactive brand entry pending approval
      const { data: newBrand, error: brandInsertError } = await supabase
        .from('brands')
        .insert({
          name: payload.company_name.trim(),
          slug: brandSlug,
          contact_email: payload.email.trim().toLowerCase(),
          contact_name: payload.contact_name.trim(),
          website: payload.website?.trim() || null,
          description: payload.description?.trim() || null,
          is_active: false,
        })
        .select('id')
        .single();

      if (!brandInsertError && newBrand) {
        brandId = (newBrand as { id: string }).id;
      }
      // If brand creation fails (e.g. name collision), proceed without brand_id
    }

    // Create brand_accounts row
    const { error: insertError } = await supabase
      .from('brand_accounts')
      .insert({
        user_id: payload.user_id,
        brand_id: brandId,
        company_name: payload.company_name.trim(),
        contact_name: payload.contact_name.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone?.trim() || null,
        license_number: payload.license_number?.trim() || null,
        license_type: payload.license_type || null,
        website: payload.website?.trim() || null,
        description: payload.description?.trim() || null,
        is_approved: false,
        account_type: 'brand',
      });

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create brand account. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Brand application submitted. Your account is pending approval.',
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
