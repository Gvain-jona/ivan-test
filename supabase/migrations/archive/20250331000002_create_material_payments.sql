-- Create material_payments table explicitly to fix migration order
-- Created: 2025-04-04

-- Create Material Payments Table if it doesn't exist
CREATE TABLE IF NOT EXISTS material_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES material_purchases(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type = ANY(ARRAY['cash', 'bank_transfer', 'mobile_payment', 'cheque'])),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS material_payments_purchase_id_idx ON material_payments(purchase_id); 