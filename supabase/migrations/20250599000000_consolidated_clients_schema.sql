-- Consolidated Clients Schema for Ivan Prints Business Management System
-- This migration consolidates all clients-related tables into a single file
-- Created: 2025-06-01

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS clients CASCADE;

-- Create Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS clients_name_idx ON clients(name);
CREATE INDEX IF NOT EXISTS clients_email_idx ON clients(email);
CREATE INDEX IF NOT EXISTS clients_phone_idx ON clients(phone);
CREATE INDEX IF NOT EXISTS clients_created_by_idx ON clients(created_by);

-- Add comments for documentation
COMMENT ON TABLE clients IS 'Clients for Ivan Prints Business';
COMMENT ON COLUMN clients.name IS 'Client name (individual or company)';
COMMENT ON COLUMN clients.email IS 'Client email address';
COMMENT ON COLUMN clients.phone IS 'Client phone number';
COMMENT ON COLUMN clients.address IS 'Client physical address';
COMMENT ON COLUMN clients.notes IS 'Additional notes about the client';
COMMENT ON COLUMN clients.created_by IS 'User who created the client record';
