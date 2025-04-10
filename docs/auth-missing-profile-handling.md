# Handling Missing User Profiles in Authentication

## Overview

This document summarizes the improvements made to handle the scenario where a user exists in Supabase's auth.users table but doesn't have a corresponding record in the profiles table.

## Scenario Description

This scenario can occur in several situations:

1. The user was created directly through Supabase Auth
2. The database trigger to create a profile record failed
3. The profiles table was created after users were already in the system
4. The profile record was deleted but the auth user remains

Without proper handling, this scenario can lead to errors and a broken authentication flow, as the application expects users to have corresponding profile records.

## Improvements Made

### 1. Auth Context - Initial User Load

The auth context has been updated to handle missing profiles during the initial user load:

- When a user is authenticated but no profile is found, a new profile is automatically created
- The new profile includes default values for required fields
- The user is redirected to the PIN setup page to complete their profile setup
- Detailed error logging is provided to help diagnose issues

### 2. Auth Context - Auth State Change

The auth state change handler has been updated to handle missing profiles:

- When an auth state change occurs and no profile is found, a new profile is automatically created
- The new profile includes the same default values as in the initial user load
- The user is redirected to the PIN setup page
- Detailed error logging is provided

### 3. Callback Route

The callback route has been updated to handle missing profiles:

- When processing a magic link and no profile is found, a new profile is automatically created
- The user is redirected to the PIN setup page
- Detailed error logging is provided

## Profile Creation Logic

When creating a new profile, the following fields are set:

- `id`: The user's ID from Supabase Auth
- `email`: The user's email from Supabase Auth
- `full_name`: The user's full name from user metadata, or a fallback derived from their email
- `role`: Default role of 'staff'
- `status`: Default status of 'active'
- `is_verified`: Set to false, indicating the user needs to set up a PIN
- `failed_attempts`: Set to 0

## Benefits of the Improvements

1. **Resilience**: The authentication system now works even if profiles are missing
2. **Self-Healing**: The system automatically creates missing profiles
3. **Consistent User Experience**: Users are always directed to the appropriate next step
4. **Better Debugging**: Detailed error logging makes it easier to diagnose issues

## Conclusion

By improving the handling of missing user profiles, we've created a more robust and resilient authentication system. The system now automatically creates missing profiles and directs users to complete their setup, ensuring a smooth authentication flow even when the database is in an inconsistent state.
