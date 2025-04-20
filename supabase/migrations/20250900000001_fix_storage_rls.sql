-- Fix Storage RLS Policies
-- Created: 2025-09-01

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to files" ON storage.objects;

-- Create policies for storage.objects
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = owner);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
  FOR DELETE TO authenticated
  USING (auth.uid()::text = owner);

-- Allow public read access to files in public buckets
CREATE POLICY "Allow public read access to files" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id IN ('logos', 'invoices'));

-- Create specific policies for each bucket
-- Logos bucket (public)
CREATE POLICY "Allow public access to logos bucket" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'logos');

CREATE POLICY "Allow authenticated users to upload to logos bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

-- Invoices bucket (public)
CREATE POLICY "Allow public access to invoices bucket" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'invoices');

CREATE POLICY "Allow authenticated users to upload to invoices bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoices');

-- Orders bucket (private)
CREATE POLICY "Allow authenticated users to access orders bucket" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'orders');

-- Profiles bucket (private)
CREATE POLICY "Allow authenticated users to access profiles bucket" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'profiles');

-- Materials bucket (private)
CREATE POLICY "Allow authenticated users to access materials bucket" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'materials');

-- Receipts bucket (private)
CREATE POLICY "Allow authenticated users to access receipts bucket" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'receipts');
