-- Migration to create announcements table
-- Created: 2024-07-01

-- Create enum type for announcement tags
CREATE TYPE announcement_tag AS ENUM (
    'New',
    'Updated',
    'Important',
    'Announcement',
    'Feature',
    'Maintenance',
    'Alert',
    'Welcome'
);

-- Create enum type for app page links
CREATE TYPE app_page_link AS ENUM (
    '/dashboard',
    '/dashboard/home',
    '/dashboard/orders',
    '/dashboard/expenses',
    '/dashboard/material-purchases',
    '/dashboard/todo',
    '/dashboard/analytics',
    '/dashboard/settings',
    '/dashboard/settings/appearance',
    '/dashboard/settings/notifications',
    '/dashboard/settings/announcements',
    '/dashboard/settings/data-privacy',
    '/dashboard/settings/user-management',
    '/dashboard/settings/profit',
    '/dashboard/settings/accounts'
);

-- Create announcements table if it doesn't exist
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag announcement_tag NOT NULL DEFAULT 'Announcement',
    message TEXT NOT NULL,
    link app_page_link NULL, -- Explicitly allow NULL for no link
    variant TEXT CHECK (variant IN ('default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info')) DEFAULT 'info',
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Only admins can create/update/delete announcements
CREATE POLICY announcements_admin_policy ON announcements
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Everyone can read announcements
CREATE POLICY announcements_read_policy ON announcements
    FOR SELECT USING (true);

-- Create function to get active announcement
DROP FUNCTION IF EXISTS get_active_announcement();

CREATE OR REPLACE FUNCTION get_active_announcement()
RETURNS TABLE (
    id UUID,
    tag announcement_tag,
    message TEXT,
    link app_page_link,
    variant TEXT,
    is_active BOOLEAN,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.*
    FROM announcements a
    WHERE a.is_active = true
    AND (a.start_date IS NULL OR a.start_date <= NOW())
    AND (a.end_date IS NULL OR a.end_date >= NOW())
    ORDER BY a.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default announcements if none exist
INSERT INTO announcements (tag, message, link, variant, is_active, start_date, end_date)
SELECT 'Welcome', 'Welcome to Ivan Prints Business Management System', '/dashboard', 'info', true, NOW(), NULL
WHERE NOT EXISTS (SELECT 1 FROM announcements);

-- Insert additional sample announcements
DO $$
BEGIN
    -- Only add these if there's just one announcement (the default one)
    IF (SELECT COUNT(*) FROM announcements) <= 1 THEN
        -- New feature announcement
        INSERT INTO announcements (
            tag, message, link, variant, is_active, start_date, end_date
        ) VALUES (
            'New',
            'New analytics dashboard is now available!',
            '/dashboard/analytics',
            'success',
            true,
            NOW(),
            NOW() + INTERVAL '7 days'
        );

        -- Maintenance announcement (inactive)
        INSERT INTO announcements (
            tag, message, link, variant, is_active, start_date, end_date
        ) VALUES (
            'Maintenance',
            'System maintenance scheduled for next weekend',
            '/dashboard/settings/announcements',
            'warning',
            false,
            NOW() + INTERVAL '5 days',
            NOW() + INTERVAL '7 days'
        );

        -- Important announcement
        INSERT INTO announcements (
            tag, message, link, variant, is_active, start_date, end_date
        ) VALUES (
            'Important',
            'Please update your profile information',
            '/dashboard/settings/appearance',
            'destructive',
            true,
            NOW(),
            NOW() + INTERVAL '14 days'
        );
    END IF;
END $$;
