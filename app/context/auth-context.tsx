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

type AuthContextType = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, redirectTo?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  isAdmin: boolean
  isManager: boolean
  isStaff: boolean
  checkSupabaseHealth: () => Promise<{ ok: boolean; error?: Error | AuthError }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager'
  const isStaff = profile?.role === 'staff'

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state changed:', event)
      console.log('Session present:', !!session)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user)
          
          try {
            // Fetch or create profile
            const { profile: userProfile } = await getOrCreateProfile(session.user)
            if (userProfile) {
              setProfile(userProfile)
            }
          } catch (error) {
            console.error('Error handling profile:', error)
          }

          // Get the redirect path and navigate
          const searchParams = new URLSearchParams(window.location.search)
          const redirect = getRedirectPath(searchParams)
          router.push(redirect)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, cleaning up...')
        setUser(null)
        setProfile(null)
        
        // Redirect to signin
        router.push('/auth/signin')
      }
    })

    // Check for existing session on load
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        
        // Get current user from Supabase
        const currentUser = await getCurrentUser()
        
        if (currentUser) {
          console.log('Found existing user:', currentUser.email)
          setUser(currentUser)
          
          // Fetch profile for the user
          try {
            const { profile: userProfile } = await getOrCreateProfile(currentUser)
            if (userProfile) {
              setProfile(userProfile)
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError)
          }
        } else {
          console.log('No user found')
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    return () => {
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [supabase, router])

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
      console.log('Signing out')
      const result = await signOutUtil()
      console.log('Signed out')
      return result
    } catch (error) {
      console.error('Sign out error:', error)
      throw error instanceof Error ? error : new Error('Failed to sign out')
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
    signIn,
    signOut,
    isAdmin,
    isManager,
    isStaff,
    checkSupabaseHealth,
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