# Authentication System Code Review

This document provides a detailed code review of the current authentication-related code in the application.

## 1. Middleware (middleware.ts)

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

  // If there's no user and the path isn't public, redirect to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.includes('.')
  ) {
    const redirectUrl = new URL('/login', request.url)
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

### Review:

- The middleware correctly uses Supabase SSR to check user authentication status
- It properly handles cookies for authentication
- It redirects unauthenticated users to the login page
- It allows access to public routes without authentication
- The matcher configuration is correct for excluding static files

### Recommendations:

- Define public routes more explicitly using an array or set for better maintainability
- Add comments to explain the purpose of each section
- Consider adding role-based access control at the middleware level

## 2. Auth Context (app/context/auth-context.tsx)

The auth context is quite large (848 lines), so I'll focus on the key parts:

### Key Components:

1. **State Management**:
   ```typescript
   const [user, setUser] = useState<User | null>(null)
   const [profile, setProfile] = useState<Profile | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   ```

2. **Authentication Functions**:
   ```typescript
   const signIn = async (email: string) => { ... }
   const signOut = async () => { ... }
   const verifyPin = async (pin: string) => { ... }
   const setPin = async (pin: string) => { ... }
   ```

3. **Session Management**:
   ```typescript
   // Set cookie to indicate PIN has been verified for this session
   const expiryDate = new Date()
   expiryDate.setTime(expiryDate.getTime() + (30 * 60 * 1000)) // 30 minutes
   document.cookie = `pin_verified=true; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=lax`

   // Also store the verification time in localStorage for session tracking
   localStorage.setItem('pin_verified_at', new Date().toISOString())
   ```

4. **Error Handling**:
   ```typescript
   // Special handling for various errors
   if (error) {
     console.log('Sign-in error details:', { code: error.code, message: error.message });

     // Handle database policy errors
     if (error.code === '42P17' && error.message?.includes('infinite recursion detected in policy')) {
       console.warn('RLS policy error detected, but proceeding with sign-in in development mode');
       // In development mode, we'll pretend the magic link was sent
       if (process.env.NODE_ENV === 'development') {
         console.log('Development mode: simulating successful magic link sending');
         setProgress(100);
         setStep('sent');
         setSuccessMessage(`Development mode: Magic link would be sent to ${email}. In production, check your email inbox for the login link.`);
         return;
       }
     }

     // Handle timeout errors
     if (error.code === 'TIMEOUT') {
       console.warn('Sign-in timed out');
       setProgress(100);
       setStep('input');
       setError(error.message || 'Sign-in timed out. Please try again later.');
       return;
     }
   }
   ```

### Review:

- The auth context is overly complex with many special cases and fallbacks
- It mixes authentication concerns (Supabase Auth) with custom PIN verification
- It uses both cookies and localStorage for session management
- It has many development mode bypasses and fallbacks
- Error handling is inconsistent and complex

### Recommendations:

- Simplify the auth context to focus on standard Supabase Auth
- Remove custom PIN verification if not required
- Use Supabase Auth session management instead of custom cookies and localStorage
- Standardize error handling
- Remove development mode bypasses and fallbacks

## 3. Sign In Page (app/auth/signin/page.tsx)

The sign in page is also quite large (282 lines), so I'll focus on the key parts:

### Key Components:

1. **State Management**:
   ```typescript
   const [email, setEmail] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState(errorFromUrl || '');
   const [successMessage, setSuccessMessage] = useState('');
   const [step, setStep] = useState<'input' | 'sending' | 'sent'>('input');
   const [progress, setProgress] = useState(0);
   ```

2. **Sign In Function**:
   ```typescript
   const handleSignIn = async (e: React.FormEvent) => {
     e.preventDefault();
     console.log('Sign-in form submitted');

     if (!email || !isValidEmail(email)) {
       console.log('Invalid email format');
       setError('Please enter a valid email address');
       return;
     }

     console.log('Email validation passed, proceeding with sign-in');

     setIsLoading(true);
     setError('');
     setStep('sending');
     setProgress(10);

     try {
       // Simulate a slight delay to show the progress animation
       await new Promise(resolve => setTimeout(resolve, 1000));

       console.log('Calling signIn function with email:', email);
       const signInResult = await signIn(email);
       console.log('Sign-in result:', signInResult);

       const { error } = signInResult;

       // Special handling for various errors
       if (error) {
         console.log('Sign-in error details:', { code: error.code, message: error.message });

         // Handle database policy errors
         if (error.code === '42P17' && error.message?.includes('infinite recursion detected in policy')) {
           console.warn('RLS policy error detected, but proceeding with sign-in in development mode');
           // In development mode, we'll pretend the magic link was sent
           if (process.env.NODE_ENV === 'development') {
             console.log('Development mode: simulating successful magic link sending');
             setProgress(100);
             setStep('sent');
             setSuccessMessage(`Development mode: Magic link would be sent to ${email}. In production, check your email inbox for the login link.`);
             return;
           }
         }

         // Handle timeout errors
         if (error.code === 'TIMEOUT') {
           console.warn('Sign-in timed out');
           setProgress(100);
           setStep('input');
           setError(error.message || 'Sign-in timed out. Please try again later.');
           return;
         }
       } else {
         console.log('Magic link sent successfully');
       }

       if (error) throw error;

       setProgress(100);
       setStep('sent');
       setSuccessMessage(`Magic link sent to ${email}. Please check your email inbox for the login link.`);
     } catch (err: any) {
       console.error('Magic link error:', err);
       setError(err.message || 'Failed to send magic link. Please try again.');
       setStep('input');
     } finally {
       setIsLoading(false);
     }
   };
   ```

3. **UI Rendering**:
   ```typescript
   const renderStepContent = () => {
     switch (step) {
       case 'input':
         return (
           <form onSubmit={handleSignIn}>
             {/* Form content */}
           </form>
         );

       case 'sending':
         return (
           <div className="grid gap-6 py-4">
             {/* Sending animation */}
           </div>
         );

       case 'sent':
         return (
           <div className="grid gap-6 py-4">
             {/* Success message */}
           </div>
         );

       default:
         return null;
     }
   };
   ```

### Review:

- The sign in page has a good UI flow with input, sending, and sent states
- It properly validates email format
- It has good error handling and user feedback
- It has many console.log statements for debugging
- It has special handling for development mode

### Recommendations:

- Remove console.log statements for production
- Simplify error handling
- Remove development mode special handling
- Consider using a form library like react-hook-form for better form handling

## 4. Database Schema

### Key Tables:

1. **profiles**:
   ```sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     full_name VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
     status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'locked')) DEFAULT 'active',
     pin TEXT,
     verification_code VARCHAR(20),
     code_expiry TIMESTAMP WITH TIME ZONE,
     is_verified BOOLEAN DEFAULT FALSE,
     failed_attempts INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **allowed_emails**:
   ```sql
   CREATE TABLE allowed_emails (
     email TEXT PRIMARY KEY,
     role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff'))
   );
   ```

### Key Functions:

1. **handle_new_user**:
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
       -- Instead of raising an exception, just set a default role with inactive status
       INSERT INTO public.profiles (id, email, role, full_name, status)
       VALUES (NEW.id, NEW.email, 'staff', 
               COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
               'inactive');
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. **hash_pin**:
   ```sql
   CREATE OR REPLACE FUNCTION hash_pin(pin TEXT) RETURNS TEXT AS $$
   BEGIN
     RETURN crypt(pin, gen_salt('bf')); -- Blowfish hashing
   END;
   $$ LANGUAGE plpgsql;
   ```

3. **verify_pin**:
   ```sql
   CREATE OR REPLACE FUNCTION verify_pin(user_id UUID, input_pin TEXT) RETURNS BOOLEAN AS $$
   DECLARE
     stored_pin TEXT;
     attempts INTEGER;
   BEGIN
     -- Get the stored PIN and current failed attempts
     SELECT pin, failed_attempts INTO stored_pin, attempts FROM profiles WHERE id = user_id;
     
     -- If no PIN is set, return false
     IF stored_pin IS NULL THEN
       RETURN FALSE;
     END IF;
     
     -- Check if the PIN matches
     IF stored_pin = crypt(input_pin, stored_pin) THEN
       -- Reset failed attempts on successful verification
       UPDATE profiles SET failed_attempts = 0 WHERE id = user_id;
       RETURN TRUE;
     ELSE
       -- Increment failed attempts
       UPDATE profiles SET failed_attempts = failed_attempts + 1 WHERE id = user_id;
       RETURN FALSE;
     END IF;
   END;
   $$ LANGUAGE plpgsql SECURITY INVOKER;
   ```

### Review:

- The database schema is well-designed with proper foreign keys and constraints
- The profiles table extends Supabase Auth users with additional fields
- The allowed_emails table provides a way to restrict sign-in to specific emails
- The handle_new_user function creates a profile when a new user signs up
- The hash_pin and verify_pin functions provide secure PIN verification

### Recommendations:

- Simplify the profiles table by removing PIN-related fields if not required
- Ensure RLS policies are properly set up for all tables
- Consider using Supabase Auth hooks for user creation instead of triggers
- Document the database schema and functions for better maintainability

## 5. Overall Recommendations

1. **Simplify Authentication Flow**:
   - Use standard Supabase Auth for authentication
   - Remove custom PIN verification if not required
   - Simplify error handling and user feedback

2. **Improve Code Organization**:
   - Split the auth context into smaller, more focused components
   - Use custom hooks for specific authentication concerns
   - Document the authentication flow for better maintainability

3. **Enhance Security**:
   - Ensure proper RLS policies for all tables
   - Validate redirect URLs to prevent open redirects
   - Use secure session management

4. **Improve User Experience**:
   - Provide clear error messages for authentication failures
   - Add loading states for better feedback
   - Consider adding password-based authentication as an option

5. **Prepare for Production**:
   - Remove development mode bypasses and fallbacks
   - Add proper logging for authentication events
   - Set up monitoring for authentication failures

By implementing these recommendations, the application will have a simpler, more reliable, and more secure authentication system that leverages the full power of Supabase Auth.
