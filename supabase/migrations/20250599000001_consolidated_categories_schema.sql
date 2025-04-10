-- Consolidated Categories and Items Schema for Ivan Prints Business Management System
-- This migration consolidates all categories and items-related tables into a single file
-- Created: 2025-06-01

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Create Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Items Table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS categories_name_idx ON categories(name);
CREATE INDEX IF NOT EXISTS categories_created_by_idx ON categories(created_by);

CREATE INDEX IF NOT EXISTS items_name_idx ON items(name);
CREATE INDEX IF NOT EXISTS items_category_id_idx ON items(category_id);
CREATE INDEX IF NOT EXISTS items_created_by_idx ON items(created_by);

-- Add comments for documentation
COMMENT ON TABLE categories IS 'Product categories for Ivan Prints Business';
COMMENT ON COLUMN categories.name IS 'Category name';
COMMENT ON COLUMN categories.description IS 'Category description';
COMMENT ON COLUMN categories.created_by IS 'User who created the category';

COMMENT ON TABLE items IS 'Products and services offered by Ivan Prints Business';
COMMENT ON COLUMN items.name IS 'Item name';
COMMENT ON COLUMN items.description IS 'Item description';
COMMENT ON COLUMN items.category_id IS 'Category this item belongs to';
COMMENT ON COLUMN items.price IS 'Standard selling price';
COMMENT ON COLUMN items.cost IS 'Standard cost price';
COMMENT ON COLUMN items.created_by IS 'User who created the item';
