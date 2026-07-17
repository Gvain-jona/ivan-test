import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Parity with the pre-Clerk gate: everything is protected except the
// auth pages and the health check. /api/cron/* stays non-public here
// (as before); its own CRON_SECRET bearer check is the real gate.
const isPublicRoute = createRouteMatcher(['/auth(.*)', '/api/healthz'])

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
