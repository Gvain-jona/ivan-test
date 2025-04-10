# Role Synchronization Between Allowed Emails and Profiles

## Overview

This document explains how roles are synchronized between the `allowed_emails` table and the `profiles` table during user registration and profile creation.

## Problem

Previously, when a user signed up and a profile was created for them, the role was hardcoded as 'staff' regardless of the role assigned to them in the `allowed_emails` table. This resulted in a mismatch where a user might be listed as an 'admin' in the `allowed_emails` table but would be assigned as 'staff' in their profile.

## Solution

We've updated the profile creation logic in all relevant places to check the `allowed_emails` table and use the role from there when creating a new profile. If the user's email is not found in the `allowed_emails` table or if the role is not specified, it will default to 'staff'.

## Implementation Details

The role synchronization has been implemented in three key places:

### 1. Auth Context - Initial User Load

When a user is first loaded in the auth context, we check if they have a profile. If not, we create one with the role from the `allowed_emails` table:

```javascript
// Check if the user is in the allowed_emails table and get their role
const { data: allowedEmail, error: allowedEmailError } = await supabase
  .from('allowed_emails')
  .select('role')
  .eq('email', user.email)
  .maybeSingle()

// Use the role from allowed_emails if available, otherwise default to 'staff'
const userRole = allowedEmail?.role || 'staff'
console.log(`Using role from allowed_emails: ${userRole} for user ${user.email}`)

// Profile doesn't exist, create it
const { data: newProfile, error: insertError } = await supabase
  .from('profiles')
  .insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    role: userRole, // Use role from allowed_emails
    status: 'active',
    is_verified: false, // They need to set up a PIN
    failed_attempts: 0
  })
  .select('*')
  .single()
```

### 2. Auth Context - Auth State Change Handler

When the auth state changes (e.g., a user signs in), we also check if they have a profile. If not, we create one with the role from the `allowed_emails` table:

```javascript
// Check if the user is in the allowed_emails table and get their role
const { data: allowedEmail, error: allowedEmailError } = await supabase
  .from('allowed_emails')
  .select('role')
  .eq('email', session.user.email)
  .maybeSingle()

// Use the role from allowed_emails if available, otherwise default to 'staff'
const userRole = allowedEmail?.role || 'staff'
console.log(`Using role from allowed_emails: ${userRole} for user ${session.user.email}`)

// Profile doesn't exist, create it
const { data: newProfile, error: insertError } = await supabase
  .from('profiles')
  .insert({
    id: session.user.id,
    email: session.user.email,
    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
    role: userRole, // Use role from allowed_emails
    status: 'active',
    is_verified: false, // They need to set up a PIN
    failed_attempts: 0
  })
  .select('*')
  .single()
```

### 3. Callback Route

When a user completes the sign-in process via the callback route, we also check if they have a profile. If not, we create one with the role from the `allowed_emails` table:

```javascript
// Check if the user is in the allowed_emails table and get their role
const { data: allowedEmail, error: allowedEmailError } = await supabase
  .from('allowed_emails')
  .select('role')
  .eq('email', data.user.email)
  .maybeSingle()

// Use the role from allowed_emails if available, otherwise default to 'staff'
const userRole = allowedEmail?.role || 'staff'
console.log(`Using role from allowed_emails: ${userRole} for user ${data.user.email}`)

// Profile doesn't exist, create it
const { error: insertError } = await supabase
  .from('profiles')
  .insert({
    id: data.user.id,
    email: data.user.email,
    full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
    role: userRole, // Use role from allowed_emails
    status: 'active',
    is_verified: false, // They need to set up a PIN
    failed_attempts: 0
  })
```

### 4. Create Profile Page

When a user manually creates a profile via the `/auth/create-profile` page, we also check the `allowed_emails` table and use the role from there:

```javascript
// Check if the user is in the allowed_emails table and get their role
const { data: allowedEmail, error: allowedEmailError } = await supabase
  .from('allowed_emails')
  .select('role')
  .eq('email', user.email)
  .maybeSingle()

// Use the role from allowed_emails if available, otherwise default to 'staff'
const userRole = allowedEmail?.role || 'staff'
console.log(`Using role from allowed_emails: ${userRole} for user ${user.email}`)

// Create a new profile
const { error: insertError } = await supabase
  .from('profiles')
  .insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    role: userRole, // Use role from allowed_emails
    status: 'active',
    is_verified: false, // They need to set up a PIN
    failed_attempts: 0
  })
```

## Testing

To test the role synchronization:

1. Add a new email to the `allowed_emails` table with a specific role (e.g., 'admin')
2. Sign up with that email
3. Verify that the role in the `profiles` table matches the role in the `allowed_emails` table

## Conclusion

With these changes, the role assigned to a user in the `allowed_emails` table will be properly synchronized to their profile when they sign up. This ensures consistency between the two tables and prevents the need for manual role adjustments after user registration.
