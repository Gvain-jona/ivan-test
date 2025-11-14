# Authentication Email Sending Issues

## Overview

This document summarizes the issues with sending magic links in the authentication system and the solutions implemented to address them.

## Issues Identified

### 1. Email Provider Configuration

In the Supabase configuration (supabase/config.toml), the SMTP settings are commented out (lines 168-176). This means that Supabase is not configured to actually send emails. In development mode, emails are captured by the Inbucket service (lines 76-86) but not actually sent to real email addresses.

```toml
# Use a production-ready SMTP server
# [auth.email.smtp]
# enabled = true
# host = "smtp.sendgrid.net"
# port = 587
# user = "apikey"
# pass = "env(SENDGRID_API_KEY)"
# admin_email = "admin@email.com"
# sender_name = "Admin"
```

### 2. Supabase Version

The Supabase CLI is quite outdated (v1.226.4 vs the latest v2.20.12). This could potentially cause issues with the authentication system.

### 3. Database Policy Issue

There's an infinite recursion issue in the RLS policy for the profiles table. This is causing 500 errors when trying to query the profiles table, which could be preventing the authentication system from working correctly.

### 4. Environment Variables

The environment variables for development mode bypasses were not being correctly loaded because they were missing the NEXT_PUBLIC_ prefix, which is required for client-side access.

## Solutions Implemented

### 1. Development Mode Bypass

Updated the sign-in process to bypass the actual Supabase call in development mode:

```javascript
// In development mode, we can bypass the actual sign-in process if needed
const isDev = process.env.NODE_ENV === 'development';
const shouldBypass = process.env.NEXT_PUBLIC_BYPASS_SIGNIN === 'true';

console.log('Sign-in environment check:', { 
  isDev, 
  shouldBypass,
  NODE_ENV: process.env.NODE_ENV,
  BYPASS_SIGNIN: process.env.NEXT_PUBLIC_BYPASS_SIGNIN
});

if (isDev && shouldBypass) {
  console.log('Development mode: bypassing actual sign-in process')
  return { error: null }
}
```

### 2. Environment Variable Fixes

Updated the environment variables in .env.local to use the NEXT_PUBLIC_ prefix for client-side access:

```
# Development Settings
NEXT_PUBLIC_SKIP_PROFILE_CHECK=true
NEXT_PUBLIC_BYPASS_SIGNIN=true
```

### 3. Improved Logging

Added detailed logging throughout the authentication flow to help diagnose issues:

```javascript
// Log environment variables for debugging
console.log('Environment mode:', process.env.NODE_ENV);
console.log('BYPASS_SIGNIN:', process.env.NEXT_PUBLIC_BYPASS_SIGNIN);
console.log('SKIP_PROFILE_CHECK:', process.env.NEXT_PUBLIC_SKIP_PROFILE_CHECK);
```

### 4. Timeout Handling

Added a timeout mechanism to prevent the sign-in process from hanging indefinitely:

```javascript
// Create a promise that rejects after a timeout
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error('Sign-in timed out. This might be due to database connection issues.'))
  }, 5000) // 5 second timeout
})

// Race the sign-in process against the timeout
return await Promise.race([
  (async () => {
    // Sign-in process
  })(),
  timeoutPromise
])
```

## Recommendations for Production

### 1. Configure SMTP

To send actual emails in production, you need to configure an SMTP server in Supabase. Uncomment and configure the SMTP settings in supabase/config.toml:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "admin@email.com"
sender_name = "Admin"
```

### 2. Update Supabase CLI

Update the Supabase CLI to the latest version:

```bash
npm install -g supabase@latest
```

### 3. Fix Database Policies

Fix the infinite recursion issue in the RLS policy for the profiles table. This might require disabling the policy temporarily to diagnose the issue:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

Then review and fix the policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### 4. Test Email Flow

Once the SMTP server is configured, test the email flow to ensure that magic links are being sent correctly.

## Development Workflow

For development, you can use the development mode bypass to simulate successful magic link sending without actually sending emails. This allows you to continue development even when there are issues with the email sending system.

To enable the bypass, set the following environment variables in .env.local:

```
NEXT_PUBLIC_BYPASS_SIGNIN=true
```

This will bypass the actual sign-in process and simulate a successful magic link sending.
