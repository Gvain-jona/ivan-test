-- Migration to update tables for smart dropdown functionality
-- Created: 2025-07-01

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables if they don't exist
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

-- Add some sample data if tables are empty
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
