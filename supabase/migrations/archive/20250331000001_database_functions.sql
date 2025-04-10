-- Function to update order payment status based on amount_paid and total_amount
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If fully paid
  IF COALESCE(NEW.amount_paid, 0) >= NEW.total_amount THEN
    NEW.payment_status := 'paid';
    NEW.balance := 0;
    NEW.amount_paid := NEW.total_amount;
  -- If partially paid
  ELSIF COALESCE(NEW.amount_paid, 0) > 0 THEN
    NEW.payment_status := 'partially_paid';
    NEW.balance := NEW.total_amount - COALESCE(NEW.amount_paid, 0);
  -- If no payment
  ELSE
    NEW.payment_status := 'unpaid';
    NEW.balance := NEW.total_amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for the payment status update function
CREATE TRIGGER order_payment_status_trigger
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();

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
CREATE TRIGGER material_purchase_payment_balance_trigger
BEFORE INSERT OR UPDATE ON material_purchases
FOR EACH ROW
EXECUTE FUNCTION update_material_purchase_payment_balance();

-- Function to update order total when payments are added
CREATE OR REPLACE FUNCTION update_order_payment_total()
RETURNS TRIGGER AS $$
DECLARE
  total_payments NUMERIC;
BEGIN
  -- Get current total payments for this order, ensuring NULL safety
  SELECT COALESCE(SUM(amount), 0) INTO total_payments
  FROM order_payments
  WHERE order_id = NEW.order_id;

  -- Update the order's amount_paid
  UPDATE orders
  SET amount_paid = total_payments
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for updating order total when payments are added
CREATE TRIGGER order_payment_update_trigger
AFTER INSERT ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_total();

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
CREATE TRIGGER expense_payment_update_trigger
AFTER INSERT ON expense_payments
FOR EACH ROW
EXECUTE FUNCTION update_expense_payment_total();

-- Function for material purchase payment total update (definition only, trigger will be created later)
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

-- NOTE: The trigger for material_payments will be created in a later migration
-- after the material_payments table exists

-- Function to create notifications for overdue tasks
CREATE OR REPLACE FUNCTION create_overdue_task_notifications()
RETURNS TRIGGER AS $$
DECLARE
  task_owner TEXT;
  task_title TEXT;
BEGIN
  -- Only create notification if the task is overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status = 'pending' THEN
    -- Get the task owner's ID
    SELECT id INTO task_owner FROM users WHERE id = NEW.created_by LIMIT 1;
    task_title := NEW.title;

    -- Create notification
    INSERT INTO notifications (
      user_id, type, message, push_message, data, status
    ) VALUES (
      task_owner,
      'overdue_task',
      format('Task ''%s'' is overdue. Due: %s', task_title, NEW.due_date),
      format('Task overdue: %s', task_title),
      json_build_object('task_id', NEW.id)::text,
      'unread'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for creating overdue task notifications
CREATE TRIGGER task_overdue_notification_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION create_overdue_task_notifications();
