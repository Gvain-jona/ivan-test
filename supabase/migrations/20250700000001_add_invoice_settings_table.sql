-- Create invoice_settings table
CREATE TABLE IF NOT EXISTS public.invoice_settings (
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

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_invoice_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_settings_updated_at
BEFORE UPDATE ON public.invoice_settings
FOR EACH ROW
EXECUTE FUNCTION update_invoice_settings_updated_at();

-- Add trigger to set user_id from auth.uid() if not provided
CREATE OR REPLACE FUNCTION set_invoice_settings_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_settings_user_id
BEFORE INSERT ON public.invoice_settings
FOR EACH ROW
EXECUTE FUNCTION set_invoice_settings_user_id();
