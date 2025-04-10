-- Update the create_complete_order function to use the order_number
CREATE OR REPLACE FUNCTION create_complete_order(
  p_client_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_status TEXT DEFAULT 'pending',
  p_payment_status TEXT DEFAULT 'unpaid',
  p_client_type TEXT DEFAULT 'regular',
  p_items JSONB DEFAULT '[]'::jsonb,
  p_payments JSONB DEFAULT '[]'::jsonb,
  p_notes JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_payment JSONB;
  v_note JSONB;
  v_client_exists BOOLEAN;
  v_user_id UUID;
  v_result JSONB;
  v_error TEXT;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Start with empty result
  v_result := jsonb_build_object(
    'success', false,
    'order_id', NULL,
    'order_number', NULL,
    'error', NULL
  );
  
  -- Check if client exists
  SELECT EXISTS(SELECT 1 FROM clients WHERE id = p_client_id) INTO v_client_exists;
  
  IF NOT v_client_exists THEN
    v_error := 'Client does not exist';
    RETURN jsonb_set(v_result, '{error}', to_jsonb(v_error));
  END IF;
  
  -- Generate order number
  v_order_number := get_next_order_number();
  
  -- Begin transaction
  BEGIN
    -- Insert the order
    INSERT INTO orders (
      client_id,
      client_type,
      date,
      status,
      payment_status,
      created_by,
      order_number
    )
    VALUES (
      p_client_id,
      p_client_type,
      p_date,
      p_status,
      p_payment_status,
      v_user_id,
      v_order_number
    )
    RETURNING id INTO v_order_id;
    
    -- Insert order items if any
    IF jsonb_array_length(p_items) > 0 THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
      LOOP
        INSERT INTO order_items (
          order_id,
          item_id,
          category_id,
          item_name,
          category_name,
          size,
          quantity,
          unit_price
        )
        VALUES (
          v_order_id,
          (v_item->>'item_id')::UUID,
          (v_item->>'category_id')::UUID,
          v_item->>'item_name',
          v_item->>'category_name',
          v_item->>'size',
          (v_item->>'quantity')::INTEGER,
          (v_item->>'unit_price')::NUMERIC
        );
      END LOOP;
    END IF;
    
    -- Insert payments if any
    IF jsonb_array_length(p_payments) > 0 THEN
      FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
      LOOP
        INSERT INTO order_payments (
          order_id,
          amount,
          payment_date,
          payment_method
        )
        VALUES (
          v_order_id,
          (v_payment->>'amount')::NUMERIC,
          (v_payment->>'payment_date')::DATE,
          v_payment->>'payment_method'
        );
      END LOOP;
    END IF;
    
    -- Insert notes if any
    IF jsonb_array_length(p_notes) > 0 THEN
      FOR v_note IN SELECT * FROM jsonb_array_elements(p_notes)
      LOOP
        INSERT INTO notes (
          type,
          text,
          linked_item_type,
          linked_item_id,
          created_by
        )
        VALUES (
          v_note->>'type',
          v_note->>'text',
          'order',
          v_order_id,
          v_user_id
        );
      END LOOP;
    END IF;
    
    -- Return success
    v_result := jsonb_build_object(
      'success', true,
      'order_id', v_order_id,
      'order_number', v_order_number,
      'error', NULL
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      v_error := SQLERRM;
      RETURN jsonb_set(v_result, '{error}', to_jsonb(v_error));
  END;
END;
$$;

-- Update the create_order function to use the order_number
CREATE OR REPLACE FUNCTION create_order(
  p_client_id UUID,
  p_date DATE,
  p_status TEXT,
  p_items JSONB,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_total_amount NUMERIC := 0;
BEGIN
  -- Calculate total amount from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total_amount := v_total_amount + ((v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC);
  END LOOP;
  
  -- Generate order number
  v_order_number := get_next_order_number();
  
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
    order_number
  ) VALUES (
    p_client_id,
    p_date,
    p_status,
    'unpaid',  -- Default payment status
    v_total_amount,
    0,  -- Default amount paid
    v_total_amount,  -- Default balance
    p_created_by,
    v_order_number
  ) RETURNING id INTO v_order_id;
  
  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      item_id,
      category_id,
      quantity,
      unit_price,
      total_amount
    ) VALUES (
      v_order_id,
      (v_item->>'item_id')::UUID,
      (v_item->>'category_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC
    );
  END LOOP;
  
  RETURN v_order_id;
END;
$$;
