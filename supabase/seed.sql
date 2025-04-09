-- Consolidated Seed Data for Ivan Prints Business Management System
-- This seed file is compatible with the consolidated schema migrations
-- Created: 2025-06-01

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data (in reverse order of dependencies)
DELETE FROM order_payments;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM expense_payments;
DELETE FROM expenses;
DELETE FROM material_payments;
DELETE FROM material_purchases;
DELETE FROM tasks;
DELETE FROM notes WHERE linked_item_type = 'order';
DELETE FROM suppliers;
DELETE FROM items;
DELETE FROM categories;
DELETE FROM clients;

-- Create a user ID for test data
-- Change this to match an actual user ID in your system
DO $$
DECLARE
    admin_user_id UUID;
    v_user_count INTEGER;
    v_skip_fk_data BOOLEAN := FALSE;
BEGIN
    -- Try to get an existing admin user ID
    SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;

    -- If no admin user exists, use a default ID but don't try to create a profile
    -- since we can't insert directly into auth.users
    IF admin_user_id IS NULL THEN
        -- Check if there are any users in auth.users
        SELECT COUNT(*) INTO v_user_count FROM auth.users;

        IF v_user_count > 0 THEN
            -- Use the first user ID from auth.users
            SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
            RAISE NOTICE 'Using existing user ID from auth.users: %', admin_user_id;
        ELSE
            -- No users found, we'll need to skip data with FK constraints to profiles
            admin_user_id := '00000000-0000-0000-0000-000000000000';
            v_skip_fk_data := TRUE;
            RAISE NOTICE 'No users found in auth.users. Will skip data with FK constraints to profiles.';
        END IF;
    END IF;

    -- Skip the rest of the seed data if we don't have a valid user ID
    IF v_skip_fk_data THEN
        RAISE NOTICE 'Skipping seed data with FK constraints to profiles. Please create a user first.';
        RETURN;
    END IF;

    -- Insert categories
    INSERT INTO categories (id, name, created_by, created_at, updated_at)
    VALUES
      (uuid_generate_v4(), 'Business Cards', admin_user_id, NOW() - INTERVAL '30 days', NOW()),
      (uuid_generate_v4(), 'Flyers', admin_user_id, NOW() - INTERVAL '29 days', NOW()),
      (uuid_generate_v4(), 'Brochures', admin_user_id, NOW() - INTERVAL '28 days', NOW()),
      (uuid_generate_v4(), 'Banners', admin_user_id, NOW() - INTERVAL '27 days', NOW()),
      (uuid_generate_v4(), 'Posters', admin_user_id, NOW() - INTERVAL '26 days', NOW()),
      (uuid_generate_v4(), 'Stickers', admin_user_id, NOW() - INTERVAL '25 days', NOW()),
      (uuid_generate_v4(), 'T-Shirts', admin_user_id, NOW() - INTERVAL '24 days', NOW()),
      (uuid_generate_v4(), 'Mugs', admin_user_id, NOW() - INTERVAL '23 days', NOW()),
      (uuid_generate_v4(), 'Signage', admin_user_id, NOW() - INTERVAL '22 days', NOW()),
      (uuid_generate_v4(), 'Other', admin_user_id, NOW() - INTERVAL '21 days', NOW());

    -- Insert clients with varied profiles
    INSERT INTO clients (id, name, created_by, created_at, updated_at)
    VALUES
      (uuid_generate_v4(), 'John Smith', admin_user_id, NOW() - INTERVAL '29 days', NOW()),
      (uuid_generate_v4(), 'Alice Johnson', admin_user_id, NOW() - INTERVAL '28 days', NOW()),
      (uuid_generate_v4(), 'Robert Davis', admin_user_id, NOW() - INTERVAL '27 days', NOW()),
      (uuid_generate_v4(), 'Sarah Williams', admin_user_id, NOW() - INTERVAL '26 days', NOW()),
      (uuid_generate_v4(), 'Michael Brown', admin_user_id, NOW() - INTERVAL '25 days', NOW()),
      (uuid_generate_v4(), 'Karen Cooper', admin_user_id, NOW() - INTERVAL '24 days', NOW()),
      (uuid_generate_v4(), 'Primax Ltd', admin_user_id, NOW() - INTERVAL '23 days', NOW()),
      (uuid_generate_v4(), 'Zenith Enterprises', admin_user_id, NOW() - INTERVAL '22 days', NOW()),
      (uuid_generate_v4(), 'David Wilson', admin_user_id, NOW() - INTERVAL '21 days', NOW()),
      (uuid_generate_v4(), 'Emily Clark', admin_user_id, NOW() - INTERVAL '20 days', NOW()),
      (uuid_generate_v4(), 'James Rodriguez', admin_user_id, NOW() - INTERVAL '19 days', NOW()),
      (uuid_generate_v4(), 'Jennifer Lee', admin_user_id, NOW() - INTERVAL '18 days', NOW()),
      (uuid_generate_v4(), 'Richard Taylor', admin_user_id, NOW() - INTERVAL '17 days', NOW()),
      (uuid_generate_v4(), 'Patricia Martinez', admin_user_id, NOW() - INTERVAL '16 days', NOW()),
      (uuid_generate_v4(), 'Global Solutions Inc', admin_user_id, NOW() - INTERVAL '15 days', NOW()),
      (uuid_generate_v4(), 'Innovative Tech Ltd', admin_user_id, NOW() - INTERVAL '14 days', NOW()),
      (uuid_generate_v4(), 'Premier Marketing Group', admin_user_id, NOW() - INTERVAL '13 days', NOW()),
      (uuid_generate_v4(), 'Elite Consulting Services', admin_user_id, NOW() - INTERVAL '12 days', NOW()),
      (uuid_generate_v4(), 'Apex Manufacturing', admin_user_id, NOW() - INTERVAL '11 days', NOW()),
      (uuid_generate_v4(), 'Stellar Design Agency', admin_user_id, NOW() - INTERVAL '10 days', NOW());

    -- Insert suppliers for various materials
    INSERT INTO suppliers (id, name, contact_person, phone, email, created_by, created_at, updated_at)
    VALUES
      (uuid_generate_v4(), 'Paper Supplies Co', 'David Kim', '0780123456', 'info@papersupplies.com', admin_user_id, NOW() - INTERVAL '29 days', NOW()),
      (uuid_generate_v4(), 'Ink Masters', 'Lisa Wong', '0780234567', 'sales@inkmasters.com', admin_user_id, NOW() - INTERVAL '28 days', NOW()),
      (uuid_generate_v4(), 'PrintTech Solutions', 'James Carter', '0780345678', 'contact@printtech.com', admin_user_id, NOW() - INTERVAL '27 days', NOW()),
      (uuid_generate_v4(), 'Graphics World', 'Susan Lee', '0780456789', 'orders@graphicsworld.com', admin_user_id, NOW() - INTERVAL '26 days', NOW()),
      (uuid_generate_v4(), 'Digital Print Experts', 'Michael Chen', '0780567890', 'info@digitalprint.com', admin_user_id, NOW() - INTERVAL '25 days', NOW()),
      (uuid_generate_v4(), 'Premium Paper Products', 'Sarah Johnson', '0780678901', 'sales@premiumpaper.com', admin_user_id, NOW() - INTERVAL '24 days', NOW()),
      (uuid_generate_v4(), 'Color Ink Distributors', 'Robert Williams', '0780789012', 'orders@colorink.com', admin_user_id, NOW() - INTERVAL '23 days', NOW()),
      (uuid_generate_v4(), 'Advanced Printing Materials', 'Jennifer Davis', '0780890123', 'info@advancedprinting.com', admin_user_id, NOW() - INTERVAL '22 days', NOW()),
      (uuid_generate_v4(), 'Eco-Friendly Supplies', 'Thomas Brown', '0780901234', 'sales@ecosupplies.com', admin_user_id, NOW() - INTERVAL '21 days', NOW()),
      (uuid_generate_v4(), 'Quality Print Solutions', 'Emily Wilson', '0780012345', 'contact@qualityprint.com', admin_user_id, NOW() - INTERVAL '20 days', NOW());

    -- Get IDs for foreign key references
    WITH client_ids AS (
        SELECT id FROM clients ORDER BY created_at LIMIT 20
    ),
    category_ids AS (
        SELECT id FROM categories ORDER BY created_at LIMIT 10
    )
    -- Insert items
    INSERT INTO items (id, name, category_id, created_by, created_at, updated_at)
    SELECT
        uuid_generate_v4(),
        'Item ' || i || ' - ' || substr(md5(random()::text), 1, 6),
        category_id,
        admin_user_id,
        NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
        NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
    FROM (
        SELECT
            i,
            (SELECT id FROM category_ids OFFSET floor(random() * 10) LIMIT 1) as category_id
        FROM generate_series(1, 20) i
    ) AS items_data;

    -- Insert orders with different statuses
    WITH client_ids AS (
        SELECT id FROM clients ORDER BY created_at LIMIT 8
    )
    INSERT INTO orders (
        id,
        client_id,
        client_type,
        date,
        status,
        payment_status,
        total_amount,
        amount_paid,
        created_by,
        created_at,
        updated_at
    )
    SELECT
        uuid_generate_v4(),
        client_id,
        CASE floor(random() * 2)::int
            WHEN 0 THEN 'regular'
            ELSE 'contract'
        END,
        NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
        CASE floor(random() * 6)::int
            WHEN 0 THEN 'pending'
            WHEN 1 THEN 'in_progress'
            WHEN 2 THEN 'paused'
            WHEN 3 THEN 'completed'
            WHEN 4 THEN 'delivered'
            ELSE 'cancelled'
        END,
        CASE floor(random() * 3)::int
            WHEN 0 THEN 'unpaid'
            WHEN 1 THEN 'partially_paid'
            ELSE 'paid'
        END,
        (random() * 900000 + 100000)::int, -- total_amount between 100k and 1M
        CASE
            WHEN floor(random() * 3)::int = 2 THEN 0 -- unpaid
            WHEN floor(random() * 3)::int = 1 THEN (random() * 450000 + 50000)::int -- partially paid
            ELSE (random() * 900000 + 100000)::int -- fully paid
        END,
        admin_user_id,
        NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
        NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
    FROM (
        SELECT id AS client_id
        FROM client_ids
        CROSS JOIN generate_series(1, 6) -- 6 orders per client
    ) AS client_orders;

    -- Insert order items
    WITH order_ids AS (
        SELECT id FROM orders ORDER BY created_at LIMIT 30
    ),
    category_ids AS (
        SELECT id FROM categories ORDER BY created_at LIMIT 10
    ),
    item_ids AS (
        SELECT id FROM items ORDER BY created_at LIMIT 20
    )
    INSERT INTO order_items (
        id,
        order_id,
        item_id,
        category_id,
        size,
        quantity,
        unit_price,
        created_at,
        updated_at
    )
    SELECT
        uuid_generate_v4(),
        order_id,
        item_id,
        category_id,
        CASE floor(random() * 4)::int
            WHEN 0 THEN 'small'
            WHEN 1 THEN 'medium'
            WHEN 2 THEN 'large'
            ELSE 'custom'
        END,
        (random() * 100 + 1)::int, -- quantity
        (random() * 50000 + 5000)::int, -- unit_price
        NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
        NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
    FROM (
        SELECT
            o.id as order_id,
            (SELECT id FROM item_ids OFFSET floor(random() * 20) LIMIT 1) as item_id,
            (SELECT id FROM category_ids OFFSET floor(random() * 10) LIMIT 1) as category_id
        FROM (SELECT id FROM order_ids) o
        CROSS JOIN generate_series(1, floor(random() * 5 + 1)::int) -- 1-5 items per order
    ) AS order_items;

    -- Create order payments
    WITH order_info AS (
        SELECT id, amount_paid
        FROM orders
        WHERE amount_paid > 0
    )
    INSERT INTO order_payments (
        id,
        order_id,
        amount,
        date,
        payment_method,
        created_at,
        updated_at
    )
    SELECT
        uuid_generate_v4(),
        order_id,
        CASE
            WHEN amount_paid <= 200000 THEN amount_paid
            ELSE (random() * (amount_paid * 0.7) + amount_paid * 0.3)::int -- partial payment amount
        END,
        NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
        CASE floor(random() * 5)::int
            WHEN 0 THEN 'cash'
            WHEN 1 THEN 'bank_transfer'
            WHEN 2 THEN 'credit_card'
            WHEN 3 THEN 'cheque'
            ELSE 'mobile_payment'
        END,

        NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
        NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
    FROM (
        SELECT id as order_id, amount_paid
        FROM order_info
    ) AS order_payments;

    -- Calculate how much has been paid so far for each order
    WITH order_info AS (
        SELECT
            o.id,
            o.amount_paid,
            COALESCE(SUM(p.amount), 0) as paid_so_far
        FROM
            orders o
        LEFT JOIN
            order_payments p ON o.id = p.order_id
        GROUP BY
            o.id, o.amount_paid
        HAVING
            o.amount_paid > COALESCE(SUM(p.amount), 0)
    )
    -- Add second payment for orders that need more payments to match amount_paid
    INSERT INTO order_payments (
        id,
        order_id,
        amount,
        date,
        payment_method,
        notes,
        created_at,
        updated_at
    )
    SELECT
        uuid_generate_v4(),
        order_id,
        (amount_paid - paid_so_far),
        NOW() - (INTERVAL '1 day' * floor(random() * 15)::int),
        CASE floor(random() * 5)::int
            WHEN 0 THEN 'cash'
            WHEN 1 THEN 'bank_transfer'
            WHEN 2 THEN 'credit_card'
            WHEN 3 THEN 'cheque'
            ELSE 'mobile_payment'
        END,

        NOW() - (INTERVAL '1 day' * floor(random() * 15)::int),
        NOW() - (INTERVAL '1 day' * floor(random() * 7)::int)
    FROM (
        SELECT id as order_id, amount_paid, paid_so_far
        FROM order_info
    ) AS remaining_payments;

    -- Create notes for some orders
    WITH order_ids AS (
        SELECT id FROM orders ORDER BY created_at LIMIT 30
    )
    INSERT INTO notes (
        id,
        type,
        text,
        linked_item_type,
        linked_item_id,
        created_by,
        created_at,
        updated_at
    )
    SELECT
        uuid_generate_v4(),
        'order',
        CASE floor(random() * 4)::int
            WHEN 0 THEN 'Special delivery instructions: ' || substr(md5(random()::text), 1, 20)
            WHEN 1 THEN 'Client requirements: ' || substr(md5(random()::text), 1, 20)
            WHEN 2 THEN 'Payment details: ' || substr(md5(random()::text), 1, 20)
            ELSE 'Design specifications: ' || substr(md5(random()::text), 1, 20)
        END,
        'order',
        order_id,
        admin_user_id,
        NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
        NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
    FROM (
        SELECT id as order_id
        FROM order_ids
        WHERE random() > 0.6 -- 40% chance of having a note
    ) AS note_generator;

END $$;
