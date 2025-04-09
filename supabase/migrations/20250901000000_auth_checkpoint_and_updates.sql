-- Auth System Checkpoint and Updates
-- This migration creates a checkpoint of the current auth tables and adds necessary functionality
-- Created: 2025-09-01

-- PART 1: CREATE CHECKPOINT
-- This allows us to rollback if needed

-- Create backup of profiles table
CREATE TABLE IF NOT EXISTS profiles_backup AS
SELECT * FROM profiles;

-- Create backup of allowed_emails table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'allowed_emails') THEN
        CREATE TABLE IF NOT EXISTS allowed_emails_backup AS
        SELECT * FROM allowed_emails;
    ELSE
        -- Create allowed_emails table if it doesn't exist
        CREATE TABLE allowed_emails (
            email TEXT PRIMARY KEY,
            role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff'))
        );
        
        -- Insert some default allowed emails
        INSERT INTO allowed_emails (email, role) VALUES
        ('admin@example.com', 'admin'),
        ('manager@example.com', 'manager'),
        ('staff@example.com', 'staff');
        
        -- Create backup
        CREATE TABLE IF NOT EXISTS allowed_emails_backup AS
        SELECT * FROM allowed_emails;
    END IF;
END
$$;

-- Create a function to restore from backup if needed
CREATE OR REPLACE FUNCTION restore_auth_tables()
RETURNS void AS $$
BEGIN
  -- Check if backup tables exist
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles_backup') THEN
    -- Delete current data
    DELETE FROM profiles;
    
    -- Restore from backup
    INSERT INTO profiles
    SELECT * FROM profiles_backup;
    
    RAISE NOTICE 'Profiles table restored from backup';
  ELSE
    RAISE NOTICE 'Profiles backup table not found';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'allowed_emails_backup') THEN
    -- Delete current data
    DELETE FROM allowed_emails;
    
    -- Restore from backup
    INSERT INTO allowed_emails
    SELECT * FROM allowed_emails_backup;
    
    RAISE NOTICE 'Allowed emails table restored from backup';
  ELSE
    RAISE NOTICE 'Allowed emails backup table not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up backups when no longer needed
CREATE OR REPLACE FUNCTION cleanup_auth_backups()
RETURNS void AS $$
BEGIN
  DROP TABLE IF EXISTS profiles_backup;
  DROP TABLE IF EXISTS allowed_emails_backup;
  DROP FUNCTION IF EXISTS restore_auth_tables();
  DROP FUNCTION IF EXISTS cleanup_auth_backups();
  RAISE NOTICE 'Auth backup tables and functions cleaned up';
END;
$$ LANGUAGE plpgsql;

-- PART 2: UPDATE EXISTING TABLES

-- Update profiles table if needed
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pin TEXT,
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS code_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;

-- Ensure RLS is enabled on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Update or create policies for profiles
-- Users can read their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users read own profile'
    ) THEN
        CREATE POLICY "Users read own profile"
        ON profiles FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    END IF;
END
$$;

-- Users can update their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users update own profile'
    ) THEN
        CREATE POLICY "Users update own profile"
        ON profiles FOR UPDATE
        TO authenticated
        USING (auth.uid() = id);
    END IF;
END
$$;

-- Admins can read all profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins read all profiles'
    ) THEN
        CREATE POLICY "Admins read all profiles"
        ON profiles FOR SELECT
        TO authenticated
        USING (EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        ));
    END IF;
END
$$;

-- Create policies for allowed_emails
-- Allow authenticated users to read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'allowed_emails' 
        AND policyname = 'Authenticated users can read allowed_emails'
    ) THEN
        CREATE POLICY "Authenticated users can read allowed_emails"
        ON allowed_emails FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END
$$;

-- Allow only admins to insert/update/delete
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'allowed_emails' 
        AND policyname = 'Admins can manage allowed_emails'
    ) THEN
        CREATE POLICY "Admins can manage allowed_emails"
        ON allowed_emails FOR ALL
        TO authenticated
        USING (EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        ));
    END IF;
END
$$;

-- PART 3: IMPLEMENT PIN HASHING AND VERIFICATION FUNCTIONS

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash a PIN
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN crypt(pin, gen_salt('bf')); -- Blowfish hashing
END;
$$ LANGUAGE plpgsql;

-- Function to verify a PIN
CREATE OR REPLACE FUNCTION verify_pin(user_id UUID, input_pin TEXT) RETURNS BOOLEAN AS $$
DECLARE
  stored_pin TEXT;
  attempts INTEGER;
BEGIN
  -- Get the stored PIN and current failed attempts
  SELECT pin, failed_attempts INTO stored_pin, attempts FROM profiles WHERE id = user_id;
  
  -- If no PIN is set, return false
  IF stored_pin IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the PIN matches
  IF stored_pin = crypt(input_pin, stored_pin) THEN
    -- Reset failed attempts on successful verification
    UPDATE profiles SET failed_attempts = 0 WHERE id = user_id;
    RETURN TRUE;
  ELSE
    -- Increment failed attempts
    UPDATE profiles SET failed_attempts = failed_attempts + 1 WHERE id = user_id;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- PART 4: UPDATE USER PROFILE TRIGGER

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM allowed_emails WHERE email = NEW.email) THEN
    INSERT INTO public.profiles (id, email, role, full_name, status)
    SELECT NEW.id, NEW.email, role, 
           COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
           'active'
    FROM allowed_emails WHERE email = NEW.email;
  ELSE
    -- Instead of raising an exception, just set a default role with inactive status
    INSERT INTO public.profiles (id, email, role, full_name, status)
    VALUES (NEW.id, NEW.email, 'staff', 
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
            'inactive');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PART 5: CREATE EMAIL VERIFICATION FUNCTION

CREATE OR REPLACE FUNCTION public.is_email_allowed(input_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM allowed_emails WHERE email = input_email);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- PART 6: ADD FUNCTION TO LOCK/UNLOCK ACCOUNTS

CREATE OR REPLACE FUNCTION public.lock_user_account(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET status = 'locked'
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.unlock_user_account(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET status = 'active',
      failed_attempts = 0
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 7: ADD FUNCTION TO RESET PIN

CREATE OR REPLACE FUNCTION public.reset_user_pin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET pin = NULL,
      failed_attempts = 0
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth users';
COMMENT ON TABLE allowed_emails IS 'Emails allowed to sign up with their assigned roles';
COMMENT ON FUNCTION hash_pin IS 'Securely hash a PIN using bcrypt';
COMMENT ON FUNCTION verify_pin IS 'Verify a PIN against the stored hash and track failed attempts';
COMMENT ON FUNCTION handle_new_user IS 'Create a profile when a new user signs up';
COMMENT ON FUNCTION is_email_allowed IS 'Check if an email is allowed to sign up';
COMMENT ON FUNCTION lock_user_account IS 'Lock a user account';
COMMENT ON FUNCTION unlock_user_account IS 'Unlock a user account';
COMMENT ON FUNCTION reset_user_pin IS 'Reset a user PIN';
COMMENT ON FUNCTION restore_auth_tables IS 'Restore auth tables from backup';
COMMENT ON FUNCTION cleanup_auth_backups IS 'Clean up auth backup tables and functions';
