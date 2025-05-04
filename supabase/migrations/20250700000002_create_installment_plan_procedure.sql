-- Create a stored procedure to handle installment plan creation
-- Created: 2025-07-01

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
