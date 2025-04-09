-- Script to set up Row Level Security (RLS) policies for smart dropdown tables
-- Run this script in the Supabase SQL editor

-- First, make sure the auth.users table exists (it should by default in Supabase)
-- Then, create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
    pin TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to automatically create a profile when a user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for the profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for the clients table
CREATE POLICY "Anyone can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for the categories table
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for the items table
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update items"
  ON items FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for the sizes table
CREATE POLICY "Anyone can view sizes"
  ON sizes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create sizes"
  ON sizes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update sizes"
  ON sizes FOR UPDATE
  TO authenticated
  USING (true);

-- For development purposes, you can also create policies that allow anonymous access
-- Uncomment these if you want to allow access without authentication

-- CREATE POLICY "Allow anonymous read access to clients"
--   ON clients FOR SELECT
--   TO anon
--   USING (true);

-- CREATE POLICY "Allow anonymous read access to categories"
--   ON categories FOR SELECT
--   TO anon
--   USING (true);

-- CREATE POLICY "Allow anonymous read access to items"
--   ON items FOR SELECT
--   TO anon
--   USING (true);

-- CREATE POLICY "Allow anonymous read access to sizes"
--   ON sizes FOR SELECT
--   TO anon
--   USING (true);

-- Insert a test user into the profiles table if it doesn't exist
INSERT INTO profiles (id, email, role, is_verified)
SELECT
  auth.uid(),
  auth.email(),
  'staff',
  true
WHERE
  NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  AND auth.uid() IS NOT NULL;

-- For development, you can also create a public access policy that bypasses authentication
-- This is useful for testing but should be removed in production

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public access policy for development" ON clients;
DROP POLICY IF EXISTS "Public access policy for development on clients" ON clients;
DROP POLICY IF EXISTS "Public access policy for development" ON categories;
DROP POLICY IF EXISTS "Public access policy for development on categories" ON categories;
DROP POLICY IF EXISTS "Public access policy for development" ON items;
DROP POLICY IF EXISTS "Public access policy for development on items" ON items;
DROP POLICY IF EXISTS "Public access policy for development" ON sizes;
DROP POLICY IF EXISTS "Public access policy for development on sizes" ON sizes;

-- Create new policies with specific names to avoid conflicts
CREATE POLICY "Public access policy for development on clients"
  ON clients FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access policy for development on categories"
  ON categories FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access policy for development on items"
  ON items FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access policy for development on sizes"
  ON sizes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add specific policies for anonymous access (no authentication required)
CREATE POLICY "Allow anonymous access to clients"
  ON clients FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to categories"
  ON categories FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to items"
  ON items FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to sizes"
  ON sizes FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create a function to check if the current user has access to the data
CREATE OR REPLACE FUNCTION public.user_has_access()
RETURNS BOOLEAN AS $$
BEGIN
  -- For development, always return true
  -- In production, you would check if the user has the right role
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
