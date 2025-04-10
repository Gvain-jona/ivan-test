-- Consolidated Materials Schema for Ivan Prints Business Management System
-- This migration consolidates all materials-related tables into a single file
-- Created: 2025-06-01

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS material_payments CASCADE;
DROP TABLE IF EXISTS material_purchases CASCADE;

-- Create Material Purchases Table
CREATE TABLE material_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Material Payments Table
CREATE TABLE material_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES material_purchases(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'cheque', 'mobile_payment')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update material purchase payment status when payments are added/updated/deleted
CREATE OR REPLACE FUNCTION update_material_purchase_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total DECIMAL(10,2);
    v_paid DECIMAL(10,2);
BEGIN
    -- Get the purchase's total amount
    SELECT total_amount INTO v_total
    FROM material_purchases
    WHERE id = COALESCE(NEW.purchase_id, OLD.purchase_id);
    
    -- Get the total amount paid
    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM material_payments
    WHERE purchase_id = COALESCE(NEW.purchase_id, OLD.purchase_id);
    
    -- Update the purchase's amount_paid and payment_status
    UPDATE material_purchases
    SET 
        amount_paid = v_paid,
        payment_status = CASE
            WHEN v_paid = 0 THEN 'unpaid'
            WHEN v_paid >= v_total THEN 'paid'
            ELSE 'partially_paid'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.purchase_id, OLD.purchase_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for material_payments changes
CREATE TRIGGER update_material_purchase_payment_status_insert_trigger
AFTER INSERT ON material_payments
FOR EACH ROW
EXECUTE FUNCTION update_material_purchase_payment_status();

CREATE TRIGGER update_material_purchase_payment_status_update_trigger
AFTER UPDATE OF amount ON material_payments
FOR EACH ROW
EXECUTE FUNCTION update_material_purchase_payment_status();

CREATE TRIGGER update_material_purchase_payment_status_delete_trigger
AFTER DELETE ON material_payments
FOR EACH ROW
EXECUTE FUNCTION update_material_purchase_payment_status();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS material_purchases_supplier_id_idx ON material_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS material_purchases_date_idx ON material_purchases(date);
CREATE INDEX IF NOT EXISTS material_purchases_payment_status_idx ON material_purchases(payment_status);
CREATE INDEX IF NOT EXISTS material_purchases_created_by_idx ON material_purchases(created_by);

CREATE INDEX IF NOT EXISTS material_payments_purchase_id_idx ON material_payments(purchase_id);
CREATE INDEX IF NOT EXISTS material_payments_date_idx ON material_payments(date);
CREATE INDEX IF NOT EXISTS material_payments_payment_method_idx ON material_payments(payment_method);
CREATE INDEX IF NOT EXISTS material_payments_created_by_idx ON material_payments(created_by);

-- Add comments for documentation
COMMENT ON TABLE material_purchases IS 'Purchases of materials from suppliers';
COMMENT ON COLUMN material_purchases.payment_status IS 'Payment status: unpaid, partially_paid, paid';
COMMENT ON COLUMN material_purchases.balance IS 'Calculated as total_amount - amount_paid';

COMMENT ON TABLE material_payments IS 'Payments made for material purchases';
COMMENT ON COLUMN material_payments.payment_method IS 'Method of payment: cash, bank_transfer, credit_card, cheque, mobile_payment';
