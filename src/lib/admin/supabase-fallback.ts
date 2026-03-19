/**
 * Supabase session-based admin authentication fallback.
 *
 * If the primary ADMIN_ANALYTICS_TOKEN mechanism fails (token rotated,
 * deleted, or misconfigured), admins can still authenticate by logging
 * into their Supabase account via /account — provided their email is
 * in the ADMIN_EMAILS list.
 *
 * Two verification levels:
 *   1. Full verification (API routes, Node.js): uses the service role key
 *      to call auth.getUser() and cryptographically verify the JWT.
 *   2. Lightweight verification (Edge middleware): decodes the JWT payload
 *      to extract the email. The JWT signature isn't verified in the Edge
 *      runtime, but middleware is only a first gate — API routes perform
 *      full verification.
 */

import { ADMIN_EMAILS } from './constants';

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

const SUPABASE_COOKIE_PREFIX = 'sb-';
const SUPABASE_COOKIE_SUFFIX = '-auth-token';

/**
 * Find the Supabase auth token from request cookies.
 * Supabase stores the session in a cookie named `sb-<project-ref>-auth-token`.
 * The value can be a JSON string containing `access_token`, or in chunked
 * form (`sb-<ref>-auth-token.0`, `sb-<ref>-auth-token.1`, etc.).
 */
export function findSupabaseTokenFromCookies(
  getCookie: (name: string) => string | undefined,
  allCookieNames: string[],
): string | null {
  // Look for the base cookie or chunked cookies
  const baseCookie = allCookieNames.find(
    (name) =>
      name.startsWith(SUPABASE_COOKIE_PREFIX) &&
      name.endsWith(SUPABASE_COOKIE_SUFFIX),
  );

  if (baseCookie) {
    const value = getCookie(baseCookie);
    if (value) {
      return extractAccessToken(value);
    }
  }

  // Try chunked cookies (sb-<ref>-auth-token.0, .1, .2, ...)
  const chunkPrefix = allCookieNames
    .filter(
      (name) =>
        name.startsWith(SUPABASE_COOKIE_PREFIX) &&
        /auth-token\.\d+$/.test(name),
    )
    .sort();

  if (chunkPrefix.length > 0) {
    const combined = chunkPrefix.map((name) => getCookie(name) ?? '').join('');
    if (combined) {
      return extractAccessToken(combined);
    }
  }

  return null;
}

function extractAccessToken(cookieValue: string): string | null {
  try {
    // The cookie value is typically a JSON-encoded array: [access_token, refresh_token, ...]
    // or a JSON object with { access_token, ... }
    const parsed = JSON.parse(cookieValue);

    if (typeof parsed === 'string') {
      return parsed;
    }
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
      return parsed[0];
    }
    if (parsed && typeof parsed.access_token === 'string') {
      return parsed.access_token;
    }
  } catch {
    // If it's not JSON, it might be a raw JWT
    if (cookieValue.split('.').length === 3) {
      return cookieValue;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Lightweight JWT decode (no crypto verification — for Edge middleware)
// ---------------------------------------------------------------------------

/**
 * Decode a JWT payload without signature verification.
 * Returns the email claim if present, or null.
 *
 * IMPORTANT: This does NOT verify the JWT signature. It should only be used
 * in Edge middleware as a first gate. API routes must use `verifySupabaseAdmin`
 * for full cryptographic verification.
 */
export function decodeJwtEmail(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url decode the payload
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decoded = atob(payload);
    const parsed = JSON.parse(decoded);

    return typeof parsed.email === 'string' ? parsed.email : null;
  } catch {
    return null;
  }
}

/**
 * Check if an email belongs to a known admin.
 * Comparison is case-insensitive.
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.some(
    (adminEmail) => adminEmail.toLowerCase() === email.toLowerCase(),
  );
}

// ---------------------------------------------------------------------------
// Full verification (Node.js API routes)
// ---------------------------------------------------------------------------

/**
 * Verify a Supabase access token server-side using the service role key.
 * Returns the verified user email if valid and in ADMIN_EMAILS, or null.
 *
 * This function is async because it makes a network call to Supabase.
 */
export async function verifySupabaseAdminToken(
  accessToken: string,
): Promise<string | null> {
  // Dynamic import to avoid loading supabase-server in Edge runtime
  const { getSupabaseServer } = await import('@/lib/supabase-server');
  const supabase = getSupabaseServer();

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user?.email) {
      return null;
    }

    const email = data.user.email;
    if (!isAdminEmail(email)) {
      return null;
    }

    return email;
  } catch {
    return null;
  }
}

/**
 * Attempt Supabase session-based admin auth from a Request object.
 * Extracts the Supabase token from cookies and verifies it.
 *
 * Returns the admin email if verified, or null.
 */
export async function verifySupabaseAdminFromRequest(
  req: Request,
): Promise<string | null> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const cookies = parseCookieHeader(cookieHeader);

  const token = findSupabaseTokenFromCookies(
    (name) => cookies.get(name),
    Array.from(cookies.keys()),
  );

  if (!token) {
    return null;
  }

  return verifySupabaseAdminToken(token);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function parseCookieHeader(header: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!header) return map;

  for (const pair of header.split(';')) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) continue;
    const name = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    map.set(name, decodeURIComponent(value));
  }

  return map;
}
