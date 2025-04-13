# Authentication System Audit and Migration Plan

## Current State of Authentication

The application currently has a hybrid authentication system that was temporarily set to a public state for testing purposes. This document provides a comprehensive audit of the current authentication system and outlines a plan to migrate to a fully Supabase-based authentication system.

## 1. Current Authentication Components

### 1.1 Middleware

The application uses Next.js middleware (`middleware.ts`) to handle authentication checks and redirects. The middleware:

- Creates a Supabase server client to check user authentication status
- Redirects unauthenticated users to the login page if they try to access protected routes
- Allows access to public routes without authentication (login, auth, API routes, static files)

### 1.2 Authentication Flow

The current authentication flow consists of:

1. **Sign In**: Users enter their email to receive a magic link
2. **Magic Link**: Users click the magic link in their email to authenticate
3. **PIN Setup/Verification**: After authentication, users set up or verify a PIN
4. **Session Management**: The system manages sessions with cookies and local storage

### 1.3 Authentication Context

The application uses a React context (`auth-context.tsx`) to manage authentication state and provide authentication functions:

- `signIn`: Sends a magic link to the user's email
- `signOut`: Signs out the user
- `verifyPin`: Verifies the user's PIN
- `setPin`: Sets a new PIN for the user
- `checkSupabaseHealth`: Checks the connection to Supabase
- `clearPinVerification`: Clears PIN verification
- `resetInactivityTimer`: Resets the inactivity timer

### 1.4 Database Schema

The authentication system uses several database tables:

- `profiles`: Extends Supabase Auth users with additional fields
- `allowed_emails`: Stores emails that are allowed to sign in with their assigned roles

### 1.5 Database Functions

The database includes several functions for authentication:

- `hash_pin`: Hashes a PIN using bcrypt
- `verify_pin`: Verifies a PIN against the stored hash
- `handle_new_user`: Creates a profile when a new user signs up
- `is_email_allowed`: Checks if an email is allowed to sign in
- `lock_user_account`: Locks a user account
- `unlock_user_account`: Unlocks a user account
- `reset_user_pin`: Resets a user's PIN

### 1.6 Row Level Security (RLS)

The database uses Row Level Security (RLS) policies to control access to data:

- Users can read and update their own profiles
- Admins can read and update all profiles
- Authenticated users can read allowed emails
- Only admins can manage allowed emails

## 2. Public Access Mode

The application is currently in a public access mode where:

- The root page (`app/page.tsx`) allows direct access to the dashboard without authentication
- The middleware is still in place but may not be enforcing authentication
- The auth context is still loaded but may not be requiring authentication

## 3. Issues and Inconsistencies

### 3.1 Authentication Bypass

- The root page allows direct access to the dashboard without authentication
- There may be environment variables that bypass authentication in development mode

### 3.2 PIN Verification

- The PIN verification system adds complexity to the standard Supabase authentication
- There are fallbacks for PIN verification in development mode that may be causing issues

### 3.3 Error Handling

- There are multiple error handling paths that may be causing inconsistent behavior
- Some errors are ignored in development mode

### 3.4 Session Management

- The application uses a combination of Supabase sessions, cookies, and local storage
- The session management may be causing issues with authentication state

## 4. Migration Plan to Full Supabase Authentication

### 4.1 Clean Up Existing Code

1. Remove public access mode from the root page
2. Remove development mode bypasses and fallbacks
3. Simplify error handling paths
4. Consolidate session management

### 4.2 Standardize on Supabase Auth

1. Use Supabase Auth for all authentication
2. Remove custom PIN verification if not required
3. Use Supabase Auth session management

### 4.3 Update Middleware

1. Simplify middleware to use standard Supabase Auth
2. Ensure proper redirects for unauthenticated users
3. Define protected and public routes clearly

### 4.4 Update Auth Context

1. Simplify auth context to use standard Supabase Auth
2. Remove custom PIN verification if not required
3. Use Supabase Auth session management

### 4.5 Update Database Schema

1. Simplify profiles table to match Supabase Auth
2. Ensure proper RLS policies for data access
3. Remove custom PIN verification if not required

### 4.6 Update UI Components

1. Simplify authentication UI components
2. Remove PIN verification UI if not required
3. Use standard Supabase Auth UI components or create custom ones that work with Supabase Auth

## 5. Implementation Steps

### 5.1 Phase 1: Clean Up

1. Remove public access mode from the root page
2. Remove development mode bypasses and fallbacks
3. Simplify error handling paths
4. Consolidate session management

### 5.2 Phase 2: Standardize

1. Update middleware to use standard Supabase Auth
2. Update auth context to use standard Supabase Auth
3. Update database schema to match Supabase Auth
4. Update UI components to use standard Supabase Auth

### 5.3 Phase 3: Test and Deploy

1. Test authentication flow end-to-end
2. Test error handling and edge cases
3. Test performance and security
4. Deploy to production

## 6. Conclusion

The application currently has a hybrid authentication system that was temporarily set to a public state for testing purposes. The migration plan outlines a path to a fully Supabase-based authentication system that is simpler, more reliable, and more secure.

The key to a successful migration is to standardize on Supabase Auth and remove custom authentication components that add complexity without adding value. The PIN verification system, in particular, should be evaluated to determine if it is necessary for the application's security requirements.

By following this migration plan, the application will have a fully Supabase-based authentication system that is simpler, more reliable, and more secure.
