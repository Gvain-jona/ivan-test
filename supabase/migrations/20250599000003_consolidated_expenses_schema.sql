-- Consolidated Expenses Schema for Ivan Prints Business Management System
-- This migration consolidates all expenses-related tables into a single file
-- Created: 2025-06-01

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS expense_payments CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;

-- Create Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Expense Payments Table
CREATE TABLE expense_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'cheque', 'mobile_payment')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update expense payment status when payments are added/updated/deleted
CREATE OR REPLACE FUNCTION update_expense_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total DECIMAL(10,2);
    v_paid DECIMAL(10,2);
BEGIN
    -- Get the expense's total amount
    SELECT total_amount INTO v_total
    FROM expenses
    WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
    
    -- Get the total amount paid
    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM expense_payments
    WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id);
    
    -- Update the expense's amount_paid and payment_status
    UPDATE expenses
    SET 
        amount_paid = v_paid,
        payment_status = CASE
            WHEN v_paid = 0 THEN 'unpaid'
            WHEN v_paid >= v_total THEN 'paid'
            ELSE 'partially_paid'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for expense_payments changes
CREATE TRIGGER update_expense_payment_status_insert_trigger
AFTER INSERT ON expense_payments
FOR EACH ROW
EXECUTE FUNCTION update_expense_payment_status();

CREATE TRIGGER update_expense_payment_status_update_trigger
AFTER UPDATE OF amount ON expense_payments
FOR EACH ROW
EXECUTE FUNCTION update_expense_payment_status();

CREATE TRIGGER update_expense_payment_status_delete_trigger
AFTER DELETE ON expense_payments
FOR EACH ROW
EXECUTE FUNCTION update_expense_payment_status();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);
CREATE INDEX IF NOT EXISTS expenses_payment_status_idx ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS expenses_created_by_idx ON expenses(created_by);

CREATE INDEX IF NOT EXISTS expense_payments_expense_id_idx ON expense_payments(expense_id);
CREATE INDEX IF NOT EXISTS expense_payments_date_idx ON expense_payments(date);
CREATE INDEX IF NOT EXISTS expense_payments_payment_method_idx ON expense_payments(payment_method);
CREATE INDEX IF NOT EXISTS expense_payments_created_by_idx ON expense_payments(created_by);

-- Add comments for documentation
COMMENT ON TABLE expenses IS 'Expenses for Ivan Prints Business';
COMMENT ON COLUMN expenses.date IS 'Date the expense was incurred';
COMMENT ON COLUMN expenses.category IS 'Expense category (e.g., Rent, Utilities, Supplies)';
COMMENT ON COLUMN expenses.description IS 'Description of the expense';
COMMENT ON COLUMN expenses.payment_status IS 'Payment status: unpaid, partially_paid, paid';
COMMENT ON COLUMN expenses.balance IS 'Calculated as total_amount - amount_paid';

COMMENT ON TABLE expense_payments IS 'Payments made for expenses';
COMMENT ON COLUMN expense_payments.payment_method IS 'Method of payment: cash, bank_transfer, credit_card, cheque, mobile_payment';
