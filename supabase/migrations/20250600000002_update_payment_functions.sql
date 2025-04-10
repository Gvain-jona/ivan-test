-- Update payment functions to remove notes field
-- Created: 2025-06-01

-- Function to add payment to an order
CREATE OR REPLACE FUNCTION add_order_payment(
  p_order_id UUID,
  p_amount DECIMAL,
  p_payment_date DATE,
  p_payment_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  -- Insert payment
  INSERT INTO order_payments (
    order_id,
    amount,
    date,
    payment_method,
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
