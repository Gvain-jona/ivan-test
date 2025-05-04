-- Migration: Add missing recurrence pattern fields to expenses table
-- This migration adds fields to store advanced recurrence patterns and improves performance
-- with indexes on the recurring_expense_occurrences table.

-- Step 1: Add missing recurrence pattern fields to the expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS recurrence_day_of_week INTEGER,
ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER,
ADD COLUMN IF NOT EXISTS recurrence_week_of_month INTEGER,
ADD COLUMN IF NOT EXISTS recurrence_month_of_year INTEGER,
ADD COLUMN IF NOT EXISTS recurrence_time VARCHAR,
ADD COLUMN IF NOT EXISTS monthly_recurrence_type VARCHAR;

-- Step 2: Add comments to the new columns for better documentation
COMMENT ON COLUMN expenses.recurrence_day_of_week IS 'Day of week for weekly recurrences (0-6, Sunday-Saturday)';
COMMENT ON COLUMN expenses.recurrence_day_of_month IS 'Day of month for monthly recurrences (1-31)';
COMMENT ON COLUMN expenses.recurrence_week_of_month IS 'Week of month for monthly recurrences (1-5)';
COMMENT ON COLUMN expenses.recurrence_month_of_year IS 'Month of year for yearly recurrences (1-12)';
COMMENT ON COLUMN expenses.recurrence_time IS 'Time of day for daily recurrences';
COMMENT ON COLUMN expenses.monthly_recurrence_type IS 'Type of monthly recurrence (day_of_month or day_of_week)';

-- Step 3: Add missing indexes to the recurring_expense_occurrences table for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_expense_occurrences_parent_expense_id
ON recurring_expense_occurrences(parent_expense_id);

CREATE INDEX IF NOT EXISTS idx_recurring_expense_occurrences_occurrence_date
ON recurring_expense_occurrences(occurrence_date);

CREATE INDEX IF NOT EXISTS idx_recurring_expense_occurrences_status
ON recurring_expense_occurrences(status);

-- Step 4: Enhance the calculate_next_occurrence function to use the advanced pattern fields
-- This function is called when generating new occurrences for recurring expenses
CREATE OR REPLACE FUNCTION calculate_next_occurrence(expense_id UUID)
RETURNS VOID AS $$
DECLARE
  exp RECORD;
BEGIN
  -- Get the expense record with all fields
  SELECT * INTO exp FROM expenses WHERE id = expense_id;

  -- Update next_occurrence_date based on frequency and pattern
  UPDATE expenses SET next_occurrence_date =
    CASE exp.recurrence_frequency
      -- Daily recurrence: simply add one day
      WHEN 'daily' THEN exp.next_occurrence_date + INTERVAL '1 day'

      -- Weekly recurrence: use day_of_week if specified
      WHEN 'weekly' THEN
        CASE WHEN exp.recurrence_day_of_week IS NOT NULL THEN
          -- Find the next occurrence of this day of week
          -- Calculate days to add to get to the next occurrence of the specified day
          exp.next_occurrence_date + INTERVAL '1 day' *
            ((exp.recurrence_day_of_week - EXTRACT(DOW FROM exp.next_occurrence_date) + 7) % 7)
        ELSE
          -- Default: just add a week
          exp.next_occurrence_date + INTERVAL '1 week'
        END

      -- Monthly recurrence: handle different types
      WHEN 'monthly' THEN
        CASE exp.monthly_recurrence_type
          -- Same day each month (e.g., 15th of every month)
          WHEN 'day_of_month' THEN
            -- Get the first day of next month, then add (day-1) days
            (DATE_TRUNC('month', exp.next_occurrence_date) + INTERVAL '1 month' +
             ((COALESCE(exp.recurrence_day_of_month, EXTRACT(DAY FROM exp.next_occurrence_date)) - 1) || ' days')::INTERVAL)::DATE

          -- Specific day of a specific week (e.g., 3rd Monday)
          WHEN 'day_of_week' THEN
            -- For now, just add a month - this will be enhanced in a future update
            -- to properly calculate the exact day based on week and day of week
            exp.next_occurrence_date + INTERVAL '1 month'

          -- Default: just add a month
          ELSE
            exp.next_occurrence_date + INTERVAL '1 month'
        END

      -- Quarterly recurrence: add three months
      WHEN 'quarterly' THEN exp.next_occurrence_date + INTERVAL '3 months'

      -- Yearly recurrence: use month_of_year and day_of_month if specified
      WHEN 'yearly' THEN
        CASE
          WHEN exp.recurrence_month_of_year IS NOT NULL AND exp.recurrence_day_of_month IS NOT NULL THEN
            -- Create a date with the specified month and day in the next year
            -- Use LEAST to handle cases like Feb 29 in non-leap years
            MAKE_DATE(EXTRACT(YEAR FROM exp.next_occurrence_date)::INTEGER + 1,
                      exp.recurrence_month_of_year,
                      LEAST(exp.recurrence_day_of_month,
                            EXTRACT(DAY FROM
                                    (DATE_TRUNC('MONTH',
                                               MAKE_DATE(EXTRACT(YEAR FROM exp.next_occurrence_date)::INTEGER + 1,
                                                        exp.recurrence_month_of_year, 1)) +
                                     INTERVAL '1 MONTH - 1 DAY')::DATE)::INTEGER))
          ELSE
            -- Default: just add a year
            exp.next_occurrence_date + INTERVAL '1 year'
        END

      -- Default: add a month (fallback)
      ELSE exp.next_occurrence_date + INTERVAL '1 month'
    END,
    updated_at = NOW()
  WHERE id = expense_id AND is_recurring = true
    AND (recurrence_end_date IS NULL OR next_occurrence_date <= recurrence_end_date);
END;
$$ LANGUAGE plpgsql;
