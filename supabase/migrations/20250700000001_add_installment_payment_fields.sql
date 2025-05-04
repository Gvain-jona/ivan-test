-- Add installment payment fields to material_purchases table
-- Created: 2025-07-01

-- Add new fields to material_purchases table
ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS installment_plan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_installments INTEGER,
ADD COLUMN IF NOT EXISTS installments_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
ADD COLUMN IF NOT EXISTS reminder_days INTEGER DEFAULT 3;

-- Create a new table for installment schedule
CREATE TABLE IF NOT EXISTS material_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES material_purchases(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    payment_id UUID REFERENCES material_payments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS material_installments_purchase_id_idx ON material_installments(purchase_id);
CREATE INDEX IF NOT EXISTS material_installments_due_date_idx ON material_installments(due_date);
CREATE INDEX IF NOT EXISTS material_installments_status_idx ON material_installments(status);

-- Add comments for documentation
COMMENT ON TABLE material_installments IS 'Installment schedule for material purchases';
COMMENT ON COLUMN material_installments.installment_number IS 'Sequential number of the installment';
COMMENT ON COLUMN material_installments.amount IS 'Amount due for this installment';
COMMENT ON COLUMN material_installments.due_date IS 'Date when this installment is due';
COMMENT ON COLUMN material_installments.status IS 'Status of the installment: pending, paid, overdue';
COMMENT ON COLUMN material_installments.payment_id IS 'Reference to the payment if this installment has been paid';

-- Create a function to update installment status based on payment
CREATE OR REPLACE FUNCTION update_installment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If a payment is linked to an installment, mark it as paid
    IF NEW.payment_id IS NOT NULL THEN
        UPDATE material_installments
        SET 
            status = 'paid',
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update installment status when payment is linked
CREATE TRIGGER update_installment_status_trigger
AFTER UPDATE OF payment_id ON material_installments
FOR EACH ROW
EXECUTE FUNCTION update_installment_status();

-- Create a function to update installments_paid count in material_purchases
CREATE OR REPLACE FUNCTION update_installments_paid_count()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Count the number of paid installments for this purchase
    SELECT COUNT(*) INTO v_count
    FROM material_installments
    WHERE purchase_id = NEW.purchase_id AND status = 'paid';
    
    -- Update the material purchase's installments_paid count
    UPDATE material_purchases
    SET 
        installments_paid = v_count,
        updated_at = NOW()
    WHERE id = NEW.purchase_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update installments_paid count when installment status changes
CREATE TRIGGER update_installments_paid_count_trigger
AFTER UPDATE OF status ON material_installments
FOR EACH ROW
WHEN (OLD.status <> NEW.status)
EXECUTE FUNCTION update_installments_paid_count();

-- Create a function to mark installments as overdue
CREATE OR REPLACE FUNCTION mark_overdue_installments()
RETURNS VOID AS $$
BEGIN
    UPDATE material_installments
    SET 
        status = 'overdue',
        updated_at = NOW()
    WHERE 
        status = 'pending' AND 
        due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run daily and mark overdue installments
SELECT cron.schedule(
    'mark-overdue-installments',
    '0 0 * * *',  -- Run at midnight every day
    $$SELECT mark_overdue_installments()$$
);

-- Add RLS policies for material_installments
ALTER TABLE material_installments ENABLE ROW LEVEL SECURITY;

-- Create policies for material_installments
CREATE POLICY material_installments_select_policy ON material_installments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM material_purchases mp
            WHERE mp.id = material_installments.purchase_id
            AND (
                mp.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_roles ur
                    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
                )
            )
        )
    );

CREATE POLICY material_installments_insert_policy ON material_installments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM material_purchases mp
            WHERE mp.id = material_installments.purchase_id
            AND (
                mp.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_roles ur
                    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
                )
            )
        )
    );

CREATE POLICY material_installments_update_policy ON material_installments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM material_purchases mp
            WHERE mp.id = material_installments.purchase_id
            AND (
                mp.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_roles ur
                    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
                )
            )
        )
    );

CREATE POLICY material_installments_delete_policy ON material_installments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM material_purchases mp
            WHERE mp.id = material_installments.purchase_id
            AND (
                mp.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_roles ur
                    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
                )
            )
        )
    );
