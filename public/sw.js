/* ── Empire 8 Service Worker ──────────────────────────────────────────
 * Handles:
 * 1. App shell caching for offline-first PWA
 * 2. Push notification display
 * 3. Notification click routing
 * ───────────────────────────────────────────────────────────────────── */

const CACHE_NAME = 'empire8-app-shell-v1';

const APP_SHELL_URLS = [
  '/',
  '/dashboard',
  '/brand-dashboard',
  '/marketplace',
];

/* ── Install: pre-cache the app shell ────────────────────────────── */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: clean up old caches ───────────────────────────────── */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: network-first with cache fallback ────────────────────── */

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only cache GET requests for navigation (HTML pages)
  if (request.method !== 'GET') return;

  // Skip API calls, analytics, and external resources
  const url = new URL(request.url);
  if (
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful navigation responses
        if (response.ok && request.mode === 'navigate') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache for navigation requests
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // If no cache match for a navigation, return cached index
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

/* ── Push: display notification ──────────────────────────────────── */

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'Empire 8',
      body: event.data.text(),
      url: '/dashboard',
    };
  }

  const { title, body, url, tag, icon } = payload;

  const options = {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: tag || 'empire8-notification',
    data: { url: url || '/dashboard' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title || 'Empire 8', options));
});

/* ── Notification click: route to relevant page ──────────────────── */

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If a window is already open, focus it and navigate
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});
