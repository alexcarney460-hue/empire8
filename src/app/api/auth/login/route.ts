import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
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
      success: true,
      session: {
        access_token: data.session?.access_token ?? null,
        refresh_token: data.session?.refresh_token ?? null,
      },
      dispensary: {
        id: account.id,
        company_name: account.company_name,
        is_approved: account.is_approved,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
