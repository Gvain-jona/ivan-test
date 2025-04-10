-- Orders database functions for Ivan Prints Business Management System
-- Purpose: Define functions to handle CRUD operations for orders, order items, and order payments
-- Created: 2025-04-03

-- Drop existing functions first if they exist
DROP FUNCTION IF EXISTS get_orders;
DROP FUNCTION IF EXISTS get_order_details;
DROP FUNCTION IF EXISTS create_order;
DROP FUNCTION IF EXISTS update_order;
DROP FUNCTION IF EXISTS add_order_payment;
DROP FUNCTION IF EXISTS delete_order;
DROP FUNCTION IF EXISTS add_order_note;

-- Function to get all orders with client information
CREATE OR REPLACE FUNCTION get_orders(
  p_status TEXT[] DEFAULT NULL,
  p_payment_status TEXT[] DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  client_name TEXT,
  date DATE,
  status TEXT,
  payment_status TEXT,
  total_amount DECIMAL,
  amount_paid DECIMAL,
  balance DECIMAL,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  items_count INTEGER
) AS $$
DECLARE
  query TEXT;
  count_query TEXT;
BEGIN
  query := '
    SELECT 
      o.id, 
      o.client_id, 
      c.name AS client_name, 
      o.date, 
      o.status, 
      o.payment_status, 
      o.total_amount, 
      o.amount_paid, 
      o.balance, 
      o.created_by, 
      o.created_at, 
      o.updated_at,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
    FROM orders o
    LEFT JOIN clients c ON o.client_id = c.id
    WHERE 1=1
  ';
  
  -- Apply filters
  IF p_status IS NOT NULL AND array_length(p_status, 1) > 0 THEN
    query := query || ' AND o.status = ANY($1)';
  END IF;
  
  IF p_payment_status IS NOT NULL AND array_length(p_payment_status, 1) > 0 THEN
    query := query || ' AND o.payment_status = ANY($2)';
  END IF;
  
  IF p_start_date IS NOT NULL THEN
    query := query || ' AND o.date >= $3';
  END IF;
  
  IF p_end_date IS NOT NULL THEN
    query := query || ' AND o.date <= $4';
  END IF;
  
  IF p_search IS NOT NULL AND p_search <> '' THEN
    query := query || ' AND (c.name ILIKE $5 OR o.id::text ILIKE $5)';
  END IF;
  
  -- Add pagination
  query := query || ' ORDER BY o.created_at DESC LIMIT $6 OFFSET $7';
  
  -- Execute the query with parameters
  RETURN QUERY EXECUTE query 
  USING 
    p_status,
    p_payment_status,
    p_start_date,
    p_end_date,
    CASE WHEN p_search IS NOT NULL THEN '%' || p_search || '%' ELSE NULL END,
    p_limit,
    p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a single order with all details (items, payments, notes)
CREATE OR REPLACE FUNCTION get_order_details(p_order_id UUID)
RETURNS TABLE (
  order_data JSONB,
  items JSONB,
  payments JSONB,
  notes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Order data as JSONB
    (SELECT row_to_json(o) 
     FROM (
       SELECT 
         o.id, 
         o.client_id, 
         c.name AS client_name, 
         o.date, 
         o.status, 
         o.payment_status, 
         o.total_amount, 
         o.amount_paid, 
         o.balance, 
         o.created_by, 
         o.created_at, 
         o.updated_at
       FROM orders o
       LEFT JOIN clients c ON o.client_id = c.id
       WHERE o.id = p_order_id
     ) o
    ) AS order_data,
    
    -- Order items as JSONB array
    (SELECT json_agg(i) 
     FROM (
       SELECT 
         oi.id,
         oi.order_id,
         oi.item_id,
         i.name AS item_name,
         oi.category_id,
         c.name AS category_name,
         oi.quantity,
         oi.unit_price,
         oi.total_amount,
         oi.created_at,
         oi.updated_at
       FROM order_items oi
       LEFT JOIN items i ON oi.item_id = i.id
       LEFT JOIN categories c ON oi.category_id = c.id
       WHERE oi.order_id = p_order_id
     ) i
    ) AS items,
    
    -- Order payments as JSONB array
    (SELECT json_agg(p) 
     FROM (
       SELECT 
         op.id,
         op.order_id,
         op.amount,
         op.payment_date,
         op.payment_type AS payment_method,
         op.created_at,
         op.updated_at
       FROM order_payments op
       WHERE op.order_id = p_order_id
     ) p
    ) AS payments,
    
    -- Order notes as JSONB array
    (SELECT json_agg(n) 
     FROM (
       SELECT 
         n.id,
         n.type,
         n.text,
         n.linked_item_type,
         n.linked_item_id,
         n.created_by,
         u.name AS created_by_name,
         n.created_at,
         n.updated_at
       FROM notes n
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.linked_item_type = 'order' AND n.linked_item_id = p_order_id
     ) n
    ) AS notes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new order with items in a transaction
CREATE OR REPLACE FUNCTION create_order(
  p_client_id UUID,
  p_date DATE,
  p_status TEXT,
  p_items JSONB,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_total_amount DECIMAL := 0;
  v_item JSONB;
  v_item_id UUID;
  v_category_id UUID;
  v_quantity INTEGER;
  v_unit_price DECIMAL;
  v_item_total DECIMAL;
BEGIN
  -- Start transaction
  BEGIN
    -- Calculate total amount from items
    FOR i IN 0..jsonb_array_length(p_items) - 1 LOOP
      v_item := p_items->i;
      v_quantity := (v_item->>'quantity')::INTEGER;
      v_unit_price := (v_item->>'unit_price')::DECIMAL;
      v_item_total := v_quantity * v_unit_price;
      v_total_amount := v_total_amount + v_item_total;
    END LOOP;
    
    -- Create the order
    INSERT INTO orders (
      client_id,
      date,
      status,
      payment_status,
      total_amount,
      amount_paid,
      balance,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      p_client_id,
      p_date,
      p_status,
      'unpaid',  -- Default payment status
      v_total_amount,
      0,  -- Default amount paid
      v_total_amount,  -- Default balance
      p_created_by,
      NOW(),
      NOW()
    ) RETURNING id INTO v_order_id;
    
    -- Create order items
    FOR i IN 0..jsonb_array_length(p_items) - 1 LOOP
      v_item := p_items->i;
      v_item_id := (v_item->>'item_id')::UUID;
      v_category_id := (v_item->>'category_id')::UUID;
      v_quantity := (v_item->>'quantity')::INTEGER;
      v_unit_price := (v_item->>'unit_price')::DECIMAL;
      v_item_total := v_quantity * v_unit_price;
      
      INSERT INTO order_items (
        order_id,
        item_id,
        category_id,
        quantity,
        unit_price,
        total_amount,
        created_at,
        updated_at
      ) VALUES (
        v_order_id,
        v_item_id,
        v_category_id,
        v_quantity,
        v_unit_price,
        v_item_total,
        NOW(),
        NOW()
      );
    END LOOP;
    
    -- Commit transaction implicitly
    RETURN v_order_id;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction in case of errors
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update an existing order
CREATE OR REPLACE FUNCTION update_order(
  p_order_id UUID,
  p_client_id UUID,
  p_date DATE,
  p_status TEXT,
  p_items JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_total_amount DECIMAL := 0;
  v_item JSONB;
  v_item_id UUID;
  v_order_item_id UUID;
  v_category_id UUID;
  v_quantity INTEGER;
  v_unit_price DECIMAL;
  v_item_total DECIMAL;
  v_existing_item_ids UUID[] := ARRAY[]::UUID[];
  v_current_item_id UUID;
BEGIN
  -- Start transaction
  BEGIN
    -- Calculate total amount from items and collect item IDs
    FOR i IN 0..jsonb_array_length(p_items) - 1 LOOP
      v_item := p_items->i;
      v_quantity := (v_item->>'quantity')::INTEGER;
      v_unit_price := (v_item->>'unit_price')::DECIMAL;
      v_item_total := v_quantity * v_unit_price;
      v_total_amount := v_total_amount + v_item_total;
      
      -- If item has an ID, add to existing items array
      IF v_item ? 'id' AND (v_item->>'id') IS NOT NULL THEN
        v_existing_item_ids := v_existing_item_ids || (v_item->>'id')::UUID;
      END IF;
    END LOOP;
    
    -- Delete items that are no longer in the order
    DELETE FROM order_items 
    WHERE order_id = p_order_id 
    AND id <> ALL(v_existing_item_ids);
    
    -- Update or insert items
    FOR i IN 0..jsonb_array_length(p_items) - 1 LOOP
      v_item := p_items->i;
      v_order_item_id := (v_item->>'id')::UUID;
      v_item_id := (v_item->>'item_id')::UUID;
      v_category_id := (v_item->>'category_id')::UUID;
      v_quantity := (v_item->>'quantity')::INTEGER;
      v_unit_price := (v_item->>'unit_price')::DECIMAL;
      v_item_total := v_quantity * v_unit_price;
      
      -- Check if this is an existing item or new
      IF v_item ? 'id' AND (v_item->>'id') IS NOT NULL THEN
        -- Update existing item
        UPDATE order_items SET
          item_id = v_item_id,
          category_id = v_category_id,
          quantity = v_quantity,
          unit_price = v_unit_price,
          total_amount = v_item_total,
          updated_at = NOW()
        WHERE id = v_order_item_id;
      ELSE
        -- Insert new item
        INSERT INTO order_items (
          order_id,
          item_id,
          category_id,
          quantity,
          unit_price,
          total_amount,
          created_at,
          updated_at
        ) VALUES (
          p_order_id,
          v_item_id,
          v_category_id,
          v_quantity,
          v_unit_price,
          v_item_total,
          NOW(),
          NOW()
        );
      END IF;
    END LOOP;
    
    -- Update the order
    UPDATE orders SET
      client_id = p_client_id,
      date = p_date,
      status = p_status,
      total_amount = v_total_amount,
      balance = v_total_amount - amount_paid,  -- Recalculate balance
      updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Update payment status based on amount_paid and total_amount
    UPDATE orders SET
      payment_status = CASE 
        WHEN amount_paid >= v_total_amount THEN 'paid'
        WHEN amount_paid > 0 THEN 'partially_paid'
        ELSE 'unpaid'
      END
    WHERE id = p_order_id;
    
    -- Commit transaction implicitly
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction in case of errors
    RAISE;
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add payment to an order
CREATE OR REPLACE FUNCTION add_order_payment(
  p_order_id UUID,
  p_amount DECIMAL,
  p_payment_date DATE,
  p_payment_type TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  -- Insert payment
  INSERT INTO order_payments (
    order_id,
    amount,
    payment_date,
    payment_type,
    created_at,
    updated_at
  ) VALUES (
    p_order_id,
    p_amount,
    p_payment_date,
    p_payment_type,
    NOW(),
    NOW()
  ) RETURNING id INTO v_payment_id;
  
  -- Return the new payment ID
  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete an order
CREATE OR REPLACE FUNCTION delete_order(p_order_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Delete order items first (cascade would handle this, but being explicit)
    DELETE FROM order_items WHERE order_id = p_order_id;
    
    -- Delete order payments
    DELETE FROM order_payments WHERE order_id = p_order_id;
    
    -- Delete order notes
    DELETE FROM notes WHERE linked_item_type = 'order' AND linked_item_id = p_order_id;
    
    -- Delete the order
    DELETE FROM orders WHERE id = p_order_id;
    
    -- Commit transaction implicitly
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction in case of errors
    RAISE;
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a note to an order
CREATE OR REPLACE FUNCTION add_order_note(
  p_order_id UUID,
  p_type TEXT,
  p_text TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_note_id UUID;
BEGIN
  -- Insert note
  INSERT INTO notes (
    type,
    text,
    linked_item_type,
    linked_item_id,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    p_type,
    p_text,
    'order',
    p_order_id,
    p_created_by,
    NOW(),
    NOW()
  ) RETURNING id INTO v_note_id;
  
  -- Return the new note ID
  RETURN v_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 