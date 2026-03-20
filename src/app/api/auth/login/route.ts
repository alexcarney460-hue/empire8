import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 requests per minute per IP
    const ip = getClientIp(req);
    if (!rateLimit(`login:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Look up dispensary account
    const { data: dispensary, error: dispError } = await supabase
      .from('dispensary_accounts')
      .select('id, is_approved, company_name')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (dispError || !dispensary) {
      return NextResponse.json(
        { error: 'No dispensary account found for this user.' },
        { status: 403 }
      );
    }

    const account = dispensary as { id: string; is_approved: boolean; company_name: string };

    return NextResponse.json({
      ok: true,
      approved: account.is_approved,
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
