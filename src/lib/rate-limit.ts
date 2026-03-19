// ---------------------------------------------------------------------------
// Simple in-memory rate limiter for public API endpoints
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  readonly count: number;
  readonly resetAt: number;
}

const hits = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) {
      hits.delete(key);
    }
  }
}

/**
 * Check if a request is allowed under the rate limit.
 * @param key   - Unique identifier (e.g. "chat:1.2.3.4")
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs    - Window duration in milliseconds
 * @returns true if allowed, false if rate-limited
 */
export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  cleanup();

  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  // Immutable update
  hits.set(key, { count: entry.count + 1, resetAt: entry.resetAt });
  return true;
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
