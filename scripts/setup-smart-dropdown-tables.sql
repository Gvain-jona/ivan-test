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

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table if it doesn't exist
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

-- Add sample clients if none exist
INSERT INTO clients (id, name, email, phone, status)
SELECT 
  uuid_generate_v4(), 
  'Client ' || n, 
  'client' || n || '@example.com',
  '+1-555-' || (1000 + n)::text,
  'active'
FROM generate_series(1, 5) AS n
WHERE NOT EXISTS (SELECT 1 FROM clients LIMIT 1);

-- Add sample categories if none exist
INSERT INTO categories (id, name, description, status)
SELECT 
  uuid_generate_v4(), 
  'Category ' || n, 
  'Description for category ' || n,
  'active'
FROM generate_series(1, 5) AS n
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
