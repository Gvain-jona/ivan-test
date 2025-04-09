-- Fix RLS policies to avoid infinite recursion
-- Created: 2025-08-02

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS profiles_admin_read_all ON profiles;
DROP POLICY IF EXISTS profiles_admin_update_all ON profiles;
DROP POLICY IF EXISTS profiles_admin_insert ON profiles;
DROP POLICY IF EXISTS profiles_admin_delete ON profiles;

-- Create a function to check if the current user is an admin without using profiles table
CREATE OR REPLACE FUNCTION is_admin_from_metadata()
RETURNS BOOLEAN AS $$
DECLARE
  user_metadata JSONB;
BEGIN
  -- Get the user metadata from auth.users
  SELECT raw_user_meta_data INTO user_metadata 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if the role in metadata is 'admin'
  RETURN user_metadata->>'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create new policies that don't cause infinite recursion
-- Create a policy for admins to read all profiles
CREATE POLICY profiles_admin_read_all ON profiles
  FOR SELECT
  USING (
    is_admin_from_metadata() OR auth.uid() = id
  );

-- Create a policy for admins to update all profiles
CREATE POLICY profiles_admin_update_all ON profiles
  FOR UPDATE
  USING (
    is_admin_from_metadata() OR auth.uid() = id
  );

-- Create a policy for admins to insert profiles
CREATE POLICY profiles_admin_insert ON profiles
  FOR INSERT
  WITH CHECK (
    is_admin_from_metadata()
  );

-- Create a policy for admins to delete profiles
CREATE POLICY profiles_admin_delete ON profiles
  FOR DELETE
  USING (
    is_admin_from_metadata()
  );

-- Update the handle_new_user function to set role from metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Get role from metadata or default to 'staff'
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'), -- Get role from metadata or default to 'staff'
    'active',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the helper functions to use metadata instead of profiles table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin_from_metadata();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_metadata JSONB;
BEGIN
  -- Get the user metadata from auth.users
  SELECT raw_user_meta_data INTO user_metadata 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if the role in metadata is 'admin' or 'manager'
  RETURN user_metadata->>'role' IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS BOOLEAN AS $$
DECLARE
  user_metadata JSONB;
BEGIN
  -- Get the user metadata from auth.users
  SELECT raw_user_meta_data INTO user_metadata 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if the role in metadata is 'admin', 'manager', or 'staff'
  RETURN user_metadata->>'role' IN ('admin', 'manager', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
