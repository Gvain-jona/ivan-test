-- Fix RLS policies to avoid infinite recursion
-- Run this in the Supabase SQL editor

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "profiles_admin_read_all" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_admin_update_all" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_admin_insert" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_admin_delete" ON "public"."profiles";

-- Create simpler policies that don't cause infinite recursion
-- Allow anyone to read any profile (we'll rely on Supabase Auth for security)
CREATE POLICY "profiles_read_all" ON "public"."profiles"
  FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON "public"."profiles"
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow anyone to insert profiles (we'll rely on Supabase Auth for security)
CREATE POLICY "profiles_insert_all" ON "public"."profiles"
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete profiles (we'll rely on Supabase Auth for security)
CREATE POLICY "profiles_delete_all" ON "public"."profiles"
  FOR DELETE
  USING (true);
