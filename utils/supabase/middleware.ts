import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const isAuthPage = requestUrl.pathname.startsWith('/auth')
  const isCallback = requestUrl.pathname === '/auth/callback'

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get auth tokens from cookies
  const accessToken = request.cookies.get('sb-auth-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  // Get auth data from localStorage via cookie
  const authData = request.cookies.get('sb-auth')?.value
  let session = null

  try {
    if (authData) {
      const parsedAuthData = JSON.parse(authData)
      if (parsedAuthData.access_token && parsedAuthData.refresh_token) {
        console.log('Middleware: Found session data in sb-auth cookie')
        session = parsedAuthData
      }
    }
  } catch (error) {
    console.error('Middleware: Error parsing sb-auth cookie:', error)
  }

  console.log('Middleware: Auth check:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasAuthData: !!session,
    path: requestUrl.pathname
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    if (session) {
      // Set the session from localStorage data
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })
    }

    // Get user session
    const { data: { session: serverSession }, error } = await supabase.auth.getSession()

    console.log('Middleware: Session check result:', {
      hasSession: !!serverSession,
      error: error?.message || 'none',
      path: requestUrl.pathname
    })

    // Handle auth pages
    if (isAuthPage) {
      if (serverSession && !isCallback) {
        // If user is signed in and the current path starts with /auth
        // redirect the user to /dashboard/orders
        return NextResponse.redirect(new URL('/dashboard/orders', request.url))
      }
      return response
    }

    // Check auth status for non-auth pages
    if (!serverSession && !isAuthPage) {
      // If user is not signed in and the current path is not /auth,
      // redirect the user to /auth/signin
      const redirectUrl = `${requestUrl.origin}/auth/signin?redirect=${encodeURIComponent(requestUrl.pathname)}`
      return NextResponse.redirect(redirectUrl)
    }

    // If we have a session but not the right cookies, set them
    if (serverSession && (!accessToken || !refreshToken)) {
      response.cookies.set('sb-auth-token', serverSession.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })

      if (serverSession.refresh_token) {
        response.cookies.set('sb-refresh-token', serverSession.refresh_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to signin
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}