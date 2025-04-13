'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { type User } from '@supabase/supabase-js'

// Define the profile type based on our database schema
type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'manager' | 'staff'
  status: 'active' | 'inactive' | 'locked'
  created_at: string
  updated_at: string
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, redirectTo?: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isManager: boolean
  isStaff: boolean
  checkSupabaseHealth: () => Promise<{ ok: boolean; error?: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Derived state
  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager'
  const isStaff = profile?.role === 'staff'

  useEffect(() => {
    const getUser = async () => {
      // Initialize auth context and check user session
      setIsLoading(true)
      try {
        console.log('Checking auth state...')

        // CRITICAL: Check for hash fragments in the URL (#access_token=...)
        // This is the key issue mentioned in the memory - magic links redirect to hash fragments
        if (typeof window !== 'undefined' && window.location.hash) {
          console.log('Hash fragment detected in URL, attempting to process...');
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Found access and refresh tokens in hash fragment, setting session manually');
            try {
              // Set the session directly with the tokens
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (error) {
                console.error('Error setting session from hash tokens:', error.message);
              } else {
                console.log('Successfully set session from hash tokens');
                // Clear the hash to prevent token exposure
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                // Set user state
                if (data.user) {
                  setUser(data.user);
                  // Store email for recovery
                  localStorage.setItem('auth_email', data.user.email || '');
                  localStorage.setItem('auth_email_temp', data.user.email || '');
                  localStorage.setItem('auth_callback_completed', 'true');
                }
                
                // No need to continue with other checks
                setIsLoading(false);
                return;
              }
            } catch (tokenError) {
              console.error('Exception setting session from hash tokens:', tokenError);
            }
          }
        }

        // Check for Supabase token in the URL (this indicates we're coming directly from a magic link)
        const urlParams = new URLSearchParams(window.location.search);
        const hasToken = urlParams.has('token') || urlParams.has('access_token') || urlParams.has('refresh_token');

        if (hasToken) {
          console.log('Detected Supabase token in URL - coming from magic link');

          // If we have a token in the URL, we're definitely coming from a magic link
          // Try to get the email from localStorage
          const magicLinkEmail = localStorage.getItem('magic_link_email');

          if (magicLinkEmail) {
            console.log('Using stored email from magic link:', magicLinkEmail);
            localStorage.setItem('auth_email', magicLinkEmail);
            localStorage.setItem('auth_email_temp', magicLinkEmail);
            localStorage.setItem('auth_callback_completed', 'true');
          }
        }

        // Check if we're coming back from a magic link
        // We can detect this by checking if the current timestamp is within a reasonable window
        // of when the magic link was sent (e.g., within 5 minutes)
        const magicLinkSentAt = localStorage.getItem('magic_link_sent_at');
        const magicLinkEmail = localStorage.getItem('magic_link_email');

        if (magicLinkSentAt && magicLinkEmail) {
          const sentTimestamp = parseInt(magicLinkSentAt, 10);
          const currentTimestamp = Date.now();
          const timeDifference = currentTimestamp - sentTimestamp;

          // If the magic link was sent within the last 5 minutes, we're likely coming back from it
          if (timeDifference < 5 * 60 * 1000) { // 5 minutes in milliseconds
            console.log('Detected recent magic link usage for email:', magicLinkEmail);

            // Store the email in our standard locations
            localStorage.setItem('auth_email', magicLinkEmail);
            localStorage.setItem('auth_email_temp', magicLinkEmail);
            localStorage.setItem('auth_callback_completed', 'true');

            // Clear the magic link indicators to prevent false positives on future page loads
            localStorage.removeItem('magic_link_sent_at');
          }
        }

        // Log stored email information for debugging
        const storedEmail = localStorage.getItem('auth_email');
        const storedEmailTemp = localStorage.getItem('auth_email_temp');
        console.log('Stored emails:', { regular: storedEmail, temp: storedEmailTemp });

        // Check if we have a callback cookie indicating successful authentication
        // Check both cookies to ensure we catch the authentication
        const callbackCookie = document.cookie.includes('auth_callback_completed=true');
        const jsCallbackCookie = document.cookie.includes('auth_completed_js=true');
        const localStorageCallback = localStorage.getItem('auth_callback_completed') === 'true';

        // Check for auth_completed flag set by AuthHandler
        const authCompleted = localStorage.getItem('auth_completed') === 'true';

        // Check for Supabase auth token cookie
        const hasSupabaseAuthCookie = document.cookie.includes('sb-giwurfpxxktfsdyitgvr-auth-token');
        console.log('Has Supabase auth cookie:', hasSupabaseAuthCookie);

        // Check if authentication is in progress (set by AuthHandler)
        const authInProgress = localStorage.getItem('auth_in_progress') === 'true';

        // Also check URL for callback parameter (for cases where the page just loaded from callback)
        // Reuse the urlParams from above
        const urlCallback = urlParams.get('auth_callback') === 'true';

        // If we detect we're coming from a callback, set localStorage immediately
        if (urlCallback) {
          console.log('Detected callback parameter in URL, setting localStorage');
          localStorage.setItem('auth_callback_completed', 'true');
          localStorage.setItem('auth_timestamp', Date.now().toString());

          // Try to get email from URL
          const urlEmail = urlParams.get('email');
          if (urlEmail) {
            console.log('Found email in URL:', urlEmail);
            localStorage.setItem('auth_email', urlEmail);
            localStorage.setItem('auth_email_temp', urlEmail);
          }
        }

        const callbackCompleted = callbackCookie || jsCallbackCookie || localStorageCallback || urlCallback || hasSupabaseAuthCookie || authCompleted;

        // If authentication is in progress, don't try to refresh the session
        if (authInProgress) {
          console.log('Authentication is in progress, waiting for completion...');
          return;
        }

        console.log('Auth indicators:', {
          callbackCookie,
          jsCallbackCookie,
          localStorageCallback,
          urlCallback,
          hasSupabaseAuthCookie,
          authCompleted,
          authInProgress,
          allCookies: document.cookie,
          localStorage: {
            auth_callback_completed: localStorage.getItem('auth_callback_completed'),
            auth_completed: localStorage.getItem('auth_completed'),
            auth_in_progress: localStorage.getItem('auth_in_progress'),
            auth_email: localStorage.getItem('auth_email'),
            auth_timestamp: localStorage.getItem('auth_timestamp'),
            auth_user_id: localStorage.getItem('auth_user_id'),
            magic_link_email: localStorage.getItem('magic_link_email'),
            magic_link_sent_at: localStorage.getItem('magic_link_sent_at')
          }
        });

        // Fetch current user from Supabase
        let { data: { user } } = await supabase.auth.getUser()
        console.log('Auth state check result:', user ? 'User found' : 'No user found')

        // If we found a user, make sure to store their email
        if (user?.email) {
          console.log('User found with email:', user.email);
          localStorage.setItem('auth_email', user.email);
          localStorage.setItem('auth_email_temp', user.email);
        }

        // If we still don't have a user, try to recover the session from localStorage
        if (!user) {
          console.log('Auth state check result: No user found');
          
          // Check localStorage for email used in recent authentication
          const storedEmail = localStorage.getItem('auth_email') || localStorage.getItem('auth_email_temp');
          const authCallbackCompleted = localStorage.getItem('auth_callback_completed') === 'true';
          const hasSupabaseAuthCookie = document.cookie.includes('sb-');
          const magicLinkSentAt = localStorage.getItem('magic_link_sent_at');
          
          console.log('Stored emails:', { storedEmail, authCallbackCompleted });
          console.log('Has Supabase auth cookie:', hasSupabaseAuthCookie);
          
          // Collect all indicators that suggest we should be logged in
          const authIndicators = {
            hasStoredEmail: !!storedEmail,
            authCallbackCompleted,
            hasSupabaseAuthCookie,
            hasMagicLinkTimestamp: !!magicLinkSentAt
          };
          console.log('Auth indicators:', authIndicators);
          
          // If we have any indicators that suggest we should be logged in, try to recover the session
          if (authCallbackCompleted || hasSupabaseAuthCookie || storedEmail) {
            console.log('Trying to recover session...');
            
            try {
              // First check if we have a session in localStorage that Supabase isn't detecting
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
              const storageKey = supabaseUrl ? `sb-${supabaseUrl.split('//')[1]}-auth-token` : null;
              
              if (storageKey) {
                try {
                  const sessionStr = localStorage.getItem(storageKey);
                  if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    
                    if (session && session.access_token && session.refresh_token) {
                      console.log('Found session data in localStorage, attempting to restore...');
                      
                      // Try to set the session directly
                      const { data, error } = await supabase.auth.setSession({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token
                      });
                      
                      if (error) {
                        console.error('Error restoring session from localStorage:', error.message);
                      } else if (data.user) {
                        console.log('Successfully restored session from localStorage');
                        setUser(data.user);
                        
                        // Get the user's profile
                        const { data: profileData } = await supabase
                          .from('profiles')
                          .select('*')
                          .eq('id', data.user.id)
                          .single();
                          
                        if (profileData) {
                          setProfile(profileData);
                        }
                        
                        setIsLoading(false);
                        return;
                      }
                    }
                  }
                } catch (e) {
                  console.error('Error parsing session from localStorage:', e);
                }
              }
              
              // Try to refresh the session
              console.log('Trying to refresh session...');
              const { data, error } = await supabase.auth.refreshSession();
              
              if (error) {
                console.error('Error refreshing session:', error.message);
                
                // Only try to re-authenticate if we haven't already tried recently
                // This prevents rate limiting errors (429)
                if (storedEmail && magicLinkSentAt) {
                  const sentAtTimestamp = parseInt(magicLinkSentAt, 10);
                  const now = Date.now();
                  const timeSinceSent = now - sentAtTimestamp;
                  
                  // Only attempt re-auth if it's been more than 60 seconds since the last attempt
                  // This prevents the 429 rate limit error
                  if (timeSinceSent > 60000) {
                    console.log('Attempting re-authentication with stored email:', storedEmail);
                    
                    // Update the timestamp to prevent multiple attempts
                    localStorage.setItem('magic_link_sent_at', Date.now().toString());
                    
                    // Try to sign in again
                    const { error: signInError } = await supabase.auth.signInWithOtp({
                      email: storedEmail,
                      options: {
                        shouldCreateUser: true
                      }
                    });
                    
                    if (signInError) {
                      console.error('Error re-authenticating:', signInError);
                    } else {
                      console.log('Re-authentication initiated successfully');
                    }
                  } else {
                    // Calculate how many seconds until we can try again
                    const secondsToWait = Math.ceil((60000 - timeSinceSent) / 1000);
                    console.log(`Rate limit protection active. Can try again in ${secondsToWait} seconds.`);
                    
                    // If we're not on the sign-in page and not in a callback, redirect to sign-in
                    if (!window.location.pathname.startsWith('/auth/')) {
                      console.log('Redirecting to sign-in page due to rate limit');
                      router.push(`/auth/signin?error=Please+wait+${secondsToWait}+seconds+before+trying+again.`);
                      setIsLoading(false);
                      return;
                    }
                  }
                } else if (storedEmail) {
                  // If we have an email but no timestamp, set the timestamp now
                  localStorage.setItem('magic_link_sent_at', Date.now().toString());
                }
              } else if (data.user) {
                console.log('Session refresh successful');
                setUser(data.user);
                
                // Get the user's profile
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', data.user.id)
                  .single();
                  
                if (profileData) {
                  setProfile(profileData);
                }
                
                setIsLoading(false);
                return;
              }
            } catch (e) {
              console.error('Exception during session recovery:', e);
            }
          }
        }

        // Final fallback: If we still don't have a user but we're on a protected page, redirect to sign-in
        if (!user && !window.location.pathname.startsWith('/auth/')) {
          console.log('No user found after all recovery attempts, redirecting to sign-in');
          
          // Store the current path to redirect back after login
          const currentPath = window.location.pathname;
          localStorage.setItem('auth_redirect_after_signin', currentPath);
          
          // Redirect to sign-in
          router.push('/auth/signin');
        } else if (user) {
          // User fetch result logged
          setUser(user)
        }

        if (user) {
          try {
            // Always try to create a profile if one doesn't exist

            // First check if we can connect to Supabase
            try {
              // Use a simple query to check if we can connect to Supabase
              const { error: healthError } = await supabase
                .from('profiles')
                .select('count')
                .limit(1)
                .maybeSingle()

              // Ignore specific errors that don't prevent authentication
              if (healthError) {
                // Ignore 'no rows returned' error
                if (healthError.code === 'PGRST116') {
                  console.log('No rows returned from profiles table, continuing...')
                }
                // Ignore RLS policy recursion error
                else if (healthError.code === '42P17' && healthError.message?.includes('infinite recursion detected in policy')) {
                  console.error('RLS policy recursion error detected, bypassing profile check')
                  // If there's an RLS policy issue, we'll just continue without a profile
                  setIsLoading(false)
                  return
                }
                else {
                  console.error('Error connecting to Supabase:', healthError)
                  // If we can't connect to Supabase, we'll just continue without a profile
                  setIsLoading(false)
                  return
                }
              }
            } catch (healthError) {
              console.error('Exception connecting to Supabase:', healthError)
              // If we can't connect to Supabase, we'll just continue without a profile
              setIsLoading(false)
              return
            }

            // Then check if the profiles table exists
            try {
              const { data, error: tableError } = await supabase
                .from('profiles')
                .select('count')
                .limit(1)

              if (tableError) {
                console.error('Error checking profiles table:', tableError)
                // If the table doesn't exist, we'll just continue without a profile
                setIsLoading(false)
                return
              }
            } catch (tableError) {
              console.error('Exception checking profiles table:', tableError)
              // If there's an exception, we'll just continue without a profile
              setIsLoading(false)
              return
            }

            // If the table exists, try to fetch the user's profile
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (error) {
              console.error('Error fetching profile:', error)

              // If the profile doesn't exist, we need to create it
              if (error.code === 'PGRST116') { // No rows returned
                console.log('Profile not found, creating new profile for user')

                try {
                  // Create a new profile for the user
                  console.log('Creating new profile for user:', user.id)

                  // First, check if the profile already exists (double-check)
                  const { data: existingProfile, error: checkError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle()

                  if (existingProfile) {
                    console.log('Profile already exists, using existing profile:', existingProfile)
                    setProfile(existingProfile);
                    console.log('Using existing profile:', existingProfile);
                    return;
                  }

                  // Check if the user is in the allowed_emails table and get their role
                  const { data: allowedEmail, error: allowedEmailError } = await supabase
                    .from('allowed_emails')
                    .select('role')
                    .eq('email', user.email)
                    .maybeSingle()

                  // Use the role from allowed_emails if available, otherwise default to 'staff'
                  const userRole = allowedEmail?.role || 'staff'
                  console.log(`Using role from allowed_emails: ${userRole} for user ${user.email}`)

                  // Profile doesn't exist, create it
                  const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: user.id,
                      email: user.email,
                      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                      role: userRole, // Use role from allowed_emails
                      status: 'active'
                    })
                    .select('*')
                    .single()

                  if (insertError) {
                    console.error('Error creating profile:', insertError)
                  } else {
                    console.log('Created new profile:', newProfile)
                    setProfile(newProfile)

                    // No need to redirect to PIN setup anymore
                  }
                } catch (insertError) {
                  console.error('Exception creating profile:', insertError)
                }
              }
            } else {
              setProfile(profile)

              // We no longer use PIN verification, so we don't need to redirect to setup-pin
              // Just set the user as verified if they're not already
              if (profile && !profile.is_verified) {
                try {
                  // Update the profile to mark as verified
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ is_verified: true })
                    .eq('id', profile.id)

                  if (updateError) {
                    console.error('Error updating profile verification status:', updateError)
                  } else {
                    // Update local profile state
                    setProfile({ ...profile, is_verified: true })
                  }
                } catch (updateError) {
                  console.error('Exception updating profile verification:', updateError)
                }
              }
            }
          } catch (profileError) {
            console.error('Exception fetching profile:', profileError)
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Auth state changed event
        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            // Always try to create a profile if one doesn't exist

            // First check if we can connect to Supabase
            try {
              // Use a simple query to check if we can connect to Supabase
              const { error: healthError } = await supabase
                .from('profiles')
                .select('count')
                .limit(1)
                .maybeSingle()

              // Ignore specific errors that don't prevent authentication
              if (healthError) {
                // Ignore 'no rows returned' error
                if (healthError.code === 'PGRST116') {
                  console.log('No rows returned from profiles table in auth change handler, continuing...')
                }
                // Ignore RLS policy recursion error
                else if (healthError.code === '42P17' && healthError.message?.includes('infinite recursion detected in policy')) {
                  console.error('RLS policy recursion error detected in auth change handler, bypassing profile check')
                  return
                }
                else {
                  console.error('Error connecting to Supabase in auth change handler:', healthError)
                  return
                }
              }
            } catch (healthError) {
              console.error('Exception connecting to Supabase in auth change handler:', healthError)
              return
            }

            // Then check if the profiles table exists
            try {
              const { error: tableError } = await supabase
                .from('profiles')
                .select('count')
                .limit(1)

              if (tableError) {
                console.error('Error checking profiles table on auth change:', tableError)
                return
              }
            } catch (tableError) {
              console.error('Exception checking profiles table on auth change:', tableError)
              return
            }

            // If the table exists, try to fetch the user's profile
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) {
              console.error('Error fetching profile on auth change:', error)

              // If the profile doesn't exist, we need to create it
              if (error.code === 'PGRST116') { // No rows returned
                // Profile not found on auth change, creating new profile

                try {
                  // Create a new profile for the user
                  // Creating new profile for user on auth change

                  // First, check if the profile already exists (double-check)
                  const { data: existingProfile, error: checkError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle()

                  if (existingProfile) {
                    console.log('Profile already exists, using existing profile:', existingProfile)
                    setProfile(existingProfile);
                    console.log('Using existing profile:', existingProfile);
                    return;
                  }

                  // Check if the user is in the allowed_emails table and get their role
                  const { data: allowedEmail, error: allowedEmailError } = await supabase
                    .from('allowed_emails')
                    .select('role')
                    .eq('email', session.user.email)
                    .maybeSingle()

                  // Use the role from allowed_emails if available, otherwise default to 'staff'
                  const userRole = allowedEmail?.role || 'staff'
                  console.log(`Using role from allowed_emails: ${userRole} for user ${session.user.email}`)

                  // Profile doesn't exist, create it
                  const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      email: session.user.email,
                      full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                      role: userRole, // Use role from allowed_emails
                      status: 'active'
                    })
                    .select('*')
                    .single()

                  if (insertError) {
                    console.error('Error creating profile on auth change:', insertError)
                  } else {
                    console.log('Created new profile on auth change:', newProfile)
                    setProfile(newProfile)

                    // No need to redirect to PIN setup anymore
                  }
                } catch (insertError) {
                  console.error('Exception creating profile on auth change:', insertError)
                }
              }
            } else {
              setProfile(data)

              // User profile loaded successfully
            }
          } catch (profileError) {
            console.error('Exception fetching profile on auth change:', profileError)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, customRedirect?: string) => {
    try {
      // Use the provided redirect or get it from URL parameters or use default
      const currentPath = window.location.pathname
      const searchParams = new URLSearchParams(window.location.search)
      const redirectTo = customRedirect || searchParams.get('redirect') || '/dashboard/orders'

      // Check if email is allowed (if the function exists)
      try {
        const { data: isAllowed, error: allowedError } = await supabase.rpc('is_email_allowed', {
          input_email: email
        })

        if (!allowedError && !isAllowed) {
          return {
            error: {
              message: 'This email is not authorized to sign in. Please contact an administrator.'
            }
          }
        }
      } catch (rpcError) {
        // Continue with sign-in even if the RPC call fails
        console.log('RPC check skipped:', rpcError)
      }

      console.log(`Signing in with email: ${email}, redirect to: ${redirectTo}`)

      // Always use window.location.origin for client-side redirects
      // This ensures we're using the actual URL the user is accessing
      const appUrl = window.location.origin;
      console.log(`Using app URL for redirect: ${appUrl}`);

      // Store authentication information in localStorage for verification and recovery
      // Store the email in both regular and temporary keys to ensure it's available throughout the flow
      localStorage.setItem('auth_redirect_origin', appUrl);
      localStorage.setItem('auth_timestamp', Date.now().toString());

      // Send OTP
      // Use the app URL directly as the redirect URL
      // Supabase will append the necessary parameters
      const redirectUrl = appUrl;
      console.log('Using redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true // Changed to true to allow creating users who pass the allowed_emails check
        },
      })

      // Store the timestamp of when the magic link was sent
      // This will help us detect if the user is coming back from a magic link
      localStorage.setItem('magic_link_sent_at', Date.now().toString());
      localStorage.setItem('magic_link_email', email);
      localStorage.setItem('auth_email', email);
      localStorage.setItem('auth_email_temp', email);

      // Log the stored values for debugging
      console.log('Stored auth email in localStorage:', email);

      if (error) {
        console.error('Error in signInWithOtp:', error.message)
      }

      return { error }
    } catch (error) {
      console.error('Error signing in:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Health check function to diagnose Supabase connection issues
  const checkSupabaseHealth = async () => {
    // Run Supabase health check
    try {
      // Check if we can connect to Supabase
      const { data, error } = await supabase.from('profiles').select('count').limit(1).maybeSingle()

      if (error) {
        console.error('Supabase health check failed:', error)
        return { ok: false, error }
      }

      // Supabase health check passed
      return { ok: true }
    } catch (error) {
      console.error('Supabase health check exception:', error)
      return { ok: false, error }
    }
  }

  const value = {
    user,
    profile,
    isLoading,
    signIn,
    signOut,
    isAdmin,
    isManager,
    isStaff,
    checkSupabaseHealth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
