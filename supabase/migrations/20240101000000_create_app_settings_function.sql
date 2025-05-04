-- Create a function to create the app_settings table if it doesn't exist
CREATE OR REPLACE FUNCTION create_app_settings_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the app_settings table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'app_settings'
  ) THEN
    -- Create the app_settings table
    CREATE TABLE public.app_settings (
      id BIGINT PRIMARY KEY,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add comment to the table
    COMMENT ON TABLE public.app_settings IS 'Stores application-wide settings';
    
    -- Grant access to authenticated users
    GRANT SELECT ON public.app_settings TO authenticated;
    GRANT SELECT ON public.app_settings TO service_role;
    
    -- Grant update access to service_role only
    GRANT INSERT, UPDATE, DELETE ON public.app_settings TO service_role;
    
    -- Create RLS policies
    ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
    
    -- Policy to allow all authenticated users to read app settings
    CREATE POLICY "Allow authenticated users to read app settings"
      ON public.app_settings
      FOR SELECT
      TO authenticated
      USING (true);
    
    -- Policy to allow only service_role to modify app settings
    CREATE POLICY "Allow service_role to modify app settings"
      ON public.app_settings
      FOR ALL
      TO service_role
      USING (true);
  END IF;
END;
$$;
