-- Migration to update order_payments table schema to match frontend requirements
-- Created: 2025-04-10

-- Rename payment_type to payment_method if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_payments' 
        AND column_name = 'payment_type'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_payments' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE order_payments RENAME COLUMN payment_type TO payment_method;
    END IF;
END $$;

-- Add payment_method column if it doesn't exist
ALTER TABLE order_payments 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) 
CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'cheque', 'mobile_payment'));

-- Update payment_method check constraint
ALTER TABLE order_payments 
DROP CONSTRAINT IF EXISTS order_payments_payment_type_check;

ALTER TABLE order_payments 
DROP CONSTRAINT IF EXISTS order_payments_payment_method_check;

ALTER TABLE order_payments 
ADD CONSTRAINT order_payments_payment_method_check 
CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'cheque', 'mobile_payment'));

-- Rename payment_date to date if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_payments' 
        AND column_name = 'payment_date'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_payments' 
        AND column_name = 'date'
    ) THEN
        ALTER TABLE order_payments RENAME COLUMN payment_date TO date;
    END IF;
END $$;

-- Add date column if it doesn't exist
ALTER TABLE order_payments 
ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Add notes column if it doesn't exist
ALTER TABLE order_payments 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create a trigger to update the amount_paid in orders when payments are added/updated/deleted
CREATE OR REPLACE FUNCTION update_order_amount_paid()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id UUID;
    v_total_paid DECIMAL(10,2);
BEGIN
    -- Determine which order to update
    IF TG_OP = 'DELETE' THEN
        v_order_id := OLD.order_id;
    ELSE
        v_order_id := NEW.order_id;
    END IF;
    
    -- Calculate total amount paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM order_payments
    WHERE order_id = v_order_id;
    
    -- Update the order
    UPDATE orders
    SET amount_paid = v_total_paid
    WHERE id = v_order_id;
    
    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop the triggers if they exist
DROP TRIGGER IF EXISTS update_order_amount_paid_insert ON order_payments;
DROP TRIGGER IF EXISTS update_order_amount_paid_update ON order_payments;
DROP TRIGGER IF EXISTS update_order_amount_paid_delete ON order_payments;

-- Create the triggers
CREATE TRIGGER update_order_amount_paid_insert
AFTER INSERT ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_amount_paid();

CREATE TRIGGER update_order_amount_paid_update
AFTER UPDATE OF amount ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_amount_paid();

CREATE TRIGGER update_order_amount_paid_delete
AFTER DELETE ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_amount_paid();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS order_payments_date_idx ON order_payments(date);
CREATE INDEX IF NOT EXISTS order_payments_payment_method_idx ON order_payments(payment_method);

-- Add comments for documentation
COMMENT ON COLUMN order_payments.payment_method IS 'Method of payment: cash, bank_transfer, credit_card, cheque, mobile_payment';
COMMENT ON COLUMN order_payments.date IS 'Date of payment';
COMMENT ON COLUMN order_payments.notes IS 'Additional notes about the payment';
