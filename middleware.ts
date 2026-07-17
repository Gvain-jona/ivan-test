import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Parity with the pre-Clerk gate: everything is protected except the
// auth pages and the health check. /api/cron/* stays non-public here
// (as before); its own CRON_SECRET bearer check is the real gate.
// /__clerk is Clerk's frontend-API auto-proxy path — never protect it
// (proxy requests are intercepted before this handler when the proxy
// is enabled, but keep it public-safe regardless).
const isPublicRoute = createRouteMatcher(['/auth(.*)', '/api/healthz', '/__clerk(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
}
