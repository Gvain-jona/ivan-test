'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DatabaseSetupMessageProps {
  title?: string
  description?: string
  showMigrationInstructions?: boolean
  showSampleDataButton?: boolean
  showRLSPolicyButton?: boolean
}

export function DatabaseSetupMessage({
  title = 'Database Setup Required',
  description = 'The required database tables do not exist or are not properly configured.',
  showMigrationInstructions = true,
  showSampleDataButton = true,
  showRLSPolicyButton = true,
}: DatabaseSetupMessageProps) {
  const { toast } = useToast()

  const copyMigrationScript = () => {
    toast({
      title: 'Migration Script Copied',
      description: 'The SQL migration script has been copied to your clipboard. Paste it into the Supabase SQL editor and run it.',
    })
    navigator.clipboard.writeText(`
-- Migration to set up all tables needed for smart dropdowns
-- Run this script in the Supabase SQL editor

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sizes table if it doesn't exist
CREATE TABLE IF NOT EXISTS sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS clients_name_idx ON clients(name);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);
CREATE INDEX IF NOT EXISTS categories_name_idx ON categories(name);
CREATE INDEX IF NOT EXISTS categories_status_idx ON categories(status);
CREATE INDEX IF NOT EXISTS items_name_idx ON items(name);
CREATE INDEX IF NOT EXISTS items_category_id_idx ON items(category_id);
CREATE INDEX IF NOT EXISTS items_status_idx ON items(status);
CREATE INDEX IF NOT EXISTS sizes_name_idx ON sizes(name);
CREATE INDEX IF NOT EXISTS sizes_status_idx ON sizes(status);
CREATE INDEX IF NOT EXISTS sizes_is_default_idx ON sizes(is_default);

-- Add default sizes if the table is empty
INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Small', 'Small size', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Small');

INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Medium', 'Medium size', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Medium');

INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Large', 'Large size', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Large');

INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Custom', 'Custom size', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Custom');

-- Update existing tables if they exist
DO $$
BEGIN
    -- Add status column to clients if it doesn't exist
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'clients'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clients'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE clients ADD COLUMN status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    END IF;

    -- Add status column to categories if it doesn't exist
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'categories'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'categories'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE categories ADD COLUMN status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    END IF;

    -- Add status column to items if it doesn't exist
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'items'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'items'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE items ADD COLUMN status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS clients_name_idx ON clients(name);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);
CREATE INDEX IF NOT EXISTS categories_name_idx ON categories(name);
CREATE INDEX IF NOT EXISTS categories_status_idx ON categories(status);
CREATE INDEX IF NOT EXISTS items_name_idx ON items(name);
CREATE INDEX IF NOT EXISTS items_category_id_idx ON items(category_id);
CREATE INDEX IF NOT EXISTS items_status_idx ON items(status);

-- Add sample data if tables are empty
INSERT INTO clients (id, name, status)
SELECT uuid_generate_v4(), 'Sample Client ' || n, 'active'
FROM generate_series(1, 5) AS n
WHERE NOT EXISTS (SELECT 1 FROM clients LIMIT 1);

INSERT INTO categories (id, name, status)
SELECT uuid_generate_v4(), 'Sample Category ' || n, 'active'
FROM generate_series(1, 5) AS n
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Get first category ID for sample items
DO $$
DECLARE
    first_category_id UUID;
BEGIN
    SELECT id INTO first_category_id FROM categories LIMIT 1;

    IF first_category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM items LIMIT 1) THEN
        INSERT INTO items (id, name, category_id, status)
        SELECT uuid_generate_v4(), 'Sample Item ' || n, first_category_id, 'active'
        FROM generate_series(1, 5) AS n;
    END IF;
END $$;
    `)
  }

  const copyRLSPolicyScript = () => {
    toast({
      title: 'RLS Policy Script Copied',
      description: 'The SQL RLS policy script has been copied to your clipboard. Paste it into the Supabase SQL editor and run it.',
    })
    navigator.clipboard.writeText(`
-- Script to set up Row Level Security (RLS) policies for smart dropdown tables
-- Run this script in the Supabase SQL editor

-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;

-- Create public access policies for development
-- These policies allow all operations without authentication
-- IMPORTANT: In production, you should replace these with more restrictive policies

-- Clients table policies
DROP POLICY IF EXISTS "Public access policy for development on clients" ON clients;
CREATE POLICY "Public access policy for development on clients"
  ON clients FOR ALL
  USING (true)
  WITH CHECK (true);

-- Categories table policies
DROP POLICY IF EXISTS "Public access policy for development on categories" ON categories;
CREATE POLICY "Public access policy for development on categories"
  ON categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- Items table policies
DROP POLICY IF EXISTS "Public access policy for development on items" ON items;
CREATE POLICY "Public access policy for development on items"
  ON items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Sizes table policies
DROP POLICY IF EXISTS "Public access policy for development on sizes" ON sizes;
CREATE POLICY "Public access policy for development on sizes"
  ON sizes FOR ALL
  USING (true)
  WITH CHECK (true);
    `)
  }

  const copySampleDataScript = () => {
    navigator.clipboard.writeText(`
-- Add sample data to the database
-- Run this script in the Supabase SQL editor

-- Add sample clients if none exist
INSERT INTO clients (id, name, email, phone, status)
SELECT
  uuid_generate_v4(),
  'Client ' || n,
  'client' || n || '@example.com',
  '+1-555-' || (1000 + n)::text,
  'active'
FROM generate_series(1, 10) AS n
WHERE NOT EXISTS (SELECT 1 FROM clients LIMIT 1);

-- Add sample categories if none exist
INSERT INTO categories (id, name, description, status)
SELECT
  uuid_generate_v4(),
  'Category ' || n,
  'Description for category ' || n,
  'active'
FROM generate_series(1, 10) AS n
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Add sample items for each category
DO $$
DECLARE
  category_record RECORD;
BEGIN
  -- Only add items if none exist
  IF NOT EXISTS (SELECT 1 FROM items LIMIT 1) THEN
    -- Loop through each category
    FOR category_record IN SELECT id FROM categories LOOP
      -- Add 5 items for each category
      INSERT INTO items (id, name, description, category_id, price, cost, status)
      SELECT
        uuid_generate_v4(),
        'Item ' || n || ' (Cat: ' || substring(category_record.id::text, 1, 8) || ')',
        'Description for item ' || n || ' in category ' || substring(category_record.id::text, 1, 8),
        category_record.id,
        (random() * 100 + 10)::numeric(10,2),
        (random() * 50 + 5)::numeric(10,2),
        'active'
      FROM generate_series(1, 5) AS n;
    END LOOP;
  END IF;
END $$;

-- Add default sizes if the table is empty
INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Small', 'Small size', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Small');

INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Medium', 'Medium size', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Medium');

INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Large', 'Large size', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Large');

INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Custom', 'Custom size', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Custom');

-- Add some custom sizes for variety
INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Extra Large', 'Extra large size', 'active', false
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Extra Large');

INSERT INTO sizes (id, name, description, status, is_default)
SELECT uuid_generate_v4(), 'Extra Small', 'Extra small size', 'active', false
WHERE NOT EXISTS (SELECT 1 FROM sizes WHERE name = 'Extra Small');
    `)

    toast({
      title: 'Sample Data Script Copied',
      description: 'The SQL sample data script has been copied to your clipboard. Paste it into the Supabase SQL editor and run it.',
    })
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {showMigrationInstructions && (
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">How to Fix:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Open your Supabase dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Click the button below to copy the migration script</li>
              <li>Paste the script into the SQL Editor</li>
              <li>Run the script</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </CardContent>
      )}

      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>

        {showMigrationInstructions && (
          <Button onClick={copyMigrationScript}>
            Copy Migration Script
          </Button>
        )}

        {showSampleDataButton && (
          <Button variant="secondary" onClick={copySampleDataScript}>
            Copy Sample Data Script
          </Button>
        )}

        {showRLSPolicyButton && (
          <Button variant="secondary" onClick={copyRLSPolicyScript}>
            Copy RLS Policy Script
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
