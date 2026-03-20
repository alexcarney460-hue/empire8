import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * CAN-SPAM compliant unsubscribe endpoint.
 * GET /api/unsubscribe?email=xxx — marks lead as unsubscribed
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`unsubscribe:${ip}`, 5, 60_000)) {
      return new NextResponse('Too many requests. Please try again later.', { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return new NextResponse('Missing email parameter.', { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase
        .from('outreach_leads')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('email', email);
    }

    return new NextResponse(
      `<!DOCTYPE html>
<html><head><title>Unsubscribed</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
  <div style="text-align:center;max-width:400px;padding:40px;">
    <h1 style="font-size:1.5rem;color:#1a1a1a;margin-bottom:8px;">You've been unsubscribed</h1>
    <p style="color:#6b7280;font-size:0.95rem;">You won't receive any more emails from us. If this was a mistake, contact <a href="mailto:info@empire8salesdirect.com">info@empire8salesdirect.com</a>.</p>
  </div>
</body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    );
  } catch (err) {
    console.error('[unsubscribe] Unexpected error:', err instanceof Error ? err.message : err);
    return new NextResponse('An error occurred. Please try again later.', { status: 500 });
  }
}
