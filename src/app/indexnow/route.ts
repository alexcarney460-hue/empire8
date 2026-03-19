import { NextResponse } from 'next/server';

// IndexNow verification key
const INDEXNOW_KEY = '2275d46d1a62409f8d744a65b4354008';

export async function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=86400' },
  });
}
