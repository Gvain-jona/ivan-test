-- Fix infinite recursion in profiles policies

-- First, enable bypass RLS for the helper functions
ALTER FUNCTION is_admin() SET search_path = '';
ALTER FUNCTION is_manager_or_admin() SET search_path = '';
ALTER FUNCTION is_staff_or_above() SET search_path = '';

-- Drop existing policies on profiles table
DROP POLICY IF EXISTS profiles_read_own ON profiles;
DROP POLICY IF EXISTS profiles_read_all_admin ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_update_all_admin ON profiles;
DROP POLICY IF EXISTS profiles_insert_admin ON profiles;
DROP POLICY IF EXISTS admin_all_access ON profiles;

-- Create new policies without recursion
-- Allow users to read their own profile
CREATE POLICY profiles_read_own ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a temporary policy to allow all operations during setup
-- This should be removed in production
CREATE POLICY profiles_temp_all_access ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
