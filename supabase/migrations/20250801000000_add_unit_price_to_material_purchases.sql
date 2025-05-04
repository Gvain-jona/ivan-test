-- Add unit_price column to material_purchases table
ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);

-- Update existing records to calculate unit_price from total_amount and quantity
UPDATE material_purchases 
SET unit_price = 
  CASE 
    WHEN quantity > 0 THEN total_amount / quantity 
    ELSE 0 
  END
WHERE unit_price IS NULL;

-- Add a comment to the column
COMMENT ON COLUMN material_purchases.unit_price IS 'Unit price of the material (per unit)';
