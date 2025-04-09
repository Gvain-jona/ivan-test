-- Mock Data for Orders System
-- This script creates mock data for orders, order_items, order_payments, categories, items, and notes
-- It also drops the payment_method column from the orders table

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Drop payment_method column from orders table
DO $$
BEGIN
    -- Check if the column exists before trying to drop it
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE orders DROP COLUMN payment_method;
        RAISE NOTICE 'Dropped payment_method column from orders table';
    ELSE
        RAISE NOTICE 'payment_method column does not exist in orders table';
    END IF;
END $$;

-- Step 2: Clear existing data from the tables (in reverse order of dependencies)
TRUNCATE order_payments CASCADE;
TRUNCATE order_items CASCADE;
TRUNCATE orders CASCADE;
TRUNCATE notes CASCADE;
TRUNCATE items CASCADE;
TRUNCATE categories CASCADE;

-- Step 3: Create mock data
DO $$
DECLARE
    v_admin_id UUID;
    v_client_ids UUID[];
    v_category_ids UUID[] := ARRAY[]::UUID[];
    v_item_ids UUID[] := ARRAY[]::UUID[];
    v_order_ids UUID[] := ARRAY[]::UUID[];
    i INTEGER;
    j INTEGER;
    k INTEGER;
    v_order_id UUID;
    v_item_id UUID;
    v_category_id UUID;
    v_total_amount DECIMAL(10,2);
    v_payment_amount DECIMAL(10,2);
BEGIN
    -- Get admin user ID (assuming there's at least one user in the profiles table)
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

    -- Get client IDs (assuming there are clients in the clients table)
    SELECT ARRAY_AGG(id) INTO v_client_ids FROM clients LIMIT 10;

    IF v_client_ids IS NULL OR array_length(v_client_ids, 1) = 0 THEN
        RAISE EXCEPTION 'No clients found in clients table. Please create clients first.';
    END IF;

    -- Step 3.1: Insert categories
    RAISE NOTICE 'Creating categories...';
    FOR i IN 1..5 LOOP
        INSERT INTO categories (id, name, description, created_by, created_at, updated_at)
        VALUES (
            uuid_generate_v4(),
            CASE i
                WHEN 1 THEN 'Business Cards'
                WHEN 2 THEN 'Flyers'
                WHEN 3 THEN 'Brochures'
                WHEN 4 THEN 'Banners'
                WHEN 5 THEN 'Posters'
            END,
            CASE i
                WHEN 1 THEN 'Standard and premium business cards in various sizes and finishes'
                WHEN 2 THEN 'Promotional flyers in various sizes and paper types'
                WHEN 3 THEN 'Bi-fold and tri-fold brochures for marketing materials'
                WHEN 4 THEN 'Indoor and outdoor banners in various sizes and materials'
                WHEN 5 THEN 'High-quality posters in various sizes and finishes'
            END,
            v_admin_id,
            NOW() - (INTERVAL '1 day' * (30 - i)),
            NOW()
        ) RETURNING id INTO v_category_id;

        -- Append the category ID to the array
        v_category_ids := array_append(v_category_ids, v_category_id);
    END LOOP;

    -- Step 3.2: Insert items
    RAISE NOTICE 'Creating items...';
    FOR i IN 1..15 LOOP
        INSERT INTO items (id, name, description, category_id, price, cost, created_by, created_at, updated_at)
        VALUES (
            uuid_generate_v4(),
            CASE
                WHEN i <= 3 THEN 'Business Card Type ' || i
                WHEN i <= 6 THEN 'Flyer Type ' || (i - 3)
                WHEN i <= 9 THEN 'Brochure Type ' || (i - 6)
                WHEN i <= 12 THEN 'Banner Type ' || (i - 9)
                ELSE 'Poster Type ' || (i - 12)
            END,
            'Description for item ' || i,
            v_category_ids[CASE
                WHEN i <= 3 THEN 1
                WHEN i <= 6 THEN 2
                WHEN i <= 9 THEN 3
                WHEN i <= 12 THEN 4
                ELSE 5
            END],
            (50000 + (i * 10000))::DECIMAL(10,2),  -- Price between 50,000 and 200,000
            (20000 + (i * 5000))::DECIMAL(10,2),   -- Cost between 20,000 and 95,000
            v_admin_id,
            NOW() - (INTERVAL '1 day' * (30 - i)),
            NOW()
        ) RETURNING id INTO v_item_id;

        -- Append the item ID to the array
        v_item_ids := array_append(v_item_ids, v_item_id);
    END LOOP;

    -- Step 3.3: Insert orders
    RAISE NOTICE 'Creating orders...';
    FOR i IN 1..20 LOOP
        INSERT INTO orders (
            id,
            client_id,
            client_type,
            created_by,
            date,
            total_amount,
            amount_paid,
            status,
            payment_status,
            notes,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            v_client_ids[1 + (i % array_length(v_client_ids, 1))],
            CASE WHEN i % 3 = 0 THEN 'contract' ELSE 'regular' END,
            v_admin_id,
            NOW() - (INTERVAL '1 day' * (60 - i * 3)),
            0,  -- Will be updated by order items
            0,  -- Will be updated by payments
            CASE i % 6
                WHEN 0 THEN 'pending'
                WHEN 1 THEN 'in_progress'
                WHEN 2 THEN 'paused'
                WHEN 3 THEN 'completed'
                WHEN 4 THEN 'delivered'
                WHEN 5 THEN 'cancelled'
            END,
            CASE i % 3
                WHEN 0 THEN 'unpaid'
                WHEN 1 THEN 'partially_paid'
                WHEN 2 THEN 'paid'
            END,
            CASE WHEN i % 4 = 0 THEN ('["Special instructions for order ' || i || '"]')::jsonb ELSE '[]'::jsonb END,
            NOW() - (INTERVAL '1 day' * (60 - i * 3)),
            NOW() - (INTERVAL '1 day' * (30 - i))
        ) RETURNING id INTO v_order_id;

        -- Append the order ID to the array
        v_order_ids := array_append(v_order_ids, v_order_id);
    END LOOP;

    -- Step 3.4: Insert order items
    RAISE NOTICE 'Creating order items...';
    FOR i IN 1..20 LOOP  -- For each order
        -- Use modulo to ensure we don't go out of bounds
        v_order_id := v_order_ids[1 + ((i-1) % array_length(v_order_ids, 1))];

        -- Add 1-3 items to each order
        FOR j IN 1..1 + (i % 3) LOOP
            v_item_id := v_item_ids[1 + ((i + j) % array_length(v_item_ids, 1))];

            -- Get the category ID for this item
            SELECT category_id INTO v_category_id FROM items WHERE id = v_item_id;

            INSERT INTO order_items (
                id,
                order_id,
                item_id,
                category_id,
                size,
                quantity,
                unit_price,
                profit_amount,
                labor_amount,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                v_order_id,
                v_item_id,
                v_category_id,
                CASE (i + j) % 4
                    WHEN 0 THEN 'small'
                    WHEN 1 THEN 'medium'
                    WHEN 2 THEN 'large'
                    WHEN 3 THEN 'custom'
                END,
                10 + (j * 5),  -- Quantity between 10 and 25
                50000 + (j * 10000),  -- Unit price between 50,000 and 80,000
                10000 + (j * 2000),  -- Profit amount between 10,000 and 16,000
                5000 + (j * 1000),  -- Labor amount between 5,000 and 8,000
                NOW() - (INTERVAL '1 day' * (60 - i * 3)),
                NOW() - (INTERVAL '1 day' * (30 - i))
            );
        END LOOP;
    END LOOP;

    -- Step 3.5: Insert order payments
    RAISE NOTICE 'Creating order payments...';
    FOR i IN 1..20 LOOP
        -- Use modulo to ensure we don't go out of bounds
        v_order_id := v_order_ids[1 + ((i-1) % array_length(v_order_ids, 1))];

        -- Get the total amount for this order
        SELECT total_amount INTO v_total_amount FROM orders WHERE id = v_order_id;

        -- Skip payments for unpaid orders
        CONTINUE WHEN (SELECT payment_status FROM orders WHERE id = v_order_id) = 'unpaid';

        -- For partially paid orders, add one payment
        IF (SELECT payment_status FROM orders WHERE id = v_order_id) = 'partially_paid' THEN
            v_payment_amount := (v_total_amount * 0.5)::DECIMAL(10,2);  -- 50% of total

            INSERT INTO order_payments (
                id,
                order_id,
                amount,
                date,
                payment_method,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                v_order_id,
                v_payment_amount,
                NOW() - (INTERVAL '1 day' * (60 - i * 3)),
                CASE i % 5
                    WHEN 0 THEN 'cash'
                    WHEN 1 THEN 'bank_transfer'
                    WHEN 2 THEN 'credit_card'
                    WHEN 3 THEN 'cheque'
                    WHEN 4 THEN 'mobile_payment'
                END,
                NOW() - (INTERVAL '1 day' * (60 - i * 3)),
                NOW() - (INTERVAL '1 day' * (30 - i))
            );
        END IF;

        -- For fully paid orders, add 1-2 payments
        IF (SELECT payment_status FROM orders WHERE id = v_order_id) = 'paid' THEN
            -- First payment (70% of total)
            v_payment_amount := (v_total_amount * 0.7)::DECIMAL(10,2);

            INSERT INTO order_payments (
                id,
                order_id,
                amount,
                date,
                payment_method,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                v_order_id,
                v_payment_amount,
                NOW() - (INTERVAL '1 day' * (60 - i * 3)),
                CASE i % 5
                    WHEN 0 THEN 'cash'
                    WHEN 1 THEN 'bank_transfer'
                    WHEN 2 THEN 'credit_card'
                    WHEN 3 THEN 'cheque'
                    WHEN 4 THEN 'mobile_payment'
                END,
                NOW() - (INTERVAL '1 day' * (60 - i * 3)),
                NOW() - (INTERVAL '1 day' * (30 - i))
            );

            -- Second payment (30% of total)
            v_payment_amount := (v_total_amount * 0.3)::DECIMAL(10,2);

            INSERT INTO order_payments (
                id,
                order_id,
                amount,
                date,
                payment_method,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                v_order_id,
                v_payment_amount,
                NOW() - (INTERVAL '1 day' * (50 - i * 3)),  -- 10 days after first payment
                CASE (i + 2) % 5
                    WHEN 0 THEN 'cash'
                    WHEN 1 THEN 'bank_transfer'
                    WHEN 2 THEN 'credit_card'
                    WHEN 3 THEN 'cheque'
                    WHEN 4 THEN 'mobile_payment'
                END,
                NOW() - (INTERVAL '1 day' * (50 - i * 3)),
                NOW() - (INTERVAL '1 day' * (25 - i))
            );
        END IF;
    END LOOP;

    -- Step 3.6: Insert notes
    RAISE NOTICE 'Creating notes...';
    FOR i IN 1..20 LOOP
        -- Only create notes for some orders
        CONTINUE WHEN i % 3 != 0;

        -- Use modulo to ensure we don't go out of bounds
        v_order_id := v_order_ids[1 + ((i-1) % array_length(v_order_ids, 1))];

        INSERT INTO notes (
            id,
            type,
            text,
            linked_item_type,
            linked_item_id,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            CASE i % 3
                WHEN 0 THEN 'general'
                WHEN 1 THEN 'important'
                WHEN 2 THEN 'follow_up'
            END,
            CASE i % 4
                WHEN 0 THEN 'Special delivery instructions for order ' || i
                WHEN 1 THEN 'Client requirements for order ' || i
                WHEN 2 THEN 'Payment details for order ' || i
                WHEN 3 THEN 'Design specifications for order ' || i
            END,
            'order',
            v_order_id,
            v_admin_id,
            NOW() - (INTERVAL '1 day' * (60 - i * 3)),
            NOW() - (INTERVAL '1 day' * (30 - i))
        );
    END LOOP;

    RAISE NOTICE 'Mock data creation completed successfully.';
END $$;

-- Verify the data was created
SELECT 'Categories: ' || COUNT(*)::TEXT AS result FROM categories
UNION ALL
SELECT 'Items: ' || COUNT(*)::TEXT FROM items
UNION ALL
SELECT 'Orders: ' || COUNT(*)::TEXT FROM orders
UNION ALL
SELECT 'Order Items: ' || COUNT(*)::TEXT FROM order_items
UNION ALL
SELECT 'Order Payments: ' || COUNT(*)::TEXT FROM order_payments
UNION ALL
SELECT 'Notes: ' || COUNT(*)::TEXT FROM notes;
