-- Mock Data for Clients
-- This script creates mock data for the clients table
-- Run this after profiles_mock_data.sql but before orders_mock_data.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create mock clients
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

    IF v_admin_id IS NULL THEN
        -- Try to get any profile
        SELECT id INTO v_admin_id FROM profiles LIMIT 1;

        IF v_admin_id IS NULL THEN
            RAISE EXCEPTION E'\n\n===========================================================================\nNo profiles found. Please run the profiles_mock_data.sql script first.\n\nSteps:\n1. Make sure you have a user in auth.users table\n2. Run the profiles_mock_data.sql script\n3. Then run this script\n===========================================================================\n';
        ELSE
            RAISE NOTICE 'No admin profile found, using profile ID: %', v_admin_id;
        END IF;
    END IF;

    -- Clear existing clients (optional - uncomment if you want to start fresh)
    -- TRUNCATE clients CASCADE;

    -- Insert clients with varied profiles (individuals and businesses)
    INSERT INTO clients (id, name, email, phone, address, notes, created_by, created_at, updated_at)
    VALUES
      (uuid_generate_v4(), 'John Smith', 'john.smith@example.com', '0780123456', '123 Main St, Kampala', 'Regular customer, prefers email communication', v_admin_id, NOW() - INTERVAL '29 days', NOW()),
      (uuid_generate_v4(), 'Alice Johnson', 'alice.johnson@example.com', '0780234567', '456 Oak Ave, Entebbe', 'Prefers high-quality paper for business cards', v_admin_id, NOW() - INTERVAL '28 days', NOW()),
      (uuid_generate_v4(), 'Robert Davis', 'robert.davis@example.com', '0780345678', '789 Pine Rd, Jinja', 'Contract client with monthly orders', v_admin_id, NOW() - INTERVAL '27 days', NOW()),
      (uuid_generate_v4(), 'Sarah Williams', 'sarah.williams@example.com', '0780456789', '101 Cedar Ln, Mbarara', 'Referred by John Smith', v_admin_id, NOW() - INTERVAL '26 days', NOW()),
      (uuid_generate_v4(), 'Michael Brown', 'michael.brown@example.com', '0780567890', '202 Elm St, Gulu', 'Prefers phone calls over emails', v_admin_id, NOW() - INTERVAL '25 days', NOW()),
      (uuid_generate_v4(), 'Karen Cooper', 'karen.cooper@example.com', '0780678901', '303 Birch Dr, Mbale', 'New client, first order placed', v_admin_id, NOW() - INTERVAL '24 days', NOW()),
      (uuid_generate_v4(), 'Primax Ltd', 'orders@primax.co.ug', '0780789012', '404 Corporate Plaza, Kampala', 'Large corporate client with monthly orders', v_admin_id, NOW() - INTERVAL '23 days', NOW()),
      (uuid_generate_v4(), 'Zenith Enterprises', 'procurement@zenith.co.ug', '0780890123', '505 Business Park, Kampala', 'Contract client, net-30 payment terms', v_admin_id, NOW() - INTERVAL '22 days', NOW()),
      (uuid_generate_v4(), 'David Wilson', 'david.wilson@example.com', '0780901234', '606 Maple Ave, Kampala', 'Prefers eco-friendly materials', v_admin_id, NOW() - INTERVAL '21 days', NOW()),
      (uuid_generate_v4(), 'Emily Clark', 'emily.clark@example.com', '0781012345', '707 Walnut St, Entebbe', 'Graphic designer, provides own artwork', v_admin_id, NOW() - INTERVAL '20 days', NOW());

    RAISE NOTICE 'Client mock data creation completed successfully.';
END $$;

-- Verify the data was created
SELECT 'Clients: ' || COUNT(*)::TEXT AS result FROM clients;
