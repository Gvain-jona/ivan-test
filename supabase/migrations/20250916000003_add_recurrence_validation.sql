-- Migration: Add validation for recurrence settings
-- This migration adds check constraints to ensure that recurrence settings are valid

-- Step 1: Add check constraints for recurrence settings
ALTER TABLE expenses
  -- Validate recurrence_frequency
  ADD CONSTRAINT check_recurrence_frequency
    CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly') OR recurrence_frequency IS NULL),
  
  -- Validate recurrence_day_of_month (1-31)
  ADD CONSTRAINT check_recurrence_day_of_month
    CHECK (recurrence_day_of_month BETWEEN 1 AND 31 OR recurrence_day_of_month IS NULL),
  
  -- Validate recurrence_day_of_week (0-6, Sunday to Saturday)
  ADD CONSTRAINT check_recurrence_day_of_week
    CHECK (recurrence_day_of_week BETWEEN 0 AND 6 OR recurrence_day_of_week IS NULL),
  
  -- Validate recurrence_week_of_month (1-5)
  ADD CONSTRAINT check_recurrence_week_of_month
    CHECK (recurrence_week_of_month BETWEEN 1 AND 5 OR recurrence_week_of_month IS NULL),
  
  -- Validate recurrence_month_of_year (1-12)
  ADD CONSTRAINT check_recurrence_month_of_year
    CHECK (recurrence_month_of_year BETWEEN 1 AND 12 OR recurrence_month_of_year IS NULL),
  
  -- Validate monthly_recurrence_type
  ADD CONSTRAINT check_monthly_recurrence_type
    CHECK (monthly_recurrence_type IN ('day_of_month', 'day_of_week') OR monthly_recurrence_type IS NULL),
  
  -- Validate that recurrence_start_date is not in the past when creating a new recurring expense
  ADD CONSTRAINT check_recurrence_start_date
    CHECK (recurrence_start_date IS NULL OR recurrence_start_date >= date),
  
  -- Validate that recurrence_end_date is after recurrence_start_date
  ADD CONSTRAINT check_recurrence_end_date
    CHECK (recurrence_end_date IS NULL OR recurrence_end_date > recurrence_start_date),
  
  -- Validate that recurring expenses have the necessary fields based on frequency
  ADD CONSTRAINT check_recurring_expense_fields
    CHECK (
      NOT is_recurring OR (
        recurrence_frequency IS NOT NULL AND
        recurrence_start_date IS NOT NULL AND
        (
          -- For daily recurrence, no additional fields required
          recurrence_frequency = 'daily' OR
          
          -- For weekly recurrence, day_of_week is required
          (recurrence_frequency = 'weekly' AND recurrence_day_of_week IS NOT NULL) OR
          
          -- For monthly recurrence, monthly_recurrence_type is required
          (recurrence_frequency = 'monthly' AND monthly_recurrence_type IS NOT NULL AND (
            -- For day_of_month type, recurrence_day_of_month is required
            (monthly_recurrence_type = 'day_of_month' AND recurrence_day_of_month IS NOT NULL) OR
            -- For day_of_week type, recurrence_day_of_week and recurrence_week_of_month are required
            (monthly_recurrence_type = 'day_of_week' AND recurrence_day_of_week IS NOT NULL AND recurrence_week_of_month IS NOT NULL)
          )) OR
          
          -- For quarterly recurrence, no additional fields required
          recurrence_frequency = 'quarterly' OR
          
          -- For yearly recurrence, recurrence_month_of_year and recurrence_day_of_month are required
          (recurrence_frequency = 'yearly' AND recurrence_month_of_year IS NOT NULL AND recurrence_day_of_month IS NOT NULL)
        )
      )
    );

-- Step 2: Create a function to validate recurrence settings
CREATE OR REPLACE FUNCTION validate_recurrence_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate recurring expenses
  IF NEW.is_recurring THEN
    -- Validate based on frequency
    CASE NEW.recurrence_frequency
      WHEN 'daily' THEN
        -- No additional validation needed
        NULL;
      
      WHEN 'weekly' THEN
        -- Validate day_of_week
        IF NEW.recurrence_day_of_week IS NULL THEN
          RAISE EXCEPTION 'Day of week is required for weekly recurrence';
        END IF;
      
      WHEN 'monthly' THEN
        -- Validate monthly_recurrence_type
        IF NEW.monthly_recurrence_type IS NULL THEN
          RAISE EXCEPTION 'Monthly recurrence type is required for monthly recurrence';
        END IF;
        
        -- Validate based on monthly_recurrence_type
        IF NEW.monthly_recurrence_type = 'day_of_month' THEN
          IF NEW.recurrence_day_of_month IS NULL THEN
            RAISE EXCEPTION 'Day of month is required for monthly recurrence with day_of_month type';
          END IF;
        ELSIF NEW.monthly_recurrence_type = 'day_of_week' THEN
          IF NEW.recurrence_day_of_week IS NULL THEN
            RAISE EXCEPTION 'Day of week is required for monthly recurrence with day_of_week type';
          END IF;
          
          IF NEW.recurrence_week_of_month IS NULL THEN
            RAISE EXCEPTION 'Week of month is required for monthly recurrence with day_of_week type';
          END IF;
        END IF;
      
      WHEN 'yearly' THEN
        -- Validate month_of_year and day_of_month
        IF NEW.recurrence_month_of_year IS NULL THEN
          RAISE EXCEPTION 'Month of year is required for yearly recurrence';
        END IF;
        
        IF NEW.recurrence_day_of_month IS NULL THEN
          RAISE EXCEPTION 'Day of month is required for yearly recurrence';
        END IF;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a trigger for the validation function
DROP TRIGGER IF EXISTS trigger_validate_recurrence_settings ON expenses;
CREATE TRIGGER trigger_validate_recurrence_settings
BEFORE INSERT OR UPDATE OF is_recurring, recurrence_frequency, recurrence_day_of_month, 
                          recurrence_day_of_week, recurrence_week_of_month, 
                          recurrence_month_of_year, monthly_recurrence_type
ON expenses
FOR EACH ROW
EXECUTE FUNCTION validate_recurrence_settings();

-- Step 4: Add a comment to explain the trigger
COMMENT ON TRIGGER trigger_validate_recurrence_settings ON expenses IS 'Validates recurrence settings when a recurring expense is created or modified';
