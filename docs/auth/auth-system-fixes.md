# Authentication System Fixes

This document outlines the issues identified in the authentication system and the solutions implemented to fix them.

## Issues Identified

1. **Row Level Security (RLS) Policy Issue**: The profiles table has an RLS policy that prevents authenticated users from creating their own profiles, resulting in 403 Forbidden errors.

2. **PIN Verification Flow Issue**: On page reload, users are being redirected to the setup PIN page instead of the verify PIN page, even if they already have a PIN set.

3. **Development Mode Bypass**: The development mode is completely bypassing profile checks, which prevents proper testing of the authentication flow.

## Solutions Implemented

### 1. Fix for RLS Policy Issue

The RLS policy for the profiles table was preventing authenticated users from creating their own profiles. We've created a SQL function to fix this issue:

```sql
-- Function to fix the RLS policy for the profiles table
CREATE OR REPLACE FUNCTION public.admin_fix_profiles_rls()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- This is important to run with admin privileges
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Drop the existing policy
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";

  -- Create a new policy that allows authenticated users to insert their own profile
  CREATE POLICY "Enable insert for authenticated users only" 
  ON "public"."profiles" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

  -- Allow users to update their own profile
  DROP POLICY IF EXISTS "Enable update for users based on id" ON "public"."profiles";
  CREATE POLICY "Enable update for users based on id" 
  ON "public"."profiles" 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

  -- Allow users to select their own profile
  DROP POLICY IF EXISTS "Enable select for users based on id" ON "public"."profiles";
  CREATE POLICY "Enable select for users based on id" 
  ON "public"."profiles" 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Successfully fixed RLS policy for profiles table',
    'timestamp', now()
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
    
    RETURN result;
END;
$$;
```

We've also created a page at `/auth/fix-profile-rls` that allows administrators to run this function directly from the application.

### 2. Fix for PIN Verification Flow

We've updated the auth context to properly check if a user has a PIN set before redirecting them to the appropriate page:

```javascript
// Function to check if user has a PIN set
const checkHasPinSet = () => {
  return !!profile?.pin
}

// When redirecting after session expiry or app reopen
if (user && !window.location.pathname.startsWith('/auth/')) {
  // If user has a PIN set, redirect to verify-pin, otherwise to setup-pin
  const redirectPath = checkHasPinSet() ? '/auth/verify-pin' : '/auth/setup-pin'
  router.push(redirectPath)
}
```

This ensures that users are redirected to the correct page based on whether they have a PIN set or not.

### 3. Fix for Development Mode Bypass

We've modified the development mode behavior to still create profiles if they don't exist, but only bypass the redirects:

```javascript
// We'll no longer skip profile checks completely
// Instead, we'll always try to create a profile if one doesn't exist
const skipProfileRedirects = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SKIP_PROFILE_CHECK === 'true'
if (skipProfileRedirects) {
  console.log('Development mode: Will create profile if needed but skip redirects')
}
```

This allows for proper testing of the authentication flow in development mode.

## Manual Steps Required

1. **Run the SQL Function**: The SQL function needs to be executed in the Supabase SQL editor with admin privileges. You can either:
   - Copy and paste the SQL from `docs/fix-rls-policy.sql` into the Supabase SQL editor
   - Use the `/auth/fix-profile-rls` page in the application (requires admin privileges)

2. **Create Profiles for Existing Users**: If there are existing users without profiles, they need to visit the `/auth/create-profile` page to create their profile.

## Testing the Fixes

1. **Test Profile Creation**: Sign in with a new email and verify that a profile is created automatically.

2. **Test PIN Verification Flow**: After setting up a PIN, sign out and sign back in to verify that you're redirected to the verify PIN page.

3. **Test Session Expiry**: Leave the application inactive for 30 minutes and verify that you're prompted to re-enter your PIN when you return.

4. **Test App Reopen**: Close and reopen the application (or switch tabs) and verify that you're prompted to re-enter your PIN.

## Security Enhancements

In addition to fixing the authentication issues, we've implemented several security enhancements:

1. **PIN Re-verification on App Reopen**: Users are required to re-enter their PIN when they close and reopen the application.

2. **Session Expiry After Inactivity**: Sessions expire after 30 minutes of inactivity, requiring users to re-enter their PIN.

3. **Forgot PIN Mechanism**: Users can reset their PIN if they forget it, using email verification.

These enhancements improve the security of the application while maintaining a good user experience.
