-- Supabase Auth Migration for Ivan Prints Business Management System
-- This migration consolidates all authentication-related tables into a single file
-- Created: 2025-08-01

-- Drop existing custom auth tables and functions
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP FUNCTION IF EXISTS verify_user_code(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_pin(UUID, TEXT) CASCADE;

-- Keep the profiles table but modify it to work with standard Supabase Auth
-- First drop the existing profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Create a simplified profiles table that extends Supabase Auth users
CREATE TABLE profiles (
  -- Link to Supabase Auth user
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Basic user information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'locked')) DEFAULT 'active',
  -- Remove custom authentication fields (PIN, verification code, etc.)
  -- Keep only the fields needed for role-based access control
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create helper functions for role-based access control
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role directly without using a subquery
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role directly without using a subquery
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role directly without using a subquery
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role IN ('admin', 'manager', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Default new users to 'staff' role
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
    'staff', -- Default role
    'active',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
-- Allow users to read their own profile
CREATE POLICY profiles_read_own ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a policy for admins to read all profiles
CREATE POLICY profiles_admin_read_all ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy for admins to update all profiles
CREATE POLICY profiles_admin_update_all ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy for admins to insert profiles
CREATE POLICY profiles_admin_insert ON profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy for admins to delete profiles
CREATE POLICY profiles_admin_delete ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth users';
COMMENT ON COLUMN profiles.role IS 'User role for access control (admin, manager, staff)';
COMMENT ON COLUMN profiles.status IS 'User account status (active, inactive, locked)';

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
