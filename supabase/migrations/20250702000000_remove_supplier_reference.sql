-- Remove supplier reference from material_purchases table
-- Created: 2025-07-02

-- First, drop the foreign key constraint
ALTER TABLE material_purchases
DROP CONSTRAINT IF EXISTS material_purchases_supplier_id_fkey;

-- Make supplier_name NOT NULL since it will be the primary identifier
ALTER TABLE material_purchases
ALTER COLUMN supplier_name SET NOT NULL;

-- Add an index on supplier_name for better performance
CREATE INDEX IF NOT EXISTS material_purchases_supplier_name_idx ON material_purchases(supplier_name);

-- Comment on the supplier_name column
COMMENT ON COLUMN material_purchases.supplier_name IS 'Name of the supplier (stored directly without reference)';

-- We'll keep the supplier_id column for now to avoid breaking existing data,
-- but it will no longer be used for referencing the suppliers table
COMMENT ON COLUMN material_purchases.supplier_id IS 'Legacy field - no longer used for referencing suppliers';
