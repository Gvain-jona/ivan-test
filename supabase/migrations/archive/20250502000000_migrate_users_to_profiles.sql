-- Clean up legacy tables and create new test data
-- This migration drops the old tables and creates new test data for the consolidated auth system

-- First, ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop legacy tables if they exist
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any views that might reference the dropped tables
DROP VIEW IF EXISTS migration_verification CASCADE;

-- Drop any functions created for migration
DROP FUNCTION IF EXISTS migrate_users_to_profiles() CASCADE;
DROP FUNCTION IF EXISTS update_user_references() CASCADE;
DROP FUNCTION IF EXISTS migrate_sessions() CASCADE;

-- Create test data for the new auth system
DO $$
DECLARE
    admin_id UUID;
    manager_id UUID;
    staff_id UUID;
    verification_code VARCHAR(8);
    code_expiry TIMESTAMP WITH TIME ZONE;
    hashed_pin TEXT;
BEGIN
    -- Set up test data parameters
    verification_code := 'ABCD1234';
    code_expiry := NOW() + INTERVAL '3 months';

    -- Create test admin user
    admin_id := uuid_generate_v4();
    INSERT INTO auth.users (id, email, role, created_at, updated_at, encrypted_password)
    VALUES (
        admin_id,
        'admin@example.com',
        'authenticated',
        NOW(),
        NOW(),
        -- This is the encrypted form of 'supabase' password
        '$2a$10$56h6M6BaNGJIuJ3dGKaBSOUUl5fDqmYPT9L.wCeLQqNn9gNJ0l3Ri'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO profiles (
        id,
        full_name,
        email,
        role,
        status,
        verification_code,
        code_expiry,
        is_verified,
        failed_attempts,
        devices,
        created_at,
        updated_at
    ) VALUES (
        admin_id,
        'Admin User',
        'admin@example.com',
        'admin',
        'active',
        verification_code,
        code_expiry,
        FALSE,
        0,
        '[]'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create test manager user
    manager_id := uuid_generate_v4();
    INSERT INTO auth.users (id, email, role, created_at, updated_at, encrypted_password)
    VALUES (
        manager_id,
        'manager@example.com',
        'authenticated',
        NOW(),
        NOW(),
        -- This is the encrypted form of 'supabase' password
        '$2a$10$56h6M6BaNGJIuJ3dGKaBSOUUl5fDqmYPT9L.wCeLQqNn9gNJ0l3Ri'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO profiles (
        id,
        full_name,
        email,
        role,
        status,
        verification_code,
        code_expiry,
        is_verified,
        failed_attempts,
        devices,
        created_at,
        updated_at
    ) VALUES (
        manager_id,
        'Manager User',
        'manager@example.com',
        'manager',
        'active',
        verification_code,
        code_expiry,
        FALSE,
        0,
        '[]'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create test staff user
    staff_id := uuid_generate_v4();
    INSERT INTO auth.users (id, email, role, created_at, updated_at, encrypted_password)
    VALUES (
        staff_id,
        'staff@example.com',
        'authenticated',
        NOW(),
        NOW(),
        -- This is the encrypted form of 'supabase' password
        '$2a$10$56h6M6BaNGJIuJ3dGKaBSOUUl5fDqmYPT9L.wCeLQqNn9gNJ0l3Ri'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO profiles (
        id,
        full_name,
        email,
        role,
        status,
        verification_code,
        code_expiry,
        is_verified,
        failed_attempts,
        devices,
        created_at,
        updated_at
    ) VALUES (
        staff_id,
        'Staff User',
        'staff@example.com',
        'staff',
        'active',
        verification_code,
        code_expiry,
        FALSE,
        0,
        '[]'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create test sessions
    INSERT INTO auth_sessions (
        id,
        user_id,
        device_id,
        device_name,
        user_agent,
        last_pin_entry,
        expires_at,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        admin_id,
        'test-device-1',
        'Test Admin Device',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        NOW(),
        NOW() + INTERVAL '12 hours',
        NOW()
    );

    INSERT INTO auth_sessions (
        id,
        user_id,
        device_id,
        device_name,
        user_agent,
        last_pin_entry,
        expires_at,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        manager_id,
        'test-device-2',
        'Test Manager Device',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        NOW(),
        NOW() + INTERVAL '12 hours',
        NOW()
    );

    -- Update references in other tables to use the new user IDs
    -- This is a placeholder - in a real scenario, you would update all tables
    -- that reference user IDs

    RAISE NOTICE 'Created test users with IDs: admin=%, manager=%, staff=%',
        admin_id, manager_id, staff_id;

    -- Log completion
    RAISE NOTICE 'Test data creation completed successfully';
END;
$$;

-- Note: In a production environment, you would:
-- 1. Use the Supabase Admin API to create users
-- 2. Hash PINs properly using bcrypt
-- 3. Create more comprehensive test data
