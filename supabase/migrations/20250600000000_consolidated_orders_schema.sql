-- Consolidated Orders Schema for Ivan Prints Business Management System
-- This migration consolidates all orders-related tables into a single file
-- Created: 2025-06-01

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS order_payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Create Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    client_type VARCHAR(20) CHECK (client_type IN ('regular', 'contract')) DEFAULT 'regular',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'paused', 'completed', 'delivered', 'cancelled')),
    payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'cheque', 'mobile_payment')),
    notes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    category_id UUID REFERENCES categories(id),
    item_name VARCHAR(255), -- Denormalized for performance
    category_name VARCHAR(255), -- Denormalized for performance
    size VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    profit_amount DECIMAL(10,2) DEFAULT 0,
    labor_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Order Payments Table
CREATE TABLE order_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'cheque', 'mobile_payment')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update item_name and category_name from related tables
CREATE OR REPLACE FUNCTION update_order_item_names()
RETURNS TRIGGER AS $$
DECLARE
    v_item_name VARCHAR(255);
    v_category_name VARCHAR(255);
BEGIN
    -- Get item name
    SELECT name INTO v_item_name
    FROM items
    WHERE id = NEW.item_id;

    -- Get category name
    SELECT name INTO v_category_name
    FROM categories
    WHERE id = NEW.category_id;

    -- Update the denormalized fields
    NEW.item_name := v_item_name;
    NEW.category_name := v_category_name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_order_item_names_trigger
BEFORE INSERT OR UPDATE OF item_id, category_id
ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_item_names();

-- Create a trigger to update order totals when items are added/updated/deleted
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the order's total_amount
    UPDATE orders
    SET
        total_amount = (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM order_items
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for order_items changes
CREATE TRIGGER update_order_totals_insert_trigger
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

CREATE TRIGGER update_order_totals_update_trigger
AFTER UPDATE OF quantity, unit_price ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

CREATE TRIGGER update_order_totals_delete_trigger
AFTER DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

-- Create a trigger to update order payment status when payments are added/updated/deleted
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total DECIMAL(10,2);
    v_paid DECIMAL(10,2);
BEGIN
    -- Get the order's total amount
    SELECT total_amount INTO v_total
    FROM orders
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    -- Get the total amount paid
    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM order_payments
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

    -- Update the order's amount_paid and payment_status
    UPDATE orders
    SET
        amount_paid = v_paid,
        payment_status = CASE
            WHEN v_paid = 0 THEN 'unpaid'
            WHEN v_paid >= v_total THEN 'paid'
            ELSE 'partially_paid'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for order_payments changes
CREATE TRIGGER update_order_payment_status_insert_trigger
AFTER INSERT ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();

CREATE TRIGGER update_order_payment_status_update_trigger
AFTER UPDATE OF amount ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();

CREATE TRIGGER update_order_payment_status_delete_trigger
AFTER DELETE ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS orders_client_id_idx ON orders(client_id);
CREATE INDEX IF NOT EXISTS orders_client_type_idx ON orders(client_type);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_date_idx ON orders(date);
CREATE INDEX IF NOT EXISTS orders_created_by_idx ON orders(created_by);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_item_id_idx ON order_items(item_id);
CREATE INDEX IF NOT EXISTS order_items_category_id_idx ON order_items(category_id);
CREATE INDEX IF NOT EXISTS order_items_size_idx ON order_items(size);
CREATE INDEX IF NOT EXISTS order_items_item_name_idx ON order_items(item_name);
CREATE INDEX IF NOT EXISTS order_items_category_name_idx ON order_items(category_name);

CREATE INDEX IF NOT EXISTS order_payments_order_id_idx ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS order_payments_date_idx ON order_payments(date);
CREATE INDEX IF NOT EXISTS order_payments_payment_method_idx ON order_payments(payment_method);

-- Add comments for documentation
COMMENT ON TABLE orders IS 'Main orders table for tracking client orders';
COMMENT ON COLUMN orders.client_type IS 'Type of client: regular or contract';
COMMENT ON COLUMN orders.payment_method IS 'Method of payment: cash, bank_transfer, credit_card, cheque, mobile_payment';
COMMENT ON COLUMN orders.notes IS 'JSON array of order notes';
COMMENT ON COLUMN orders.balance IS 'Calculated as total_amount - amount_paid';

COMMENT ON TABLE order_items IS 'Items included in each order';
COMMENT ON COLUMN order_items.size IS 'Size of the item (small, medium, large, custom)';
COMMENT ON COLUMN order_items.item_name IS 'Denormalized item name for performance';
COMMENT ON COLUMN order_items.category_name IS 'Denormalized category name for performance';
COMMENT ON COLUMN order_items.total_amount IS 'Calculated as quantity * unit_price';

COMMENT ON TABLE order_payments IS 'Payments made for each order';
COMMENT ON COLUMN order_payments.payment_method IS 'Method of payment: cash, bank_transfer, credit_card, cheque, mobile_payment';
