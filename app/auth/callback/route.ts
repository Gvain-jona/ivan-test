import { createClient } from '@/app/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard/orders'
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  // Extract email from the URL if present (we'll add this to the magic link URL)
  const email = requestUrl.searchParams.get('email')

  console.log('Auth callback received:', {
    code: code ? 'present' : 'missing',
    token_hash: token_hash ? 'present' : 'missing',
    type,
    error,
    next,
    email: email || 'not provided'
  })

  // If we have a token_hash and type, redirect to the verify endpoint
  if (token_hash && type) {
    console.log('Redirecting to verify endpoint...')
    const verifyUrl = new URL('/auth/verify', requestUrl.origin)
    verifyUrl.searchParams.set('token_hash', token_hash)
    verifyUrl.searchParams.set('type', type)
    verifyUrl.searchParams.set('next', next)
    if (email) {
      verifyUrl.searchParams.set('email', email)
    }
    return NextResponse.redirect(verifyUrl)
  }

  // Default redirect path
  let redirectPath = next

  // If there's an error in the URL parameters, redirect to sign-in with the error message
  if (error) {
    const errorMessage = error_description || 'Authentication error'
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(errorMessage)}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
      { status: 303 }
    )
  }

  // If we have a code, exchange it for a session
  if (code) {
    try {
      const supabase = await createClient()

      console.log('Exchanging code for session...')
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (data) {
        console.log('Session exchange successful:', {
          user: data.user ? 'present' : 'missing',
          session: data.session ? 'present' : 'missing',
          email: data.user?.email || email || 'not available'
        })

        // Add a script to set localStorage as another fallback mechanism
        // This ensures we have multiple ways to detect a successful authentication
        const script = `
          <script>
            // CRITICAL: Set these values immediately before any other code runs
            console.log('Auth callback script executing...');

            // Always set these authentication indicators
            localStorage.setItem('auth_callback_completed', 'true');
            localStorage.setItem('auth_timestamp', '${Date.now()}');

            // Set the email with multiple fallbacks to ensure it's available
            const userEmail = ${data.user?.email ? `'${data.user.email}'` : 'null'};
            const urlEmail = ${email ? `'${email}'` : 'null'};
            const storedEmail = localStorage.getItem('auth_email_temp');

            // Use the first available email source
            const emailToUse = userEmail || urlEmail || storedEmail;

            if (emailToUse) {
              localStorage.setItem('auth_email', emailToUse);
              localStorage.setItem('auth_email_temp', emailToUse);
              console.log('Auth email set to:', emailToUse);
            } else {
              console.warn('No email available from any source!');
            }

            // Log all authentication-related localStorage values
            console.log('Auth localStorage values:', {
              auth_callback_completed: localStorage.getItem('auth_callback_completed'),
              auth_timestamp: localStorage.getItem('auth_timestamp'),
              auth_email: localStorage.getItem('auth_email'),
              auth_email_temp: localStorage.getItem('auth_email_temp')
            });

            // Redirect to the specified path after a short delay to ensure localStorage is set
            // Add auth_callback=true to the URL to indicate we're coming from a callback
            setTimeout(() => {
              const redirectUrl = '${redirectPath}';
              const separator = redirectUrl.includes('?') ? '&' : '?';
              const finalUrl = redirectUrl + separator + 'auth_callback=true&email=' + encodeURIComponent(emailToUse || '');
              console.log('Redirecting to:', finalUrl);
              window.location.href = finalUrl;
            }, 500);
          </script>
        `;

        // Return an HTML response with the script
        // This will execute the script and then redirect
        return new NextResponse(script, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }

      if (error) {
        console.error('Error exchanging code for session:', error.message)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent('Invalid or expired login link')}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
          { status: 303 }
        )
      }

      if (data?.user) {
        // Check if user has a profile
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') { // No rows returned
            // Create a new profile for the user
            try {
              // Check if the user is in the allowed_emails table and get their role
              const { data: allowedEmail, error: allowedEmailError } = await supabase
                .from('allowed_emails')
                .select('role')
                .eq('email', data.user.email)
                .maybeSingle()

              // Use the role from allowed_emails if available, otherwise default to 'staff'
              const userRole = allowedEmail?.role || 'staff'

              // Profile doesn't exist, create it
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: data.user.email,
                  full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
                  role: userRole, // Use role from allowed_emails
                  status: 'active'
                })

              if (insertError) {
                console.error('Error creating profile:', insertError.message)
              }
            } catch (insertError) {
              console.error('Exception creating profile in callback:', insertError)
            }
          }
        } catch (error) {
          console.error('Exception checking user profile in callback:', error)
        }
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('An unexpected error occurred')}&redirect=${encodeURIComponent(next)}`, requestUrl.origin),
        { status: 303 }
      )
    }
  }

  // Create a response with the redirect
  const origin = requestUrl.origin;
  console.log(`Redirecting to ${redirectPath} with origin ${origin}`);

  // Create the response with the redirect
  const response = NextResponse.redirect(new URL(redirectPath, origin), { status: 303 })

  // Set a cookie to indicate successful authentication
  // This helps with debugging and can be used as a fallback
  response.cookies.set('auth_callback_completed', 'true', {
    path: '/',
    maxAge: 60 * 60, // 1 hour
    httpOnly: false, // Make it accessible from JavaScript
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' // Only secure in production
  })

  // Also set a cookie that will definitely be accessible from JavaScript
  response.cookies.set('auth_completed_js', 'true', {
    path: '/',
    maxAge: 60 * 60, // 1 hour
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  return response
}
