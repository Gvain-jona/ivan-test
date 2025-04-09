-- Consolidated Database Functions for Ivan Prints Business Management System
-- This migration consolidates all database functions into a single file
-- Created: 2025-06-01

-- Function to update order payment status when payments are added/updated/deleted
-- This function is already defined in the consolidated orders schema
-- CREATE OR REPLACE FUNCTION update_order_payment_status()...

-- Function to update expense payment balance
CREATE OR REPLACE FUNCTION update_expense_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance
  NEW.balance := NEW.total_amount - COALESCE(NEW.amount_paid, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for the expense payment balance update function
DROP TRIGGER IF EXISTS expense_payment_balance_trigger ON expenses;
CREATE TRIGGER expense_payment_balance_trigger
BEFORE INSERT OR UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_expense_payment_status();

-- Function to update material purchase payment balance
CREATE OR REPLACE FUNCTION update_material_purchase_payment_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance
  NEW.balance := NEW.total_amount - COALESCE(NEW.amount_paid, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for the material purchase payment balance update function
DROP TRIGGER IF EXISTS material_purchase_payment_balance_trigger ON material_purchases;
CREATE TRIGGER material_purchase_payment_balance_trigger
BEFORE INSERT OR UPDATE ON material_purchases
FOR EACH ROW
EXECUTE FUNCTION update_material_purchase_payment_balance();

-- Function to update expense total when payments are added
CREATE OR REPLACE FUNCTION update_expense_payment_total()
RETURNS TRIGGER AS $$
DECLARE
  total_payments NUMERIC;
BEGIN
  -- Get current total payments for this expense
  SELECT COALESCE(SUM(amount), 0) INTO total_payments
  FROM expense_payments
  WHERE expense_id = NEW.expense_id;

  -- Update the expense's amount_paid
  UPDATE expenses
  SET amount_paid = total_payments
  WHERE id = NEW.expense_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for updating expense total when payments are added
DROP TRIGGER IF EXISTS expense_payment_update_trigger ON expense_payments;
CREATE TRIGGER expense_payment_update_trigger
AFTER INSERT ON expense_payments
FOR EACH ROW
EXECUTE FUNCTION update_expense_payment_total();

-- Function for material purchase payment total update
CREATE OR REPLACE FUNCTION update_material_purchase_payment_total()
RETURNS TRIGGER AS $$
DECLARE
  total_payments NUMERIC;
BEGIN
  -- Get current total payments for this material purchase
  SELECT COALESCE(SUM(amount), 0) INTO total_payments
  FROM material_payments
  WHERE purchase_id = NEW.purchase_id;

  -- Update the material purchase's amount_paid
  UPDATE material_purchases
  SET amount_paid = total_payments
  WHERE id = NEW.purchase_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for updating material purchase total when payments are added
DROP TRIGGER IF EXISTS material_payment_update_trigger ON material_payments;
CREATE TRIGGER material_payment_update_trigger
AFTER INSERT ON material_payments
FOR EACH ROW
EXECUTE FUNCTION update_material_purchase_payment_total();

-- Function to create notifications for overdue tasks
CREATE OR REPLACE FUNCTION create_overdue_task_notifications()
RETURNS TRIGGER AS $$
DECLARE
  task_owner UUID;
  task_title TEXT;
BEGIN
  -- Only create notification if the task is overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status = 'pending' THEN
    -- Get the task owner's ID
    task_owner := NEW.created_by;
    task_title := NEW.title;

    -- Create notification if the notifications table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
      INSERT INTO notifications (
        user_id, type, message, data, status
      ) VALUES (
        task_owner,
        'overdue_task',
        format('Task ''%s'' is overdue. Due: %s', task_title, NEW.due_date),
        json_build_object('task_id', NEW.id)::jsonb,
        'unread'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for creating overdue task notifications
DROP TRIGGER IF EXISTS task_overdue_notification_trigger ON tasks;
CREATE TRIGGER task_overdue_notification_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION create_overdue_task_notifications();
