-- SQL migration to enable public access to the database
-- This is for development purposes only and should not be used in production

-- Function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(
  p_table_name TEXT,
  p_policy_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = p_table_name
    AND policyname = p_policy_name
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- Enable public read access to clients table
DO $$
BEGIN
  IF NOT policy_exists('clients', 'public_read_access') THEN
    CREATE POLICY "public_read_access" ON "public"."clients"
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Enable public read access to orders table
DO $$
BEGIN
  IF NOT policy_exists('orders', 'public_read_access') THEN
    CREATE POLICY "public_read_access" ON "public"."orders"
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Enable public read access to order_items table
DO $$
BEGIN
  IF NOT policy_exists('order_items', 'public_read_access') THEN
    CREATE POLICY "public_read_access" ON "public"."order_items"
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Enable public read access to order_payments table
DO $$
BEGIN
  IF NOT policy_exists('order_payments', 'public_read_access') THEN
    CREATE POLICY "public_read_access" ON "public"."order_payments"
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Enable public read access to order_notes table
DO $$
BEGIN
  IF NOT policy_exists('order_notes', 'public_read_access') THEN
    CREATE POLICY "public_read_access" ON "public"."order_notes"
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Enable public read access to items table
DO $$
BEGIN
  IF NOT policy_exists('items', 'public_read_access') THEN
    CREATE POLICY "public_read_access" ON "public"."items"
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Enable public read access to categories table
DO $$
BEGIN
  IF NOT policy_exists('categories', 'public_read_access') THEN
    CREATE POLICY "public_read_access" ON "public"."categories"
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Enable public read access to sizes table
DO $$
BEGIN
  IF NOT policy_exists('sizes', 'public_read_access') THEN
    CREATE POLICY "public_read_access" ON "public"."sizes"
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Set environment variable to indicate public access is enabled
-- This is for development purposes only
