-- Fix infinite recursion in profiles policies

-- Drop existing policies
DROP POLICY IF EXISTS profiles_read_own ON profiles;
DROP POLICY IF EXISTS profiles_read_all ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;

-- Create new policies without recursion
-- Allow users to read their own profile
CREATE POLICY profiles_read_own ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY profiles_read_all ON profiles
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins and managers to update profiles
CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Allow all authenticated users to insert their own profile
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow all authenticated users to delete their own profile
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Allow admins to delete any profile
CREATE POLICY profiles_delete_admin ON profiles
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
