// Next.js API Route Handler for orders
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

// Type for the count result from Supabase
type CountResult = {
  count: number | null;
};

/**
 * GET /api/orders
 * Retrieves a list of orders with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.getAll('status');
    const paymentStatus = searchParams.getAll('paymentStatus');
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;
    const search = searchParams.get('search') || null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Start building the query
    let query = supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (id, name)
      `, { count: 'exact' });

    // Apply filters
    if (status.length > 0) {
      query = query.in('status', status);
    }

    if (paymentStatus.length > 0) {
      query = query.in('payment_status', paymentStatus);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (search) {
      // Search in order ID or client name
      query = query.or(`id.ilike.%${search}%,clients.name.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedOrders = data?.map(order => {
      return {
        id: order.id,
        client_id: order.client_id,
        client_name: order.clients?.name || 'Unknown Client',
        client_type: order.client_type || 'regular',
        date: order.date,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: order.total_amount || 0,
        amount_paid: order.amount_paid || 0,
        balance: order.balance || 0,
        created_by: order.created_by,
        created_at: order.created_at,
        updated_at: order.updated_at
      };
    }) || [];

    return NextResponse.json({
      orders: transformedOrders,
      totalCount: count || 0,
      pageCount: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Creates a new order with items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, date, status, items, createdBy } = body;

    // Validate required fields
    if (!clientId || !date || !status || !items || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the database function to create order
    const { data, error } = await supabase.rpc('create_order', {
      p_client_id: clientId,
      p_date: date,
      p_status: status,
      p_items: items,
      p_created_by: createdBy
    });

    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data,
      message: 'Order created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders
 * Updates an existing order
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, clientId, date, status, items } = body;

    // Validate required fields
    if (!id || !clientId || !date || !status || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the database function to update order
    const { data, error } = await supabase.rpc('update_order', {
      p_order_id: id,
      p_client_id: clientId,
      p_date: date,
      p_status: status,
      p_items: items
    });

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders
 * Deletes an order by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the database function to delete order
    const { data, error } = await supabase.rpc('delete_order', {
      p_order_id: id
    });

    if (error) {
      console.error('Error deleting order:', error);
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}