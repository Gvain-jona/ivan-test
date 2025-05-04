import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-utils';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/material-purchases/:id/notes
 * Get all notes for a material purchase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // In Next.js 15, params is now async and needs to be awaited
  const { id } = await params;

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    let user;
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error('Error getting authenticated user:', error);
        return handleApiError(
          'AUTHENTICATION_ERROR',
          'Authentication required to view notes'
        );
      }

      user = data.user;
    } catch (authError) {
      console.error('Exception getting authenticated user:', authError);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to view notes'
      );
    }

    // Get notes for the material purchase
    const { data: notes, error } = await supabase
      .from('material_purchase_notes')
      .select('*')
      .eq('purchase_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching material purchase notes:', error);
      return handleSupabaseError(error);
    }

    return createApiResponse({ notes });
  } catch (error: any) {
    console.error('Error in GET /api/material-purchases/:id/notes:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while fetching notes'
    );
  }
}

/**
 * POST /api/material-purchases/:id/notes
 * Create a new note for a material purchase
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // In Next.js 15, params is now async and needs to be awaited
  const { id } = await params;

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    let user;
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error('Error getting authenticated user:', error);
        return handleApiError(
          'AUTHENTICATION_ERROR',
          'Authentication required to create note'
        );
      }

      user = data.user;
    } catch (authError) {
      console.error('Exception getting authenticated user:', authError);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to create note'
      );
    }

    // Parse request body
    const body = await request.json();
    const { type = 'note', text } = body;

    // Validate required fields
    if (!text) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Note text is required',
        { param: 'text' }
      );
    }

    // Create the note
    const { data: note, error } = await supabase
      .from('material_purchase_notes')
      .insert({
        purchase_id: id,
        type,
        text,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating material purchase note:', error);
      return handleSupabaseError(error);
    }

    return createApiResponse({
      message: 'Note created successfully',
      note
    });
  } catch (error: any) {
    console.error('Error in POST /api/material-purchases/:id/notes:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while creating the note'
    );
  }
}

/**
 * DELETE /api/material-purchases/:id/notes
 * Delete a note for a material purchase
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // In Next.js 15, params is now async and needs to be awaited
  const { id } = await params;
  const noteId = request.nextUrl.searchParams.get('noteId');

  if (!noteId) {
    return handleApiError(
      'VALIDATION_ERROR',
      'Note ID is required',
      { param: 'noteId' }
    );
  }

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    let user;
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error('Error getting authenticated user:', error);
        return handleApiError(
          'AUTHENTICATION_ERROR',
          'Authentication required to delete note'
        );
      }

      user = data.user;
    } catch (authError) {
      console.error('Exception getting authenticated user:', authError);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to delete note'
      );
    }

    // Delete the note
    const { error } = await supabase
      .from('material_purchase_notes')
      .delete()
      .eq('id', noteId)
      .eq('purchase_id', id);

    if (error) {
      console.error('Error deleting material purchase note:', error);
      return handleSupabaseError(error);
    }

    return createApiResponse({
      message: 'Note deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/material-purchases/:id/notes:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while deleting the note'
    );
  }
}
