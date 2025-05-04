-- Update Recurring Expense Occurrences Table
-- Created: 2025-09-02

-- Add linked_expense_id and completed_date columns to recurring_expense_occurrences table
ALTER TABLE recurring_expense_occurrences
ADD COLUMN linked_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
ADD COLUMN completed_date TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS recurring_expense_occurrences_linked_expense_id_idx ON recurring_expense_occurrences(linked_expense_id);

-- Add comments for documentation
COMMENT ON COLUMN recurring_expense_occurrences.linked_expense_id IS 'Reference to the expense created when this occurrence was completed';
COMMENT ON COLUMN recurring_expense_occurrences.completed_date IS 'Date and time when this occurrence was marked as completed';

-- Create trigger to set completed_date when status changes to completed
CREATE OR REPLACE FUNCTION update_occurrence_completed_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_date := NOW();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_date := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating completed_date
DROP TRIGGER IF EXISTS update_occurrence_completed_date_trigger ON recurring_expense_occurrences;
CREATE TRIGGER update_occurrence_completed_date_trigger
BEFORE INSERT OR UPDATE OF status ON recurring_expense_occurrences
FOR EACH ROW
EXECUTE FUNCTION update_occurrence_completed_date();
