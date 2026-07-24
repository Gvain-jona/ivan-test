'use client'

import { createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';

/**
 * Clerk-backed façade over the pre-Clerk `useAuth()` interface, so the
 * dashboard shell (header, loading coordinators, logout button, …)
 * keeps working without touching every consumer.
 *
 * - `user.id` / `profile.id` is the app-internal UUID from Clerk
 *   public_metadata.internal_user_id (same value server routes see via
 *   the session-token claim) — NOT the Clerk `user_…` id. Falls back
 *   to the Clerk id for unprovisioned users (v2 routes 401 for them
 *   anyway).
 * - Legacy `profiles`-table roles are gone with Supabase Auth:
 *   `profile.role` is fixed to 'staff' and `isAdmin`/`isManager` are
 *   false. Legacy admin screens are dark until their v2 cutover; v2
 *   role gates use `orgRole` from `resolveTenant()` server-side.
 *   Deliberately NOT wired to Clerk's client-side org_role either —
 *   that claim is fine for display (see TopHeader's org name/logo),
 *   but authorization must only ever come from the server-resolved
 *   orgRole, never a client-trusted value.
 * - `signIn`/`signInWithGoogle` no longer start a flow here — Clerk's
 *   sign-in page owns that — they just navigate to it.
 */

interface AuthUser {
  id: string
  email?: string
}

interface Profile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  role: 'admin' | 'manager' | 'staff'
  status: 'active'
}

type AuthResult = { success: boolean; error?: string }

type AuthContextType = {
  user: AuthUser | null
  profile: Profile | null
  isLoading: boolean
  profileError: boolean
  signIn: (email: string, redirectTo?: string) => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  isAdmin: boolean
  isManager: boolean
  isStaff: boolean
  checkSupabaseHealth: () => Promise<{ ok: boolean; error?: Error }>
  refreshProfile?: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerk()
  const router = useRouter()

  const value = useMemo<AuthContextType>(() => {
    const internalId =
      (clerkUser?.publicMetadata?.internal_user_id as string | undefined) ?? clerkUser?.id
    const email = clerkUser?.primaryEmailAddress?.emailAddress

    const user: AuthUser | null =
      clerkUser && internalId ? { id: internalId, email } : null

    const profile: Profile | null = user
      ? {
          id: user.id,
          email,
          full_name: clerkUser?.fullName ?? undefined,
          avatar_url: clerkUser?.imageUrl,
          role: 'staff',
          status: 'active',
        }
      : null

    const goToSignIn = async (): Promise<AuthResult> => {
      router.push('/auth/signin')
      return { success: true }
    }

    return {
      user,
      profile,
      isLoading: !isLoaded,
      profileError: false,
      signIn: goToSignIn,
      signInWithGoogle: goToSignIn,
      signOut: async () => {
        try {
          await clerkSignOut({ redirectUrl: '/auth/signin' })
          return { success: true }
        } catch (error) {
          console.error('Sign out error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to sign out',
          }
        }
      },
      isAdmin: false,
      isManager: false,
      isStaff: true,
      checkSupabaseHealth: async () => ({ ok: true }),
      refreshProfile: undefined,
    }
  }, [clerkUser, isLoaded, clerkSignOut, router])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
