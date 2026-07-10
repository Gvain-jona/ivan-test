import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getBaseUrl } from '@/app/lib/auth/session-utils'
import { getCodeVerifierCookieName } from '@/app/lib/auth/cookie-utils'
import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function getSameOriginPath(next: string, requestUrl: string): string {
  try {
    const base = new URL(requestUrl)
    const resolved = new URL(next, base)
    if (resolved.origin !== base.origin) return '/dashboard/orders'
    return resolved.pathname + resolved.search
  } catch {
    return '/dashboard/orders'
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') || '/dashboard/orders'

  try {
    const supabase = await createClient()

    if (code && state) {
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      if (sessionError) {
        console.error('OAuth code exchange failed:', sessionError.message)
        return NextResponse.redirect(
          `${getBaseUrl()}/auth/error?error=${encodeURIComponent('Authentication failed')}`
        )
      }
    } else if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash })
      if (error) {
        console.error('OTP verification failed:', error.message)
        return NextResponse.redirect(
          `${getBaseUrl()}/auth/error?error=${encodeURIComponent(error.message)}`
        )
      }
    } else if (code) {
      const cookieStore = await cookies()
      const codeVerifier = cookieStore.get(getCodeVerifierCookieName())?.value

      if (!codeVerifier) {
        console.error('Auth callback: code verifier cookie missing')
        return NextResponse.redirect(
          `${getBaseUrl()}/auth/error?error=${encodeURIComponent('Authentication session expired. Please try signing in again.')}`
        )
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Code exchange failed:', error.message)
        return NextResponse.redirect(
          `${getBaseUrl()}/auth/error?error=${encodeURIComponent(error.message)}`
        )
      }
    } else {
      console.error('Auth callback: no valid auth parameters')
      return NextResponse.redirect(
        `${getBaseUrl()}/auth/error?error=${encodeURIComponent('Invalid authentication link')}`
      )
    }

  } catch (error) {
    console.error('Auth callback exception:', error instanceof Error ? error.message : error)
    return NextResponse.redirect(
      `${getBaseUrl()}/auth/error?error=${encodeURIComponent('An unexpected error occurred')}`
    )
  }

  // Redirect on success OUTSIDE the try/catch. redirect() throws a NEXT_REDIRECT signal as
  // its control-flow mechanism; if called inside the try, the catch above swallows it and
  // converts every successful sign-in into an /auth/error redirect.
  const safePath = getSameOriginPath(next, request.url)
  redirect(`${getBaseUrl()}${safePath}`)
}
