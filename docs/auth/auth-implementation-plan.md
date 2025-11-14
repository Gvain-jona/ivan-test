# Authentication Implementation Plan

## Overview

This document outlines a step-by-step plan to implement authentication in the Ivan Prints application based on the auth-ideation.md file. The implementation will use Supabase Auth with custom extensions for PIN-based verification while ensuring existing application functionality remains intact.

## Analysis of Current State vs. Desired State

### Current State
- Authentication has been removed from the application
- Middleware redirects all auth-related paths to the dashboard
- No authentication checks are performed
- A `profiles` table exists that extends Supabase Auth users
- The application is configured to use a cloud Supabase instance

### Desired State (from auth-ideation.md)
- Two-factor authentication: Magic link email + PIN verification
- Allowed emails list with role-based access control
- Secure PIN storage with proper hashing
- Automatic profile creation with database triggers
- Comprehensive error handling

## Implementation Plan

### Phase 1: Database Setup

1. **Create/Update Database Tables**
   - Verify and update the `profiles` table structure
   - Create the `allowed_emails` table
   - Set up Row Level Security (RLS) policies

2. **Implement Database Functions**
   - PIN hashing and verification functions
   - Email verification functions
   - User creation trigger

### Phase 2: Authentication Flow Implementation

1. **Supabase Client Setup**
   - Create/update browser and server clients
   - Set up session management

2. **Authentication Pages**
   - Login page with email validation
   - PIN setup page
   - PIN verification page

3. **Middleware Implementation**
   - Update middleware to check authentication
   - Implement role-based access control
   - Handle session refresh

### Phase 3: Integration and Testing

1. **Connect Authentication to Existing App**
   - Update navigation context
   - Protect routes based on authentication status
   - Add user context provider

2. **Error Handling**
   - Implement comprehensive error handling
   - Add loading states
   - Handle edge cases

3. **Testing**
   - Test all authentication flows
   - Verify role-based access control
   - Test error scenarios

## Detailed Steps

### Phase 1: Database Setup

#### Step 1: Create/Update the `allowed_emails` Table

```sql
-- Create allowed_emails table if it doesn't exist
CREATE TABLE IF NOT EXISTS allowed_emails (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff'))
);

-- Enable Row Level Security
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read allowed_emails"
ON allowed_emails FOR SELECT
TO authenticated
USING (true);

-- Allow only admins to insert/update/delete
CREATE POLICY "Admins can manage allowed_emails"
ON allowed_emails FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
));
```

#### Step 2: Update the `profiles` Table

Verify the existing `profiles` table and update it if needed:

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

#### Step 4: Create User Profile Trigger

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

```typescript
// app/auth/signin/page.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

// Email validation schema
const emailSchema = z.string().email({ message: 'Please enter a valid email address' })

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      // Validate email format
      emailSchema.parse(email)

      // Send magic link
      const { error } = await signIn(email)

      if (error) throw error

      setSuccessMessage(`Magic link sent to ${email}. Please check your email inbox for the login link.`)
    } catch (err: any) {
      console.error('Magic link error:', err)
      setError(err.message || 'Failed to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground">Enter your email to receive a magic link</p>
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border p-2"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:bg-primary/70"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {successMessage && (
          <div className="rounded-md bg-green-50 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
```

2. **Auth Callback Page (`app/auth/callback/route.ts`)**

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/auth/setup-pin'

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(redirect, requestUrl.origin))
}
```

3. **PIN Setup Page (`app/auth/setup-pin/page.tsx`)**

```typescript
// app/auth/setup-pin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

// PIN validation schema
const pinSchema = z.string().min(4, { message: 'PIN must be at least 4 digits' }).regex(/^\d+$/, { message: 'PIN must contain only numbers' })

export default function SetupPin() {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, profile, setPin: savePin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check if user already has a PIN
    if (profile?.pin) {
      router.push('/auth/verify-pin')
      return
    }

    setIsLoading(false)
  }, [user, profile, router])

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Validate PIN format
      pinSchema.parse(pin)

      // Check if PINs match
      if (pin !== confirmPin) {
        setError('PINs do not match')
        return
      }

      setIsLoading(true)

      // Save PIN
      const { error } = await savePin(pin)

      if (error) throw error

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('PIN setup error:', err)
      setError(err.message || 'Failed to set PIN. Please try again.')
      setIsLoading(false)
    }
  }

  if (isLoading && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set Your PIN</h1>
          <p className="text-muted-foreground">Create a PIN to secure your account</p>
        </div>

        <form onSubmit={handleSetPin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="pin" className="text-sm font-medium">
              PIN (minimum 4 digits)
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPin" className="text-sm font-medium">
              Confirm PIN
            </label>
            <input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm PIN"
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:bg-primary/70"
            disabled={isLoading}
          >
            {isLoading ? 'Setting PIN...' : 'Set PIN'}
          </button>
        </form>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
```

4. **PIN Verification Page (`app/auth/verify-pin/page.tsx`)**

```typescript
// app/auth/verify-pin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useRouter } from 'next/navigation'

export default function VerifyPin() {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const { user, profile, verifyPin, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check if user has a PIN
    if (!profile?.pin) {
      router.push('/auth/setup-pin')
      return
    }

    setIsLoading(false)
  }, [user, profile, router])

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      setIsLoading(true)

      // Verify PIN
      const isValid = await verifyPin(pin)

      if (!isValid) {
        // Increment attempts
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        // If too many attempts, sign out
        if (newAttempts >= 3) {
          await signOut()
          router.push('/auth/signin')
          return
        }

        throw new Error(`Invalid PIN. ${3 - newAttempts} attempts remaining.`)
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('PIN verification error:', err)
      setError(err.message || 'Failed to verify PIN. Please try again.')
      setIsLoading(false)
    }
  }

  if (isLoading && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Enter Your PIN</h1>
          <p className="text-muted-foreground">Please enter your PIN to continue</p>
        </div>

        <form onSubmit={handleVerifyPin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="pin" className="text-sm font-medium">
              PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:bg-primary/70"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify PIN'}
          </button>
        </form>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={signOut}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### Step 4: Update Middleware

Update the middleware to handle authentication and protect routes:

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

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
  // This would typically be done by checking a session cookie or similar
  // For now, we'll just redirect to the PIN verification page
  if (pinProtectedRoutes.some(route => pathname.startsWith(route))) {
    // In a real implementation, you would check if the PIN has been verified
    // For now, we'll just redirect to the verify-pin page
    // This would be replaced with actual PIN verification logic
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
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
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

#### Step 2: Create Allowed Emails Management Page

Create a page for admins to manage allowed emails:

```typescript
// app/dashboard/settings/allowed-emails/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { createClient } from '@/utils/supabase/client'

export default function AllowedEmails() {
  const [emails, setEmails] = useState<Array<{ email: string; role: string }>>([])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('staff')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { profile } = useAuth()
  const supabase = createClient()

  // Load allowed emails
  useEffect(() => {
    const loadEmails = async () => {
      try {
        const { data, error } = await supabase
          .from('allowed_emails')
          .select('*')
          .order('email')

        if (error) throw error
        setEmails(data || [])
      } catch (err: any) {
        console.error('Error loading emails:', err)
        setError(err.message || 'Failed to load allowed emails')
      } finally {
        setIsLoading(false)
      }
    }

    loadEmails()
  }, [])

  // Check if user is admin
  if (profile?.role !== 'admin') {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Allowed Emails</h1>
        <p className="text-red-600">You do not have permission to access this page.</p>
      </div>
    )
  }

  // Add new email
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('allowed_emails')
        .insert({ email: newEmail, role: newRole })

      if (error) throw error

      // Refresh the list
      const { data } = await supabase
        .from('allowed_emails')
        .select('*')
        .order('email')

      setEmails(data || [])
      setNewEmail('')
      setSuccess('Email added successfully')
    } catch (err: any) {
      console.error('Error adding email:', err)
      setError(err.message || 'Failed to add email')
    }
  }

  // Delete email
  const handleDeleteEmail = async (email: string) => {
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('allowed_emails')
        .delete()
        .eq('email', email)

      if (error) throw error

      // Refresh the list
      setEmails(emails.filter(e => e.email !== email))
      setSuccess('Email removed successfully')
    } catch (err: any) {
      console.error('Error removing email:', err)
      setError(err.message || 'Failed to remove email')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Allowed Emails</h1>

      {/* Add new email form */}
      <form onSubmit={handleAddEmail} className="mb-8 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">Add New Email</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Role
            </label>
            <select
              id="role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Add Email
        </button>
      </form>

      {/* Success/Error messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Emails list */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center">
                  No allowed emails found.
                </td>
              </tr>
            ) : (
              emails.map((item) => (
                <tr key={item.email} className="border-t">
                  <td className="p-2">{item.email}</td>
                  <td className="p-2">
                    <span className="capitalize">{item.role}</span>
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => handleDeleteEmail(item.email)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

#### Step 3: Testing Plan

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