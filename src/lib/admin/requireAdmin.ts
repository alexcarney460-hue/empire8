import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { verifySupabaseAdminFromRequest } from './supabase-fallback';

function safeEqual(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Require admin authentication for API route handlers.
 *
 * Primary method: Bearer token matching ADMIN_ANALYTICS_TOKEN env var.
 * Fallback method: Supabase session where the user's email is in ADMIN_EMAILS.
 *
 * Returns null if authenticated (request may proceed), or a NextResponse
 * with an error status if authentication fails.
 */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  const adminToken = process.env.ADMIN_ANALYTICS_TOKEN;

  // --- Primary: Bearer token ---
  if (adminToken) {
    const auth = req.headers.get('authorization') || '';
    const expected = `Bearer ${adminToken}`;
    if (safeEqual(auth, expected)) {
      return null; // Authenticated via token
    }

    // Also check admin_token cookie (set by middleware on admin login)
    const cookieHeader = req.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/admin_token=([^;]+)/);
    if (cookieMatch && safeEqual(cookieMatch[1], adminToken)) {
      return null; // Authenticated via admin cookie
    }
  }

  // --- Fallback: Supabase session-based admin auth ---
  // If the token is missing, rotated, or the Bearer header doesn't match,
  // check whether the request includes a valid Supabase session cookie
  // belonging to a known admin email.
  try {
    const adminEmail = await verifySupabaseAdminFromRequest(req);
    if (adminEmail) {
      return null; // Authenticated via Supabase session
    }
  } catch {
    // Supabase verification failed — fall through to unauthorized
  }

  // --- Neither method succeeded ---
  if (!adminToken) {
    return NextResponse.json(
      { ok: false, error: 'missing_env' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: false, error: 'unauthorized' },
    { status: 401 },
  );
}
