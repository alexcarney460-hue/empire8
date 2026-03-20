'use client';

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'desktop';

const DISMISS_KEY = 'e8_install_dismissed';
const VIEW_COUNT_KEY = 'e8_page_views';
const MIN_VIEWS = 3;

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/i.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

function trackInstallEvent(action: string, platform: Platform): void {
  try {
    // Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as Record<string, unknown>).gtag?.('event', action, {
        event_category: 'PWA',
        event_label: platform,
      });
    }
    // Meta Pixel
    if (typeof window !== 'undefined' && 'fbq' in window) {
      (window as Record<string, unknown>).fbq?.('trackCustom', `PWA_${action}`, {
        platform,
      });
    }
  } catch {
    // Analytics should never break the app
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');

  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);

    // Increment page view counter
    const views = parseInt(localStorage.getItem(VIEW_COUNT_KEY) ?? '0', 10) + 1;
    localStorage.setItem(VIEW_COUNT_KEY, String(views));

    // Don't show if dismissed or not enough views
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;
    if (views < MIN_VIEWS) return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((navigator as Record<string, unknown>).standalone === true) return;

    // For iOS, show the manual instruction banner directly
    if (detected === 'ios') {
      setVisible(true);
      trackInstallEvent('prompt_shown', detected);
      return;
    }

    // For Android/Desktop, wait for the native beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
      trackInstallEvent('prompt_shown', detected);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Track successful installs via appinstalled event
  useEffect(() => {
    const handler = () => {
      trackInstallEvent('installed', platform);
      setVisible(false);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, [platform]);

  const dismiss = useCallback(() => {
    setClosing(true);
    trackInstallEvent('prompt_dismissed', platform);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      localStorage.setItem(DISMISS_KEY, 'true');
    }, 300);
  }, [platform]);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;

    trackInstallEvent('install_clicked', platform);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      trackInstallEvent('install_accepted', platform);
      setClosing(true);
      setTimeout(() => setVisible(false), 300);
    } else {
      trackInstallEvent('install_rejected', platform);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt, platform]);

  if (!visible) return null;

  const isIOS = platform === 'ios';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        closing ? 'translate-y-full' : 'translate-y-0'
      }`}
      role="banner"
      aria-label="Install application"
    >
      <div
        className="mx-auto max-w-2xl px-4 pb-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="flex items-center gap-4 rounded-2xl px-5 py-4"
          style={{
            background: 'linear-gradient(135deg, var(--color-royal-dark) 0%, var(--color-royal) 100%)',
            boxShadow: '0 -4px 32px rgba(74, 14, 120, 0.35), 0 0 0 1px rgba(200, 162, 60, 0.15)',
            border: '1px solid rgba(200, 162, 60, 0.2)',
          }}
        >
          {/* Icon */}
          <div
            className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(200, 162, 60, 0.15)' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isIOS ? (
                /* Share icon for iOS */
                <>
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </>
              ) : (
                /* Download icon for Android/Desktop */
                <path d="M12 5v14M5 12l7 7 7-7" />
              )}
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1">
            {isIOS ? (
              <p className="text-sm leading-snug text-white/90">
                Install <span className="font-semibold text-white">Empire 8</span>: tap the{' '}
                <span className="inline-block align-middle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 inline">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>{' '}
                Share button, then &quot;Add to Home Screen&quot;
              </p>
            ) : (
              <p className="text-sm leading-snug text-white/90">
                Install <span className="font-semibold text-white">Empire 8</span> for quick access
                to orders, lots, and updates
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white/90"
            >
              {isIOS ? 'Got it' : 'Not now'}
            </button>
            {!isIOS && (
              <button
                onClick={install}
                className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-hover) 100%)',
                  color: 'var(--color-charcoal)',
                  boxShadow: '0 2px 8px rgba(200, 162, 60, 0.3)',
                }}
              >
                Install
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
