-- Add Invoices Table to track invoice metadata
-- Created: 2025-07-01

-- Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    is_proforma BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS invoices_order_id_idx ON invoices(order_id);
CREATE INDEX IF NOT EXISTS invoices_created_by_idx ON invoices(created_by);
CREATE INDEX IF NOT EXISTS invoices_invoice_date_idx ON invoices(invoice_date);

-- Add a function to generate sequential invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_number INTEGER;
    new_invoice_number TEXT;
BEGIN
    -- Get current year
    year_part := to_char(CURRENT_DATE, 'YYYY');
    
    -- Get the latest sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0)
    INTO sequence_number
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_part || '-%';
    
    -- Increment the sequence number
    sequence_number := sequence_number + 1;
    
    -- Format the new invoice number
    new_invoice_number := 'INV-' || year_part || '-' || LPAD(sequence_number::TEXT, 4, '0');
    
    -- Set the invoice number
    NEW.invoice_number := new_invoice_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate invoice numbers
CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT ON invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
EXECUTE FUNCTION generate_invoice_number();

-- Add a column to orders table to track the latest invoice
ALTER TABLE orders ADD COLUMN IF NOT EXISTS latest_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMP WITH TIME ZONE;

-- Add a function to update the latest invoice reference in orders
CREATE OR REPLACE FUNCTION update_order_latest_invoice()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the order's latest invoice reference
    UPDATE orders
    SET 
        latest_invoice_id = NEW.id,
        invoice_generated_at = NEW.created_at
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the order's latest invoice
CREATE TRIGGER update_order_latest_invoice_trigger
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_order_latest_invoice();

-- Add comments for documentation
COMMENT ON TABLE invoices IS 'Stores metadata for generated invoices';
COMMENT ON COLUMN invoices.invoice_number IS 'Sequential invoice number in format INV-YYYY-NNNN';
COMMENT ON COLUMN invoices.file_url IS 'Public URL for accessing the invoice PDF';
COMMENT ON COLUMN invoices.storage_path IS 'Path in Supabase storage where the invoice is stored';
COMMENT ON COLUMN invoices.settings IS 'JSON object containing the settings used to generate the invoice';
COMMENT ON COLUMN invoices.is_proforma IS 'Whether this is a proforma invoice';
COMMENT ON COLUMN orders.latest_invoice_id IS 'Reference to the most recently generated invoice for this order';
COMMENT ON COLUMN orders.invoice_generated_at IS 'When the most recent invoice was generated';
