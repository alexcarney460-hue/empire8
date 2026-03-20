import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_EMAILS } from '@/lib/admin/constants';
import {
  findSupabaseTokenFromCookies,
  decodeJwtEmail,
  isAdminEmail,
} from '@/lib/admin/supabase-fallback';

/**
 * Middleware: protects /admin routes and /api/admin routes.
 *
 * Authentication scheme:
 *   - Admin pages require an `admin_token` cookie that matches ADMIN_ANALYTICS_TOKEN env.
 *   - Admin API routes already check Bearer tokens per-route via requireAdmin(),
 *     but this middleware adds an extra layer: requests without a valid cookie
 *     OR valid Bearer header are rejected early.
 *   - Public routes pass through untouched.
 *
 * Fallback authentication:
 *   - If the primary token-based auth fails, the middleware checks for a
 *     Supabase auth session cookie (sb-*-auth-token). If the JWT payload
 *     contains an email in ADMIN_EMAILS, the request is allowed through.
 *   - Note: Edge middleware only decodes the JWT — it does NOT verify the
 *     signature. API routes perform full cryptographic verification via
 *     requireAdmin() as a second layer.
 *
 * To authenticate, visit /admin?token=<ADMIN_ANALYTICS_TOKEN> — the middleware
 * sets a secure HttpOnly cookie and redirects to /admin.
 */

const ADMIN_PATHS = ['/admin', '/api/admin'];
const DASHBOARD_PATHS = ['/dashboard'];

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Check if the request has a Supabase session cookie present.
 * This is a lightweight check -- the actual token verification
 * happens server-side in getAuthenticatedDispensary().
 */
function hasSupabaseSessionCookie(request: NextRequest): boolean {
  const allCookies = request.cookies.getAll();
  return allCookies.some((c) => c.name.match(/^sb-.*-auth-token$/));
}

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Check for a valid Supabase admin session in the request cookies.
 * Uses lightweight JWT decode (no signature verification) since this
 * runs in the Edge runtime. API routes do full verification.
 */
function hasSupabaseAdminSession(request: NextRequest): boolean {
  const allCookieNames = request.cookies.getAll().map((c) => c.name);

  const token = findSupabaseTokenFromCookies(
    (name) => request.cookies.get(name)?.value,
    allCookieNames,
  );

  if (!token) return false;

  const email = decodeJwtEmail(token);
  if (!email) return false;

  return isAdminEmail(email);
}

// ---------------------------------------------------------------------------
// Visitor tracking cookie — captures UTMs, landing page, page view count
// ---------------------------------------------------------------------------
const VS_COOKIE = 'vs_visitor';

function setVisitorTracking(request: NextRequest, response: NextResponse): NextResponse {
  const { pathname, searchParams } = request.nextUrl;

  // Skip tracking for admin, api, and static asset paths
  if (pathname.startsWith('/admin') || pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return response;
  }

  const existing = request.cookies.get(VS_COOKIE)?.value;
  let cookie: {
    firstVisit: string;
    landingPage: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    pageViews: number;
  };

  if (existing) {
    try {
      cookie = JSON.parse(existing);
      // Immutable update: increment page views
      cookie = { ...cookie, pageViews: cookie.pageViews + 1 };
    } catch {
      cookie = {
        firstVisit: new Date().toISOString(),
        landingPage: pathname,
        utm_source: searchParams.get('utm_source') || '',
        utm_medium: searchParams.get('utm_medium') || '',
        utm_campaign: searchParams.get('utm_campaign') || '',
        pageViews: 1,
      };
    }
  } else {
    cookie = {
      firstVisit: new Date().toISOString(),
      landingPage: pathname,
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      pageViews: 1,
    };
  }

  response.cookies.set(VS_COOKIE, JSON.stringify(cookie), {
    httpOnly: false, // Must be readable by client-side JS for form tracking
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Protect dashboard routes: redirect to /login if no session cookie
  if (isDashboardPath(pathname)) {
    if (!hasSupabaseSessionCookie(request)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
    const response = NextResponse.next();
    return setVisitorTracking(request, response);
  }

  // For non-admin paths, set visitor tracking cookie and pass through
  if (!isAdminPath(pathname)) {
    const response = NextResponse.next();
    return setVisitorTracking(request, response);
  }

  const expectedToken = process.env.ADMIN_ANALYTICS_TOKEN;

  // Allow login via query param: /admin?token=xxx
  // Sets a cookie and redirects to clean URL
  if (expectedToken) {
    const loginToken = searchParams.get('token');
    if (loginToken && timingSafeCompare(loginToken, expectedToken)) {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.searchParams.delete('token');
      const response = NextResponse.redirect(cleanUrl);
      response.cookies.set('admin_token', expectedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }
  }

  // Check cookie auth (primary method)
  if (expectedToken) {
    const cookieToken = request.cookies.get('admin_token')?.value;
    if (cookieToken && timingSafeCompare(cookieToken, expectedToken)) {
      return NextResponse.next();
    }
  }

  // For API routes, also accept Bearer header
  if (pathname.startsWith('/api/admin')) {
    if (expectedToken) {
      const authHeader = request.headers.get('authorization') || '';
      const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
      if (bearerToken && timingSafeCompare(bearerToken, expectedToken)) {
        return NextResponse.next();
      }
    }

    // Fallback: Supabase session-based admin auth for API routes.
    // Let through to requireAdmin() which does full JWT verification.
    if (hasSupabaseAdminSession(request)) {
      return NextResponse.next();
    }

    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  // Fallback: Supabase session-based admin auth for admin pages
  if (hasSupabaseAdminSession(request)) {
    return NextResponse.next();
  }

  // If env is not set AND no Supabase fallback, block all admin access
  if (!expectedToken) {
    return new NextResponse('Service unavailable', { status: 503 });
  }

  // Admin page without valid auth — return 401
  return new NextResponse(
    '<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5">' +
    '<div style="text-align:center"><h1 style="font-size:1.5rem;color:#333">Admin Access Required</h1>' +
    '<p style="color:#666">Append <code>?token=YOUR_TOKEN</code> to authenticate, or log in at <a href="/account">/account</a> with an admin email.</p></div></body></html>',
    {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  );
}

export const config = {
  matcher: [
    // Admin auth
    '/admin/:path*',
    '/api/admin/:path*',
    // Dashboard auth
    '/dashboard/:path*',
    // Visitor tracking — match all pages except static assets and Next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
