import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware - Authentication Required
 *
 * This middleware handles redirects and authentication checks.
 * It ensures that users are directed to the dashboard/orders page by default.
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle root path redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard/orders', request.url))
  }

  // Redirect dashboard/home to dashboard/orders
  if (pathname === '/dashboard/home') {
    return NextResponse.redirect(new URL('/dashboard/orders', request.url))
  }

  // Redirect /dashboard to dashboard/orders
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/orders', request.url))
  }

  // Handle auth routes
  if (pathname.startsWith('/auth')) {
    // If user is already authenticated and has verified PIN, redirect to dashboard
    // This prevents authenticated users from accessing auth pages unnecessarily
    // Look for any Supabase auth cookie (they start with 'sb-')
    const authCookie = Array.from(request.cookies.getAll())
      .find(cookie => cookie.name.startsWith('sb-'))

    const pinVerified = request.cookies.get('pin_verified')?.value === 'true'

    console.log('Middleware - Auth route:', pathname)
    console.log('Middleware - Auth cookies:', Array.from(request.cookies.getAll())
      .filter(cookie => cookie.name.startsWith('sb-'))
      .map(cookie => cookie.name))
    console.log('Middleware - Auth cookie present:', !!authCookie, 'Cookie name:', authCookie?.name)
    console.log('Middleware - PIN verified:', pinVerified)

    // Allow access to callback route for magic link processing
    if (pathname === '/auth/callback') {
      console.log('Middleware - Allowing access to callback route')
      return NextResponse.next()
    }

    // If user is authenticated and has verified PIN, redirect to dashboard
    if (authCookie && pinVerified &&
        (pathname === '/auth/signin' || pathname === '/auth/setup-pin' || pathname === '/auth/verify-pin')) {
      return NextResponse.redirect(new URL('/dashboard/orders', request.url))
    }

    // If user is authenticated but hasn't verified PIN, allow access to PIN pages but redirect from signin
    if (authCookie && !pinVerified) {
      if (pathname === '/auth/signin') {
        // Check if user has a PIN set up
        // For now, we'll redirect to verify-pin and let that page handle the logic
        return NextResponse.redirect(new URL('/auth/verify-pin', request.url))
      }
    }

    // Allow access to all other auth routes
    return NextResponse.next()
  }

  // Check for authentication cookie
  // Look for any Supabase auth cookie (they start with 'sb-')
  const authCookie = Array.from(request.cookies.getAll())
    .find(cookie => cookie.name.startsWith('sb-'))

  console.log('Middleware - Auth cookies for protected route:', Array.from(request.cookies.getAll())
    .filter(cookie => cookie.name.startsWith('sb-'))
    .map(cookie => cookie.name))
  console.log('Middleware - Auth cookie for protected route:', !!authCookie, 'Cookie name:', authCookie?.name)

  // If no auth cookie, redirect to sign in
  if (!authCookie && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Check for PIN verification cookie for dashboard routes
  if (pathname.startsWith('/dashboard') && authCookie) {
    const pinVerified = request.cookies.get('pin_verified')?.value === 'true'

    if (!pinVerified) {
      // Redirect to PIN verification page
      return NextResponse.redirect(new URL(`/auth/verify-pin?redirect=${encodeURIComponent(pathname)}`, request.url))
    }
  }

  // Allow access to all other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
