-- Create a dedicated table for material purchase notes
-- Created: 2025-07-01

-- Create material_purchase_notes table
CREATE TABLE IF NOT EXISTS material_purchase_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES material_purchases(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS material_purchase_notes_purchase_id_idx ON material_purchase_notes(purchase_id);
CREATE INDEX IF NOT EXISTS material_purchase_notes_created_by_idx ON material_purchase_notes(created_by);

-- Add comments for documentation
COMMENT ON TABLE material_purchase_notes IS 'Dedicated table for notes related to material purchases';
COMMENT ON COLUMN material_purchase_notes.purchase_id IS 'Reference to the material purchase';
COMMENT ON COLUMN material_purchase_notes.note_text IS 'The content of the note';
COMMENT ON COLUMN material_purchase_notes.created_by IS 'User who created the note';

-- Enable Row Level Security
ALTER TABLE material_purchase_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY material_purchase_notes_select_policy ON material_purchase_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM material_purchases mp
            WHERE mp.id = material_purchase_notes.purchase_id
            AND (
                mp.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_roles ur
                    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
                )
            )
        )
    );

CREATE POLICY material_purchase_notes_insert_policy ON material_purchase_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM material_purchases mp
            WHERE mp.id = material_purchase_notes.purchase_id
            AND (
                mp.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_roles ur
                    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
                )
            )
        )
    );

CREATE POLICY material_purchase_notes_update_policy ON material_purchase_notes
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
        )
    );

CREATE POLICY material_purchase_notes_delete_policy ON material_purchase_notes
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
        )
    );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_material_purchase_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER update_material_purchase_notes_updated_at_trigger
BEFORE UPDATE ON material_purchase_notes
FOR EACH ROW
EXECUTE FUNCTION update_material_purchase_notes_updated_at();
