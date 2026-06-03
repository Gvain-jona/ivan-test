import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';

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

    const [
      { data: order, error: orderError },
      { data: orderItems, error: itemsError },
      { data: orderPayments, error: paymentsError },
      { data: orderNotes, error: notesError },
    ] = await Promise.all([
      supabase.from('orders').select('*').eq('id', id).single(),
      supabase.from('order_items').select('*').eq('order_id', id).order('created_at', { ascending: true }),
      supabase.from('order_payments').select('*').eq('order_id', id).order('date', { ascending: false }),
      supabase
        .from('notes')
        .select('*')
        .eq('linked_item_type', 'order')
        .eq('linked_item_id', id)
        .order('created_at', { ascending: false }),
    ]);

    if (orderError) {
      if (orderError.code === 'PGRST116') return handleApiError('NOT_FOUND', 'Order not found');
      return handleSupabaseError(orderError);
    }

    const warnings: string[] = [];
    if (itemsError) { console.error('GET /api/orders/[id]: items fetch failed', itemsError); warnings.push('items_unavailable'); }
    if (paymentsError) { console.error('GET /api/orders/[id]: payments fetch failed', paymentsError); warnings.push('payments_unavailable'); }
    if (notesError) { console.error('GET /api/orders/[id]: notes fetch failed', notesError); warnings.push('notes_unavailable'); }

    const orderDetails = {
      id: order.id,
      order_number: order.order_number,
      client_id: order.client_id,
      client_name: order.client_name || 'Unknown Client',
      client_type: order.client_type || 'regular',
      date: order.date,
      delivery_date: order.delivery_date,
      is_delivered: order.is_delivered || false,
      status: order.status,
      payment_status: order.payment_status,
      total_amount: order.total_amount || 0,
      amount_paid: order.amount_paid || 0,
      balance: order.balance || 0,
      invoice_generated_at: order.invoice_generated_at,
      created_by: order.created_by,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: (orderItems ?? []).map(item => ({
        id: item.id,
        order_id: item.order_id,
        item_id: item.item_id,
        item_name: item.item_name || 'Unknown Item',
        category_id: item.category_id,
        category_name: item.category_name || 'Uncategorized',
        size: item.size,
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        total_amount: item.total_amount || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      payments: (orderPayments ?? []).map(payment => ({
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        date: payment.date,
        payment_method: payment.payment_method,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
      })),
      notes: (orderNotes ?? []).map(note => ({
        id: note.id,
        type: note.type || 'info',
        text: note.text || '',
        linked_item_type: note.linked_item_type,
        linked_item_id: note.linked_item_id,
        created_by: note.created_by,
        created_at: note.created_at,
        updated_at: note.updated_at,
      })),
    };

    return NextResponse.json({
      order: orderDetails,
      ...(warnings.length > 0 && { warnings }),
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
