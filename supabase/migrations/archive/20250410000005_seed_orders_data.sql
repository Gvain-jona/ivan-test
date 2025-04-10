-- Seed data for orders, order_items, order_payments, and order_notes
-- Created: 2025-04-10

-- Only run this if we're in development mode and tables are empty
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check if orders table is empty
    SELECT COUNT(*) INTO v_count FROM orders;

    -- Only proceed if there are no orders
    IF v_count = 0 THEN
        -- Insert sample clients if they don't exist
        INSERT INTO clients (id, name, created_at, updated_at)
        VALUES
            ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', NOW(), NOW()),
            ('22222222-2222-2222-2222-222222222222', 'TechStart Inc.', NOW(), NOW()),
            ('33333333-3333-3333-3333-333333333333', 'Global Enterprises', NOW(), NOW()),
            ('44444444-4444-4444-4444-444444444444', 'Local Business Ltd.', NOW(), NOW()),
            ('55555555-5555-5555-5555-555555555555', 'University of Innovation', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;

        -- Insert sample categories if they don't exist
        INSERT INTO categories (id, name, created_at, updated_at)
        VALUES
            ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Printing', NOW(), NOW()),
            ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Signage', NOW(), NOW()),
            ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Branding', NOW(), NOW()),
            ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Promotional', NOW(), NOW()),
            ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Stationery', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;

        -- Insert sample items if they don't exist
        INSERT INTO items (id, name, category_id, created_at, updated_at)
        VALUES
            ('11111111-aaaa-1111-aaaa-111111111111', 'Business Cards', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
            ('22222222-aaaa-2222-aaaa-222222222222', 'Flyers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
            ('33333333-aaaa-3333-aaaa-333333333333', 'Brochures', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
            ('44444444-bbbb-4444-bbbb-444444444444', 'Banners', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), NOW()),
            ('55555555-bbbb-5555-bbbb-555555555555', 'Posters', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), NOW()),
            ('66666666-cccc-6666-cccc-666666666666', 'Logo Design', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), NOW()),
            ('77777777-cccc-7777-cccc-777777777777', 'Brand Identity', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), NOW()),
            ('88888888-dddd-8888-dddd-888888888888', 'T-Shirts', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW(), NOW()),
            ('99999999-dddd-9999-dddd-999999999999', 'Mugs', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW(), NOW()),
            ('aaaaaaaa-eeee-aaaa-eeee-aaaaaaaaaaaa', 'Letterheads', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;

        -- Get a user ID for created_by
        DECLARE
            v_user_id UUID;
            v_order_id UUID;
            v_order_id_1 UUID;
            v_order_id_2 UUID;
            v_order_id_3 UUID;
            v_order_id_4 UUID;
            v_order_id_5 UUID;
        BEGIN
            SELECT id INTO v_user_id FROM users LIMIT 1;

            -- If no user exists, create one
            IF v_user_id IS NULL THEN
                INSERT INTO users (name, email, password, role, status)
                VALUES ('Admin User', 'admin@example.com', 'password', 'admin', 'active')
                RETURNING id INTO v_user_id;
            END IF;

            -- Insert sample orders
            INSERT INTO orders (
                id, client_id, client_type, created_by, date, status, payment_status,
                total_amount, amount_paid, payment_method, created_at, updated_at
            )
            VALUES
            (
                '11111111-aaaa-aaaa-aaaa-111111111111',
                '11111111-1111-1111-1111-111111111111',
                'contract',
                v_user_id,
                '2025-04-01',
                'completed',
                'paid',
                1250.00,
                1250.00,
                'bank_transfer',
                NOW() - INTERVAL '10 days',
                NOW() - INTERVAL '5 days'
            ),
            (
                '22222222-aaaa-aaaa-aaaa-222222222222',
                '22222222-2222-2222-2222-222222222222',
                'regular',
                v_user_id,
                '2025-04-03',
                'in_progress',
                'partially_paid',
                850.00,
                400.00,
                'cash',
                NOW() - INTERVAL '7 days',
                NOW() - INTERVAL '3 days'
            ),
            (
                '33333333-aaaa-aaaa-aaaa-333333333333',
                '33333333-3333-3333-3333-333333333333',
                'contract',
                v_user_id,
                '2025-04-05',
                'pending',
                'unpaid',
                2100.00,
                0.00,
                NULL,
                NOW() - INTERVAL '5 days',
                NOW() - INTERVAL '5 days'
            ),
            (
                '44444444-aaaa-aaaa-aaaa-444444444444',
                '44444444-4444-4444-4444-444444444444',
                'regular',
                v_user_id,
                '2025-04-07',
                'delivered',
                'paid',
                450.00,
                450.00,
                'mobile_payment',
                NOW() - INTERVAL '3 days',
                NOW() - INTERVAL '1 day'
            ),
            (
                '55555555-aaaa-aaaa-aaaa-555555555555',
                '55555555-5555-5555-5555-555555555555',
                'contract',
                v_user_id,
                '2025-04-10',
                'paused',
                'partially_paid',
                3200.00,
                1000.00,
                'bank_transfer',
                NOW() - INTERVAL '1 day',
                NOW()
            );

            -- Set order IDs for reference
            v_order_id_1 := '11111111-aaaa-aaaa-aaaa-111111111111';
            v_order_id_2 := '22222222-aaaa-aaaa-aaaa-222222222222';
            v_order_id_3 := '33333333-aaaa-aaaa-aaaa-333333333333';
            v_order_id_4 := '44444444-aaaa-aaaa-aaaa-444444444444';
            v_order_id_5 := '55555555-aaaa-aaaa-aaaa-555555555555';

            -- Insert sample order items
            INSERT INTO order_items (
                order_id, item_id, category_id, item_name, category_name,
                size, quantity, unit_price, profit_amount, labor_amount
            )
            VALUES
                (
                    v_order_id_1,
                    '11111111-aaaa-1111-aaaa-111111111111',
                    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                    'Business Cards',
                    'Printing',
                    'Standard',
                    500,
                    0.50,
                    100.00,
                    50.00
                ),
                (
                    v_order_id_1,
                    '33333333-aaaa-3333-aaaa-333333333333',
                    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                    'Brochures',
                    'Printing',
                    'A4',
                    200,
                    5.00,
                    300.00,
                    100.00
                ),
                (
                    v_order_id_2,
                    '44444444-bbbb-4444-bbbb-444444444444',
                    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                    'Banners',
                    'Signage',
                    '2m x 1m',
                    2,
                    175.00,
                    150.00,
                    50.00
                ),
                (
                    v_order_id_2,
                    '55555555-bbbb-5555-bbbb-555555555555',
                    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                    'Posters',
                    'Signage',
                    'A2',
                    10,
                    50.00,
                    200.00,
                    100.00
                ),
                (
                    v_order_id_3,
                    '66666666-cccc-6666-cccc-666666666666',
                    'cccccccc-cccc-cccc-cccc-cccccccccccc',
                    'Logo Design',
                    'Branding',
                    'N/A',
                    1,
                    1200.00,
                    800.00,
                    400.00
                ),
                (
                    v_order_id_3,
                    '77777777-cccc-7777-cccc-777777777777',
                    'cccccccc-cccc-cccc-cccc-cccccccccccc',
                    'Brand Identity',
                    'Branding',
                    'N/A',
                    1,
                    900.00,
                    600.00,
                    300.00
                ),
                (
                    v_order_id_4,
                    '88888888-dddd-8888-dddd-888888888888',
                    'dddddddd-dddd-dddd-dddd-dddddddddddd',
                    'T-Shirts',
                    'Promotional',
                    'Mixed',
                    30,
                    15.00,
                    150.00,
                    75.00
                ),
                (
                    v_order_id_5,
                    '99999999-dddd-9999-dddd-999999999999',
                    'dddddddd-dddd-dddd-dddd-dddddddddddd',
                    'Mugs',
                    'Promotional',
                    'Standard',
                    100,
                    12.00,
                    400.00,
                    200.00
                ),
                (
                    v_order_id_5,
                    'aaaaaaaa-eeee-aaaa-eeee-aaaaaaaaaaaa',
                    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
                    'Letterheads',
                    'Stationery',
                    'A4',
                    1000,
                    0.80,
                    300.00,
                    100.00
                ),
                (
                    v_order_id_5,
                    '11111111-aaaa-1111-aaaa-111111111111',
                    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                    'Business Cards',
                    'Printing',
                    'Premium',
                    1000,
                    1.20,
                    500.00,
                    200.00
                );

            -- Insert sample order payments
            INSERT INTO order_payments (
                order_id, amount, date, payment_method, notes
            )
            VALUES
                (
                    v_order_id_1,
                    500.00,
                    '2025-04-01',
                    'bank_transfer',
                    'Initial payment'
                ),
                (
                    v_order_id_1,
                    750.00,
                    '2025-04-05',
                    'bank_transfer',
                    'Final payment'
                ),
                (
                    v_order_id_2,
                    400.00,
                    '2025-04-03',
                    'cash',
                    'Deposit'
                ),
                (
                    v_order_id_4,
                    450.00,
                    '2025-04-07',
                    'mobile_payment',
                    'Full payment'
                ),
                (
                    v_order_id_5,
                    1000.00,
                    '2025-04-10',
                    'bank_transfer',
                    'Deposit'
                );

            -- Insert sample order notes
            INSERT INTO order_notes (
                order_id, type, text, created_by
            )
            VALUES
                (
                    v_order_id_1,
                    'info',
                    'Order completed and delivered on time.',
                    v_user_id
                ),
                (
                    v_order_id_2,
                    'client_follow_up',
                    'Client requested a design change. Follow up needed.',
                    v_user_id
                ),
                (
                    v_order_id_3,
                    'urgent',
                    'Client needs this by end of month. Priority job.',
                    v_user_id
                ),
                (
                    v_order_id_4,
                    'info',
                    'Client very satisfied with the quality.',
                    v_user_id
                ),
                (
                    v_order_id_5,
                    'internal',
                    'Waiting for materials to arrive before continuing.',
                    v_user_id
                ),
                (
                    v_order_id_5,
                    'client_follow_up',
                    'Client informed about delay. Will resume next week.',
                    v_user_id
                );
        END;
    END IF;
END $$;
