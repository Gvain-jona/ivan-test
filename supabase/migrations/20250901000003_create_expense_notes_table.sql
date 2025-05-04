-- Migration to create expense_notes table
-- Created: 2025-09-01

-- Create expense_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS expense_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('info', 'follow_up', 'urgent', 'internal')) NOT NULL DEFAULT 'info',
    text TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS expense_notes_expense_id_idx ON expense_notes(expense_id);
CREATE INDEX IF NOT EXISTS expense_notes_type_idx ON expense_notes(type);
CREATE INDEX IF NOT EXISTS expense_notes_created_by_idx ON expense_notes(created_by);

-- Add comments for documentation
COMMENT ON TABLE expense_notes IS 'Notes related to expenses';
COMMENT ON COLUMN expense_notes.type IS 'Type of note: info, follow_up, urgent, internal';
COMMENT ON COLUMN expense_notes.text IS 'Content of the note';
COMMENT ON COLUMN expense_notes.created_by IS 'User who created the note';

-- Migrate existing notes from the notes table to the expense_notes table
INSERT INTO expense_notes (id, expense_id, type, text, created_by, created_at, updated_at)
SELECT 
    n.id,
    n.linked_item_id AS expense_id,
    CASE 
        WHEN n.type IN ('info', 'follow_up', 'urgent', 'internal') THEN n.type
        ELSE 'info'
    END AS type,
    n.text,
    n.created_by,
    n.created_at,
    n.updated_at
FROM notes n
WHERE n.linked_item_type = 'expense'
AND EXISTS (SELECT 1 FROM expenses e WHERE e.id = n.linked_item_id);

-- Delete migrated notes from the notes table
DELETE FROM notes
WHERE linked_item_type = 'expense'
AND EXISTS (SELECT 1 FROM expenses e WHERE e.id = linked_item_id);
