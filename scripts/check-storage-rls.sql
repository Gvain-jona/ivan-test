-- Script to check storage RLS policies and fix them

-- Check if RLS is enabled on storage.objects
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- List existing policies on storage.objects
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check bucket configuration
SELECT *
FROM storage.buckets
WHERE name = 'logos';

-- Fix RLS policies for storage.objects

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create policy to allow public read access to files in public buckets
CREATE POLICY "Allow public read access to files" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id IN ('logos', 'invoices'));

-- Create specific policy for logos bucket
CREATE POLICY "Allow public access to logos bucket" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'logos');

-- Create policy to allow authenticated users to upload to logos bucket
CREATE POLICY "Allow authenticated users to upload to logos bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

-- Make sure the logos bucket is public
UPDATE storage.buckets
SET public = true
WHERE name = 'logos';
