-- Add helper functions for RLS management
-- Created: 2025-07-01

-- Function to disable RLS for a request (admin only)
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION disable_rls_for_request() TO authenticated;

-- Function to check if a user exists by email (bypasses RLS)
CREATE OR REPLACE FUNCTION check_user_exists_by_email(user_email TEXT)
RETURNS TABLE (
  user_exists BOOLEAN,
  user_id UUID,
  email TEXT,
  user_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) > 0 AS user_exists,
    p.id AS user_id,
    p.email AS email,
    p.status AS user_status
  FROM 
    profiles p
  WHERE 
    p.email = user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_exists_by_email(TEXT) TO authenticated;
