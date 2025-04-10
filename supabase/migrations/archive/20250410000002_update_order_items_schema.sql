-- Migration to update order_items table schema to match frontend requirements
-- Created: 2025-04-10

-- Add size column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS size VARCHAR(50);

-- Add item_name column to order_items table (for denormalization)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);

-- Add category_name column to order_items table (for denormalization)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);

-- Make sure total_amount is calculated correctly
-- If total_amount is not a generated column, make it one
DO $$ 
BEGIN
    -- First check if total_amount is a generated column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'total_amount' 
        AND is_generated = 'NEVER'
    ) THEN
        -- Drop the existing column
        ALTER TABLE order_items DROP COLUMN total_amount;
        
        -- Add it back as a generated column
        ALTER TABLE order_items 
        ADD COLUMN total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;
    END IF;
    
    -- If total_amount doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE order_items 
        ADD COLUMN total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;
    END IF;
END $$;

-- Add profit_amount column if it doesn't exist
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS profit_amount DECIMAL(10,2) DEFAULT 0;

-- Add labor_amount column if it doesn't exist
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS labor_amount DECIMAL(10,2) DEFAULT 0;

-- Create a trigger to update item_name and category_name from related tables
CREATE OR REPLACE FUNCTION update_order_item_names()
RETURNS TRIGGER AS $$
DECLARE
    v_item_name VARCHAR(255);
    v_category_name VARCHAR(255);
BEGIN
    -- Get item name
    SELECT name INTO v_item_name
    FROM items
    WHERE id = NEW.item_id;
    
    -- Get category name
    SELECT name INTO v_category_name
    FROM categories
    WHERE id = NEW.category_id;
    
    -- Update the denormalized fields
    NEW.item_name := v_item_name;
    NEW.category_name := v_category_name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_order_item_names_trigger ON order_items;

-- Create the trigger
CREATE TRIGGER update_order_item_names_trigger
BEFORE INSERT OR UPDATE OF item_id, category_id
ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_item_names();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS order_items_size_idx ON order_items(size);
CREATE INDEX IF NOT EXISTS order_items_item_name_idx ON order_items(item_name);
CREATE INDEX IF NOT EXISTS order_items_category_name_idx ON order_items(category_name);

-- Add comments for documentation
COMMENT ON COLUMN order_items.size IS 'Size of the item (e.g., A4, A3, etc.)';
COMMENT ON COLUMN order_items.item_name IS 'Denormalized item name from items table';
COMMENT ON COLUMN order_items.category_name IS 'Denormalized category name from categories table';
COMMENT ON COLUMN order_items.total_amount IS 'Calculated as quantity * unit_price';
COMMENT ON COLUMN order_items.profit_amount IS 'Profit amount for this item';
COMMENT ON COLUMN order_items.labor_amount IS 'Labor cost for this item';
