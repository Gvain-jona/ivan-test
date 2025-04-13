# Authentication System Migration Plan

This document provides a detailed implementation plan for migrating the application to a fully Supabase-based authentication system.

## 1. Current Authentication System

The current authentication system uses Supabase Auth with custom extensions:

- **Magic Link Authentication**: Users sign in by receiving a magic link via email
- **PIN Verification**: After authentication, users must set up and verify a PIN
- **Session Management**: Uses a combination of Supabase sessions, cookies, and local storage
- **Role-Based Access Control**: Uses roles stored in the profiles table
- **Allowed Emails**: Restricts sign-in to emails in the allowed_emails table

## 2. Migration Goals

1. Simplify the authentication system to use standard Supabase Auth
2. Remove unnecessary custom extensions (e.g., PIN verification if not required)
3. Ensure proper security with Row Level Security (RLS)
4. Improve reliability and error handling
5. Enhance user experience with clear authentication flows

## 3. Detailed Implementation Plan

### 3.1 Phase 1: Clean Up and Preparation

#### 3.1.1 Update Root Page (app/page.tsx)

- Remove direct access to the dashboard
- Implement proper authentication check
- Redirect unauthenticated users to the login page

```tsx
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

#### 3.1.2 Update Middleware (middleware.ts)

- Simplify middleware to use standard Supabase Auth
- Ensure proper redirects for unauthenticated users
- Define protected and public routes clearly

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

#### 3.1.3 Clean Up Environment Variables

- Review and clean up environment variables
- Remove development mode bypasses and fallbacks
- Ensure consistent environment variables across environments

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Remove these variables if they exist
# BYPASS_SIGNIN
# SKIP_PROFILE_CHECK
```

### 3.2 Phase 2: Simplify Authentication Context

#### 3.2.1 Update Auth Context (app/context/auth-context.tsx)

- Simplify auth context to use standard Supabase Auth
- Remove custom PIN verification if not required
- Use Supabase Auth session management

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

#### 3.2.2 Update Sign In Page (app/auth/signin/page.tsx)

- Simplify sign in page to use standard Supabase Auth
- Remove custom PIN verification if not required
- Improve error handling and user experience

```tsx
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

### 3.3 Phase 3: Update Database Schema

#### 3.3.1 Create Migration File

Create a new migration file in the `supabase/migrations` directory to update the database schema:

```sql
-- Migration: Simplify Auth System
-- This migration simplifies the auth system to use standard Supabase Auth

-- Create a backup of the current profiles table
CREATE TABLE IF NOT EXISTS profiles_backup AS
SELECT * FROM profiles;

-- Drop PIN-related columns if they are no longer needed
ALTER TABLE profiles
DROP COLUMN IF EXISTS pin,
DROP COLUMN IF EXISTS verification_code,
DROP COLUMN IF EXISTS code_expiry,
DROP COLUMN IF EXISTS is_verified,
DROP COLUMN IF EXISTS failed_attempts;

-- Drop PIN-related functions if they are no longer needed
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

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure RLS policies are properly set up
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;

-- Create policies for profiles table
-- Allow users to read their own profile
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a policy for admins to read all profiles
CREATE POLICY "profiles_admin_read_all" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy for admins to update all profiles
CREATE POLICY "profiles_admin_update_all" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy for admins to insert profiles
CREATE POLICY "profiles_admin_insert" ON profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy for admins to delete profiles
CREATE POLICY "profiles_admin_delete" ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 3.4 Phase 4: Test and Deploy

#### 3.4.1 Testing Plan

1. **Authentication Flow**:
   - Test sign in with magic link
   - Test redirects for unauthenticated users
   - Test session persistence
   - Test sign out

2. **Role-Based Access Control**:
   - Test admin access to all profiles
   - Test staff access to own profile only
   - Test access to protected routes based on role

3. **Error Handling**:
   - Test invalid email format
   - Test non-allowed email
   - Test expired magic link
   - Test network errors

4. **Security**:
   - Test RLS policies
   - Test redirect URL validation
   - Test session expiration

#### 3.4.2 Deployment Checklist

1. **Environment Variables**:
   - Ensure Supabase URL and anon key are set
   - Remove development mode bypasses and fallbacks

2. **Database Migrations**:
   - Run migrations to update database schema
   - Verify RLS policies are properly set up

3. **Code Deployment**:
   - Deploy updated code to production
   - Verify authentication flow works in production

4. **Monitoring**:
   - Set up monitoring for authentication errors
   - Set up alerts for security issues

## 4. Conclusion

This migration plan provides a detailed roadmap for migrating the application to a fully Supabase-based authentication system. By following this plan, the application will have a simpler, more reliable, and more secure authentication system that leverages the full power of Supabase Auth.

The key to a successful migration is to standardize on Supabase Auth and remove custom authentication components that add complexity without adding value. The PIN verification system, in particular, should be evaluated to determine if it is necessary for the application's security requirements.

By simplifying the authentication system, the application will be easier to maintain, more reliable, and more secure.
