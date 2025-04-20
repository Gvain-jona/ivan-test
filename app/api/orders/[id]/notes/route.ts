// Next.js API Route Handler for order notes
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/orders/[id]/notes
 * Retrieves all notes for a specific order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing its properties
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get notes for the order - don't use join to avoid potential issues
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('linked_item_type', 'order')
      .eq('linked_item_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching order notes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order notes' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedNotes = data.map(note => ({
      ...note,
      created_by_name: 'User' // We don't have users data anymore
    }));

    return NextResponse.json({ notes: formattedNotes });
  } catch (error) {
    console.error('Unexpected error in GET /api/orders/[id]/notes:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/[id]/notes
 * Adds a new note to an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing its properties
    const { id } = await params;
    const body = await request.json();
    const { note } = body;

    // Extract note details
    const { type, text, created_by, createdBy } = note;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check for required fields using both naming conventions
    if (!type || !text) {
      return NextResponse.json(
        { error: 'Note type and text are required' },
        { status: 400 }
      );
    }

    // Use the appropriate fields for created_by, ensuring it's a valid UUID
    const finalCreatedBy = created_by || createdBy || uuidv4();

    // Create Supabase client
    const supabase = await createClient();

    // Prepare the note data
    const noteData = {
      type: type,
      text: text,
      linked_item_type: 'order',
      linked_item_id: id,
      created_by: finalCreatedBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Inserting note with data:', noteData);

    // Insert directly into the notes table
    const { data, error } = await supabase
      .from('notes')
      .insert(noteData)
      .select('*') // Select all fields to return the complete note
      .single();

    if (error) {
      console.error('Error adding order note:', error);

      // Check if it's an RLS error
      if (error.code === '42501') {
        return NextResponse.json(
          {
            error: 'Row-level security policy violation. Please check the RLS policies for the notes table.',
            details: error
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to add order note',
          details: error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      note: data, // Return the complete note data
      message: 'Note added successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/orders/[id]/notes:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]/notes/[noteId]
 * Deletes a note from an order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing its properties
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!id || !noteId) {
      return NextResponse.json(
        { error: 'Order ID and Note ID are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Delete the note
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('linked_item_type', 'order')
      .eq('linked_item_id', id);

    if (error) {
      console.error('Error deleting order note:', error);
      return NextResponse.json(
        { error: 'Failed to delete order note' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/orders/[id]/notes:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}