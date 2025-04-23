'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  type User,
  type AuthError,
  type AuthChangeEvent,
  type Session
} from '@supabase/supabase-js';
import {
  getCurrentUser,
  getRedirectPath,
  signOut as signOutUtil,
  getAuthCallbackUrl,
  getBaseUrl
} from '@/app/lib/auth/session-utils';
import {
  type Profile,
  getOrCreateProfile
} from '@/app/lib/auth/profile-utils';

// For prefetching data
let prefetchTriggered = false;

type AuthContextType = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  profileError: boolean
  signIn: (email: string, redirectTo?: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  isAdmin: boolean
  isManager: boolean
  isStaff: boolean
  checkSupabaseHealth: () => Promise<{ ok: boolean; error?: Error | AuthError }>
  refreshProfile?: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a single Supabase client instance to avoid multiple GoTrueClient instances
const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<boolean>(false)
  const router = useRouter()

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager'
  const isStaff = profile?.role === 'staff'

  // Try to load cached profile data from localStorage
  const loadCachedProfile = () => {
    try {
      const cachedProfileData = localStorage.getItem('cached_user_profile')
      if (cachedProfileData) {
        const { profile: cachedProfile, timestamp } = JSON.parse(cachedProfileData)
        const cacheAge = Date.now() - timestamp

        // Use cache if it's less than 1 hour old
        if (cacheAge < 3600000 && cachedProfile) {
          console.log('Using cached profile data:', cachedProfile)
          setProfile(cachedProfile)
          return true
        } else {
          console.log('Cached profile data expired or invalid:', { cacheAge, cachedProfile })
        }
      } else {
        console.log('No cached profile data found in localStorage')
      }
    } catch (e) {
      // Ignore localStorage errors
      console.error('Error loading cached profile:', e)
    }
    return false
  }

  // Save profile data to localStorage
  const cacheProfileData = (profileData: Profile) => {
    try {
      localStorage.setItem('cached_user_profile', JSON.stringify({
        profile: profileData,
        timestamp: Date.now()
      }))
    } catch (e) {
      // Ignore localStorage errors
      console.log('Error caching profile:', e)
    }
  }

  // Fetch profile with retry logic
  const fetchProfileWithRetry = async (currentUser: User, retryCount = 0) => {
    try {
      console.log(`Attempting to fetch profile (attempt ${retryCount + 1})...`, { userId: currentUser.id, email: currentUser.email })
      const { profile: userProfile, error } = await getOrCreateProfile(currentUser)

      if (userProfile) {
        console.log('Profile fetched successfully:', userProfile)
        setProfile(userProfile)
        cacheProfileData(userProfile)
        setProfileError(false)
      } else {
        console.error('No profile returned from getOrCreateProfile:', { error })
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
          console.log(`No profile found, retrying in ${delay}ms...`)

          setTimeout(() => {
            fetchProfileWithRetry(currentUser, retryCount + 1)
          }, delay)
        } else {
          console.error('Failed to fetch profile after maximum retries')
          setProfileError(true)
        }
      }
    } catch (profileError) {
      console.error('Exception in fetchProfileWithRetry:', profileError)

      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`Retrying profile fetch in ${delay}ms...`)

        setTimeout(() => {
          fetchProfileWithRetry(currentUser, retryCount + 1)
        }, delay)
      } else {
        console.error('Failed to fetch profile after maximum retries')
        setProfileError(true)
      }
    } finally {
      // Ensure loading state is turned off after first attempt
      if (retryCount === 0) {
        setIsLoading(false)
      }
    }
  }

  // Function to trigger data prefetch
  const triggerPrefetch = () => {
    // Only trigger prefetch once
    if (prefetchTriggered) return;
    prefetchTriggered = true;

    // Use a small delay to avoid blocking the main thread
    setTimeout(() => {
      // Dispatch a custom event that GlobalDropdownCache can listen for
      const prefetchEvent = new CustomEvent('prefetch-app-data');
      window.dispatchEvent(prefetchEvent);
      console.log('Triggered data prefetch');
    }, 100);
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state changed:', event)
      console.log('Session present:', !!session)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user)

          // Try to use cached profile first
          const usedCache = loadCachedProfile()

          // Fetch profile for the user in the background
          fetchProfileWithRetry(session.user)

          // Trigger data prefetch as early as possible
          triggerPrefetch();

          // Get the redirect path and navigate
          const searchParams = new URLSearchParams(window.location.search)
          const redirect = getRedirectPath(searchParams)
          router.push(redirect)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, cleaning up...')
        setUser(null)
        setProfile(null)

        // Reset prefetch flag
        prefetchTriggered = false;

        // Redirect to signin
        router.push('/auth/signin')
      }
    })



    // Check for existing session on load
    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // In development mode, we can create a mock user and profile
        const isDevelopment = process.env.NODE_ENV === 'development';

        // Get current user from Supabase
        const currentUser = await getCurrentUser()

        if (currentUser) {
          console.log('Found existing user:', currentUser.email)
          setUser(currentUser)

          // Try to use cached profile first
          const usedCache = loadCachedProfile()

          // Fetch profile for the user in the background
          fetchProfileWithRetry(currentUser)

          // Trigger data prefetch as early as possible
          triggerPrefetch();

          // If we have cached data, we can stop loading immediately
          if (usedCache) {
            setIsLoading(false)
          }
        } else if (isDevelopment) {
          // In development mode, create a mock user and profile
          console.log('No user found, but in development mode - creating mock user')

          // Create a mock user
          const mockUser = {
            id: 'dev-user-id',
            email: 'dev@example.com',
            user_metadata: { full_name: 'Development User' }
          } as User;

          // Create a mock profile
          const mockProfile = {
            id: 'dev-user-id',
            email: 'dev@example.com',
            full_name: 'Development User',
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Profile;

          setUser(mockUser);
          setProfile(mockProfile);
          setIsLoading(false);

          // Trigger data prefetch
          triggerPrefetch();
        } else {
          console.log('No user found')
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setIsLoading(false)
      }
    }

    initializeAuth()

    return () => {
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getBaseUrl()}/auth/callback`
        }
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception in signInWithGoogle:', error);
      return { success: false, error };
    }
  };

  const signIn = async (email: string, customRedirect?: string) => {
    try {
      console.log('Sign in:', email)

      // Get the environment-aware base URL
      // Force HTTP for local development to avoid SSL errors
      const baseUrl = getBaseUrl().replace('https://', 'http://');

      // Determine where to redirect after authentication
      const redirectPath = customRedirect || '/dashboard/orders';

      console.log('Sign in config:', {
        email,
        baseUrl,
        redirectPath
      });

      // Use Supabase's recommended approach for OTP authentication
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // This redirects to our auth/confirm route which handles the token verification
          emailRedirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error('Error signing in:', error)
        setError(error.message)
        return { success: false, error }
      }

      // Store email temporarily to show on check-email page
      try {
        localStorage.setItem('auth_email', email)
      } catch (e) {
        // Ignore localStorage errors
      }

      return { success: true }
    } catch (error) {
      console.error('Exception in signIn:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
      return { success: false, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out user:', { 
        id: user?.id, 
        email: user?.email, 
        provider: user?.app_metadata?.provider 
      });

      // Clear profile state first
      setProfile(null);
      setUser(null);

      // Then sign out from Supabase
      const result = await signOutUtil();

      if (!result.success) {
        throw result.error || new Error('Failed to sign out');
      }

      // Force a router refresh to ensure all authenticated data is cleared
      router.refresh();

      // Redirect to sign-in
      router.push('/auth/signin');

      console.log('Successfully signed out');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign out'
      };
    }
  }

  const checkSupabaseHealth = async () => {
    try {
      console.log('Checking Supabase health')
      const { data, error } = await supabase.from('profiles').select('count').limit(1).maybeSingle()
      if (error) {
        console.error('Health check failed:', error)
        return { ok: false, error }
      }
      return { ok: true }
    } catch (error) {
      console.error('Health check exception:', error)
      return { ok: false, error: error instanceof Error ? error : new Error('Health check failed') }
    }
  }

  const value = {
    user,
    profile,
    isLoading,
    profileError,
    signIn,
    signInWithGoogle,
    signOut,
    isAdmin,
    isManager,
    isStaff,
    checkSupabaseHealth,
    refreshProfile: user ? () => fetchProfileWithRetry(user) : undefined
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