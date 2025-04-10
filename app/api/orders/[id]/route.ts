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

    // Get order with related data
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (id, name)
      `)
      .eq('id', id)
      .single();

    // Get order items if they exist
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        items:item_id (id, name),
        categories:category_id (id, name)
      `)
      .eq('order_id', id);

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
    }

    // Get order payments if they exist
    const { data: orderPayments, error: orderPaymentsError } = await supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', id);

    if (orderPaymentsError) {
      console.error('Error fetching order payments:', orderPaymentsError);
    }

    // Get order notes if they exist
    const { data: orderNotes, error: orderNotesError } = await supabase
      .from('notes')
      .select(`
        *,
        profiles:created_by (id, full_name, email)
      `)
      .eq('linked_item_id', id)
      .eq('linked_item_type', 'order')
      .order('created_at', { ascending: false });

    if (orderNotesError) {
      console.error('Error fetching order notes:', orderNotesError);
    }

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
      client_name: data.clients?.name || 'Unknown Client',
      client_type: data.client_type || 'regular',
      date: data.date,
      status: data.status,
      payment_status: data.payment_status,
      payment_method: data.payment_method,
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
        item_name: item.items?.name || 'Unknown Item',
        category_id: item.category_id,
        category_name: item.categories?.name || 'Uncategorized',
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        total_amount: item.total_amount || 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) : [],
      payments: orderPayments || [],
      notes: orderNotes ? orderNotes.map(note => ({
        id: note.id,
        order_id: note.linked_item_id,
        text: note.text || '',
        note_type: note.type || 'general',
        created_by: note.created_by,
        created_by_name: note.profiles?.full_name || 'Unknown User',
        created_by_email: note.profiles?.email || '',
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
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

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