// Next.js API Route Handler for fetching a single order by ID
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * GET /api/orders/[id]
 * Retrieves a single order with all related details (items, payments, notes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get order without using joins to avoid foreign key issues
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    // We'll use client_name directly from orders table

    // Get order items without using joins to avoid foreign key issues
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);
    // We'll use item_name and category_name directly from order_items table

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
    }

    // Get order payments if they exist
    console.log('API - Fetching payments for order ID:', id);
    console.log('API - Order ID type:', typeof id);

    // Use a more explicit query to ensure we're correctly comparing UUIDs
    const { data: orderPayments, error: orderPaymentsError } = await supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', id)
      .order('date', { ascending: false });

    if (orderPaymentsError) {
      console.error('Error fetching order payments:', orderPaymentsError);
    }

    // Log the payments data for debugging
    console.log('API - Order payments data:', orderPayments);
    console.log('API - Order ID for payments query:', id);
    console.log('API - Order payments query result:', { data: orderPayments, error: orderPaymentsError });

    // Get order notes if they exist - don't use join to avoid potential issues
    const { data: orderNotes, error: orderNotesError } = await supabase
      .from('notes')
      .select('*')
      .eq('linked_item_id', id)
      .eq('linked_item_type', 'order')
      .order('created_at', { ascending: false });

    if (orderNotesError) {
      console.error('Error fetching order notes:', orderNotesError);
    }

    // Log the notes data for debugging
    console.log('API - Order notes data:', orderNotes);

    if (error) {
      console.error('Error fetching order details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order details' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const orderDetails = {
      id: data.id,
      client_id: data.client_id,
      client_name: data.client_name || 'Unknown Client',
      client_type: data.client_type || 'regular',
      date: data.date,
      status: data.status,
      payment_status: data.payment_status,
      delivery_date: data.delivery_date,
      is_delivered: data.is_delivered || false,
      total_amount: data.total_amount || 0,
      amount_paid: data.amount_paid || 0,
      balance: data.balance || 0,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      items: orderItems ? orderItems.map(item => ({
        id: item.id,
        order_id: item.order_id,
        item_id: item.item_id,
        item_name: item.item_name || 'Unknown Item',
        category_id: item.category_id,
        category_name: item.category_name || 'Uncategorized',
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        total_amount: item.total_amount || 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) : [],
      payments: orderPayments ? orderPayments.map(payment => ({
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        // Map both naming conventions for compatibility
        payment_date: payment.payment_date || payment.date,
        date: payment.date || payment.payment_date,
        payment_method: payment.payment_method || payment.payment_type,
        payment_type: payment.payment_type || payment.payment_method,
        created_at: payment.created_at,
        updated_at: payment.updated_at
      })) : [],
      notes: orderNotes ? orderNotes.map(note => ({
        id: note.id,
        order_id: note.linked_item_id,
        text: note.text || '',
        type: note.type || 'info', // Changed note_type to type to match OrderNote interface
        linked_item_type: note.linked_item_type || 'order',
        linked_item_id: note.linked_item_id,
        created_by: note.created_by,
        created_by_name: 'User', // We don't have profiles data anymore
        created_at: note.created_at,
        updated_at: note.updated_at
      })) : []
    };

    return NextResponse.json({ order: orderDetails });
  } catch (error) {
    console.error('Unexpected error in GET /api/orders/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]/status
 * Updates the status of an order
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Update the order status
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating order status:', error);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/orders/[id]/status:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}