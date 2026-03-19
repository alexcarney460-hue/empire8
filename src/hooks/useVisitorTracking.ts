'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const COOKIE_NAME = 'vs_visitor';
const SESSION_KEY = 'vs_session';

interface VisitorCookie {
  readonly firstVisit: string;
  readonly landingPage: string;
  readonly utm_source: string;
  readonly utm_medium: string;
  readonly utm_campaign: string;
  readonly pageViews: number;
}

interface SessionData {
  readonly startedAt: number;
  readonly pagesViewed: number;
}

interface TrackingData {
  readonly utm_source: string;
  readonly utm_medium: string;
  readonly utm_campaign: string;
  readonly referrer: string;
  readonly landing_page: string;
  readonly session_duration: number;
  readonly pages_viewed: number;
}

function parseCookie(): VisitorCookie | null {
  try {
    const match = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return null;
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
  } catch {
    return null;
  }
}

function getSession(): SessionData {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // sessionStorage not available
  }
  return { startedAt: Date.now(), pagesViewed: 0 };
}

function saveSession(session: SessionData): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage not available
  }
}

/**
 * Tracks visitor behavior across the session.
 * Reads the tracking cookie set by middleware, counts pages viewed in
 * sessionStorage, and provides getTrackingData() for forms to call
 * before submission.
 */
export function useVisitorTracking() {
  const pathname = usePathname();
  const sessionRef = useRef<SessionData>(getSession());

  // Increment page views on each navigation
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    const updated: SessionData = {
      ...sessionRef.current,
      pagesViewed: sessionRef.current.pagesViewed + 1,
    };
    sessionRef.current = updated;
    saveSession(updated);
  }, [pathname]);

  const getTrackingData = useCallback((): TrackingData => {
    const cookie = parseCookie();
    const session = sessionRef.current;
    const durationMs = Date.now() - session.startedAt;
    const durationSeconds = Math.round(durationMs / 1000);

    return {
      utm_source: cookie?.utm_source || '',
      utm_medium: cookie?.utm_medium || '',
      utm_campaign: cookie?.utm_campaign || '',
      referrer: document.referrer || '',
      landing_page: cookie?.landingPage || '',
      session_duration: durationSeconds,
      pages_viewed: session.pagesViewed,
    };
  }, []);

  return { getTrackingData };
}
