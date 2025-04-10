-- Disable triggers that might cause issues during migration
-- This file runs before any other migrations to ensure a clean start
-- Created: 2025-06-01

-- Check if tables exist before dropping triggers
DO $$
BEGIN
  -- Drop triggers if the tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    DROP TRIGGER IF EXISTS order_payment_status_trigger ON orders;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    DROP TRIGGER IF EXISTS expense_payment_balance_trigger ON expenses;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_purchases') THEN
    DROP TRIGGER IF EXISTS material_purchase_payment_balance_trigger ON material_purchases;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_payments') THEN
    DROP TRIGGER IF EXISTS order_payment_update_trigger ON order_payments;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense_payments') THEN
    DROP TRIGGER IF EXISTS expense_payment_update_trigger ON expense_payments;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    DROP TRIGGER IF EXISTS task_overdue_notification_trigger ON tasks;
  END IF;

  -- Drop functions if they exist
  DROP FUNCTION IF EXISTS update_order_payment_status() CASCADE;
  DROP FUNCTION IF EXISTS update_expense_payment_status() CASCADE;
  DROP FUNCTION IF EXISTS update_material_purchase_payment_balance() CASCADE;
  DROP FUNCTION IF EXISTS update_order_payment_total() CASCADE;
  DROP FUNCTION IF EXISTS update_expense_payment_total() CASCADE;
  DROP FUNCTION IF EXISTS update_material_purchase_payment_total() CASCADE;
  DROP FUNCTION IF EXISTS create_overdue_task_notifications() CASCADE;
END $$;
