import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';
import { updateOrderTotals } from '@/lib/orders/db';
import { AddOrderItemSchema, UpdateOrderItemSchema } from '@/lib/orders/validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    if (!orderId) return handleApiError('VALIDATION_ERROR', 'Order ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) return handleSupabaseError(error);

    return createApiResponse({ items: data ?? [] });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    if (!orderId) return handleApiError('VALIDATION_ERROR', 'Order ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const body = await request.json();
    const parsed = AddOrderItemSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid item data', parsed.error.flatten());
    }

    const { item } = parsed.data;
    const categoryId = await resolveCategory(supabase, item.category_name);
    if (!categoryId) return handleApiError('DATABASE_ERROR', 'Failed to resolve category');

    const itemId = await resolveItem(supabase, item.item_name, categoryId);
    if (!itemId) return handleApiError('DATABASE_ERROR', 'Failed to resolve item');

    const { data: newItem, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        item_id: itemId,
        category_id: categoryId,
        item_name: item.item_name.trim(),
        category_name: item.category_name.trim(),
        size: item.size || 'Default',
        quantity: item.quantity,
        unit_price: item.unit_price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) return handleSupabaseError(error);

    await updateOrderTotals(supabase, orderId);

    return createApiResponse({ item: newItem }, undefined, 201);
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!orderId || !itemId) {
      return handleApiError('VALIDATION_ERROR', 'Order ID and Item ID are required');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const body = await request.json();
    const parsed = UpdateOrderItemSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid item data', parsed.error.flatten());
    }

    const { item } = parsed.data;
    const categoryId = await resolveCategory(supabase, item.category_name);
    if (!categoryId) return handleApiError('DATABASE_ERROR', 'Failed to resolve category');

    const resolvedItemId = await resolveItem(supabase, item.item_name, categoryId);
    if (!resolvedItemId) return handleApiError('DATABASE_ERROR', 'Failed to resolve item');

    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update({
        item_id: resolvedItemId,
        category_id: categoryId,
        item_name: item.item_name.trim(),
        category_name: item.category_name.trim(),
        size: item.size || 'Default',
        quantity: item.quantity,
        unit_price: item.unit_price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('order_id', orderId)
      .select('*')
      .single();

    if (error) return handleSupabaseError(error);

    await updateOrderTotals(supabase, orderId);

    return createApiResponse({ item: updatedItem });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!orderId || !itemId) {
      return handleApiError('VALIDATION_ERROR', 'Order ID and Item ID are required');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
      .eq('order_id', orderId);

    if (error) return handleSupabaseError(error);

    await updateOrderTotals(supabase, orderId);

    return createApiResponse({ message: 'Item deleted successfully' });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

async function resolveCategory(supabase: Awaited<ReturnType<typeof createClient>>, name: string) {
  const trimmed = name.trim();
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', trimmed)
    .limit(1)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('categories')
    .insert({ name: trimmed, status: 'active' })
    .select('id')
    .single();

  if (error) {
    console.error('resolveCategory: insert failed', error);
    return null;
  }
  return created.id;
}

async function resolveItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  categoryId: string,
) {
  const trimmed = name.trim();
  const { data: existing } = await supabase
    .from('items')
    .select('id')
    .ilike('name', trimmed)
    .limit(1)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('items')
    .insert({ name: trimmed, category_id: categoryId, status: 'active' })
    .select('id')
    .single();

  if (error) {
    console.error('resolveItem: insert failed', error);
    return null;
  }
  return created.id;
}
