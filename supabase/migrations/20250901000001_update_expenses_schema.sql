-- Update Expenses Schema for Fixed/Variable Categories and Recurring Expenses
-- Created: 2025-09-01

-- Add new columns to expenses table
ALTER TABLE expenses
ADD COLUMN expense_type VARCHAR(20) CHECK (expense_type IN ('fixed', 'variable')) NOT NULL DEFAULT 'variable',
ADD COLUMN item_name VARCHAR(255),
ADD COLUMN quantity DECIMAL(10,2) DEFAULT 1,
ADD COLUMN unit_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
ADD COLUMN recurrence_start_date DATE,
ADD COLUMN recurrence_end_date DATE,
ADD COLUMN next_occurrence_date DATE,
ADD COLUMN reminder_days INTEGER DEFAULT 0;

-- Create recurring expense occurrences table
CREATE TABLE IF NOT EXISTS recurring_expense_occurrences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    occurrence_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'skipped')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS expenses_expense_type_idx ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS expenses_is_recurring_idx ON expenses(is_recurring);
CREATE INDEX IF NOT EXISTS expenses_next_occurrence_date_idx ON expenses(next_occurrence_date);
CREATE INDEX IF NOT EXISTS recurring_expense_occurrences_parent_expense_id_idx ON recurring_expense_occurrences(parent_expense_id);
CREATE INDEX IF NOT EXISTS recurring_expense_occurrences_occurrence_date_idx ON recurring_expense_occurrences(occurrence_date);
CREATE INDEX IF NOT EXISTS recurring_expense_occurrences_status_idx ON recurring_expense_occurrences(status);

-- Add comments for documentation
COMMENT ON COLUMN expenses.expense_type IS 'Type of expense: fixed or variable';
COMMENT ON COLUMN expenses.item_name IS 'Name of the item or service purchased';
COMMENT ON COLUMN expenses.quantity IS 'Quantity of items purchased';
COMMENT ON COLUMN expenses.unit_cost IS 'Cost per unit';
COMMENT ON COLUMN expenses.is_recurring IS 'Whether this expense recurs regularly';
COMMENT ON COLUMN expenses.recurrence_frequency IS 'Frequency of recurrence: daily, weekly, monthly, quarterly, yearly';
COMMENT ON COLUMN expenses.recurrence_start_date IS 'Date when the recurrence starts';
COMMENT ON COLUMN expenses.recurrence_end_date IS 'Date when the recurrence ends (optional)';
COMMENT ON COLUMN expenses.next_occurrence_date IS 'Date of the next occurrence';
COMMENT ON COLUMN expenses.reminder_days IS 'Number of days before occurrence to send a reminder';

COMMENT ON TABLE recurring_expense_occurrences IS 'Individual occurrences of recurring expenses';
COMMENT ON COLUMN recurring_expense_occurrences.parent_expense_id IS 'Reference to the parent recurring expense';
COMMENT ON COLUMN recurring_expense_occurrences.occurrence_date IS 'Date of this specific occurrence';
COMMENT ON COLUMN recurring_expense_occurrences.status IS 'Status of this occurrence: pending, completed, skipped';

-- Create function to calculate next occurrence date
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
    base_date DATE,
    frequency VARCHAR(20)
)
RETURNS DATE AS $$
BEGIN
    CASE frequency
        WHEN 'daily' THEN
            RETURN base_date + INTERVAL '1 day';
        WHEN 'weekly' THEN
            RETURN base_date + INTERVAL '1 week';
        WHEN 'monthly' THEN
            RETURN base_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            RETURN base_date + INTERVAL '3 months';
        WHEN 'yearly' THEN
            RETURN base_date + INTERVAL '1 year';
        ELSE
            RETURN NULL;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update next_occurrence_date when a recurring expense is created or updated
CREATE OR REPLACE FUNCTION update_next_occurrence_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_recurring AND NEW.recurrence_frequency IS NOT NULL THEN
        -- If next_occurrence_date is not set or is being reset
        IF NEW.next_occurrence_date IS NULL OR OLD.recurrence_frequency != NEW.recurrence_frequency THEN
            NEW.next_occurrence_date := calculate_next_occurrence(
                COALESCE(NEW.recurrence_start_date, NEW.date),
                NEW.recurrence_frequency
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating next_occurrence_date
DROP TRIGGER IF EXISTS update_next_occurrence_date_trigger ON expenses;
CREATE TRIGGER update_next_occurrence_date_trigger
BEFORE INSERT OR UPDATE OF is_recurring, recurrence_frequency, recurrence_start_date ON expenses
FOR EACH ROW
WHEN (NEW.is_recurring = TRUE)
EXECUTE FUNCTION update_next_occurrence_date();

-- Create function to update total_amount based on quantity and unit_cost
CREATE OR REPLACE FUNCTION update_expense_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if both quantity and unit_cost are provided and total_amount is not manually set
    IF NEW.quantity IS NOT NULL AND NEW.unit_cost IS NOT NULL AND 
       (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.quantity != NEW.quantity OR OLD.unit_cost != NEW.unit_cost))) THEN
        NEW.total_amount := NEW.quantity * NEW.unit_cost;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating total_amount
DROP TRIGGER IF EXISTS update_expense_total_amount_trigger ON expenses;
CREATE TRIGGER update_expense_total_amount_trigger
BEFORE INSERT OR UPDATE OF quantity, unit_cost ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_expense_total_amount();

-- Migrate existing data
-- Set item_name from description for existing expenses
UPDATE expenses
SET item_name = description
WHERE item_name IS NULL AND description IS NOT NULL;
