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

        // Also check URL for callback parameter (for cases where the page just loaded from callback)
        const urlParams = new URLSearchParams(window.location.search);
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

        const callbackCompleted = callbackCookie || jsCallbackCookie || localStorageCallback || urlCallback;

        console.log('Auth indicators:', {
          callbackCookie,
          jsCallbackCookie,
          localStorageCallback,
          urlCallback,
          allCookies: document.cookie,
          localStorage: {
            auth_callback_completed: localStorage.getItem('auth_callback_completed'),
            auth_email: localStorage.getItem('auth_email'),
            auth_timestamp: localStorage.getItem('auth_timestamp')
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

        // Check localStorage for email used in recent authentication
        // Try both the regular and temporary email keys
        const lastAuthEmail = localStorage.getItem('auth_email') || localStorage.getItem('auth_email_temp')
        console.log('Last auth email from localStorage:', lastAuthEmail);

        // If we don't have a user but we have the callback cookie or localStorage email, try to refresh or re-authenticate
        if (!user && (callbackCompleted || lastAuthEmail)) {
          console.log('No user found but authentication indicators present, trying to recover session...')

          // First try to get the session
          const { data: sessionData } = await supabase.auth.getSession();
          console.log('Current session:', sessionData.session ? 'present' : 'missing');

          // Then try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError) {
            console.error('Error refreshing session:', refreshError)

            // If refresh fails and we have an email, try to re-authenticate
            if (lastAuthEmail) {
              console.log('Attempting re-authentication with stored email:', lastAuthEmail)

              try {
                // Store the email again to ensure it's available throughout the flow
                localStorage.setItem('auth_email', lastAuthEmail);
                localStorage.setItem('auth_email_temp', lastAuthEmail);

                // Send a new OTP to the user's email
                const { error: signInError } = await supabase.auth.signInWithOtp({
                  email: lastAuthEmail,
                  options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/orders`,
                    shouldCreateUser: true
                  },
                })

                if (signInError) {
                  console.error('Error re-authenticating:', signInError)
                } else {
                  console.log('Re-authentication email sent successfully')
                  // Show a message to the user that a new verification email has been sent
                  // This would be better with a toast notification
                  alert('A new verification email has been sent. Please check your inbox.')
                }
              } catch (e) {
                console.error('Exception during re-authentication:', e)
              }
            }
          } else if (refreshData.user) {
            console.log('Session refreshed successfully, user found')
            setUser(refreshData.user)
            // Continue with the rest of the function using the refreshed user
            user = refreshData.user
          }
        } else {
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
                    return { data: existingProfile, error: null }
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
              const { data, error: tableError } = await supabase
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
                    // Profile already exists on auth change
                    return { data: existingProfile, error: null }
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
      localStorage.setItem('auth_email', email);
      localStorage.setItem('auth_email_temp', email); // Temporary key that won't be overwritten
      localStorage.setItem('auth_timestamp', Date.now().toString());

      console.log('Stored auth email in localStorage:', email);

      // Send OTP
      // Use the app URL directly as the redirect URL
      // Supabase will append the necessary parameters
      const redirectUrl = appUrl;
      console.log('Using redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true
        },
      })

      // Store the timestamp of when the magic link was sent
      // This will help us detect if the user is coming back from a magic link
      localStorage.setItem('magic_link_sent_at', Date.now().toString());
      localStorage.setItem('magic_link_email', email);

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
      return await supabase.auth.signOut()
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
