import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware - No Authentication Required
 *
 * This middleware simply redirects the root path, dashboard path, and any auth-related paths to the dashboard/orders page.
 * No authentication checks are performed - all users have direct access to the dashboard.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect root to dashboard orders
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard/orders', request.url))
  }

  // Redirect /dashboard to dashboard/orders
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/orders', request.url))
  }

  // Redirect any auth routes to dashboard orders (auth has been removed)
  if (pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard/orders', request.url))
  }

  // Allow access to all other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};