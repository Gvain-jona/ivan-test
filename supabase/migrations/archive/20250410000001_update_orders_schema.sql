-- Migration to update orders table schema to match frontend requirements
-- Created: 2025-04-10

-- Add client_type column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_type VARCHAR(20) CHECK (client_type IN ('regular', 'contract')) DEFAULT 'regular';

-- Update status check constraint to include all required statuses
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'in_progress', 'paused', 'completed', 'delivered', 'cancelled'));

-- Add date column if it doesn't exist (some migrations might use 'date' instead of 'order_date')
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'date') THEN
        ALTER TABLE orders ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Make sure balance is calculated correctly
-- If balance is not a generated column, make it one
DO $$ 
BEGIN
    -- First check if balance is a generated column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'balance' 
        AND is_generated = 'NEVER'
    ) THEN
        -- Drop the existing column
        ALTER TABLE orders DROP COLUMN balance;
        
        -- Add it back as a generated column
        ALTER TABLE orders 
        ADD COLUMN balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED;
    END IF;
    
    -- If balance doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'balance'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED;
    END IF;
END $$;

-- Add payment_method column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) 
CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'cheque', 'mobile_payment'));

-- Add notes column if it doesn't exist (for storing order notes)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]';

-- Update payment_status check constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid'));

-- Add trigger to automatically update payment_status based on amount_paid and total_amount
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.amount_paid = 0 THEN
        NEW.payment_status := 'unpaid';
    ELSIF NEW.amount_paid >= NEW.total_amount THEN
        NEW.payment_status := 'paid';
    ELSE
        NEW.payment_status := 'partially_paid';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_order_payment_status ON orders;

-- Create the trigger
CREATE TRIGGER update_order_payment_status
BEFORE INSERT OR UPDATE OF amount_paid, total_amount
ON orders
FOR EACH ROW
EXECUTE FUNCTION update_payment_status();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS orders_client_type_idx ON orders(client_type);
CREATE INDEX IF NOT EXISTS orders_payment_method_idx ON orders(payment_method);

-- Add comments for documentation
COMMENT ON COLUMN orders.client_type IS 'Type of client: regular or contract';
COMMENT ON COLUMN orders.payment_method IS 'Method of payment: cash, bank_transfer, credit_card, cheque, mobile_payment';
COMMENT ON COLUMN orders.notes IS 'JSON array of order notes';
COMMENT ON COLUMN orders.balance IS 'Calculated as total_amount - amount_paid';
