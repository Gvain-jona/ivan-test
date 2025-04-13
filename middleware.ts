import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

/**
 * Middleware - Authentication Required
 *
 * This middleware handles redirects and authentication checks.
 * It ensures that users are directed to the dashboard/orders page by default.
 */

export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl
  
  // Special handling for signin page to prevent loops
  if (pathname === '/auth/signin') {
    // Check if there's a session cookie
    const authCookie = request.cookies.get('sb-auth')?.value
    
    if (authCookie) {
      try {
        // Try to parse the cookie to verify it's a valid session
        const session = JSON.parse(authCookie)
        
        if (session?.access_token) {
          console.log('Root middleware: Found valid session, redirecting from signin page')
          
          // Get the redirect path from query params or default to dashboard
          const url = new URL(request.url)
          const redirectPath = url.searchParams.get('redirect') || '/dashboard/orders'
          
          // Force an immediate redirect with cache-busting headers
          return NextResponse.redirect(new URL(redirectPath, request.url), {
            status: 302,
            headers: {
              'Cache-Control': 'no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          })
        }
      } catch (error) {
        console.error('Root middleware: Error parsing auth cookie:', error)
      }
    }
  }
  
  // For all other routes, use the regular session handling
  return updateSession(request)
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
}
