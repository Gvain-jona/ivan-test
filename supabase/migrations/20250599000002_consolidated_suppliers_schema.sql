-- Consolidated Suppliers Schema for Ivan Prints Business Management System
-- This migration consolidates all suppliers-related tables into a single file
-- Created: 2025-06-01

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS suppliers CASCADE;

-- Create Suppliers Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS suppliers_name_idx ON suppliers(name);
CREATE INDEX IF NOT EXISTS suppliers_email_idx ON suppliers(email);
CREATE INDEX IF NOT EXISTS suppliers_phone_idx ON suppliers(phone);
CREATE INDEX IF NOT EXISTS suppliers_created_by_idx ON suppliers(created_by);

-- Add comments for documentation
COMMENT ON TABLE suppliers IS 'Suppliers for Ivan Prints Business';
COMMENT ON COLUMN suppliers.name IS 'Supplier company name';
COMMENT ON COLUMN suppliers.contact_person IS 'Primary contact person at the supplier';
COMMENT ON COLUMN suppliers.phone IS 'Supplier phone number';
COMMENT ON COLUMN suppliers.email IS 'Supplier email address';
COMMENT ON COLUMN suppliers.address IS 'Supplier physical address';
COMMENT ON COLUMN suppliers.notes IS 'Additional notes about the supplier';
COMMENT ON COLUMN suppliers.created_by IS 'User who created the supplier record';
