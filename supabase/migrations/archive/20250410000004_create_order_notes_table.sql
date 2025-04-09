-- Migration to create order_notes table
-- Created: 2025-04-10

-- Create order_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('info', 'client_follow_up', 'urgent', 'internal')) NOT NULL DEFAULT 'info',
    text TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS order_notes_order_id_idx ON order_notes(order_id);
CREATE INDEX IF NOT EXISTS order_notes_type_idx ON order_notes(type);
CREATE INDEX IF NOT EXISTS order_notes_created_by_idx ON order_notes(created_by);

-- Add comments for documentation
COMMENT ON TABLE order_notes IS 'Notes related to orders';
COMMENT ON COLUMN order_notes.type IS 'Type of note: info, client_follow_up, urgent, internal';
COMMENT ON COLUMN order_notes.text IS 'Content of the note';
COMMENT ON COLUMN order_notes.created_by IS 'User who created the note';
