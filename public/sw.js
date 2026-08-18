/* YOKO service worker — PWA-lite (installable shell) + Web Push foundation.
 *
 * Deliberately NO offline caching. App Router serves hashed chunks, and SW
 * caching of them is a classic footgun (stale caches → broken bundles); it is
 * also unnecessary for the notifications goal. This SW exists to:
 *   (a) satisfy installability so the app can be added to the Home Screen — the
 *       prerequisite for Web Push on iOS, and
 *   (b) host the push / notificationclick handlers the Web Push track will use
 *       once subscriptions exist (they are inert until then).
 * See docs/v2-migration/NOTIFICATIONS_REBUILD.md §14. Do not add caching here
 * without a deliberate offline-PWA decision.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A fetch handler with no respondWith() = normal network, no caching. Its mere
// presence is what makes the app installable in Chromium.
self.addEventListener('fetch', () => {});

// --- Web Push foundation (inert until the Web Push track adds subscriptions) ---

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || 'YOKO';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag,
    data: { url: data.url || '/dashboard/notifications' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || '/dashboard/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
