-- Add sample data to the database
-- Run this script in the Supabase SQL editor

-- Add sample clients if none exist
INSERT INTO clients (id, name, email, phone, status)
SELECT 
  uuid_generate_v4(), 
  'Client ' || n, 
  'client' || n || '@example.com',
  '+1-555-' || (1000 + n)::text,
  'active'
FROM generate_series(1, 10) AS n
WHERE NOT EXISTS (SELECT 1 FROM clients LIMIT 1);

-- Add sample categories if none exist
INSERT INTO categories (id, name, description, status)
SELECT 
  uuid_generate_v4(), 
  'Category ' || n, 
  'Description for category ' || n,
  'active'
FROM generate_series(1, 10) AS n
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Add sample items for each category
DO $$
DECLARE
  category_record RECORD;
BEGIN
  -- Only add items if none exist
  IF NOT EXISTS (SELECT 1 FROM items LIMIT 1) THEN
    -- Loop through each category
    FOR category_record IN SELECT id FROM categories LOOP
      -- Add 5 items for each category
      INSERT INTO items (id, name, description, category_id, price, cost, status)
      SELECT 
        uuid_generate_v4(), 
        'Item ' || n || ' (Cat: ' || substring(category_record.id::text, 1, 8) || ')', 
        'Description for item ' || n || ' in category ' || substring(category_record.id::text, 1, 8),
        category_record.id,
        (random() * 100 + 10)::numeric(10,2),
        (random() * 50 + 5)::numeric(10,2),
        'active'
      FROM generate_series(1, 5) AS n;
    END LOOP;
  END IF;
END $$;
