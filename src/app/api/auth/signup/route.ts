import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

type SignupPayload = {
  email: string;
  password: string;
  company_name: string;
  license_number: string;
  license_type: string;
  contact_name: string;
  phone?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
};

const LICENSE_TYPES = [
  'adult_use_retail',
  'medical_retail',
  'microbusiness',
  'delivery',
] as const;

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 requests per minute per IP
    const ip = getClientIp(req);
    if (!rateLimit(`signup:${ip}`, 3, 60_000)) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Partial<SignupPayload>;

    // Validate required fields
    const requiredFields: (keyof SignupPayload)[] = [
      'email',
      'password',
      'company_name',
      'license_number',
      'license_type',
      'contact_name',
    ];

    const missing = requiredFields.filter((f) => !body[f]?.trim());
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const payload = body as SignupPayload;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (payload.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    // Validate license type
    if (!LICENSE_TYPES.includes(payload.license_type as typeof LICENSE_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid license type. Must be one of: ${LICENSE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service unavailable.' },
        { status: 503 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      email_confirm: true,
    });

    if (authError) {
      // Handle duplicate email
      if (authError.message?.includes('already')) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account.' },
        { status: 500 }
      );
    }

    // Create dispensary_accounts row
    const { error: insertError } = await supabase
      .from('dispensary_accounts')
      .insert({
        user_id: authData.user.id,
        company_name: payload.company_name.trim(),
        license_number: payload.license_number.trim(),
        license_type: payload.license_type,
        contact_name: payload.contact_name.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone?.trim() || null,
        address_street: payload.address_street?.trim() || null,
        address_city: payload.address_city?.trim() || null,
        address_state: payload.address_state?.trim() || 'NY',
        address_zip: payload.address_zip?.trim() || null,
        is_approved: false,
      });

    if (insertError) {
      // Clean up: delete the auth user if dispensary insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create dispensary account. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted. Your account is pending approval.',
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
