import { createClient } from '@/app/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { EmailOtpType } from '@supabase/supabase-js';

/**
 * Route handler for verifying authentication tokens
 * This is used when a user clicks on a magic link
 */
export async function GET(request: NextRequest) {
  try {
    // Get the token hash and type from the URL
    const { searchParams } = new URL(request.url);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next') || '/dashboard/orders';
    const email = searchParams.get('email');

    console.log('Auth verify route called with:', {
      tokenHash: tokenHash ? 'present' : 'missing',
      type,
      next,
      email: email || 'not provided'
    });

    if (!tokenHash || !type) {
      console.error('Missing token_hash or type');
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Create a Supabase client
    const supabase = await createClient();

    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      return NextResponse.redirect(new URL('/auth/signin?error=verification_failed', request.url));
    }

    console.log('OTP verified successfully:', {
      user: data.user ? 'present' : 'missing',
      session: data.session ? 'present' : 'missing'
    });

    // Create a response with HTML that sets localStorage values and redirects
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        </head>
        <body>
          <h1>Authentication Successful</h1>
          <p>You are being redirected...</p>
          
          <script>
            // Store authentication information in localStorage
            localStorage.setItem('auth_completed', 'true');
            localStorage.setItem('auth_timestamp', '${Date.now()}');
            ${data.user?.id ? `localStorage.setItem('auth_user_id', '${data.user.id}');` : ''}
            ${data.user?.email ? `localStorage.setItem('auth_email', '${data.user.email}');` : ''}
            ${data.user?.email ? `localStorage.setItem('auth_email_temp', '${data.user.email}');` : ''}
            ${email ? `localStorage.setItem('auth_email', '${email}');` : ''}
            ${email ? `localStorage.setItem('auth_email_temp', '${email}');` : ''}
            
            console.log('Auth localStorage values set');
            
            // Redirect to the specified page
            window.location.href = '${next}';
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error in auth/verify route:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=server_error', request.url));
  }
}
