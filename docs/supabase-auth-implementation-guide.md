# Supabase Auth Implementation Guide

This document provides a step-by-step guide for implementing the Supabase Auth migration plan.

## Prerequisites

1. Access to the Supabase project
2. Access to the codebase
3. Understanding of the current authentication system

## Implementation Steps

### Step 1: Create Database Migration

1. Create a new migration file in `supabase/migrations/` directory:

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

2. Run the migration:

```bash
npx supabase migration up
```

### Step 2: Update Auth Context

1. Update the `app/context/auth-context.tsx` file:

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

### Step 3: Update Auth Callback

1. Update the `app/auth/callback/route.ts` file:

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

### Step 4: Update Middleware

1. Update the `middleware.ts` file:

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

### Step 5: Update Root Page

1. Update the `app/page.tsx` file:

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

### Step 6: Remove PIN-Related Pages

1. Remove the following files:
   - `app/auth/setup-pin/page.tsx`
   - `app/auth/verify-pin/page.tsx`
   - `app/auth/forgot-pin/page.tsx` (if exists)

2. Remove any test auth pages:
   - `app/auth-test/` directory (if exists)
   - `app/auth/test-supabase/` directory

### Step 7: Update Sign-In Page

1. Update the `app/auth/signin/page.tsx` file:

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { Progress } from '@/components/ui/progress';

// Helper function to validate redirect URLs for security
function validateRedirectUrl(url: string): string {
  // Only allow redirects to internal dashboard pages
  if (url && (
    url.startsWith('/dashboard') ||
    url.startsWith('/admin') ||
    url.startsWith('/manager')
  )) {
    return url;
  }

  // Default to dashboard if the URL is not allowed
  return '/dashboard';
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, checkSupabaseHealth } = useAuth();

  // Get the redirect URL from the query parameters
  const redirectTo = searchParams?.get('redirect') || '/dashboard';

  // Get error message from query parameters if present
  const errorFromUrl = searchParams?.get('error');

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(errorFromUrl || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState<'input' | 'sending' | 'sent'>('input');
  const [progress, setProgress] = useState(0);

  // Check if email is valid format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setStep('sending');
    setProgress(10);

    try {
      // Simulate a slight delay to show the progress animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const signInResult = await signIn(email);
      const { error } = signInResult;

      if (error) {
        console.error('Sign-in error:', error);
        setError(error.message || 'Failed to send magic link. Please try again.');
        setStep('input');
      } else {
        setProgress(100);
        setStep('sent');
        setSuccessMessage(`Magic link sent to ${email}. Please check your email inbox for the login link.`);
      }
    } catch (err: any) {
      console.error('Magic link error:', err);
      setError(err.message || 'Failed to send magic link. Please try again.');
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <form onSubmit={handleSignIn}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !isValidEmail(email)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Continue with Email'
                )}
              </Button>
            </div>
          </form>
        );

      case 'sending':
        return (
          <div className="grid gap-6 py-4">
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h3 className="mt-4 text-lg font-medium">Sending Magic Link</h3>
              <p className="text-sm text-muted-foreground text-center">
                We're sending a secure login link to {email}
              </p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        );

      case 'sent':
        return (
          <div className="grid gap-6 py-4">
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <div className="rounded-full bg-primary/10 p-3">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Check Your Email</h3>
              <p className="text-sm text-muted-foreground text-center">
                We've sent a magic link to <strong>{email}</strong>
              </p>
              <div className="mt-4 flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`mailto:${email}`, '_blank')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Open Email App
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('input');
                    setProgress(0);
                    setSuccessMessage('');
                  }}
                >
                  Use a different email
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            {step === 'input' && 'Enter your email to receive a magic link'}
            {step === 'sending' && 'Sending secure login link...'}
            {step === 'sent' && 'Magic link sent!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center">
          <div className="text-sm text-muted-foreground">
            Only authorized emails can sign in. Contact your administrator for access.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### Step 8: Update Login Redirect Page

1. Update the `app/auth/login/page.tsx` file:

```typescript
'use client';

// Redirect from old login page to new signin page

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get any query parameters
    const redirect = searchParams.get('redirect');
    const queryString = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';

    // Redirect to the new signin page
    router.replace(`/auth/signin${queryString}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <p className="text-muted-foreground">Redirecting to sign in page...</p>
    </div>
  );
}
```

### Step 9: Testing

1. Test the authentication flow:
   - Sign in with a valid email
   - Verify the magic link works
   - Verify the redirect to the dashboard works
   - Verify the session persists after page refresh
   - Verify sign out works

2. Test role-based access control:
   - Sign in with an admin email
   - Verify admin access to all profiles
   - Sign in with a staff email
   - Verify staff access to own profile only

3. Test error handling:
   - Try to sign in with an invalid email format
   - Try to sign in with a non-allowed email
   - Try to use an expired magic link

### Step 10: Cleanup

1. Remove any remaining references to PIN verification in the codebase:
   - Search for "pin" in the codebase
   - Search for "verify" in the codebase
   - Search for "setup-pin" in the codebase
   - Search for "verify-pin" in the codebase

2. Remove any unused imports or variables related to PIN verification

3. Remove any unused environment variables related to PIN verification

## Troubleshooting

### Database Issues

1. **Missing Profiles**: If a user doesn't have a profile, the handle_new_user function should create one automatically. If not, check the function for errors.

2. **Migration Errors**: If the migration fails, check the error message and fix the issue. You can also restore the profiles table from the backup.

### Authentication Issues

1. **Magic Link Not Working**: Check the Supabase logs for errors. Make sure the email is allowed to sign in.

2. **Redirect Issues**: Check the auth callback route for errors. Make sure the redirect URL is valid.

3. **Session Issues**: Check the Supabase session management. Make sure the session is being stored correctly.

## Conclusion

By following this implementation guide, you should be able to successfully migrate the authentication system to a fully Supabase OTP-based login without PIN verification. This will simplify the authentication flow, improve the user experience, and make the codebase more maintainable.
