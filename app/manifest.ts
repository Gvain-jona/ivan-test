import type { MetadataRoute } from 'next';

/**
 * Web app manifest (served by Next at /manifest.webmanifest).
 *
 * PWA-lite: makes the app installable — the prerequisite for Web Push on iOS
 * (a Safari tab gets no push; an installed PWA does, iOS 16.4+). No offline
 * behaviour lives here; see docs/v2-migration/NOTIFICATIONS_REBUILD.md §14.
 *
 * Colours are neutral on purpose: the manifest is per-origin and static, while
 * the org brand colour is per-tenant and applied in-app (brand tokens). So the
 * install icon / theme are a neutral product mark, not any one tenant's brand.
 */
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'YOKO Business Management',
    short_name: 'YOKO',
    description: 'Business management for print shops — orders, clients, payments.',
    start_url: '/dashboard/orders',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#18181B',
    theme_color: '#18181B',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
