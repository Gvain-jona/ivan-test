import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';
import { AddOrderNoteSchema } from '@/lib/orders/validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return handleApiError('VALIDATION_ERROR', 'Order ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await supabase
      .from('notes')
      .select('id, type, text, linked_item_type, linked_item_id, created_by, created_at, updated_at')
      .eq('linked_item_type', 'order')
      .eq('linked_item_id', id)
      .order('created_at', { ascending: false });

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ notes: data ?? [] });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return handleApiError('VALIDATION_ERROR', 'Order ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const body = await request.json();
    const parsed = AddOrderNoteSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid note data', parsed.error.flatten());
    }

    const { note } = parsed.data;

    const { data, error } = await supabase
      .from('notes')
      .insert({
        type: note.type,
        text: note.text,
        linked_item_type: 'order',
        linked_item_id: id,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, type, text, linked_item_type, linked_item_id, created_by, created_at, updated_at')
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ note: data }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!id || !noteId) {
      return handleApiError('VALIDATION_ERROR', 'Order ID and Note ID are required');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('linked_item_type', 'order')
      .eq('linked_item_id', id);

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
