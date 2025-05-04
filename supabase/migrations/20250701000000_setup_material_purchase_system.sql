-- Setup Material Purchase System
-- Created: 2025-07-01

-- Check if the pgcrypto extension is available (needed for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Check if the cron extension is available (needed for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add installment payment fields to material_purchases table if they don't exist
ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS installment_plan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_installments INTEGER,
ADD COLUMN IF NOT EXISTS installments_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
ADD COLUMN IF NOT EXISTS reminder_days INTEGER DEFAULT 3;

-- Create a dedicated table for material purchase notes if it doesn't exist
CREATE TABLE IF NOT EXISTS material_purchase_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES material_purchases(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'note',
    text TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for installment schedule if it doesn't exist
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
CREATE INDEX IF NOT EXISTS material_purchase_notes_purchase_id_idx ON material_purchase_notes(purchase_id);
CREATE INDEX IF NOT EXISTS material_purchase_notes_created_by_idx ON material_purchase_notes(created_by);
CREATE INDEX IF NOT EXISTS material_installments_purchase_id_idx ON material_installments(purchase_id);
CREATE INDEX IF NOT EXISTS material_installments_due_date_idx ON material_installments(due_date);
CREATE INDEX IF NOT EXISTS material_installments_status_idx ON material_installments(status);

-- Add comments for documentation
COMMENT ON TABLE material_purchase_notes IS 'Dedicated table for notes related to material purchases';
COMMENT ON COLUMN material_purchase_notes.purchase_id IS 'Reference to the material purchase';
COMMENT ON COLUMN material_purchase_notes.type IS 'Type of note (e.g., note, comment, reminder)';
COMMENT ON COLUMN material_purchase_notes.text IS 'The content of the note';
COMMENT ON COLUMN material_purchase_notes.created_by IS 'User who created the note';

COMMENT ON TABLE material_installments IS 'Installment schedule for material purchases';
COMMENT ON COLUMN material_installments.installment_number IS 'Sequential number of the installment';
COMMENT ON COLUMN material_installments.amount IS 'Amount due for this installment';
COMMENT ON COLUMN material_installments.due_date IS 'Date when this installment is due';
COMMENT ON COLUMN material_installments.status IS 'Status of the installment: pending, paid, overdue';
COMMENT ON COLUMN material_installments.payment_id IS 'Reference to the payment if this installment has been paid';

-- Enable Row Level Security for new tables
ALTER TABLE material_purchase_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_installments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for material_purchase_notes
CREATE POLICY IF NOT EXISTS material_purchase_notes_select_policy ON material_purchase_notes
    FOR SELECT USING (is_staff_or_above());

CREATE POLICY IF NOT EXISTS material_purchase_notes_insert_policy ON material_purchase_notes
    FOR INSERT WITH CHECK (is_staff_or_above());

CREATE POLICY IF NOT EXISTS material_purchase_notes_update_policy ON material_purchase_notes
    FOR UPDATE USING (is_staff_or_above());

CREATE POLICY IF NOT EXISTS material_purchase_notes_delete_policy ON material_purchase_notes
    FOR DELETE USING (is_manager_or_admin());

-- Create RLS policies for material_installments
CREATE POLICY IF NOT EXISTS material_installments_select_policy ON material_installments
    FOR SELECT USING (is_staff_or_above());

CREATE POLICY IF NOT EXISTS material_installments_insert_policy ON material_installments
    FOR INSERT WITH CHECK (is_staff_or_above());

CREATE POLICY IF NOT EXISTS material_installments_update_policy ON material_installments
    FOR UPDATE USING (is_staff_or_above());

CREATE POLICY IF NOT EXISTS material_installments_delete_policy ON material_installments
    FOR DELETE USING (is_manager_or_admin());

-- Create functions and triggers for material_purchase_notes
CREATE OR REPLACE FUNCTION update_material_purchase_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_material_purchase_notes_updated_at_trigger ON material_purchase_notes;
CREATE TRIGGER update_material_purchase_notes_updated_at_trigger
BEFORE UPDATE ON material_purchase_notes
FOR EACH ROW
EXECUTE FUNCTION update_material_purchase_notes_updated_at();

-- Create functions and triggers for material_installments
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

DROP TRIGGER IF EXISTS update_installment_status_trigger ON material_installments;
CREATE TRIGGER update_installment_status_trigger
AFTER UPDATE OF payment_id ON material_installments
FOR EACH ROW
EXECUTE FUNCTION update_installment_status();

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

DROP TRIGGER IF EXISTS update_installments_paid_count_trigger ON material_installments;
CREATE TRIGGER update_installments_paid_count_trigger
AFTER UPDATE OF status ON material_installments
FOR EACH ROW
WHEN (OLD.status <> NEW.status)
EXECUTE FUNCTION update_installments_paid_count();

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

-- Create a function to create an installment plan
CREATE OR REPLACE FUNCTION create_installment_plan(
    p_purchase_id UUID,
    p_installments JSONB[],
    p_total_installments INTEGER,
    p_payment_frequency VARCHAR(20),
    p_next_payment_date DATE,
    p_reminder_days INTEGER DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Update the material purchase to mark it as an installment plan
    UPDATE material_purchases
    SET 
        installment_plan = TRUE,
        total_installments = p_total_installments,
        installments_paid = 0,
        next_payment_date = p_next_payment_date,
        payment_frequency = p_payment_frequency,
        reminder_days = p_reminder_days,
        updated_at = NOW()
    WHERE id = p_purchase_id;
    
    -- Insert the installments
    WITH inserted_installments AS (
        INSERT INTO material_installments (
            purchase_id,
            installment_number,
            amount,
            due_date,
            status,
            created_at,
            updated_at
        )
        SELECT 
            p_purchase_id,
            (installment->>'installment_number')::INTEGER,
            (installment->>'amount')::DECIMAL,
            (installment->>'due_date')::DATE,
            installment->>'status',
            NOW(),
            NOW()
        FROM unnest(p_installments) AS installment
        RETURNING *
    )
    SELECT jsonb_agg(to_jsonb(i)) INTO v_result
    FROM inserted_installments i;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Installment plan created successfully',
        'installments', v_result
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Error creating installment plan: ' || SQLERRM
        );
END;
$$;
