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
                  
                  // Get the user's profile
                  try {
                    const { data: profileData } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', data.user.id)
                      .single();
                      
                    if (profileData) {
                      setProfile(profileData);
                    }
                  } catch (profileError) {
                    console.error('Error fetching profile after hash auth:', profileError);
                  }
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

        // Check for auth success flag in URL (this indicates we're coming from a successful auth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth_success') === 'true';
        
        if (authSuccess) {
          console.log('Auth success flag detected in URL, clearing it...');
          // Remove the auth_success parameter from the URL to prevent confusion on refresh
          urlParams.delete('auth_success');
          const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
          window.history.replaceState(null, '', newUrl);
        }

        // Get the user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Session found, getting user...');
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            console.log('User found:', user.email);
            setUser(user);
            
            // Store the email for future use
            if (user.email) {
              localStorage.setItem('auth_email', user.email);
              localStorage.setItem('auth_email_temp', user.email);
            }
            
            // Get the user's profile
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
                
              if (profileData) {
                setProfile(profileData);
              }
            } catch (profileError) {
              console.error('Error fetching profile:', profileError);
            }
          } else {
            console.log('No user found despite having a session');
          }
        } else {
          console.log('No active session found');
          
          // Check if we have indicators that we should be logged in
          const authCallbackCompleted = localStorage.getItem('auth_callback_completed') === 'true';
          const storedEmail = localStorage.getItem('auth_email') || localStorage.getItem('auth_email_temp');
          const hasSupabaseAuthCookie = document.cookie.includes('sb-');
          
          if ((authCallbackCompleted || hasSupabaseAuthCookie) && storedEmail) {
            console.log('Auth indicators found but no session, attempting recovery...');
            
            // Try to refresh the session
            try {
              const { data, error } = await supabase.auth.refreshSession();
              
              if (error) {
                console.error('Error refreshing session:', error.message);
                
                // Check if we should try to re-authenticate
                const magicLinkSentAt = localStorage.getItem('magic_link_sent_at');
                
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
                  }
                } else if (storedEmail) {
                  // If we have an email but no timestamp, set the timestamp now
                  localStorage.setItem('magic_link_sent_at', Date.now().toString());
                }
              } else if (data.user) {
                console.log('Session refresh successful');
                setUser(data.user);
                
                // Get the user's profile
                try {
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                    
                  if (profileData) {
                    setProfile(profileData);
                  }
                } catch (profileError) {
                  console.error('Error fetching profile after refresh:', profileError);
                }
              }
            } catch (e) {
              console.error('Exception during session recovery:', e);
            }
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
            // Get the user's profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profileData) {
              setProfile(profileData)
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
