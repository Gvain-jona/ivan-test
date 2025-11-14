-- Function to fix the RLS policy for the profiles table
-- This needs to be run in the Supabase SQL editor with admin privileges

-- Create the admin function to fix RLS
CREATE OR REPLACE FUNCTION public.admin_fix_profiles_rls()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- This is important to run with admin privileges
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Drop the existing policy
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";

  -- Create a new policy that allows authenticated users to insert their own profile
  CREATE POLICY "Enable insert for authenticated users only" 
  ON "public"."profiles" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

  -- Allow users to update their own profile
  DROP POLICY IF EXISTS "Enable update for users based on id" ON "public"."profiles";
  CREATE POLICY "Enable update for users based on id" 
  ON "public"."profiles" 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

  -- Allow users to select their own profile
  DROP POLICY IF EXISTS "Enable select for users based on id" ON "public"."profiles";
  CREATE POLICY "Enable select for users based on id" 
  ON "public"."profiles" 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Successfully fixed RLS policy for profiles table',
    'timestamp', now()
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_fix_profiles_rls() TO authenticated;

-- Comment on the function
COMMENT ON FUNCTION public.admin_fix_profiles_rls() IS 'Admin function to fix RLS policy for profiles table';
