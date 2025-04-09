-- Create a function to execute SQL directly
-- This function should be used with caution, only for development/initialization purposes
CREATE OR REPLACE FUNCTION exec_sql(sql text) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
BEGIN
  EXECUTE sql;
END;
$$; 