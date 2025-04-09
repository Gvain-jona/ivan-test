-- Consolidated Row Level Security Policies for Ivan Prints Business Management System
-- Created: 2025-06-01

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is staff, manager, or admin
CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
DO $$ 
BEGIN
  -- Only enable RLS if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
    ALTER TABLE items ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_payments') THEN
    ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense_payments') THEN
    ALTER TABLE expense_payments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_purchases') THEN
    ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_payments') THEN
    ALTER TABLE material_payments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
    ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
    ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approvals') THEN
    ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for clients
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS clients_select_policy ON clients;
    DROP POLICY IF EXISTS clients_insert_policy ON clients;
    DROP POLICY IF EXISTS clients_update_policy ON clients;
    DROP POLICY IF EXISTS clients_delete_policy ON clients;
    
    -- Create new policies
    CREATE POLICY clients_select_policy ON clients
      FOR SELECT USING (is_staff_or_above());
      
    CREATE POLICY clients_insert_policy ON clients
      FOR INSERT WITH CHECK (is_staff_or_above());
      
    CREATE POLICY clients_update_policy ON clients
      FOR UPDATE USING (is_staff_or_above());
      
    CREATE POLICY clients_delete_policy ON clients
      FOR DELETE USING (is_manager_or_admin());
  END IF;
END $$;

-- Create RLS policies for categories
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS categories_select_policy ON categories;
    DROP POLICY IF EXISTS categories_insert_policy ON categories;
    DROP POLICY IF EXISTS categories_update_policy ON categories;
    DROP POLICY IF EXISTS categories_delete_policy ON categories;
    
    -- Create new policies
    CREATE POLICY categories_select_policy ON categories
      FOR SELECT USING (is_staff_or_above());
      
    CREATE POLICY categories_insert_policy ON categories
      FOR INSERT WITH CHECK (is_manager_or_admin());
      
    CREATE POLICY categories_update_policy ON categories
      FOR UPDATE USING (is_manager_or_admin());
      
    CREATE POLICY categories_delete_policy ON categories
      FOR DELETE USING (is_admin());
  END IF;
END $$;

-- Create RLS policies for items
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS items_select_policy ON items;
    DROP POLICY IF EXISTS items_insert_policy ON items;
    DROP POLICY IF EXISTS items_update_policy ON items;
    DROP POLICY IF EXISTS items_delete_policy ON items;
    
    -- Create new policies
    CREATE POLICY items_select_policy ON items
      FOR SELECT USING (is_staff_or_above());
      
    CREATE POLICY items_insert_policy ON items
      FOR INSERT WITH CHECK (is_staff_or_above());
      
    CREATE POLICY items_update_policy ON items
      FOR UPDATE USING (is_staff_or_above());
      
    CREATE POLICY items_delete_policy ON items
      FOR DELETE USING (is_manager_or_admin());
  END IF;
END $$;

-- Create RLS policies for orders and related tables
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS orders_select_policy ON orders;
    DROP POLICY IF EXISTS orders_insert_policy ON orders;
    DROP POLICY IF EXISTS orders_update_policy ON orders;
    DROP POLICY IF EXISTS orders_delete_policy ON orders;
    
    -- Create new policies
    CREATE POLICY orders_select_policy ON orders
      FOR SELECT USING (is_staff_or_above());
      
    CREATE POLICY orders_insert_policy ON orders
      FOR INSERT WITH CHECK (is_staff_or_above());
      
    CREATE POLICY orders_update_policy ON orders
      FOR UPDATE USING (is_staff_or_above());
      
    CREATE POLICY orders_delete_policy ON orders
      FOR DELETE USING (is_manager_or_admin());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS order_items_select_policy ON order_items;
    DROP POLICY IF EXISTS order_items_insert_policy ON order_items;
    DROP POLICY IF EXISTS order_items_update_policy ON order_items;
    DROP POLICY IF EXISTS order_items_delete_policy ON order_items;
    
    -- Create new policies
    CREATE POLICY order_items_select_policy ON order_items
      FOR SELECT USING (is_staff_or_above());
      
    CREATE POLICY order_items_insert_policy ON order_items
      FOR INSERT WITH CHECK (is_staff_or_above());
      
    CREATE POLICY order_items_update_policy ON order_items
      FOR UPDATE USING (is_staff_or_above());
      
    CREATE POLICY order_items_delete_policy ON order_items
      FOR DELETE USING (is_staff_or_above());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_payments') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS order_payments_select_policy ON order_payments;
    DROP POLICY IF EXISTS order_payments_insert_policy ON order_payments;
    DROP POLICY IF EXISTS order_payments_update_policy ON order_payments;
    DROP POLICY IF EXISTS order_payments_delete_policy ON order_payments;
    
    -- Create new policies
    CREATE POLICY order_payments_select_policy ON order_payments
      FOR SELECT USING (is_staff_or_above());
      
    CREATE POLICY order_payments_insert_policy ON order_payments
      FOR INSERT WITH CHECK (is_staff_or_above());
      
    CREATE POLICY order_payments_update_policy ON order_payments
      FOR UPDATE USING (is_staff_or_above());
      
    CREATE POLICY order_payments_delete_policy ON order_payments
      FOR DELETE USING (is_manager_or_admin());
  END IF;
END $$;

-- Create RLS policies for suppliers and material purchases
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS suppliers_select_policy ON suppliers;
    DROP POLICY IF EXISTS suppliers_insert_policy ON suppliers;
    DROP POLICY IF EXISTS suppliers_update_policy ON suppliers;
    DROP POLICY IF EXISTS suppliers_delete_policy ON suppliers;
    
    -- Create new policies
    CREATE POLICY suppliers_select_policy ON suppliers
      FOR SELECT USING (is_staff_or_above());
      
    CREATE POLICY suppliers_insert_policy ON suppliers
      FOR INSERT WITH CHECK (is_staff_or_above());
      
    CREATE POLICY suppliers_update_policy ON suppliers
      FOR UPDATE USING (is_staff_or_above());
      
    CREATE POLICY suppliers_delete_policy ON suppliers
      FOR DELETE USING (is_manager_or_admin());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_purchases') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS material_purchases_select_policy ON material_purchases;
    DROP POLICY IF EXISTS material_purchases_insert_policy ON material_purchases;
    DROP POLICY IF EXISTS material_purchases_update_policy ON material_purchases;
    DROP POLICY IF EXISTS material_purchases_delete_policy ON material_purchases;
    
    -- Create new policies
    CREATE POLICY material_purchases_select_policy ON material_purchases
      FOR SELECT USING (is_staff_or_above());
      
    CREATE POLICY material_purchases_insert_policy ON material_purchases
      FOR INSERT WITH CHECK (is_staff_or_above());
      
    CREATE POLICY material_purchases_update_policy ON material_purchases
      FOR UPDATE USING (is_staff_or_above());
      
    CREATE POLICY material_purchases_delete_policy ON material_purchases
      FOR DELETE USING (is_manager_or_admin());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_payments') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS material_payments_select_policy ON material_payments;
    DROP POLICY IF EXISTS material_payments_insert_policy ON material_payments;
    DROP POLICY IF EXISTS material_payments_update_policy ON material_payments;
    DROP POLICY IF EXISTS material_payments_delete_policy ON material_payments;
    
    -- Create new policies
    CREATE POLICY material_payments_select_policy ON material_payments
      FOR SELECT USING (is_staff_or_above());
      
    CREATE POLICY material_payments_insert_policy ON material_payments
      FOR INSERT WITH CHECK (is_staff_or_above());
      
    CREATE POLICY material_payments_update_policy ON material_payments
      FOR UPDATE USING (is_staff_or_above());
      
    CREATE POLICY material_payments_delete_policy ON material_payments
      FOR DELETE USING (is_manager_or_admin());
  END IF;
END $$;
