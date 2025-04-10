-- Row Level Security Policies for Ivan Prints Business Management System

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Admin can do anything with users
CREATE POLICY admin_all_users ON users
  FOR ALL 
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Users can see themselves
CREATE POLICY see_self_users ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Managers can see all users but can only modify employees
CREATE POLICY manager_select_users ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'manager'));

CREATE POLICY manager_modify_employees ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'manager') AND 
    role = 'staff'
  );

-- Policies for clients table
-- Admin and managers can do anything with clients
CREATE POLICY admin_manager_all_clients ON clients
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Employees can only view clients
CREATE POLICY employee_view_clients ON clients
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

-- Policies for categories table
-- Admin and managers can do anything with categories
CREATE POLICY admin_manager_all_categories ON categories
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Employees can only view categories
CREATE POLICY employee_view_categories ON categories
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

-- Policies for items table
-- Admin and managers can do anything with items
CREATE POLICY admin_manager_all_items ON items
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Employees can view all items
CREATE POLICY employee_view_items ON items
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

-- Policies for suppliers table
-- Admin and managers can do anything with suppliers
CREATE POLICY admin_manager_all_suppliers ON suppliers
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Employees can only view suppliers
CREATE POLICY employee_view_suppliers ON suppliers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

-- Policies for orders table
-- Admin and managers can do anything with orders
CREATE POLICY admin_manager_all_orders ON orders
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Employees can view all orders but only modify those they created
CREATE POLICY employee_view_orders ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

CREATE POLICY employee_modify_own_orders ON orders
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    ) AND
    created_by = auth.uid()
  );

-- Policies for order_items table (follow orders policies)
CREATE POLICY admin_manager_all_order_items ON order_items
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY employee_view_order_items ON order_items
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

CREATE POLICY employee_modify_own_order_items ON order_items
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    ) AND
    order_id IN (
      SELECT id FROM orders WHERE created_by = auth.uid()
    )
  );

-- Policies for order_payments table (follow orders policies)
CREATE POLICY admin_manager_all_order_payments ON order_payments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY employee_view_order_payments ON order_payments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

CREATE POLICY employee_modify_own_order_payments ON order_payments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    ) AND
    order_id IN (
      SELECT id FROM orders WHERE created_by = auth.uid()
    )
  );

-- Policies for expenses table
-- Only admin and managers can manage expenses
CREATE POLICY admin_manager_all_expenses ON expenses
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Employees can only view expenses
CREATE POLICY employee_view_expenses ON expenses
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

-- Policies for expense_payments table (follow expenses policies)
CREATE POLICY admin_manager_all_expense_payments ON expense_payments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY employee_view_expense_payments ON expense_payments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

-- Policies for material_purchases table
-- Only admin and managers can manage material purchases
CREATE POLICY admin_manager_all_material_purchases ON material_purchases
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Employees can only view material purchases
CREATE POLICY employee_view_material_purchases ON material_purchases
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

-- Policies for material_purchase_payments table (follow material_purchases policies)
CREATE POLICY admin_manager_all_material_purchase_payments ON material_purchase_payments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY employee_view_material_purchase_payments ON material_purchase_payments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

-- Policies for tasks table
-- Admin and managers can do anything with tasks
CREATE POLICY admin_manager_all_tasks ON tasks
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Employees can view and update tasks assigned to them
CREATE POLICY employee_view_assigned_tasks ON tasks
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    ) AND
    assigned_to = auth.uid()
  );

CREATE POLICY employee_update_assigned_tasks ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    ) AND
    assigned_to = auth.uid()
  );

-- Policies for notes table
-- Admin and managers can do anything with notes
CREATE POLICY admin_manager_all_notes ON notes
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Employees can create notes and view/update their own notes
CREATE POLICY employee_create_notes ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

CREATE POLICY employee_view_own_notes ON notes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    ) AND
    created_by = auth.uid()
  );

CREATE POLICY employee_update_own_notes ON notes
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    ) AND
    created_by = auth.uid()
  );

-- Policies for notifications table
-- Users can only see and update their own notifications
CREATE POLICY user_own_notifications ON notifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for settings table
-- Only admin can modify settings
CREATE POLICY admin_all_settings ON settings
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Everyone can view settings
CREATE POLICY all_view_settings ON settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for approvals table
-- Admin can do anything with approvals
CREATE POLICY admin_all_approvals ON approvals
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Managers can view all approvals and modify as approvers
CREATE POLICY manager_view_approvals ON approvals
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'manager'
    )
  );

CREATE POLICY manager_approve_approvals ON approvals
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'manager'
    ) AND
    approver_id = auth.uid()
  );

-- Employees can view their own approval requests and create new ones
CREATE POLICY employee_view_own_approvals ON approvals
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    ) AND
    requester_id = auth.uid()
  );

CREATE POLICY employee_create_approvals ON approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'staff'
    )
  );

-- Policies for sessions table
-- Users can only see and manage their own sessions
CREATE POLICY user_own_sessions ON sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()); 