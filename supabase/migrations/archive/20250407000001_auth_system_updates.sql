-- Authentication System Updates for Ivan Prints Business Management System

-- Alter users table to add authentication fields
ALTER TABLE users
  -- Add PIN field (bcrypt hashed)
  ADD COLUMN IF NOT EXISTS pin TEXT,
  -- Add verification code field
  ADD COLUMN IF NOT EXISTS verification_code VARCHAR(20),
  -- Add code expiry timestamp
  ADD COLUMN IF NOT EXISTS code_expiry TIMESTAMP WITH TIME ZONE,
  -- Add verification status
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  -- Add failed login attempts counter
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;

-- Alter sessions table to add device information
ALTER TABLE sessions
  -- Add device ID field
  ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT '';

-- Create indexes for authentication-related fields
CREATE INDEX IF NOT EXISTS users_verification_code_idx ON users(verification_code);
CREATE INDEX IF NOT EXISTS users_is_verified_idx ON users(is_verified);
CREATE INDEX IF NOT EXISTS sessions_device_id_idx ON sessions(device_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

-- Function to generate verification codes
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

-- Function to add a device to a user
CREATE OR REPLACE FUNCTION add_user_device(
  user_id UUID,
  new_device_id TEXT,
  device_name TEXT,
  user_agent TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_devices JSONB;
  device_count INTEGER;
  user_role TEXT;
  max_devices INTEGER;
BEGIN
  -- Get user's current devices and role
  SELECT devices, role INTO current_devices, user_role FROM public.users WHERE id = user_id;
  
  -- Set max devices based on role
  IF user_role = 'admin' THEN
    max_devices := 999; -- Effectively unlimited
  ELSIF user_role = 'manager' THEN
    max_devices := 4;
  ELSE -- staff
    max_devices := 2;
  END IF;
  
  -- Count current devices
  device_count := jsonb_array_length(current_devices);
  
  -- Check if device already exists
  FOR i IN 0..device_count-1 LOOP
    IF current_devices->i->>'device_id' = new_device_id THEN
      -- Update last_used timestamp
      current_devices := jsonb_set(
        current_devices, 
        ARRAY[i::text, 'last_used'], 
        to_jsonb(now()::text)
      );
      
      -- Update device information
      current_devices := jsonb_set(
        current_devices, 
        ARRAY[i::text, 'user_agent'], 
        to_jsonb(user_agent)
      );
      
      -- Update devices
      UPDATE public.users SET devices = current_devices WHERE id = user_id;
      RETURN TRUE;
    END IF;
  END LOOP;
  
  -- If device limit reached, return false
  IF device_count >= max_devices THEN
    RETURN FALSE;
  END IF;
  
  -- Add new device
  current_devices := current_devices || jsonb_build_object(
    'device_id', new_device_id,
    'device_name', device_name,
    'user_agent', user_agent,
    'last_used', now()::text
  );
  
  -- Update devices
  UPDATE public.users SET devices = current_devices WHERE id = user_id;
  RETURN TRUE;
END;
$$;

-- Function to remove a device from a user
CREATE OR REPLACE FUNCTION remove_user_device(
  user_id UUID,
  device_id_to_remove TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_devices JSONB;
  new_devices JSONB := '[]'::jsonb;
  device_count INTEGER;
  device JSONB;
BEGIN
  -- Get user's current devices
  SELECT devices INTO current_devices FROM public.users WHERE id = user_id;
  
  -- Count current devices
  device_count := jsonb_array_length(current_devices);
  
  -- Build new devices array without the specified device
  FOR i IN 0..device_count-1 LOOP
    device := current_devices->i;
    IF device->>'device_id' != device_id_to_remove THEN
      new_devices := new_devices || device;
    END IF;
  END LOOP;
  
  -- Update devices
  UPDATE public.users SET devices = new_devices WHERE id = user_id;
  
  -- Delete sessions for this device
  DELETE FROM public.sessions WHERE user_id = user_id AND device_id = device_id_to_remove;
  
  RETURN TRUE;
END;
$$;

-- Function to clear all devices for a user
CREATE OR REPLACE FUNCTION clear_all_user_devices(
  user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Clear devices array
  UPDATE public.users SET devices = '[]'::jsonb WHERE id = user_id;
  
  -- Delete all sessions for this user
  DELETE FROM public.sessions WHERE user_id = user_id;
  
  RETURN TRUE;
END;
$$;

-- Function to regenerate verification codes
CREATE OR REPLACE FUNCTION check_and_regenerate_verification_codes()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update verification codes for users where the code has expired
  UPDATE public.users
  SET 
    verification_code = generate_verification_code(),
    code_expiry = NOW() + INTERVAL '3 months'
  WHERE 
    code_expiry < NOW() OR
    code_expiry IS NULL;
END;
$$;

-- Function to verify user PIN
CREATE OR REPLACE FUNCTION verify_user_pin(
  user_email TEXT,
  user_pin TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  is_verified BOOLEAN,
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user by email
  SELECT * INTO user_record FROM public.users
  WHERE email = user_email AND status = 'active';
  
  -- If user found and PIN matches
  IF FOUND AND user_record.pin = user_pin THEN
    -- Reset failed attempts
    UPDATE public.users
    SET failed_attempts = 0
    WHERE id = user_record.id;
    
    -- Return success
    RETURN QUERY
    SELECT 
      user_record.id,
      user_record.name,
      user_record.email,
      user_record.role,
      user_record.status,
      user_record.is_verified,
      TRUE as success;
  ELSE
    -- If user found but PIN doesn't match, increment failed attempts
    IF FOUND THEN
      UPDATE public.users
      SET failed_attempts = failed_attempts + 1
      WHERE id = user_record.id;
    END IF;
    
    -- Return failure
    RETURN QUERY
    SELECT 
      NULL::UUID as id,
      NULL as name,
      user_email as email,
      NULL as role,
      NULL as status,
      NULL::BOOLEAN as is_verified,
      FALSE as success;
  END IF;
END;
$$;

-- Function to verify user code
CREATE OR REPLACE FUNCTION verify_user_code(
  user_email TEXT,
  verification_code_input TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user by email
  SELECT * INTO user_record FROM public.users
  WHERE email = user_email AND status = 'active';
  
  -- If user found and verification code matches
  IF FOUND AND user_record.verification_code = verification_code_input AND user_record.code_expiry > NOW() THEN
    -- Update is_verified
    UPDATE public.users
    SET is_verified = TRUE
    WHERE id = user_record.id;
    
    -- Return success
    RETURN QUERY
    SELECT 
      user_record.id,
      user_record.name,
      user_record.email,
      TRUE as success;
  ELSE
    -- Return failure
    RETURN QUERY
    SELECT 
      NULL::UUID as id,
      NULL as name,
      user_email as email,
      FALSE as success;
  END IF;
END;
$$;

-- Function to update user PIN
CREATE OR REPLACE FUNCTION update_user_pin(
  user_id UUID,
  new_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update PIN
  UPDATE public.users
  SET pin = new_pin
  WHERE id = user_id;
  
  -- Clear all devices
  PERFORM clear_all_user_devices(user_id);
  
  RETURN TRUE;
END;
$$;

-- Generate verification codes for existing users without codes
UPDATE users
SET 
  verification_code = generate_verification_code(),
  code_expiry = NOW() + INTERVAL '3 months'
WHERE 
  verification_code IS NULL; 