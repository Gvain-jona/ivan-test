-- Migration: Fix monthly recurrence calculation
-- This migration fixes the issue with monthly recurrences where the next occurrence date
-- is incorrectly calculated for months with fewer days than the specified recurrence day.

-- Step 1: Update the calculate_next_occurrence function to handle months with fewer days
CREATE OR REPLACE FUNCTION calculate_next_occurrence(expense_id UUID)
RETURNS VOID AS $$
DECLARE
  exp RECORD;
  next_date DATE;
  target_day INTEGER;
  first_of_next_month DATE;
  last_day_of_month INTEGER;
BEGIN
  -- Get the expense record with all fields
  SELECT * INTO exp FROM expenses WHERE id = expense_id;

  -- Skip if not a recurring expense or if it has reached its end date
  IF NOT exp.is_recurring OR (exp.recurrence_end_date IS NOT NULL AND exp.next_occurrence_date > exp.recurrence_end_date) THEN
    RETURN;
  END IF;

  -- Calculate the next occurrence date based on frequency and pattern
  CASE exp.recurrence_frequency
    -- Daily recurrence: simply add one day
    WHEN 'daily' THEN
      next_date := exp.next_occurrence_date + INTERVAL '1 day';

    -- Weekly recurrence: use day_of_week if specified
    WHEN 'weekly' THEN
      IF exp.recurrence_day_of_week IS NOT NULL THEN
        -- Find the next occurrence of this day of week
        -- Calculate days to add to get to the next occurrence of the specified day
        next_date := exp.next_occurrence_date + INTERVAL '1 day' *
          ((exp.recurrence_day_of_week - EXTRACT(DOW FROM exp.next_occurrence_date) + 7) % 7);
        
        -- If the calculated date is the same as the current date, add a week
        IF next_date = exp.next_occurrence_date THEN
          next_date := next_date + INTERVAL '1 week';
        END IF;
      ELSE
        -- Default: just add a week
        next_date := exp.next_occurrence_date + INTERVAL '1 week';
      END IF;

    -- Monthly recurrence: handle different types
    WHEN 'monthly' THEN
      IF exp.monthly_recurrence_type = 'day_of_month' AND exp.recurrence_day_of_month IS NOT NULL THEN
        -- Get the target day of month
        target_day := exp.recurrence_day_of_month;
        
        -- Get the first day of the next month
        first_of_next_month := DATE_TRUNC('month', exp.next_occurrence_date) + INTERVAL '1 month';
        
        -- Get the last day of the next month
        last_day_of_month := EXTRACT(DAY FROM (first_of_next_month + INTERVAL '1 month - 1 day')::DATE);
        
        -- If target day is greater than the last day of the month, use the last day
        IF target_day > last_day_of_month THEN
          target_day := last_day_of_month;
        END IF;
        
        -- Calculate the next occurrence date
        next_date := first_of_next_month + (target_day - 1) * INTERVAL '1 day';
      ELSIF exp.monthly_recurrence_type = 'day_of_week' AND 
            exp.recurrence_day_of_week IS NOT NULL AND 
            exp.recurrence_week_of_month IS NOT NULL THEN
        -- Calculate the next occurrence for a specific day of a specific week
        -- (e.g., 3rd Monday of the month)
        
        -- Get the first day of the next month
        first_of_next_month := DATE_TRUNC('month', exp.next_occurrence_date) + INTERVAL '1 month';
        
        -- Find the first occurrence of the specified day of week in the next month
        next_date := first_of_next_month + INTERVAL '1 day' * 
          ((exp.recurrence_day_of_week - EXTRACT(DOW FROM first_of_next_month) + 7) % 7);
        
        -- Add the specified number of weeks (minus 1 since we already found the first occurrence)
        next_date := next_date + INTERVAL '1 week' * (exp.recurrence_week_of_month - 1);
        
        -- If the calculated date is in the following month, go back to the last occurrence in the target month
        IF EXTRACT(MONTH FROM next_date) != EXTRACT(MONTH FROM first_of_next_month) THEN
          next_date := next_date - INTERVAL '1 week';
        END IF;
      ELSE
        -- Default: just add a month
        next_date := exp.next_occurrence_date + INTERVAL '1 month';
      END IF;

    -- Quarterly recurrence: add 3 months
    WHEN 'quarterly' THEN
      next_date := exp.next_occurrence_date + INTERVAL '3 months';

    -- Yearly recurrence: use month_of_year and day_of_month if specified
    WHEN 'yearly' THEN
      IF exp.recurrence_month_of_year IS NOT NULL AND exp.recurrence_day_of_month IS NOT NULL THEN
        -- Create a date with the specified month and day in the next year
        next_date := MAKE_DATE(
          EXTRACT(YEAR FROM exp.next_occurrence_date)::INTEGER + 1,
          exp.recurrence_month_of_year,
          LEAST(
            exp.recurrence_day_of_month,
            EXTRACT(DAY FROM (
              DATE_TRUNC('MONTH', MAKE_DATE(
                EXTRACT(YEAR FROM exp.next_occurrence_date)::INTEGER + 1,
                exp.recurrence_month_of_year, 1
              )) + INTERVAL '1 MONTH - 1 DAY'
            )::DATE)::INTEGER
          )
        );
      ELSE
        -- Default: just add a year
        next_date := exp.next_occurrence_date + INTERVAL '1 year';
      END IF;

    -- Default: add a month (fallback)
    ELSE 
      next_date := exp.next_occurrence_date + INTERVAL '1 month';
  END CASE;

  -- Update the expense with the new next_occurrence_date
  UPDATE expenses 
  SET 
    next_occurrence_date = next_date,
    updated_at = NOW()
  WHERE 
    id = expense_id 
    AND is_recurring = true
    AND (recurrence_end_date IS NULL OR next_date <= recurrence_end_date);
END;
$$ LANGUAGE plpgsql;

-- Step 2: Add a comment to explain the function
COMMENT ON FUNCTION calculate_next_occurrence(UUID) IS 'Calculates the next occurrence date for a recurring expense based on its frequency and pattern';

-- Step 3: Create a function to fix existing recurring expenses with incorrect next_occurrence_date
CREATE OR REPLACE FUNCTION fix_recurring_expenses_next_occurrence()
RETURNS INTEGER AS $$
DECLARE
  fixed_count INTEGER := 0;
  exp RECORD;
BEGIN
  -- Loop through all recurring expenses
  FOR exp IN 
    SELECT id 
    FROM expenses 
    WHERE is_recurring = true
  LOOP
    -- Call calculate_next_occurrence for each expense
    PERFORM calculate_next_occurrence(exp.id);
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Execute the fix function to update all existing recurring expenses
SELECT fix_recurring_expenses_next_occurrence();

-- Step 5: Drop the fix function as it's no longer needed
DROP FUNCTION fix_recurring_expenses_next_occurrence();
