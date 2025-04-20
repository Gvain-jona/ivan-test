import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Order, OrderItem, OrderPayment, OrderNote } from '@/types/orders';
import { handleApiError, handleUnexpectedError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse, createNoContentResponse } from '@/lib/api/response-handler';

/**
 * PUT /api/orders/[id]/inline-edit
 * Updates specific parts of an order (items, payments, notes) without requiring the entire order object
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id: orderId } = await params;

    if (!orderId) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Order ID is required',
        { param: 'id' }
      );
    }

    // Parse request body
    const body = await request.json();
    const { items, payments, notes, total_amount, amount_paid, balance, payment_status } = body;

    // Create Supabase client
    const supabase = await createClient();

    // Start a transaction
    let success = true;
    let error = null;

    // IMPORTANT: We must NOT update total_amount directly as it's managed by triggers
    // The database has constraints that prevent direct updates to total_amount
    // The update_order_totals trigger will update total_amount when items are modified
    // The update_order_payment_status trigger will update amount_paid and payment_status when payments are modified
    // We'll update the balance at the end of all operations

    // Update items if provided - optimized approach
    if (items && Array.isArray(items) && success) {
      // For each item, update if it exists or create if it doesn't
      for (const item of items) {
        // Ensure size is never empty
        const size = item.size || 'Default';

        // Generate UUIDs for missing IDs or when names have changed
        // If the item name or category name has changed, we need to generate a new UUID
        // to avoid updating the wrong item or category in the reference tables
        const categoryId = item.category_id || crypto.randomUUID();
        const itemId = item.item_id || crypto.randomUUID();

        // Store the original names for future reference
        const originalItemName = item.item_name_original || item.item_name;
        const originalCategoryName = item.category_name_original || item.category_name;

        // If the name has changed, generate a new UUID
        const finalItemId = (item.item_name !== originalItemName) ? crypto.randomUUID() : itemId;
        const finalCategoryId = (item.category_name !== originalCategoryName) ? crypto.randomUUID() : categoryId;

        // Step 3: Update or create the order item
        if (item.id) {
          // Update existing item - simplified approach
          const updateData = {
            item_id: finalItemId,
            category_id: finalCategoryId,
            quantity: item.quantity,
            unit_price: item.unit_price,
            // total_amount is omitted intentionally as it's calculated by triggers
            size: size,
            item_name: item.item_name,
            category_name: item.category_name,
            updated_at: new Date().toISOString()
          };

          const { error: itemError } = await supabase
            .from('order_items')
            .update(updateData)
            .eq('id', item.id)
            .eq('order_id', orderId);

          if (itemError) {
            console.error('Error updating order item:', itemError);
            success = false;
            error = itemError;
            break;
          }
        } else {
          // Create new item
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: orderId,
              item_id: finalItemId,
              category_id: finalCategoryId,
              quantity: item.quantity,
              unit_price: item.unit_price,
              // total_amount is omitted intentionally as it's calculated by triggers
              size: size,
              item_name: item.item_name,
              category_name: item.category_name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (itemError) {
            console.error('Error creating order item:', itemError);
            success = false;
            error = itemError;
            break;
          }
        }
      }
    }

    // Update payments if provided
    if (payments && Array.isArray(payments) && success) {
      // For each payment, update if it exists or create if it doesn't
      for (const payment of payments) {
        if (payment.id) {
          // Update existing payment
          const { error: paymentError } = await supabase
            .from('order_payments')
            .update({
              amount: payment.amount,
              date: payment.date,
              payment_method: payment.payment_method,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)
            .eq('order_id', orderId);

          if (paymentError) {
            console.error('Error updating order payment:', paymentError);
            success = false;
            error = paymentError;
            break;
          }
        } else {
          // Create new payment
          const { error: paymentError } = await supabase
            .from('order_payments')
            .insert({
              order_id: orderId,
              amount: payment.amount,
              date: payment.date,
              payment_method: payment.payment_method,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (paymentError) {
            console.error('Error creating order payment:', paymentError);
            success = false;
            error = paymentError;
            break;
          }
        }
      }
    }

    // Update notes if provided
    if (notes && Array.isArray(notes) && success) {
      // For each note, update if it exists or create if it doesn't
      for (const note of notes) {
        if (note.id) {
          // Update existing note
          const { error: noteError } = await supabase
            .from('notes')
            .update({
              type: note.type,
              text: note.text,
              updated_at: new Date().toISOString()
            })
            .eq('id', note.id)
            .eq('linked_item_id', orderId)
            .eq('linked_item_type', 'order');

          if (noteError) {
            console.error('Error updating order note:', noteError);
            success = false;
            error = noteError;
            break;
          }
        } else {
          // Create new note
          const { error: noteError } = await supabase
            .from('notes')
            .insert({
              linked_item_id: orderId,
              linked_item_type: 'order',
              type: note.type,
              text: note.text,
              created_by: note.created_by,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (noteError) {
            console.error('Error creating order note:', noteError);
            success = false;
            error = noteError;
            break;
          }
        }
      }
    }

    if (!success) {
      console.error('Failed to update order:', error);

      // Handle Supabase errors with our standardized error handler
      if (error && typeof error === 'object' && 'code' in error) {
        return handleSupabaseError(error);
      }

      // Handle other errors
      return handleApiError(
        'DATABASE_ERROR',
        error instanceof Error ? error.message : 'Failed to update order',
        { orderId }
      );
    }

    // We don't need to update the balance field either
    // It seems the database has constraints on updating financial fields directly
    // Let the database triggers handle all financial calculations

    // Fetch the updated order with all related data
    let transformedOrder;

    // Use our optimized get_order_details function
    try {
      // Call the optimized function to get all order details in a single call
      const { data: orderDetails, error: fetchError } = await supabase
        .rpc('get_order_details', { p_order_id: orderId });

      if (fetchError) {
        console.error('Error fetching order data:', fetchError);
        return handleSupabaseError(fetchError);
      }

      // Extract the data from the function result
      transformedOrder = {
        ...orderDetails.order,
        items: orderDetails.items || [],
        payments: orderDetails.payments || [],
        notes: orderDetails.notes || []
      };
    } catch (error) {
      console.error('Error fetching order details:', error);
      return handleUnexpectedError(error);
    }

    // Return standardized success response with the updated order data
    return createApiResponse(
      {
        success: true,
        message: 'Order updated successfully',
        order: transformedOrder
      },
      {
        // Include metadata about the update
        operation: 'update',
        entityType: 'order',
        entityId: orderId
      }
    );
  } catch (error) {
    console.error('Error in inline edit API:', error);
    return handleUnexpectedError(error);
  }
}
