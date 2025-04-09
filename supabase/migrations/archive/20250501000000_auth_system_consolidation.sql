-- Authentication System Consolidation for Ivan Prints Business Management System
-- This migration consolidates the authentication system to work with Supabase Auth

-- First, ensure the auth schema exists and is properly configured
-- This is typically handled by Supabase automatically, but we include it for completeness

-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS auth_sessions;
DROP TABLE IF EXISTS profiles;

-- Create a profiles table that extends Supabase Auth users
-- This table will store our custom authentication data
CREATE TABLE profiles (
  -- Link to Supabase Auth user
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Basic user information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'locked')),
  -- Authentication fields
  pin TEXT, -- bcrypt-hashed 4-digit PIN
  verification_code VARCHAR(20),
  code_expiry TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT FALSE,
  failed_attempts INTEGER DEFAULT 0,
  -- Device management
  devices JSONB DEFAULT '[]'::jsonb NOT NULL,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a sessions table for tracking custom session data
-- This complements Supabase Auth sessions with our custom requirements
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  user_agent TEXT,
  last_pin_entry TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_verification_code_idx ON profiles(verification_code);
CREATE INDEX IF NOT EXISTS profiles_is_verified_idx ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_device_id_idx ON auth_sessions(device_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions(expires_at);

-- Create a function to automatically update the updated_at timestamp
DROP FUNCTION IF EXISTS update_updated_at_column();
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RPC functions for authentication operations

-- Drop existing functions if they exist to avoid return type conflicts
DROP FUNCTION IF EXISTS verify_user_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS check_pin_reentry(UUID, TEXT);

-- Function to verify a user's verification code
CREATE FUNCTION verify_user_code(user_email TEXT, verification_code_input TEXT)
RETURNS TABLE(success BOOLEAN, user_id UUID, message TEXT) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get the user record
  SELECT p.* INTO user_record
  FROM profiles p
  WHERE p.email = user_email
  AND p.status = 'active'
  LIMIT 1;

  -- Check if user exists
  IF user_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'User not found'::TEXT;
    RETURN;
  END IF;

  -- Check if verification code matches
  IF user_record.verification_code != verification_code_input THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Invalid verification code'::TEXT;
    RETURN;
  END IF;

  -- Check if verification code is expired
  IF user_record.code_expiry < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Verification code expired'::TEXT;
    RETURN;
  END IF;

  -- Mark user as verified
  UPDATE profiles
  SET is_verified = TRUE
  WHERE id = user_record.id;

  -- Return success
  RETURN QUERY SELECT true, user_record.id, 'Verification successful'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a PIN re-entry is required
CREATE FUNCTION check_pin_reentry(user_id_input UUID, device_id_input TEXT)
RETURNS TABLE(required BOOLEAN, reason TEXT) AS $$
DECLARE
  session_record RECORD;
  inactivity_threshold INTERVAL = INTERVAL '2 hours';
BEGIN
  -- Get the session record
  SELECT * INTO session_record
  FROM auth_sessions
  WHERE user_id = user_id_input
  AND device_id = device_id_input
  AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if session exists
  IF session_record IS NULL THEN
    RETURN QUERY SELECT true, 'No active session found'::TEXT;
    RETURN;
  END IF;

  -- Check if PIN re-entry is required due to inactivity
  IF (NOW() - session_record.last_pin_entry) > inactivity_threshold THEN
    RETURN QUERY SELECT true, 'Session inactive for too long'::TEXT;
    RETURN;
  END IF;

  -- No PIN re-entry required
  RETURN QUERY SELECT false, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up Row Level Security policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS profiles_read_own ON profiles;
DROP POLICY IF EXISTS profiles_read_all ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_delete_own ON profiles;
DROP POLICY IF EXISTS profiles_delete_admin ON profiles;
DROP POLICY IF EXISTS auth_sessions_read_own ON auth_sessions;
DROP POLICY IF EXISTS auth_sessions_read_all ON auth_sessions;
DROP POLICY IF EXISTS auth_sessions_insert ON auth_sessions;
DROP POLICY IF EXISTS auth_sessions_update ON auth_sessions;
DROP POLICY IF EXISTS auth_sessions_delete ON auth_sessions;
DROP POLICY IF EXISTS auth_sessions_delete_admin ON auth_sessions;

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY profiles_read_own ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow everyone to read all profiles (temporary fix)
CREATE POLICY profiles_read_all ON profiles
  FOR SELECT
  USING (true);

-- Allow everyone to update profiles (temporary fix)
CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (true);

-- Allow everyone to insert profiles (temporary fix)
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow everyone to delete profiles (temporary fix)
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE
  USING (true);

-- Auth sessions table policies
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own sessions
CREATE POLICY auth_sessions_read_own ON auth_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow everyone to read all sessions (temporary fix)
CREATE POLICY auth_sessions_read_all ON auth_sessions
  FOR SELECT
  USING (true);

-- Allow everyone to insert sessions (temporary fix)
CREATE POLICY auth_sessions_insert ON auth_sessions
  FOR INSERT
  WITH CHECK (true);

-- Allow everyone to update sessions (temporary fix)
CREATE POLICY auth_sessions_update ON auth_sessions
  FOR UPDATE
  USING (true);

-- Allow everyone to delete sessions (temporary fix)
CREATE POLICY auth_sessions_delete ON auth_sessions
  FOR DELETE
  USING (true);

-- Allow admins to delete any session
CREATE POLICY auth_sessions_delete_admin ON auth_sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
