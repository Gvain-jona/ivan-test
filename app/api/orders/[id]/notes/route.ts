// Next.js API Route Handler for order notes
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

/**
 * GET /api/orders/[id]/notes
 * Retrieves all notes for a specific order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get notes for the order
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        users(name)
      `)
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
      created_by_name: note.users?.name || 'Unknown',
      users: undefined
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { type, text, createdBy } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    if (!type || !text || !createdBy) {
      return NextResponse.json(
        { error: 'Note type, text, and creator are required' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Call the database function to add note
    const { data, error } = await supabase.rpc('add_order_note', {
      p_order_id: id,
      p_type: type,
      p_text: text,
      p_created_by: createdBy
    });
    
    if (error) {
      console.error('Error adding order note:', error);
      return NextResponse.json(
        { error: 'Failed to add order note' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      id: data,
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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