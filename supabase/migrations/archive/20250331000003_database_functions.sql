-- Additional functions and triggers for material payments
-- Only adding what's needed after material_payments table is created

-- Create material payments trigger now that the table exists
CREATE TRIGGER material_purchase_payment_update_trigger
AFTER INSERT ON material_payments
FOR EACH ROW
EXECUTE FUNCTION update_material_purchase_payment_total();

-- Add additional indexes for material_payments
CREATE INDEX IF NOT EXISTS material_payments_date_idx ON material_payments(date);
CREATE INDEX IF NOT EXISTS material_payments_created_by_idx ON material_payments(created_by);
