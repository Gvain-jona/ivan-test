import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware - Authentication Required
 *
 * This middleware handles redirects and authentication checks.
 * It ensures that users are directed to the dashboard/orders page by default.
 */

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  let response = NextResponse.next()

  // Check if this is a magic link verification request
  const { searchParams } = new URL(request.url)
  const hasTokenHash = searchParams.has('token_hash')
  const hasType = searchParams.has('type')

  // If this is a magic link verification, let it pass through without middleware processing
  if (hasTokenHash && hasType) {
    console.log('Middleware: Magic link verification detected, skipping middleware')
    return response
  }

  // Log all cookies for debugging
  const allCookies = request.cookies.getAll();
  console.log('Middleware cookies:', allCookies.map(c => c.name).join(', '));

  // Check for Supabase auth cookies
  const hasAuthCookie = allCookies.some(cookie => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-'));
  console.log('Has Supabase auth cookie:', hasAuthCookie);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        set(name, value, options) {
          // Set cookie on the request and the response
          try {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
            console.log(`Middleware: Set cookie ${name}`);
          } catch (e) {
            console.error(`Middleware: Error setting cookie ${name}:`, e);
          }
        },
        remove(name, options) {
          try {
            request.cookies.delete({
              name,
              ...options,
            })
            response.cookies.delete({
              name,
              ...options,
            })
            console.log(`Middleware: Removed cookie ${name}`);
          } catch (e) {
            console.error(`Middleware: Error removing cookie ${name}:`, e);
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public routes
  const isPublicRoute =
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.');

  // If there's no user and the path isn't public, redirect to login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
