-- Remove redundant expense_type field from expenses table
-- Created: 2025-09-01

-- First, drop the triggers that keep category and expense_type in sync
DROP TRIGGER IF EXISTS set_category_from_expense_type_trigger ON expenses;
DROP TRIGGER IF EXISTS sync_expense_type_category_trigger ON expenses;

-- Drop the trigger functions
DROP FUNCTION IF EXISTS set_category_from_expense_type();
DROP FUNCTION IF EXISTS sync_expense_type_category();

-- Remove the expense_type column
ALTER TABLE expenses DROP COLUMN IF EXISTS expense_type;

-- Add a comment to the category column to clarify its purpose
COMMENT ON COLUMN expenses.category IS 'Expense category (fixed or variable)';
