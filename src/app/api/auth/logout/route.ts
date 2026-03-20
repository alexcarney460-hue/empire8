import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service unavailable.' },
        { status: 503 }
      );
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to sign out.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
