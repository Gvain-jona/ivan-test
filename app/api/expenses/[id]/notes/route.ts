import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/expenses/[id]/notes
 * Retrieves all notes for a specific expense
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;

    if (!id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Expense ID is required',
        { param: 'id' }
      );
    }

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get notes for the expense
    const { data, error } = await supabase
      .from('expense_notes')
      .select('*')
      .eq('expense_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expense notes:', error);
      return handleSupabaseError(error);
    }

    return createApiResponse({
      notes: data || []
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/expenses/[id]/notes:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching expense notes'
    );
  }
}

/**
 * POST /api/expenses/[id]/notes
 * Adds a new note to an expense
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;
    const body = await request.json();
    const { note } = body;

    if (!id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Expense ID is required',
        { param: 'id' }
      );
    }

    // Check for required fields
    if (!note.type || !note.text) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Note type and text are required',
        { param: 'note' }
      );
    }

    // Validate note type against allowed values
    const allowedTypes = ['info', 'follow_up', 'urgent', 'internal'];
    if (!allowedTypes.includes(note.type)) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Invalid note type',
        {
          param: 'note.type',
          details: `Note type must be one of: ${allowedTypes.join(', ')}`
        }
      );
    }

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to add a note'
      );
    }

    // Add the note
    const { data: newNote, error: noteError } = await supabase
      .from('expense_notes')
      .insert({
        expense_id: id,
        type: note.type,
        text: note.text,
        created_by: user.id
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error adding expense note:', noteError);
      return handleSupabaseError(noteError);
    }

    // Get all notes for the expense
    const { data: notes, error: notesError } = await supabase
      .from('expense_notes')
      .select('*')
      .eq('expense_id', id)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('Error fetching expense notes:', notesError);
      return handleSupabaseError(notesError);
    }

    return createApiResponse({
      note: newNote,
      notes: notes || []
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/expenses/[id]/notes:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while adding the note'
    );
  }
}

/**
 * PUT /api/expenses/[id]/notes
 * Updates an existing note
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;
    const body = await request.json();
    const { note, noteId } = body;

    if (!id || !noteId) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Expense ID and Note ID are required',
        { param: 'id' }
      );
    }

    // Check for required fields
    if (!note.type || !note.text) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Note type and text are required',
        { param: 'note' }
      );
    }

    // Validate note type against allowed values
    const allowedTypes = ['info', 'follow_up', 'urgent', 'internal'];
    if (!allowedTypes.includes(note.type)) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Invalid note type',
        {
          param: 'note.type',
          details: `Note type must be one of: ${allowedTypes.join(', ')}`
        }
      );
    }

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to update a note'
      );
    }

    // Update the note
    const { data: updatedNote, error: noteError } = await supabase
      .from('expense_notes')
      .update({
        type: note.type,
        text: note.text,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('expense_id', id)
      .select()
      .single();

    if (noteError) {
      console.error('Error updating expense note:', noteError);
      return handleSupabaseError(noteError);
    }

    // Get all notes for the expense
    const { data: notes, error: notesError } = await supabase
      .from('expense_notes')
      .select('*')
      .eq('expense_id', id)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('Error fetching expense notes:', notesError);
      return handleSupabaseError(notesError);
    }

    return createApiResponse({
      note: updatedNote,
      notes: notes || []
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/expenses/[id]/notes:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while updating the note'
    );
  }
}

/**
 * DELETE /api/expenses/[id]/notes
 * Deletes a note from an expense
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!id || !noteId) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Expense ID and Note ID are required',
        { param: 'id' }
      );
    }

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to delete a note'
      );
    }

    // Check if the user is an admin or manager, or the creator of the note
    const { data: note } = await supabase
      .from('expense_notes')
      .select('created_by')
      .eq('id', noteId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager' && note?.created_by !== user.id)) {
      return handleApiError(
        'AUTHORIZATION_ERROR',
        'You do not have permission to delete this note'
      );
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('expense_notes')
      .delete()
      .eq('id', noteId)
      .eq('expense_id', id);

    if (deleteError) {
      console.error('Error deleting expense note:', deleteError);
      return handleSupabaseError(deleteError);
    }

    // Get all notes for the expense
    const { data: notes, error: notesError } = await supabase
      .from('expense_notes')
      .select('*')
      .eq('expense_id', id)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('Error fetching expense notes:', notesError);
      return handleSupabaseError(notesError);
    }

    return createApiResponse({
      success: true,
      message: 'Note deleted successfully',
      notes: notes || []
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/expenses/[id]/notes:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while deleting the note'
    );
  }
}
