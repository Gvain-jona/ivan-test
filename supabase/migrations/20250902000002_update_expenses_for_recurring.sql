-- Update Expenses Table for Recurring Expense Tracking
-- Created: 2025-09-02

-- Add columns to track recurring expense relationships
ALTER TABLE expenses
ADD COLUMN generated_from_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_recurring_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS expenses_generated_from_recurring_idx ON expenses(generated_from_recurring);
CREATE INDEX IF NOT EXISTS expenses_parent_recurring_expense_id_idx ON expenses(parent_recurring_expense_id);

-- Add comments for documentation
COMMENT ON COLUMN expenses.generated_from_recurring IS 'Whether this expense was generated from a recurring expense';
COMMENT ON COLUMN expenses.parent_recurring_expense_id IS 'Reference to the parent recurring expense if this was generated from one';

-- Add auto_payment to payment_type enum in expense_payments table
ALTER TABLE expense_payments
DROP CONSTRAINT IF EXISTS expense_payments_payment_type_check;

ALTER TABLE expense_payments
ADD CONSTRAINT expense_payments_payment_type_check 
CHECK (payment_type IN ('cash', 'bank_transfer', 'mobile_payment', 'cheque', 'auto_payment'));
