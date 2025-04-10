-- Consolidated Tasks and Notes Schema for Ivan Prints Business Management System
-- This migration consolidates all tasks and notes-related tables into a single file
-- Created: 2025-06-01

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Create Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID,
    due_date DATE,
    completed_date DATE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Notes Table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    linked_item_type VARCHAR(50) NOT NULL,
    linked_item_id UUID NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON tasks(created_by);

CREATE INDEX IF NOT EXISTS notes_type_idx ON notes(type);
CREATE INDEX IF NOT EXISTS notes_linked_item_type_idx ON notes(linked_item_type);
CREATE INDEX IF NOT EXISTS notes_linked_item_id_idx ON notes(linked_item_id);
CREATE INDEX IF NOT EXISTS notes_created_by_idx ON notes(created_by);

-- Add comments for documentation
COMMENT ON TABLE tasks IS 'Tasks for Ivan Prints Business';
COMMENT ON COLUMN tasks.title IS 'Task title';
COMMENT ON COLUMN tasks.description IS 'Task description';
COMMENT ON COLUMN tasks.status IS 'Task status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, high, urgent';
COMMENT ON COLUMN tasks.assigned_to IS 'User assigned to the task';
COMMENT ON COLUMN tasks.due_date IS 'Date the task is due';
COMMENT ON COLUMN tasks.completed_date IS 'Date the task was completed';
COMMENT ON COLUMN tasks.created_by IS 'User who created the task';

COMMENT ON TABLE notes IS 'Notes for various items in Ivan Prints Business';
COMMENT ON COLUMN notes.type IS 'Note type (e.g., general, important, follow_up)';
COMMENT ON COLUMN notes.text IS 'Note text content';
COMMENT ON COLUMN notes.linked_item_type IS 'Type of item the note is linked to (e.g., order, client, task)';
COMMENT ON COLUMN notes.linked_item_id IS 'ID of the item the note is linked to';
COMMENT ON COLUMN notes.created_by IS 'User who created the note';
