# Authentication Implementation Plan (Updated)

## Overview

This document provides an updated implementation plan for adding authentication to the Ivan Prints application. The implementation uses Supabase Auth with custom extensions for PIN-based verification, following the approach outlined in the auth-ideation.md file.

## Current State

- The database already has `profiles` and `allowed_emails` tables set up with sample data
- Authentication has been removed from the application
- Middleware redirects all auth-related paths to the dashboard
- No authentication checks are performed

## Implementation Phases

### Phase 1: Database Updates

#### Step 1: Create Checkpoint Migration

```sql
-- Create a checkpoint of current database state
-- This allows us to rollback if needed

-- Create backup of profiles table
CREATE TABLE IF NOT EXISTS profiles_backup AS
SELECT * FROM profiles;

-- Create backup of allowed_emails table
CREATE TABLE IF NOT EXISTS allowed_emails_backup AS
SELECT * FROM allowed_emails;

-- Create a function to restore from backup if needed
CREATE OR REPLACE FUNCTION restore_auth_tables()
RETURNS void AS $$
BEGIN
  -- Check if backup tables exist
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles_backup') THEN
    -- Delete current data
    DELETE FROM profiles;
    
    -- Restore from backup
    INSERT INTO profiles
    SELECT * FROM profiles_backup;
    
    RAISE NOTICE 'Profiles table restored from backup';
  ELSE
    RAISE NOTICE 'Profiles backup table not found';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'allowed_emails_backup') THEN
    -- Delete current data
    DELETE FROM allowed_emails;
    
    -- Restore from backup
    INSERT INTO allowed_emails
    SELECT * FROM allowed_emails_backup;
    
    RAISE NOTICE 'Allowed emails table restored from backup';
  ELSE
    RAISE NOTICE 'Allowed emails backup table not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up backups when no longer needed
CREATE OR REPLACE FUNCTION cleanup_auth_backups()
RETURNS void AS $$
BEGIN
  DROP TABLE IF EXISTS profiles_backup;
  DROP TABLE IF EXISTS allowed_emails_backup;
  DROP FUNCTION IF EXISTS restore_auth_tables();
  DROP FUNCTION IF EXISTS cleanup_auth_backups();
  RAISE NOTICE 'Auth backup tables and functions cleaned up';
END;
$$ LANGUAGE plpgsql;
```

#### Step 2: Update Existing Tables

```sql
-- Update profiles table if needed
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pin TEXT,
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS code_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Update or create policies
-- Users can read their own profile
CREATE POLICY IF NOT EXISTS "Users read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY IF NOT EXISTS "Admins read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
));
```

#### Step 3: Implement PIN Hashing and Verification Functions

```sql
-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash a PIN
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN crypt(pin, gen_salt('bf')); -- Blowfish hashing
END;
$$ LANGUAGE plpgsql;

-- Function to verify a PIN
CREATE OR REPLACE FUNCTION verify_pin(user_id UUID, input_pin TEXT) RETURNS BOOLEAN AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  SELECT pin INTO stored_pin FROM profiles WHERE id = user_id;
  RETURN stored_pin = crypt(input_pin, stored_pin);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

#### Step 4: Update User Profile Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM allowed_emails WHERE email = NEW.email) THEN
    INSERT INTO public.profiles (id, email, role, full_name, status)
    SELECT NEW.id, NEW.email, role, 
           COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
           'active'
    FROM allowed_emails WHERE email = NEW.email;
  ELSE
    -- Instead of raising an exception, just set a default role
    INSERT INTO public.profiles (id, email, role, full_name, status)
    VALUES (NEW.id, NEW.email, 'staff', 
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
            'inactive');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Step 5: Create Email Verification Function

```sql
CREATE OR REPLACE FUNCTION public.is_email_allowed(input_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM allowed_emails WHERE email = input_email);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

### Phase 2: Authentication Flow Implementation

#### Step 1: Update Supabase Client Setup

Create or update the Supabase client files:

1. **Browser Client (`utils/supabase/client.ts`)**

```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

2. **Server Client (`utils/supabase/server.ts`)**

```typescript
// utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookies.set error in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookies.delete error in middleware
          }
        },
      },
    }
  )
}
```

3. **Middleware Client (`utils/supabase/middleware.ts`)**

```typescript
// utils/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return response
}
```

#### Step 2: Create Authentication Context

Create a user context to manage authentication state:

```typescript
// app/context/auth-context.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { type User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  profile: any | null
  isLoading: boolean
  signIn: (email: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  verifyPin: (pin: string) => Promise<boolean>
  setPin: (pin: string) => Promise<{ error: any | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          setProfile(profile)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              setProfile(data)
            })
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      console.error('Error signing in:', error)
      return { error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const verifyPin = async (pin: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_pin', {
        user_id: user?.id,
        input_pin: pin,
      })

      if (error) throw error
      return !!data
    } catch (error) {
      console.error('Error verifying PIN:', error)
      return false
    }
  }

  const setPin = async (pin: string) => {
    try {
      // First hash the PIN
      const { data: hashedPin, error: hashError } = await supabase.rpc('hash_pin', {
        pin,
      })

      if (hashError) return { error: hashError }

      // Then update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ pin: hashedPin })
        .eq('id', user?.id)

      return { error: updateError }
    } catch (error) {
      console.error('Error setting PIN:', error)
      return { error }
    }
  }

  const value = {
    user,
    profile,
    isLoading,
    signIn,
    signOut,
    verifyPin,
    setPin,
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

#### Step 3: Create Authentication Pages

1. **Sign In Page (`app/auth/signin/page.tsx`)**
2. **Auth Callback Page (`app/auth/callback/route.ts`)**
3. **PIN Setup Page (`app/auth/setup-pin/page.tsx`)**
4. **PIN Verification Page (`app/auth/verify-pin/page.tsx`)**

#### Step 4: Update Middleware

Update the middleware to handle authentication and protect routes:

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/callback',
  '/auth/setup-pin',
  '/auth/verify-pin',
]

// Define routes that require PIN verification
const pinProtectedRoutes = [
  '/dashboard',
  '/dashboard/orders',
  '/dashboard/clients',
  '/dashboard/expenses',
  '/dashboard/settings',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Step 1: Update the Supabase session
  const response = await updateSession(request)

  // Step 2: Handle root path redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard/orders', request.url))
  }

  // Step 3: Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  // Step 4: Get the user from the session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Create a temporary supabase client to get the user
  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set() {}, // No-op as we don't need to set cookies here
        remove() {}, // No-op as we don't need to remove cookies here
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Step 5: If no user, redirect to sign in
  if (!user) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Step 6: For PIN protected routes, check if PIN verification is needed
  if (pinProtectedRoutes.some(route => pathname.startsWith(route))) {
    // Check if PIN has been verified in this session
    const pinVerified = request.cookies.get('pin_verified')?.value === 'true'
    
    if (!pinVerified) {
      const redirectUrl = new URL('/auth/verify-pin', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. robots.txt)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Phase 3: Integration and Testing

#### Step 1: Update Providers

Update the app providers to include the AuthProvider:

```typescript
// app/providers.tsx
'use client'

import { ThemeProvider } from '@/components/theme/theme-provider'
import { NavigationProvider } from '@/context/navigation-context'
import { AuthProvider } from '@/app/context/auth-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

#### Step 2: Testing Plan

1. **Database Setup Testing**
   - Verify that all tables and functions are created correctly
   - Test the PIN hashing and verification functions
   - Test the email verification function
   - Test the user creation trigger

2. **Authentication Flow Testing**
   - Test the sign-in process with magic links
   - Test PIN setup and verification
   - Test session management and token refresh
   - Test role-based access control

3. **Error Handling Testing**
   - Test invalid email scenarios
   - Test incorrect PIN scenarios
   - Test expired session scenarios
   - Test network error scenarios

4. **Integration Testing**
   - Test the entire authentication flow from sign-in to dashboard access
   - Test navigation between protected routes
   - Test the allowed emails management page
   - Test user profile management

## Root Cause Approach

When encountering issues during implementation, we will:

1. **Identify Root Causes**: Look beyond symptoms to understand underlying issues
2. **Create Targeted Solutions**: Address the fundamental problems rather than applying quick fixes
3. **Test Thoroughly**: Ensure solutions don't introduce new problems
4. **Document Changes**: Keep track of all modifications for future reference

## Implementation Notes

1. **Security Considerations**
   - PINs are securely hashed using bcrypt via pgcrypto
   - Row Level Security (RLS) ensures users can only access their own data
   - Session tokens are securely stored in cookies
   - CSRF protection is implemented for all forms

2. **Performance Considerations**
   - Minimize database queries by caching user profiles
   - Use server components where possible to reduce client-side JavaScript
   - Implement proper loading states to improve perceived performance

3. **Compatibility with Existing Code**
   - The implementation maintains compatibility with the existing codebase
   - No existing functionality is broken
   - The authentication system integrates seamlessly with the existing UI

## Conclusion

This implementation plan provides a comprehensive approach to implementing authentication in the Ivan Prints application using Supabase Auth with custom extensions for PIN-based verification. The plan ensures that the implementation aligns with the auth-ideation.md file while maintaining compatibility with the existing codebase.

The checkpoint migration provides a safety net in case we need to roll back changes, and the focus on addressing root causes rather than symptoms will ensure a robust and maintainable authentication system.
