import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';
import { InlineEditSchema } from '@/lib/orders/validators';

export async function PUT(
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
    const parsed = InlineEditSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
    }

    const { items, payments, notes } = parsed.data;

    if (items) {
      for (const item of items) {
        const size = item.size || 'Default';
        const categoryId = item.category_id ?? crypto.randomUUID();
        const itemId = item.item_id ?? crypto.randomUUID();

        if (item.id) {
          const { error } = await supabase
            .from('order_items')
            .update({
              item_id: itemId,
              category_id: categoryId,
              quantity: item.quantity,
              unit_price: item.unit_price,
              size,
              item_name: item.item_name,
              category_name: item.category_name,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id)
            .eq('order_id', orderId);

          if (error) return handleSupabaseError(error);
        } else {
          const { error } = await supabase.from('order_items').insert({
            order_id: orderId,
            item_id: itemId,
            category_id: categoryId,
            quantity: item.quantity,
            unit_price: item.unit_price,
            size,
            item_name: item.item_name,
            category_name: item.category_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (error) return handleSupabaseError(error);
        }
      }
    }

    if (payments) {
      for (const payment of payments) {
        if (payment.id) {
          const { error } = await supabase
            .from('order_payments')
            .update({
              amount: payment.amount,
              date: payment.date,
              payment_method: payment.payment_method,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id)
            .eq('order_id', orderId);

          if (error) return handleSupabaseError(error);
        } else {
          const { error } = await supabase.from('order_payments').insert({
            order_id: orderId,
            amount: payment.amount,
            date: payment.date,
            payment_method: payment.payment_method,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (error) return handleSupabaseError(error);
        }
      }
    }

    if (notes) {
      for (const note of notes) {
        if (note.id) {
          const { error } = await supabase
            .from('notes')
            .update({
              type: note.type,
              text: note.text,
              updated_at: new Date().toISOString(),
            })
            .eq('id', note.id)
            .eq('linked_item_id', orderId)
            .eq('linked_item_type', 'order');

          if (error) return handleSupabaseError(error);
        } else {
          const { error } = await supabase.from('notes').insert({
            linked_item_id: orderId,
            linked_item_type: 'order',
            type: note.type,
            text: note.text,
            created_by: note.created_by ?? user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (error) return handleSupabaseError(error);
        }
      }
    }

    const { data: orderDetails, error: fetchError } = await supabase.rpc('get_order_details', {
      p_order_id: orderId,
    });

    if (fetchError) return handleSupabaseError(fetchError);

    const transformedOrder = {
      ...orderDetails.order,
      items: orderDetails.items ?? [],
      payments: orderDetails.payments ?? [],
      notes: orderDetails.notes ?? [],
    };

    return createApiResponse({ success: true, order: transformedOrder });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
