import { createClient } from '@/app/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard/orders'
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const access_token = requestUrl.searchParams.get('access_token')
  const refresh_token = requestUrl.searchParams.get('refresh_token')

  // Extract email from the URL if present (we'll add this to the magic link URL)
  const email = requestUrl.searchParams.get('email')

  console.log('Auth callback received:', {
    code: code ? 'present' : 'missing',
    token_hash: token_hash ? 'present' : 'missing',
    access_token: access_token ? 'present' : 'missing',
    refresh_token: refresh_token ? 'present' : 'missing',
    type,
    error,
    next,
    email: email || 'not provided'
  })

  // Create a response object that we'll modify and return
  const response = NextResponse.redirect(new URL(next, requestUrl.origin), { 
    status: 303 
  })

  // Create a server-side Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // If there's an error in the URL parameters, redirect to sign-in with the error message
  if (error) {
    const errorMessage = error_description || 'Authentication error'
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(errorMessage)}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
      { status: 303 }
    )
  }

  try {
    // Handle token hash verification (for email OTP)
    if (token_hash && type) {
      console.log('Verifying OTP token...')
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as EmailOtpType,
      })

      if (error) {
        console.error('Error verifying OTP:', error.message)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent('Invalid or expired verification code')}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
          { status: 303 }
        )
      }

      console.log('OTP verification successful')
    }
    // Handle code exchange (for OAuth and magic links)
    else if (code) {
      console.log('Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging code for session:', error.message)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent('Invalid or expired login link')}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
          { status: 303 }
        )
      }

      console.log('Session exchange successful')
    }
    // Handle direct token auth (for hash fragment redirects)
    else if (access_token && refresh_token) {
      console.log('Setting session from tokens...')
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token
      })

      if (error) {
        console.error('Error setting session from tokens:', error.message)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent('Invalid authentication tokens')}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
          { status: 303 }
        )
      }

      console.log('Session set from tokens successfully')
    }

    // Get the user to verify authentication worked
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log('Authentication successful, user found:', user.id)
      
      // Set cookies to help with client-side detection
      response.cookies.set('auth_callback_completed', 'true', {
        path: '/',
        maxAge: 60 * 60, // 1 hour
        httpOnly: false, // Make it accessible from JavaScript
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })

      // Add a script to set localStorage values
      const htmlWithScript = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <meta http-equiv="refresh" content="1;url=${next}">
        </head>
        <body>
          <p>Authentication successful. Redirecting...</p>
          <script>
            console.log('Auth callback script executing...');
            localStorage.setItem('auth_callback_completed', 'true');
            localStorage.setItem('auth_timestamp', '${Date.now()}');
            
            // Store the email with multiple fallbacks
            const userEmail = ${user.email ? `'${user.email}'` : 'null'};
            const urlEmail = ${email ? `'${email}'` : 'null'};
            const emailToStore = userEmail || urlEmail || localStorage.getItem('auth_email_temp');
            
            if (emailToStore) {
              localStorage.setItem('auth_email', emailToStore);
              localStorage.setItem('auth_email_temp', emailToStore);
              console.log('Auth email stored:', emailToStore);
            }
            
            // Redirect with auth flag to help client detection
            setTimeout(() => {
              window.location.href = '${next}?auth_success=true';
            }, 500);
          </script>
        </body>
        </html>
      `;
      
      return new NextResponse(htmlWithScript, {
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      console.error('Authentication failed: No user found after auth flow')
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('Authentication failed')}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
        { status: 303 }
      )
    }
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent('An unexpected error occurred')}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
      { status: 303 }
    )
  }
}
