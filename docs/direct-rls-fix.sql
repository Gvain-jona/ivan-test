-- Direct fix for RLS policy on profiles table
-- Run this in the Supabase SQL editor

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

-- Verify the policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'profiles';
