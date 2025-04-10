-- Fix infinite recursion in profiles policies

-- Drop existing policies
DROP POLICY IF EXISTS profiles_read_own ON profiles;
DROP POLICY IF EXISTS profiles_read_all ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_delete_own ON profiles;
DROP POLICY IF EXISTS profiles_delete_admin ON profiles;

-- Create simple policies without recursion
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
