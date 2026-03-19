import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let supabaseDomain = '';
  try {
    supabaseDomain = new URL(supabaseUrl).hostname;
  } catch {
    supabaseDomain = supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '').split('/')[0] : 'not configured';
  }

  return NextResponse.json({
    ok: true,
    admin_email: 'gardenablaze@gmail.com',
    supabase_domain: supabaseDomain,
    features: {
      email_notifications: true,
      auto_approve_wholesale: false,
      maintenance_mode: false,
    },
  });
}
