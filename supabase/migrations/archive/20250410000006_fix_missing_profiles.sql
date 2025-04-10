-- Migration to fix missing profiles
-- Created: 2025-04-10

-- This migration checks for users in auth.users that don't have corresponding profiles
-- and creates profiles for them

DO $$ 
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_count INTEGER;
BEGIN
    -- Check if the specific user ID exists in auth.users but not in profiles
    SELECT COUNT(*) INTO v_count 
    FROM auth.users 
    WHERE id = 'f16a9a11-a9ff-4d32-a033-a7f13d7a93b6'
    AND NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = 'f16a9a11-a9ff-4d32-a033-a7f13d7a93b6'
    );
    
    IF v_count > 0 THEN
        -- Get the email for this user
        SELECT email INTO v_email 
        FROM auth.users 
        WHERE id = 'f16a9a11-a9ff-4d32-a033-a7f13d7a93b6';
        
        -- Create a profile for this user
        INSERT INTO profiles (
            id,
            full_name,
            email,
            role,
            status,
            is_verified,
            failed_attempts,
            devices,
            created_at,
            updated_at
        ) VALUES (
            'f16a9a11-a9ff-4d32-a033-a7f13d7a93b6',
            'User ' || substring(v_email from 1 for position('@' in v_email) - 1),
            v_email,
            'admin',
            'active',
            TRUE,
            0,
            '[]'::jsonb,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created missing profile for user ID: f16a9a11-a9ff-4d32-a033-a7f13d7a93b6';
    END IF;
    
    -- Now check for any other users that might be missing profiles
    FOR v_user_id, v_email IN
        SELECT u.id, u.email
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = u.id
        )
    LOOP
        -- Create a profile for this user
        INSERT INTO profiles (
            id,
            full_name,
            email,
            role,
            status,
            is_verified,
            failed_attempts,
            devices,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            'User ' || substring(v_email from 1 for position('@' in v_email) - 1),
            v_email,
            'admin',
            'active',
            TRUE,
            0,
            '[]'::jsonb,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created missing profile for user ID: %', v_user_id;
    END LOOP;
END $$;
