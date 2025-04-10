-- Seed data for Ivan Prints Business Management System

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data (in reverse order of dependencies)
-- First delete rows from notes table where linked_item_type = 'order'
DELETE FROM notes WHERE linked_item_type = 'order';
TRUNCATE TABLE order_payments CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE expense_payments CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE material_purchase_payments CASCADE;
TRUNCATE TABLE material_purchases CASCADE;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE suppliers CASCADE;
TRUNCATE TABLE clients CASCADE;

-- Create a user ID for test data
-- Change this to match an actual user ID in your system
DO $$ 
DECLARE
    admin_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN

-- Insert clients with varied profiles
INSERT INTO clients (id, name, created_at, updated_at)
VALUES
  (uuid_generate_v4(), 'John Smith', NOW() - INTERVAL '29 days', NOW()),
  (uuid_generate_v4(), 'Alice Johnson', NOW() - INTERVAL '28 days', NOW()),
  (uuid_generate_v4(), 'Robert Davis', NOW() - INTERVAL '27 days', NOW()),
  (uuid_generate_v4(), 'Sarah Williams', NOW() - INTERVAL '26 days', NOW()),
  (uuid_generate_v4(), 'Michael Brown', NOW() - INTERVAL '25 days', NOW()),
  (uuid_generate_v4(), 'Karen Cooper', NOW() - INTERVAL '24 days', NOW()),
  (uuid_generate_v4(), 'Primax Ltd', NOW() - INTERVAL '23 days', NOW()),
  (uuid_generate_v4(), 'Zenith Enterprises', NOW() - INTERVAL '22 days', NOW());

-- Insert suppliers for various materials
INSERT INTO suppliers (id, name, contact_person, phone, email, created_at, updated_at)
VALUES
  (uuid_generate_v4(), 'Paper Supplies Co', 'David Kim', '0780123456', 'info@papersupplies.com', NOW() - INTERVAL '29 days', NOW()),
  (uuid_generate_v4(), 'Ink Masters', 'Lisa Wong', '0780234567', 'sales@inkmasters.com', NOW() - INTERVAL '28 days', NOW()),
  (uuid_generate_v4(), 'PrintTech Solutions', 'James Carter', '0780345678', 'contact@printtech.com', NOW() - INTERVAL '27 days', NOW()),
  (uuid_generate_v4(), 'Graphics World', 'Susan Lee', '0780456789', 'orders@graphicsworld.com', NOW() - INTERVAL '26 days', NOW());

-- Get IDs for foreign key references
WITH client_ids AS (
    SELECT id FROM clients ORDER BY created_at LIMIT 8
),
supplier_ids AS (
    SELECT id FROM suppliers ORDER BY created_at LIMIT 4
)

-- Insert orders with different statuses
INSERT INTO orders (id, client_id, date, status, payment_status, total_amount, amount_paid, balance, created_by, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    client_id,
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'completed'
        ELSE 'canceled'
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
    0, -- balance will be calculated in an update
    admin_user_id,
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
FROM (
    SELECT id AS client_id 
    FROM client_ids 
    CROSS JOIN generate_series(1, 4) -- 4 orders per client
) AS client_orders;

-- Update balance field based on total_amount and amount_paid
UPDATE orders SET balance = total_amount - amount_paid;

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
INSERT INTO order_items (id, order_id, item_id, category_id, quantity, unit_price, total_amount, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    order_id,
    item_id,
    category_id,
    (random() * 100 + 1)::int, -- quantity
    (random() * 50000 + 5000)::int, -- unit_price
    0, -- total_amount will be calculated in an update
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
FROM (
    SELECT 
        o.id as order_id,
        (SELECT id FROM item_ids OFFSET floor(random() * 20) LIMIT 1) as item_id,
        (SELECT id FROM category_ids OFFSET floor(random() * 10) LIMIT 1) as category_id
    FROM (SELECT id FROM order_ids) o
    CROSS JOIN generate_series(1, floor(random() * 3 + 1)::int) -- 1-3 items per order
) AS order_items;

-- Update total_amount field based on quantity and unit_price
UPDATE order_items SET total_amount = quantity * unit_price;

-- Create order payments
WITH order_info AS (
    SELECT id, amount_paid 
    FROM orders 
    WHERE amount_paid > 0
)
INSERT INTO order_payments (id, order_id, amount, payment_date, payment_type, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    order_id,
    CASE 
        WHEN amount_paid <= 200000 THEN amount_paid 
        ELSE (random() * (amount_paid * 0.7) + amount_paid * 0.3)::int -- partial payment amount
    END,
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'bank_transfer'
        ELSE 'mobile_payment'
    END,
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
FROM (
    SELECT id as order_id, amount_paid
    FROM order_info
) AS order_payments;

-- Add second payment for some orders
WITH order_info AS (
    SELECT o.id, o.amount_paid, COALESCE(SUM(op.amount), 0) as paid_so_far
    FROM orders o
    LEFT JOIN order_payments op ON o.id = op.order_id
    GROUP BY o.id, o.amount_paid
    HAVING o.amount_paid > COALESCE(SUM(op.amount), 0) AND o.amount_paid > 200000
)
INSERT INTO order_payments (id, order_id, amount, payment_date, payment_type, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    order_id,
    (amount_paid - paid_so_far),
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int),
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'bank_transfer'
        ELSE 'mobile_payment'
    END,
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 7)::int)
FROM (
    SELECT id as order_id, amount_paid, paid_so_far
    FROM order_info
) AS remaining_payments;

-- Create expenses
INSERT INTO expenses (id, date, category, description, amount, total_amount, amount_paid, balance, created_by, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    NOW() - (INTERVAL '1 day' * floor(random() * 60)::int),
    CASE floor(random() * 12)::int
        WHEN 0 THEN 'Rent'
        WHEN 1 THEN 'Utilities'
        WHEN 2 THEN 'Salaries'
        WHEN 3 THEN 'Marketing'
        WHEN 4 THEN 'Equipment'
        WHEN 5 THEN 'Maintenance'
        WHEN 6 THEN 'Internet'
        WHEN 7 THEN 'Insurance'
        WHEN 8 THEN 'Office Supplies'
        WHEN 9 THEN 'Training'
        WHEN 10 THEN 'Travel'
        ELSE 'Software Subscriptions'
    END,
    CASE floor(random() * 12)::int
        WHEN 0 THEN 'Monthly office rent'
        WHEN 1 THEN 'Electricity and water bills'
        WHEN 2 THEN 'Staff salaries for the month'
        WHEN 3 THEN 'Facebook and Google ads'
        WHEN 4 THEN 'New printer purchase'
        WHEN 5 THEN 'Equipment maintenance'
        WHEN 6 THEN 'Monthly internet subscription'
        WHEN 7 THEN 'Annual business insurance'
        WHEN 8 THEN 'Paper, ink and office supplies'
        WHEN 9 THEN 'Staff training workshop'
        WHEN 10 THEN 'Business travel expenses'
        ELSE 'Software licenses'
    END,
    (random() * 500000 + 50000)::int, -- amount
    (random() * 1000000 + 50000)::int, -- total_amount
    CASE 
        WHEN floor(random() * 10)::int <= 7 THEN (random() * 1000000 + 50000)::int -- amount_paid (mostly paid)
        ELSE 0 -- unpaid
    END,
    0, -- balance will be calculated in update
    admin_user_id,
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
FROM generate_series(1, 30);

-- Update expense balance
UPDATE expenses SET balance = total_amount - amount_paid;

-- Create expense payments
WITH expense_info AS (
    SELECT id, amount_paid, date
    FROM expenses
    WHERE amount_paid > 0
)
INSERT INTO expense_payments (id, expense_id, amount, payment_date, payment_type, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    expense_id,
    CASE 
        WHEN amount_paid <= 200000 THEN amount_paid
        ELSE (random() * (amount_paid * 0.7) + amount_paid * 0.3)::int -- partial payment
    END,
    expense_date, -- use expense date for payment
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'bank_transfer'
        ELSE 'mobile_payment'
    END,
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
FROM (
    SELECT id as expense_id, amount_paid, date as expense_date
    FROM expense_info
) AS expense_payments;

-- Add second payment for some expenses
WITH expense_info AS (
    SELECT e.id, e.amount_paid, COALESCE(SUM(ep.amount), 0) as paid_so_far, e.date
    FROM expenses e
    LEFT JOIN expense_payments ep ON e.id = ep.expense_id
    GROUP BY e.id, e.amount_paid, e.date
    HAVING e.amount_paid > COALESCE(SUM(ep.amount), 0) AND e.amount_paid > 200000
)
INSERT INTO expense_payments (id, expense_id, amount, payment_date, payment_type, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    expense_id,
    (amount_paid - paid_so_far),
    expense_date + INTERVAL '5 days',
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'bank_transfer'
        ELSE 'mobile_payment'
    END,
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 7)::int)
FROM (
    SELECT id as expense_id, amount_paid, paid_so_far, date as expense_date
    FROM expense_info
) AS remaining_payments;

-- Create material purchases
WITH supplier_ids AS (
    SELECT id FROM suppliers ORDER BY created_at LIMIT 4
)
INSERT INTO material_purchases (id, supplier_id, date, description, quantity, unit, total_amount, amount_paid, balance, installment, created_by, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    supplier_id,
    NOW() - (INTERVAL '1 day' * floor(random() * 60)::int),
    CASE floor(random() * 6)::int
        WHEN 0 THEN 'Paper - Ream'
        WHEN 1 THEN 'Ink - Liter'
        WHEN 2 THEN 'Vinyl - Roll'
        WHEN 3 THEN 'Toner - Cartridge'
        WHEN 4 THEN 'Lamination Film - Roll'
        ELSE 'Binding Materials - Box'
    END,
    (random() * 50 + 1)::int, -- quantity
    CASE floor(random() * 6)::int
        WHEN 0 THEN 'Ream'
        WHEN 1 THEN 'Liter'
        WHEN 2 THEN 'Roll'
        WHEN 3 THEN 'Cartridge'
        WHEN 4 THEN 'Box'
        ELSE 'Pack'
    END,
    (random() * 800000 + 200000)::int, -- total_amount
    CASE 
        WHEN floor(random() * 10)::int <= 7 THEN (random() * 800000 + 200000)::int -- amount_paid (mostly paid)
        ELSE 0 -- unpaid
    END,
    0, -- balance will be calculated
    CASE WHEN floor(random() * 10)::int <= 3 THEN TRUE ELSE FALSE END, -- installment
    admin_user_id,
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
FROM (
    SELECT id AS supplier_id
    FROM supplier_ids
    CROSS JOIN generate_series(1, 5) -- 5 purchases per supplier
) AS material_purchases;

-- Update material purchase balance
UPDATE material_purchases SET balance = total_amount - amount_paid;

-- Create material purchase payments
WITH material_purchase_info AS (
    SELECT id, amount_paid, date
    FROM material_purchases
    WHERE amount_paid > 0
)
INSERT INTO material_purchase_payments (id, material_purchase_id, amount, payment_date, payment_type, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    purchase_id,
    CASE 
        WHEN amount_paid <= 200000 THEN amount_paid
        ELSE (random() * (amount_paid * 0.7) + amount_paid * 0.3)::int -- partial payment
    END,
    purchase_date,
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'bank_transfer'
        ELSE 'mobile_payment'
    END,
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
FROM (
    SELECT id as purchase_id, amount_paid, date as purchase_date
    FROM material_purchase_info
) AS purchase_payments;

-- Add second payment for some material purchases
WITH purchase_info AS (
    SELECT mp.id, mp.amount_paid, COALESCE(SUM(mpp.amount), 0) as paid_so_far, mp.date
    FROM material_purchases mp
    LEFT JOIN material_purchase_payments mpp ON mp.id = mpp.material_purchase_id
    GROUP BY mp.id, mp.amount_paid, mp.date
    HAVING mp.amount_paid > COALESCE(SUM(mpp.amount), 0) AND mp.amount_paid > 200000
)
INSERT INTO material_purchase_payments (id, material_purchase_id, amount, payment_date, payment_type, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    purchase_id,
    (amount_paid - paid_so_far),
    purchase_date + INTERVAL '5 days',
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'bank_transfer'
        ELSE 'mobile_payment'
    END,
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 7)::int)
FROM (
    SELECT id as purchase_id, amount_paid, paid_so_far, date as purchase_date
    FROM purchase_info
) AS remaining_payments;

-- Create tasks
WITH order_ids AS (
    SELECT id FROM orders ORDER BY created_at LIMIT 30
)
INSERT INTO tasks (id, title, description, due_date, priority, status, recurring, linked_item_type, linked_item_id, assigned_to, created_by, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    CASE floor(random() * 6)::int
        WHEN 0 THEN 'Design Task - ' || substr(md5(random()::text), 1, 6)
        WHEN 1 THEN 'Production Task - ' || substr(md5(random()::text), 1, 6)
        WHEN 2 THEN 'Delivery Task - ' || substr(md5(random()::text), 1, 6)
        WHEN 3 THEN 'Follow-up Task - ' || substr(md5(random()::text), 1, 6)
        WHEN 4 THEN 'Maintenance Task - ' || substr(md5(random()::text), 1, 6)
        ELSE 'Administrative Task - ' || substr(md5(random()::text), 1, 6)
    END,
    CASE floor(random() * 6)::int
        WHEN 0 THEN 'Design related task that needs to be completed'
        WHEN 1 THEN 'Production related task that needs to be completed'
        WHEN 2 THEN 'Delivery related task that needs to be completed'
        WHEN 3 THEN 'Follow-up related task that needs to be completed'
        WHEN 4 THEN 'Maintenance related task that needs to be completed'
        ELSE 'Administrative related task that needs to be completed'
    END,
    NOW() + (INTERVAL '1 day' * floor(random() * 14)::int),
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'low'
        WHEN 1 THEN 'medium'
        ELSE 'high'
    END,
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'in-progress'
        ELSE 'completed'
    END,
    CASE WHEN floor(random() * 10)::int <= 2 THEN TRUE ELSE FALSE END, -- recurring (20% chance)
    CASE
        WHEN floor(random() * 10)::int >= 7 THEN 'order'
        ELSE NULL
    END,
    CASE
        WHEN floor(random() * 10)::int >= 7 THEN order_id
        ELSE NULL
    END,
    admin_user_id,
    admin_user_id,
    NOW() - (INTERVAL '1 day' * floor(random() * 30)::int),
    NOW() - (INTERVAL '1 day' * floor(random() * 15)::int)
FROM (
    SELECT id as order_id
    FROM order_ids 
    CROSS JOIN generate_series(1, floor(random() * 3 + 1)::int) -- 1-3 tasks potentially linked to each order
) AS task_generator;

-- Create order notes using the generic notes table
WITH order_ids AS (
    SELECT id FROM orders ORDER BY created_at LIMIT 30
)
INSERT INTO notes (id, type, text, linked_item_type, linked_item_id, created_by, created_at, updated_at)
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