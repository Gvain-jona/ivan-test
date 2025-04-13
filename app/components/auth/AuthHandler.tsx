'use client';

import { useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';

/**
 * AuthHandler component
 *
 * This component is responsible for handling the authentication flow
 * It runs on the client side and captures authentication information
 * from the URL when the user clicks a magic link
 */
export default function AuthHandler() {
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Create Supabase client
        const supabase = createClient();

        // Check if we have authentication parameters in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthParams = window.location.hash.includes('access_token') ||
                             urlParams.has('code') ||
                             urlParams.has('token') ||
                             urlParams.has('token_hash') ||
                             urlParams.has('type');

        // Check for Supabase auth cookies
        const hasAuthCookie = document.cookie.includes('sb-giwurfpxxktfsdyitgvr-auth-token');

        if (hasAuthParams) {
          console.log('🔑 Auth parameters detected in URL');

          // If we have a token_hash, we need to verify it
          const tokenHash = urlParams.get('token_hash');
          const type = urlParams.get('type');

          if (tokenHash && type) {
            console.log('Token hash detected, verifying OTP...');

            try {
              const { error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: type as any,
              });

              if (error) {
                console.error('Error verifying OTP:', error);
              } else {
                console.log('OTP verified successfully');
              }
            } catch (e) {
              console.error('Exception verifying OTP:', e);
            }
          }

          // Get the current URL
          const url = window.location.href;
          console.log('Current URL:', url);

          // Store the fact that we're processing authentication
          localStorage.setItem('auth_in_progress', 'true');
          localStorage.setItem('auth_timestamp', Date.now().toString());

          // Process the authentication
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting session:', error);
          } else if (data?.session) {
            console.log('Session obtained successfully');

            // Get user information
            const { data: userData } = await supabase.auth.getUser();

            if (userData?.user) {
              console.log('User authenticated:', userData.user.email);

              // Store authentication information in localStorage
              localStorage.setItem('auth_completed', 'true');
              localStorage.setItem('auth_user_id', userData.user.id);

              if (userData.user.email) {
                localStorage.setItem('auth_email', userData.user.email);
                localStorage.setItem('auth_email_temp', userData.user.email);
              }

              // Clear the auth_in_progress flag
              localStorage.removeItem('auth_in_progress');

              // Reload the page to ensure the authentication state is properly recognized
              window.location.href = window.location.origin + '/dashboard/orders';
            }
          }
        } else if (hasAuthCookie) {
          console.log('🍪 Auth cookie detected, checking session...');

          try {
            // We have an auth cookie but no auth params in the URL
            // This could be a returning user with a valid session
            const { data } = await supabase.auth.getSession();

            if (data?.session) {
              console.log('Valid session found from cookie');
              const { data: userData } = await supabase.auth.getUser();

              if (userData?.user) {
                console.log('User found from cookie session:', userData.user.email);

                localStorage.setItem('auth_completed', 'true');
                localStorage.setItem('auth_user_id', userData.user.id);

                if (userData.user.email) {
                  localStorage.setItem('auth_email', userData.user.email);
                  localStorage.setItem('auth_email_temp', userData.user.email);
                }

                // If we're on the signin page, redirect to dashboard
                if (window.location.pathname.includes('/auth/signin')) {
                  console.log('Redirecting from signin to dashboard...');
                  window.location.href = window.location.origin + '/dashboard/orders';
                }
              }
            } else {
              console.log('No valid session found despite having auth cookie');

              // If we're on a protected page but have no valid session, redirect to signin
              if (!window.location.pathname.includes('/auth/')) {
                console.log('Redirecting to signin page due to invalid session...');
                window.location.href = window.location.origin + '/auth/signin';
              }
            }
          } catch (error) {
            console.error('Error checking session from cookie:', error);

            // Clear the invalid cookie by signing out
            try {
              await supabase.auth.signOut();
              console.log('Signed out due to invalid session');

              // If we're on a protected page, redirect to signin
              if (!window.location.pathname.includes('/auth/')) {
                console.log('Redirecting to signin page after signout...');
                window.location.href = window.location.origin + '/auth/signin';
              }
            } catch (signOutError) {
              console.error('Error signing out:', signOutError);
            }
          }
        } else {
          // No auth params in URL and no auth cookie
          // Check if we have a session but no user in localStorage
          const { data } = await supabase.auth.getSession();

          if (data?.session) {
            const { data: userData } = await supabase.auth.getUser();

            if (userData?.user && !localStorage.getItem('auth_email')) {
              console.log('Session found but no user in localStorage, storing user information');

              localStorage.setItem('auth_completed', 'true');
              localStorage.setItem('auth_user_id', userData.user.id);

              if (userData.user.email) {
                localStorage.setItem('auth_email', userData.user.email);
                localStorage.setItem('auth_email_temp', userData.user.email);
              }

              // If we're on the signin page, redirect to dashboard
              if (window.location.pathname.includes('/auth/signin')) {
                console.log('Redirecting from signin to dashboard...');
                window.location.href = window.location.origin + '/dashboard/orders';
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in AuthHandler:', error);
      }
    };

    handleAuth();
  }, []);

  // This component doesn't render anything
  return null;
}
