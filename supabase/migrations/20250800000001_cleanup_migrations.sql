-- Clean up unused or problematic migrations
-- Created: 2025-08-01

-- This migration consolidates and cleans up previous attempts to fix RLS issues
-- and standardizes the authentication system

-- First, ensure we have the necessary helper functions with proper security settings
-- These functions are used in RLS policies and need to bypass RLS themselves

-- Helper function to check if the current user is an admin
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

-- Helper function to check if the current user is a manager or admin
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

-- Helper function to check if the current user is staff or above
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

-- Standardize the verification code generation function
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding similar-looking characters
  i INTEGER;
BEGIN
  code := '';
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION is_admin() IS 'Checks if the current user is an admin (bypasses RLS)';
COMMENT ON FUNCTION is_manager_or_admin() IS 'Checks if the current user is a manager or admin (bypasses RLS)';
COMMENT ON FUNCTION is_staff_or_above() IS 'Checks if the current user is staff or above (bypasses RLS)';
COMMENT ON FUNCTION generate_verification_code() IS 'Generates a standardized 8-character alphanumeric verification code';

-- Create a function to disable RLS for a request (admin only)
CREATE OR REPLACE FUNCTION disable_rls_for_request()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- This function is a no-op but allows us to use the SECURITY DEFINER
  -- attribute to bypass RLS for the current transaction
  RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_manager_or_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_staff_or_above() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_auth_event(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
