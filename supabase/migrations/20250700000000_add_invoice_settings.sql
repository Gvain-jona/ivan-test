-- Create invoice_settings table to store invoice preferences
CREATE TABLE IF NOT EXISTS invoice_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Default',
    is_default BOOLEAN NOT NULL DEFAULT false,
    settings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to handle default settings
CREATE OR REPLACE FUNCTION handle_default_invoice_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new setting is marked as default, unmark any existing default
    IF NEW.is_default = true THEN
        UPDATE invoice_settings
        SET is_default = false
        WHERE id != NEW.id AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle default settings
CREATE TRIGGER handle_default_invoice_settings_trigger
BEFORE INSERT OR UPDATE ON invoice_settings
FOR EACH ROW
EXECUTE FUNCTION handle_default_invoice_settings();

-- Create index for faster lookups
CREATE INDEX idx_invoice_settings_is_default ON invoice_settings(is_default);
