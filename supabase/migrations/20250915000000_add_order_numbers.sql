-- Add order_number column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Create function to generate the next order number
CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  latest_order_number TEXT;
  sequence_number INT;
  formatted_sequence TEXT;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get the latest order number for this year
  SELECT order_number INTO latest_order_number
  FROM orders
  WHERE order_number LIKE 'ORD-' || year_part || '-%'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Extract sequence number or start at 1
  IF latest_order_number IS NULL THEN
    sequence_number := 1;
  ELSE
    -- Extract the sequence number using substring
    sequence_number := (
      CAST(SUBSTRING(latest_order_number FROM 'ORD-\d{4}-(\d+)') AS INTEGER) + 1
    );
  END IF;
  
  -- Format with leading zeros (5 digits)
  formatted_sequence := LPAD(sequence_number::TEXT, 5, '0');
  
  RETURN 'ORD-' || year_part || '-' || formatted_sequence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a temporary function for backfilling
CREATE OR REPLACE FUNCTION backfill_order_numbers()
RETURNS VOID AS $$
DECLARE
  order_rec RECORD;
  year_part TEXT;
  counter INT;
  current_year INT;
BEGIN
  current_year := 0;
  counter := 0;
  
  FOR order_rec IN 
    SELECT id, created_at 
    FROM orders 
    WHERE order_number IS NULL
    ORDER BY created_at ASC
  LOOP
    year_part := EXTRACT(YEAR FROM order_rec.created_at)::TEXT;
    
    -- Reset counter for new year
    IF current_year != EXTRACT(YEAR FROM order_rec.created_at)::INT THEN
      current_year := EXTRACT(YEAR FROM order_rec.created_at)::INT;
      counter := 1;
    ELSE
      counter := counter + 1;
    END IF;
    
    -- Update the order with a generated number
    UPDATE orders
    SET order_number = 'ORD-' || year_part || '-' || LPAD(counter::TEXT, 5, '0')
    WHERE id = order_rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the backfill
SELECT backfill_order_numbers();

-- Drop the temporary function
DROP FUNCTION backfill_order_numbers();

-- Add a unique index on order_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Make order_number NOT NULL after backfill
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.order_number IS 'Human-readable order number in format ORD-YYYY-XXXXX';
COMMENT ON FUNCTION get_next_order_number() IS 'Generates the next sequential order number in format ORD-YYYY-XXXXX';
