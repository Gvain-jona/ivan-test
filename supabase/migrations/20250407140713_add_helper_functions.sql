-- Add helper functions for user management
-- Created: 2025-04-07

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS check_user_exists_by_email_simple(TEXT);

-- Function to check if a user exists by email
CREATE OR REPLACE FUNCTION check_user_exists_by_email_simple(
  input_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.email = input_email
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_exists_by_email_simple(TEXT) TO authenticated;

COMMENT ON FUNCTION check_user_exists_by_email_simple IS 'Checks if a user exists by email and returns their basic profile information'; 