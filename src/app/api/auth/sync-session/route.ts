import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { ADMIN_EMAILS } from '@/lib/admin/constants';

/**
 * POST /api/auth/sync-session
 *
 * Accepts a Supabase access_token in the request body, verifies it
 * server-side, and if the user is a known admin, sets a secure HttpOnly
 * cookie containing the access token. This bridges the gap between
 * client-side Supabase auth (localStorage) and server-side middleware
 * (cookies).
 *
 * Body: { access_token: string }
 *
 * This endpoint is ONLY called by admin users from the account page.
 * Non-admin users get a 200 with synced: false (no cookie set).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accessToken = body?.access_token;

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'missing_token' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'supabase_unavailable' },
        { status: 503 },
      );
    }

    // Verify the token server-side using the service role key
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user?.email) {
      return NextResponse.json(
        { ok: false, error: 'invalid_token' },
        { status: 401 },
      );
    }

    const email = data.user.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.some(
      (ae) => ae.toLowerCase() === email,
    );

    if (!isAdmin) {
      // Not an admin — no cookie needed, but not an error
      return NextResponse.json({ ok: true, synced: false });
    }

    // Set a secure cookie with the access token so middleware can read it.
    // The cookie name follows Supabase convention: sb-<ref>-auth-token
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const projectRef = supabaseUrl.match(/\/\/([\w-]+)\.supabase/)?.[1] ?? 'app';
    const cookieName = `sb-${projectRef}-auth-token`;

    const response = NextResponse.json({ ok: true, synced: true });
    response.cookies.set(cookieName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour — matches typical Supabase JWT expiry
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/auth/sync-session
 *
 * Clears the admin session cookie on logout.
 */
export async function DELETE() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectRef = supabaseUrl.match(/\/\/([\w-]+)\.supabase/)?.[1] ?? 'app';
  const cookieName = `sb-${projectRef}-auth-token`;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
