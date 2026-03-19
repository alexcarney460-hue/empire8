'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Sends a page view event to /api/track on every client-side navigation.
 * Include this hook once in the root layout.
 */
export function usePageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin pages from tracking
    if (pathname.startsWith('/admin')) return;

    const controller = new AbortController();

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      }),
      signal: controller.signal,
    }).catch(() => {
      // Silently fail — tracking should never block UX
    });

    return () => controller.abort();
  }, [pathname]);
}
