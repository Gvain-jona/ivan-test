import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard/orders'
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle errors first
  if (error) {
    console.error('Auth error:', error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error_description || error)}`
    )
  }

  // No code, check for hash fragment
  if (!code) {
    // Redirect to client-side handler for hash fragments
    return NextResponse.redirect(`${requestUrl.origin}/auth/hash-callback${requestUrl.hash || ''}`)
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error

    if (!session) {
      throw new Error('No session from code exchange')
    }

    // Set auth cookie for middleware
    const response = NextResponse.redirect(`${requestUrl.origin}${next}`)
    response.cookies.set('sb-auth', session.access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    return response
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`
    )
  }
}
