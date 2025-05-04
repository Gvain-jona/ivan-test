-- Migration: Add trigger for automatic next occurrence calculation
-- This migration adds a trigger to automatically update the next occurrence date when a recurring expense is created or modified

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION update_next_occurrence_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process recurring expenses
  IF NEW.is_recurring THEN
    -- If this is a new recurring expense or the recurrence settings have changed
    IF (TG_OP = 'INSERT') OR 
       (TG_OP = 'UPDATE' AND (
         OLD.is_recurring != NEW.is_recurring OR
         OLD.recurrence_frequency != NEW.recurrence_frequency OR
         OLD.recurrence_day_of_month != NEW.recurrence_day_of_month OR
         OLD.recurrence_day_of_week != NEW.recurrence_day_of_week OR
         OLD.recurrence_week_of_month != NEW.recurrence_week_of_month OR
         OLD.recurrence_month_of_year != NEW.recurrence_month_of_year OR
         OLD.monthly_recurrence_type != NEW.monthly_recurrence_type OR
         OLD.recurrence_start_date != NEW.recurrence_start_date
       ))
    THEN
      -- Set the next_occurrence_date if it's not already set
      IF NEW.next_occurrence_date IS NULL THEN
        -- Use the recurrence_start_date as the base date, or fall back to the expense date
        NEW.next_occurrence_date := COALESCE(NEW.recurrence_start_date, NEW.date);
      END IF;
      
      -- Calculate the next occurrence date
      PERFORM calculate_next_occurrence(NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS trigger_update_next_occurrence_date ON expenses;
CREATE TRIGGER trigger_update_next_occurrence_date
AFTER INSERT OR UPDATE OF is_recurring, recurrence_frequency, recurrence_day_of_month, 
                          recurrence_day_of_week, recurrence_week_of_month, 
                          recurrence_month_of_year, monthly_recurrence_type, 
                          recurrence_start_date
ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_next_occurrence_date();

-- Step 3: Add a comment to explain the trigger
COMMENT ON TRIGGER trigger_update_next_occurrence_date ON expenses IS 'Automatically updates the next occurrence date when a recurring expense is created or modified';
