-- Check if tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'clients'
) AS clients_table_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'categories'
) AS categories_table_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'items'
) AS items_table_exists;

-- Check table columns
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name IN ('clients', 'categories', 'items')
ORDER BY 
  table_name, 
  ordinal_position;

-- Check if status column exists in each table
SELECT 
  table_name,
  EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = t.table_name
    AND column_name = 'status'
  ) AS has_status_column
FROM (
  VALUES ('clients'), ('categories'), ('items')
) AS t(table_name);

-- Check sample data
SELECT 'clients' AS table_name, COUNT(*) AS row_count FROM clients
UNION ALL
SELECT 'categories' AS table_name, COUNT(*) AS row_count FROM categories
UNION ALL
SELECT 'items' AS table_name, COUNT(*) AS row_count FROM items;
