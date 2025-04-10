// Next.js API Route Handler for orders
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();

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
    console.log('Executing Supabase query for orders');
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    console.log(`Found ${count || 0} orders in database`);

    // Transform the data to match the expected format
    const transformedOrders = await Promise.all((data || []).map(async order => {
      // Fetch order items for this order
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (orderItemsError) {
        console.error('Error fetching order items:', orderItemsError);
      }

      // Parse the JSONB notes field
      let notes = [];
      if (order.notes && typeof order.notes === 'object') {
        notes = Array.isArray(order.notes) ? order.notes : [];
      }

      return {
        id: order.id,
        order_number: order.order_number,
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
        updated_at: order.updated_at,
        items: orderItems || [],
        notes: notes
      };
    }));

    // If no orders found, provide a sample order for testing
    if (transformedOrders.length === 0) {
      console.log('No orders found in database, adding a sample order for testing');
      transformedOrders.push({
        id: 'sample-order-1',
        order_number: 'ORD-2025-00000',
        client_id: 'sample-client-1',
        client_name: 'Sample Client',
        client_type: 'regular',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: 'cash',
        total_amount: 1000,
        amount_paid: 0,
        balance: 1000,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [
          {
            id: 'sample-item-1',
            order_id: 'sample-order-1',
            item_id: 'sample-item-type-1',
            item_name: 'Sample Item',
            category_id: 'sample-category-1',
            category_name: 'Sample Category',
            quantity: 2,
            unit_price: 500,
            total_amount: 1000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        notes: [
          {
            id: 'sample-note-1',
            text: 'This is a sample note',
            type: 'general',
            created_at: new Date().toISOString(),
            created_by: 'system',
            updated_at: new Date().toISOString()
          }
        ]
      });
    }

    // Create response with proper cache headers
    const response = NextResponse.json({
      orders: transformedOrders,
      totalCount: count || transformedOrders.length,
      pageCount: Math.ceil((count || transformedOrders.length) / limit)
    });

    // Set cache headers
    // Use a much shorter cache time (10 seconds) to ensure fresh data
    // while still providing some caching benefit
    response.headers.set('Cache-Control', 'public, max-age=10, s-maxage=10, stale-while-revalidate=30, must-revalidate');

    // Add ETag for conditional requests
    const etag = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(transformedOrders))
      .digest('hex');
    response.headers.set('ETag', `"${etag}"`);

    return response;
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