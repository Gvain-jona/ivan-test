import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const searchParams = requestUrl.searchParams
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle errors first
  if (error) {
    console.error('Auth error:', error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error_description || error)}`
    )
  }

  // No code, redirect to signin
  if (!code) {
    console.error('No code in callback')
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent('No authentication code found')}`
    )
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    console.log('Exchanging code for session...')
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Code exchange error:', error)
      throw error
    }

    if (!session) {
      console.error('No session from code exchange')
      throw new Error('No session from code exchange')
    }

    console.log('Session established, setting cookies...')

    // Set auth cookies
    const response = NextResponse.redirect(`${requestUrl.origin}${next}`)
    
    // Store the full session in the sb-auth cookie (matches localStorage format)
    response.cookies.set('sb-auth', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (session.expires_in || 3600),
      user: session.user,
      token_type: 'bearer'
    }), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    // Also set individual token cookies for middleware
    response.cookies.set('sb-auth-token', session.access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    if (session.refresh_token) {
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
    }

    return response
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`
    )
  }
}
