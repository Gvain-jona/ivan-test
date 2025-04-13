-- Migration: Remove PIN Verification
-- This migration removes PIN-related fields and functions
-- Created: 2025-09-20

-- Create a backup of the current profiles table
CREATE TABLE IF NOT EXISTS profiles_backup_20250920 AS
SELECT * FROM profiles;

-- Remove PIN-related columns from profiles table
ALTER TABLE profiles
DROP COLUMN IF EXISTS pin,
DROP COLUMN IF EXISTS verification_code,
DROP COLUMN IF EXISTS code_expiry,
DROP COLUMN IF EXISTS is_verified,
DROP COLUMN IF EXISTS failed_attempts;

-- Drop PIN-related functions
DROP FUNCTION IF EXISTS hash_pin(TEXT);
DROP FUNCTION IF EXISTS verify_pin(UUID, TEXT);
DROP FUNCTION IF EXISTS reset_user_pin(UUID);

-- Update the handle_new_user function to simplify profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is in the allowed_emails table
  IF EXISTS (SELECT 1 FROM allowed_emails WHERE email = NEW.email) THEN
    -- Insert with the role from allowed_emails
    INSERT INTO profiles (id, email, full_name, role, status)
    SELECT 
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      role, 
      'active'
    FROM allowed_emails 
    WHERE email = NEW.email;
  ELSE
    -- Insert with default role
    INSERT INTO profiles (id, email, full_name, role, status)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      'staff', 
      'active'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a function to restore from backup if needed
CREATE OR REPLACE FUNCTION restore_profiles_with_pin()
RETURNS void AS $$
BEGIN
  -- Check if backup table exists
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles_backup_20250920') THEN
    -- Delete current data
    DELETE FROM profiles;
    
    -- Restore from backup
    INSERT INTO profiles
    SELECT * FROM profiles_backup_20250920;
    
    RAISE NOTICE 'Profiles table restored from backup';
  ELSE
    RAISE NOTICE 'Profiles backup table not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth users';
COMMENT ON COLUMN profiles.role IS 'User role for access control (admin, manager, staff)';
COMMENT ON COLUMN profiles.status IS 'User account status (active, inactive, locked)';
COMMENT ON FUNCTION handle_new_user IS 'Create a profile when a new user signs up';
COMMENT ON FUNCTION restore_profiles_with_pin IS 'Restore profiles table from backup with PIN fields';
