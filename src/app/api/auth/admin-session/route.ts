import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAILS } from '@/lib/admin/constants';

/**
 * POST /api/auth/admin-session
 * Sets the admin_token cookie for authenticated admin users.
 * Called after successful Supabase login when the user is an admin.
 */
export async function POST(req: NextRequest) {
  const token = process.env.ADMIN_ANALYTICS_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Admin token not configured' }, { status: 503 });
  }

  // Verify the user has a valid Supabase session and is an admin
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'Service unavailable' }, { status: 503 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Get access token from Authorization header (primary) or cookie (fallback)
  let accessToken: string | null = null;

  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.slice(7).trim();
  }

  if (!accessToken) {
    const authCookie = req.cookies.getAll().find((c) => c.name.match(/^sb-.*-auth-token/));
    if (authCookie) {
      try {
        const raw = decodeURIComponent(authCookie.value);
        if (raw.startsWith('[')) {
          accessToken = JSON.parse(raw)[0];
        } else {
          const parsed = JSON.parse(raw);
          accessToken = parsed.access_token ?? parsed[0] ?? null;
        }
      } catch {
        accessToken = authCookie.value;
      }
    }
  }

  if (!accessToken) {
    return NextResponse.json({ ok: false, error: 'No session' }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user?.email) {
    return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });
  }

  if (!ADMIN_EMAILS.includes(userData.user.email.toLowerCase())) {
    return NextResponse.json({ ok: false, error: 'Not an admin' }, { status: 403 });
  }

  // Set the admin cookie
  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
