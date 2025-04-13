import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard/orders'
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')

  console.log('Callback params:', { code: code ? 'present' : 'none', token: token ? 'present' : 'none', type })

  if (!code && !token) {
    console.error('No code or token found in callback')
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent('Authentication failed - no code or token found')}`
    )
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    if (token && type === 'magiclink') {
      console.log('Processing magic link token')
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'magiclink'
      })

      if (error) throw error
      if (!data.session) throw new Error('No session from magic link verification')

      console.log('Magic link verified, redirecting with token')
      const response = NextResponse.redirect(`${requestUrl.origin}?token=${token}&type=${type}`)

      // Set auth cookies
      response.cookies.set('auth_token', token, {
        path: '/',
        maxAge: 60 * 60, // 1 hour
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })

      response.cookies.set('auth_type', type, {
        path: '/',
        maxAge: 60 * 60,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })

      return response
    }

    if (code) {
      console.log('Processing PKCE code')
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    }

    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`
    )
  }
}
