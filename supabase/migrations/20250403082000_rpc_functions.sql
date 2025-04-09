-- Helper functions for database management

-- Function to get list of all tables in the public schema
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (
  table_schema TEXT,
  table_name TEXT,
  table_type TEXT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    table_schema,
    table_name,
    table_type
  FROM
    information_schema.tables
  WHERE
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
  ORDER BY
    table_name;
$$;

-- Function to check if RLS is enabled on a specific table
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name TEXT)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    relrowsecurity
  FROM 
    pg_class
  WHERE 
    oid = ('public.' || table_name)::regclass;
$$;

-- Function to get all RLS policies for a specific table
CREATE OR REPLACE FUNCTION get_rls_policies(table_name TEXT)
RETURNS TABLE (
  policy_name TEXT,
  policy_command TEXT,
  policy_roles TEXT[],
  policy_using TEXT,
  policy_check TEXT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT
    polname::TEXT AS policy_name,
    CASE
      WHEN polcmd = '*' THEN 'ALL'
      WHEN polcmd = 'r' THEN 'SELECT'
      WHEN polcmd = 'a' THEN 'INSERT'
      WHEN polcmd = 'w' THEN 'UPDATE'
      WHEN polcmd = 'd' THEN 'DELETE'
      ELSE polcmd::TEXT
    END AS policy_command,
    polroles::TEXT[] AS policy_roles,
    pg_get_expr(polqual, polrelid, true)::TEXT AS policy_using,
    pg_get_expr(polwithcheck, polrelid, true)::TEXT AS policy_check
  FROM
    pg_policy
  WHERE
    polrelid = ('public.' || table_name)::regclass
  ORDER BY
    polname;
$$;

-- Function to get database size and table sizes
CREATE OR REPLACE FUNCTION get_database_size_info()
RETURNS TABLE (
  item_name TEXT,
  size_bytes BIGINT,
  size_readable TEXT
) LANGUAGE SQL SECURITY DEFINER AS $$
  -- Database total size
  SELECT 
    'database_total' AS item_name,
    pg_database_size(current_database()) AS size_bytes,
    pg_size_pretty(pg_database_size(current_database())) AS size_readable
  UNION ALL
  -- Table sizes
  SELECT
    'table:' || table_name AS item_name,
    pg_total_relation_size('public.' || table_name) AS size_bytes,
    pg_size_pretty(pg_total_relation_size('public.' || table_name)) AS size_readable
  FROM
    information_schema.tables
  WHERE
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
  ORDER BY
    size_bytes DESC;
$$;

-- Function to get record counts for tables
CREATE OR REPLACE FUNCTION get_table_record_counts()
RETURNS TABLE (
  table_name TEXT,
  record_count BIGINT
) LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE
  t TEXT;
  query TEXT;
  result BIGINT;
BEGIN
  FOR t IN 
    SELECT tables.table_name 
    FROM information_schema.tables tables
    WHERE tables.table_schema = 'public' 
    AND tables.table_type = 'BASE TABLE'
  LOOP
    query := 'SELECT COUNT(*) FROM public.' || t;
    EXECUTE query INTO result;
    table_name := t;
    record_count := result;
    RETURN NEXT;
  END LOOP;
END;
$$; 