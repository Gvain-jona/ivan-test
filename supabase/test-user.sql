-- Create a test user for authentication testing
-- Run this in the Supabase SQL editor

-- First, create a user in the auth.users table
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Then, create a profile for the user
INSERT INTO public.profiles (
  id,
  full_name,
  email,
  role,
  status,
  created_at,
  updated_at
)
SELECT
  id,
  'Test User',
  'test@example.com',
  'admin',
  'active',
  now(),
  now()
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT (id) DO NOTHING;

-- Create another test user with manager role
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
)
VALUES (
  gen_random_uuid(),
  'manager@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

INSERT INTO public.profiles (
  id,
  full_name,
  email,
  role,
  status,
  created_at,
  updated_at
)
SELECT
  id,
  'Manager User',
  'manager@example.com',
  'manager',
  'active',
  now(),
  now()
FROM auth.users
WHERE email = 'manager@example.com'
ON CONFLICT (id) DO NOTHING;

-- Create a staff user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
)
VALUES (
  gen_random_uuid(),
  'staff@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

INSERT INTO public.profiles (
  id,
  full_name,
  email,
  role,
  status,
  created_at,
  updated_at
)
SELECT
  id,
  'Staff User',
  'staff@example.com',
  'staff',
  'active',
  now(),
  now()
FROM auth.users
WHERE email = 'staff@example.com'
ON CONFLICT (id) DO NOTHING;

-- Create a locked user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
)
VALUES (
  gen_random_uuid(),
  'locked@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

INSERT INTO public.profiles (
  id,
  full_name,
  email,
  role,
  status,
  created_at,
  updated_at
)
SELECT
  id,
  'Locked User',
  'locked@example.com',
  'staff',
  'locked',
  now(),
  now()
FROM auth.users
WHERE email = 'locked@example.com'
ON CONFLICT (id) DO NOTHING;
