-- Check if the invoice_settings table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invoice_settings'
    ) THEN
        -- Create the invoice_settings table if it doesn't exist
        CREATE TABLE public.invoice_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            is_default BOOLEAN DEFAULT false,
            settings JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
        );

        -- Add RLS policies
        ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

        -- Policy for selecting invoice settings
        CREATE POLICY "Users can view their own invoice settings"
            ON public.invoice_settings
            FOR SELECT
            USING (auth.uid() = user_id);

        -- Policy for inserting invoice settings
        CREATE POLICY "Users can insert their own invoice settings"
            ON public.invoice_settings
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        -- Policy for updating invoice settings
        CREATE POLICY "Users can update their own invoice settings"
            ON public.invoice_settings
            FOR UPDATE
            USING (auth.uid() = user_id);

        -- Policy for deleting invoice settings
        CREATE POLICY "Users can delete their own invoice settings"
            ON public.invoice_settings
            FOR DELETE
            USING (auth.uid() = user_id);
    ELSE
        -- Check if the user_id column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'invoice_settings' 
            AND column_name = 'user_id'
        ) THEN
            -- Add the user_id column if it doesn't exist
            ALTER TABLE public.invoice_settings 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;

        -- Check if RLS is enabled
        IF NOT EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'invoice_settings' 
            AND rowsecurity = true
        ) THEN
            -- Enable RLS if it's not enabled
            ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
        END IF;

        -- Check if the select policy exists
        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'invoice_settings' 
            AND policyname = 'Users can view their own invoice settings'
        ) THEN
            -- Create the select policy if it doesn't exist
            CREATE POLICY "Users can view their own invoice settings"
                ON public.invoice_settings
                FOR SELECT
                USING (auth.uid() = user_id);
        END IF;

        -- Check if the insert policy exists
        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'invoice_settings' 
            AND policyname = 'Users can insert their own invoice settings'
        ) THEN
            -- Create the insert policy if it doesn't exist
            CREATE POLICY "Users can insert their own invoice settings"
                ON public.invoice_settings
                FOR INSERT
                WITH CHECK (auth.uid() = user_id);
        END IF;

        -- Check if the update policy exists
        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'invoice_settings' 
            AND policyname = 'Users can update their own invoice settings'
        ) THEN
            -- Create the update policy if it doesn't exist
            CREATE POLICY "Users can update their own invoice settings"
                ON public.invoice_settings
                FOR UPDATE
                USING (auth.uid() = user_id);
        END IF;

        -- Check if the delete policy exists
        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'invoice_settings' 
            AND policyname = 'Users can delete their own invoice settings'
        ) THEN
            -- Create the delete policy if it doesn't exist
            CREATE POLICY "Users can delete their own invoice settings"
                ON public.invoice_settings
                FOR DELETE
                USING (auth.uid() = user_id);
        END IF;
    END IF;
END
$$;
