import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const response = NextResponse.json({ ok: true });

    // Clear the admin_token cookie
    response.cookies.set('admin_token', '', {
      maxAge: 0,
      path: '/',
    });

    // Clear all Supabase auth cookies (sb-*-auth-token pattern)
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
        response.cookies.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
        });
      }
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
