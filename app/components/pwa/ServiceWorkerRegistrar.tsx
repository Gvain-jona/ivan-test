'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker (public/sw.js) once, on the client.
 *
 * The SW makes the app installable — the prerequisite for Web Push on iOS — and
 * hosts the push handlers the Web Push track will use. It does no offline
 * caching (see docs/v2-migration/NOTIFICATIONS_REBUILD.md §14). Renders nothing.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Register after load so it never competes with first paint.
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
