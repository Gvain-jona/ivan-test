import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OrderItem } from '@/types/orders';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/orders/[id]/items
 * Retrieves all items for a specific order
 */
export async function GET(
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

    // Create Supabase client
    const supabase = await createClient();

    // Get order items
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      return handleSupabaseError(error);
    }

    return createApiResponse({
      items: data || []
    });
  } catch (error) {
    console.error('Error in GET /api/orders/[id]/items:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching order items'
    );
  }
}

/**
 * POST /api/orders/[id]/items
 * Adds a new item to an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] POST /api/orders/[id]/items - Start');
  try {
    // In Next.js 15, params is now async and needs to be awaited
    console.log('[API] Awaiting params...');
    const { id: orderId } = await params;
    console.log('[API] Order ID from params:', orderId);

    if (!orderId) {
      console.error('[API] Missing order ID');
      return handleApiError(
        'VALIDATION_ERROR',
        'Order ID is required',
        { param: 'id' }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('[API] Request body:', body);
    const { item } = body;

    if (!item) {
      console.error('[API] Missing item data');
      return handleApiError(
        'VALIDATION_ERROR',
        'Item data is required',
        { param: 'item' }
      );
    }

    // Validate required fields
    console.log('[API] Validating item fields:', {
      item_name: item.item_name,
      category_name: item.category_name,
      quantity: item.quantity,
      unit_price: item.unit_price
    });

    if (!item.item_name || !item.category_name || item.quantity === undefined || item.unit_price === undefined) {
      console.error('[API] Validation failed - missing required fields');
      return handleApiError(
        'VALIDATION_ERROR',
        'Item name, category name, quantity, and unit price are required',
        { param: 'item' }
      );
    }

    console.log('[API] Validation passed');


    // Create Supabase client
    const supabase = await createClient();

    // Check if the item exists in the items table or create a new one
    let finalItemId;
    let finalCategoryId;

    // First, handle the category
    try {
      console.log('[API] Starting category handling for:', item.category_name);

      // Check if a category with this name already exists
      console.log('[API] Checking if category exists:', item.category_name.trim());
      const { data: existingCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', item.category_name.trim()) // Case-insensitive search
        .limit(1);

      console.log('[API] Category search result:', existingCategories);

      if (categoriesError) {
        console.error('[API] Error searching for category:', categoriesError);
        return handleSupabaseError(categoriesError);
      }

      if (existingCategories && existingCategories.length > 0) {
        finalCategoryId = existingCategories[0].id;
        console.log(`[API] Found existing category: ${item.category_name} with ID: ${finalCategoryId}`);
      } else {
        // Create a new category
        console.log('[API] Creating new category:', item.category_name.trim());
        const categoryData = {
          name: item.category_name.trim(),
          status: 'active'
        };
        console.log('[API] Category data for insertion:', categoryData);

        const { data: newCategory, error: newCategoryError } = await supabase
          .from('categories')
          .insert(categoryData)
          .select('id')
          .single();

        console.log('[API] New category creation result:', newCategory);

        if (newCategoryError) {
          console.error('[API] Error creating new category:', newCategoryError);
          return handleSupabaseError(newCategoryError);
        }

        finalCategoryId = newCategory.id;
        console.log(`[API] Created new category: ${item.category_name} with ID: ${finalCategoryId}`);
      }
    } catch (error) {
      console.error('[API] Error handling category:', error);
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to process category information',
        { category: item.category_name }
      );
    }

    // Then, handle the item
    try {
      console.log('[API] Starting item handling for:', item.item_name);

      // Check if an item with this name already exists
      console.log('[API] Checking if item exists:', item.item_name.trim());
      const { data: existingItems, error: itemsError } = await supabase
        .from('items')
        .select('id')
        .ilike('name', item.item_name.trim()) // Case-insensitive search
        .limit(1);

      console.log('[API] Item search result:', existingItems);

      if (itemsError) {
        console.error('[API] Error searching for item:', itemsError);
        return handleSupabaseError(itemsError);
      }

      if (existingItems && existingItems.length > 0) {
        finalItemId = existingItems[0].id;
        console.log(`[API] Found existing item: ${item.item_name} with ID: ${finalItemId}`);
      } else {
        // Create a new item
        console.log('[API] Creating new item:', item.item_name.trim());
        const itemData = {
          name: item.item_name.trim(),
          category_id: finalCategoryId,
          status: 'active'
        };
        console.log('[API] Item data for insertion:', itemData);

        const { data: newItem, error: newItemError } = await supabase
          .from('items')
          .insert(itemData)
          .select('id')
          .single();

        console.log('[API] New item creation result:', newItem);

        if (newItemError) {
          console.error('[API] Error creating new item:', newItemError);
          return handleSupabaseError(newItemError);
        }

        finalItemId = newItem.id;
        console.log(`[API] Created new item: ${item.item_name} with ID: ${finalItemId}`);
      }
    } catch (error) {
      console.error('[API] Error handling item:', error);
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to process item information',
        { item: item.item_name }
      );
    }

    // Create the order item with proper error handling
    try {
      console.log('[API] Starting order item creation');

      // Prepare the order item data
      const orderItemData = {
        order_id: orderId,
        item_id: finalItemId,
        category_id: finalCategoryId,
        item_name: item.item_name.trim(),
        category_name: item.category_name.trim(),
        size: item.size || 'Default',
        quantity: item.quantity,
        unit_price: item.unit_price,
        // total_amount is calculated automatically by the database
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[API] Creating order item with data:', orderItemData);

      // Insert the order item
      console.log('[API] Inserting into order_items table');
      const { data: newItem, error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemData)
        .select('*')
        .single();

      if (itemError) {
        console.error('[API] Error creating order item:', itemError);
        return handleSupabaseError(itemError);
      }

      console.log('[API] Order item created successfully:', newItem);

      // Update the order totals
      console.log('[API] Updating order totals for order ID:', orderId);
      await updateOrderTotals(supabase, orderId);
      console.log('[API] Order totals updated successfully');

      // We don't need to invalidate the cache here since we'll do it on the client side
      // The client will call invalidateOrderCache after the API call succeeds
      console.log('[API] Order updated successfully, client will handle cache invalidation');

      // Return the newly created item
      console.log('[API] Returning successful response');
      return createApiResponse({
        item: newItem,
        message: 'Item added successfully'
      });
    } catch (error) {
      console.error('[API] Error in order item creation:', error);
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to create order item',
        { orderId, itemName: item.item_name }
      );
    }

    // The return statement is now inside the try block
  } catch (error) {
    console.error('Error in POST /api/orders/[id]/items:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while adding the item'
    );
  }
}

/**
 * PUT /api/orders/[id]/items/[itemId]
 * Updates an existing order item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id: orderId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!orderId || !itemId) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Order ID and Item ID are required',
        { param: 'id' }
      );
    }

    // Parse request body
    const body = await request.json();
    const { item } = body;

    if (!item) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Item data is required',
        { param: 'item' }
      );
    }

    // Validate required fields
    if (!item.item_name || !item.category_name || item.quantity === undefined || item.unit_price === undefined) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Item name, category name, quantity, and unit price are required',
        { param: 'item' }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Check if the item exists in the items table
    let finalItemId = item.item_id;
    let finalCategoryId = item.category_id;

    // If item_name has changed, update or create the item
    if (item.item_name !== item.item_name_original) {
      // Check if an item with this name already exists
      const { data: existingItems, error: itemsError } = await supabase
        .from('items')
        .select('id')
        .eq('name', item.item_name)
        .limit(1);

      if (itemsError) {
        return handleSupabaseError(itemsError);
      }

      if (existingItems && existingItems.length > 0) {
        finalItemId = existingItems[0].id;
      } else {
        // Create a new item
        const { data: newItem, error: newItemError } = await supabase
          .from('items')
          .insert({
            name: item.item_name,
            category_id: finalCategoryId || null,
            status: 'active'
          })
          .select('id')
          .single();

        if (newItemError) {
          return handleSupabaseError(newItemError);
        }

        finalItemId = newItem.id;
      }
    }

    // If category_name has changed, update or create the category
    if (item.category_name !== item.category_name_original) {
      // Check if a category with this name already exists
      const { data: existingCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', item.category_name)
        .limit(1);

      if (categoriesError) {
        return handleSupabaseError(categoriesError);
      }

      if (existingCategories && existingCategories.length > 0) {
        finalCategoryId = existingCategories[0].id;
      } else {
        // Create a new category
        const { data: newCategory, error: newCategoryError } = await supabase
          .from('categories')
          .insert({
            name: item.category_name,
            status: 'active'
          })
          .select('id')
          .single();

        if (newCategoryError) {
          return handleSupabaseError(newCategoryError);
        }

        finalCategoryId = newCategory.id;
      }
    }

    // Update the order item
    const { data: updatedItem, error: itemError } = await supabase
      .from('order_items')
      .update({
        item_id: finalItemId,
        category_id: finalCategoryId,
        item_name: item.item_name,
        category_name: item.category_name,
        size: item.size || 'Default',
        quantity: item.quantity,
        unit_price: item.unit_price,
        // total_amount is calculated automatically by the database
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('order_id', orderId)
      .select('*')
      .single();

    if (itemError) {
      return handleSupabaseError(itemError);
    }

    // Update the order totals
    await updateOrderTotals(supabase, orderId);

    return createApiResponse({
      item: updatedItem,
      message: 'Item updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/orders/[id]/items:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while updating the item'
    );
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId]
 * Deletes an order item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id: orderId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!orderId || !itemId) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Order ID and Item ID are required',
        { param: 'id' }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Delete the order item
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
      .eq('order_id', orderId);

    if (error) {
      return handleSupabaseError(error);
    }

    // Update the order totals
    await updateOrderTotals(supabase, orderId);

    return createApiResponse({
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/orders/[id]/items:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while deleting the item'
    );
  }
}



/**
 * Helper function to update order totals
 */
async function updateOrderTotals(supabase: any, orderId: string) {
  console.log('[API:updateOrderTotals] Starting update for order ID:', orderId);
  try {
    // Calculate the total amount from order items
    console.log('[API:updateOrderTotals] Fetching order items');
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('total_amount')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('[API:updateOrderTotals] Error fetching order items:', itemsError);
      return;
    }

    console.log('[API:updateOrderTotals] Order items fetched:', items);

    // Calculate the total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (parseFloat(item.total_amount) || 0), 0);
    console.log('[API:updateOrderTotals] Calculated total amount:', totalAmount);

    // Calculate the amount paid from order payments
    console.log('[API:updateOrderTotals] Fetching order payments');
    const { data: payments, error: paymentsError } = await supabase
      .from('order_payments')
      .select('amount')
      .eq('order_id', orderId);

    if (paymentsError) {
      console.error('[API:updateOrderTotals] Error fetching order payments:', paymentsError);
      return;
    }

    console.log('[API:updateOrderTotals] Order payments fetched:', payments);

    // Calculate the amount paid
    const amountPaid = payments.reduce((sum: number, payment: any) => sum + (parseFloat(payment.amount) || 0), 0);
    console.log('[API:updateOrderTotals] Calculated amount paid:', amountPaid);

    // Calculate the balance
    const balance = totalAmount - amountPaid;
    console.log('[API:updateOrderTotals] Calculated balance:', balance);

    // Determine the payment status
    let paymentStatus = 'unpaid';
    if (totalAmount === 0) {
      paymentStatus = 'unpaid';
    } else if (amountPaid >= totalAmount) {
      paymentStatus = 'paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'partially_paid';
    }
    console.log('[API:updateOrderTotals] Determined payment status:', paymentStatus);

    // Update the order
    console.log('[API:updateOrderTotals] Updating order with new totals');
    // Don't include balance as it's a generated column
    const updateData = {
      total_amount: totalAmount,
      amount_paid: amountPaid,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };
    console.log('[API:updateOrderTotals] Update data:', updateData);

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('[API:updateOrderTotals] Error updating order totals:', updateError);
    } else {
      console.log('[API:updateOrderTotals] Order totals updated successfully');
    }
  } catch (error) {
    console.error('[API:updateOrderTotals] Error in updateOrderTotals:', error);
  }
}
