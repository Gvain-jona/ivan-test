# Supabase Auth Migration Plan

This document outlines the plan to clean up the old authentication system and implement a fully Supabase OTP-based login without PIN verification.

## Current State Analysis

The current authentication system uses:

1. **Supabase Auth** for basic authentication
2. **Custom PIN Verification** as an additional security layer
3. **Profiles Table** that extends Supabase Auth users with additional fields
4. **Custom Session Management** using cookies and localStorage

The system currently has these components:

1. **Auth Context** (`app/context/auth-context.tsx`) - Manages authentication state and provides auth functions
2. **Middleware** (`middleware.ts`) - Handles authentication checks and redirects
3. **PIN Pages**:
   - `app/auth/setup-pin/page.tsx` - For setting up a PIN
   - `app/auth/verify-pin/page.tsx` - For verifying a PIN
4. **Auth Callback** (`app/auth/callback/route.ts`) - Handles magic link callbacks
5. **Database Schema** - Includes PIN-related fields and functions

## Migration Plan

### 1. Files to Remove

1. **PIN Verification Pages**:
   - `app/auth/setup-pin/page.tsx`
   - `app/auth/verify-pin/page.tsx`
   - `app/auth/forgot-pin/page.tsx` (if exists)

2. **Test Auth Pages**:
   - `app/auth-test/` directory (if exists)
   - `app/auth/test-supabase/` directory

### 2. Files to Modify

1. **Auth Context** (`app/context/auth-context.tsx`):
   - Remove PIN-related functions and state
   - Simplify session management
   - Focus on standard Supabase Auth

2. **Middleware** (`middleware.ts`):
   - Simplify to use standard Supabase Auth
   - Update redirect paths

3. **Auth Callback** (`app/auth/callback/route.ts`):
   - Remove PIN-related checks
   - Simplify redirect logic

4. **Database Schema**:
   - Create a new migration to remove PIN-related fields and functions

### 3. Detailed Implementation Steps

#### 3.1. Create New Database Migration

Create a new migration file in `supabase/migrations/` to:

1. Remove PIN-related fields from the profiles table
2. Drop PIN-related functions
3. Update the handle_new_user function

```sql
-- Migration: Remove PIN Verification
-- This migration removes PIN-related fields and functions

-- Create a backup of the current profiles table
CREATE TABLE IF NOT EXISTS profiles_backup AS
SELECT * FROM profiles;

-- Remove PIN-related columns from profiles table
ALTER TABLE profiles
DROP COLUMN IF EXISTS pin,
DROP COLUMN IF EXISTS verification_code,
DROP COLUMN IF EXISTS code_expiry,
DROP COLUMN IF EXISTS is_verified,
DROP COLUMN IF EXISTS failed_attempts;

-- Drop PIN-related functions
DROP FUNCTION IF EXISTS hash_pin(TEXT);
DROP FUNCTION IF EXISTS verify_pin(UUID, TEXT);
DROP FUNCTION IF EXISTS reset_user_pin(UUID);

-- Update the handle_new_user function to simplify profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is in the allowed_emails table
  IF EXISTS (SELECT 1 FROM allowed_emails WHERE email = NEW.email) THEN
    -- Insert with the role from allowed_emails
    INSERT INTO profiles (id, email, full_name, role, status)
    SELECT 
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      role, 
      'active'
    FROM allowed_emails 
    WHERE email = NEW.email;
  ELSE
    -- Insert with default role
    INSERT INTO profiles (id, email, full_name, role, status)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      'staff', 
      'active'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3.2. Update Auth Context

Simplify the auth context to focus on standard Supabase Auth:

```typescript
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
  signIn: (email: string) => Promise<{ error: any | null }>
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
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (error) {
              console.error('Error fetching profile:', error)
            } else {
              setProfile(profile)
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) {
              console.error('Error fetching profile on auth change:', error)
            } else {
              setProfile(data)
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
  }, [])

  const signIn = async (email: string) => {
    try {
      // Get the current URL's pathname to use as the next parameter
      const currentPath = window.location.pathname
      const searchParams = new URLSearchParams(window.location.search)
      const redirectTo = searchParams.get('redirect') || '/dashboard/orders'

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          shouldCreateUser: true
        },
      })

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
    try {
      // Check if we can connect to Supabase
      const { data, error } = await supabase.from('profiles').select('count').limit(1).maybeSingle()

      if (error) {
        console.error('Supabase health check failed:', error)
        return { ok: false, error }
      }

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
```

#### 3.3. Update Auth Callback

Simplify the auth callback to redirect directly to the dashboard:

```typescript
import { createClient } from '@/app/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard/orders'

  // Default redirect path
  let redirectPath = next

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      // If there's an error, redirect to sign-in with error message
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('Invalid or expired magic link')}`, requestUrl.origin)
      )
    }

    // If successful, redirect to the next URL or dashboard
    redirectPath = next
  }

  // Use a 303 redirect to ensure the browser uses GET for the redirect
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin), { status: 303 })
}
```

#### 3.4. Update Middleware

Simplify the middleware to use standard Supabase Auth:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public routes
  const isPublicRoute = 
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.');

  // If there's no user and the path isn't public, redirect to login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

#### 3.5. Update Root Page

Update the root page to redirect to the dashboard if authenticated:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard/orders');
      } else {
        router.push('/auth/signin');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-900 p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Ivan Prints</h1>
          <p className="mt-2 text-gray-400">Business Management System</p>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    </div>
  );
}
```

### 4. Impact on the Application

#### 4.1. Authentication Flow

The new authentication flow will be:

1. User enters email on the sign-in page
2. User receives a magic link via email
3. User clicks the magic link
4. User is redirected directly to the dashboard

This simplifies the flow by removing the PIN setup and verification steps.

#### 4.2. Security Considerations

1. **Security Level**: The security level will be maintained through Supabase's secure authentication system.
2. **Session Management**: Supabase handles session management securely.
3. **Access Control**: Role-based access control will still be enforced through the profiles table.

#### 4.3. User Experience

1. **Simpler Flow**: Users will have a simpler authentication flow without the need to set up and remember a PIN.
2. **Fewer Steps**: The authentication process will have fewer steps, making it more user-friendly.
3. **Standard Experience**: The authentication experience will be more standard and familiar to users.

### 5. Testing Plan

1. **Authentication Flow**:
   - Test sign-in with magic link
   - Test redirects for unauthenticated users
   - Test session persistence
   - Test sign-out

2. **Role-Based Access Control**:
   - Test admin access to all profiles
   - Test staff access to own profile only
   - Test access to protected routes based on role

3. **Error Handling**:
   - Test invalid email format
   - Test non-allowed email
   - Test expired magic link
   - Test network errors

### 6. Rollback Plan

If issues arise during the migration:

1. **Database**: Restore the profiles table from the backup created during the migration
2. **Code**: Revert the changes to the auth context, middleware, and auth callback
3. **Testing**: Test the rollback to ensure the old authentication system works correctly

## Conclusion

This migration plan outlines the steps to clean up the old authentication system and implement a fully Supabase OTP-based login without PIN verification. By following this plan, the application will have a simpler, more reliable, and more secure authentication system that leverages the full power of Supabase Auth.
