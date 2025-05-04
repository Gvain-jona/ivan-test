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
    // Increase default limit to 500 to ensure we get all records for accurate metrics
    const limit = parseInt(searchParams.get('limit') || '500');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create Supabase client
    const supabase = await createClient();

    // Start building the query with optimized select
    // Only select the fields we actually need to reduce data transfer
    // Don't use joins since we've denormalized the data
    let query = supabase
      .from('orders')
      .select(`
        id, order_number, client_id, client_name, client_type, date, status, payment_status,
        total_amount, amount_paid, balance, created_by, delivery_date, is_delivered,
        created_at, updated_at
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
      // Search in order number or client name - more efficient than searching by ID
      query = query.or(`order_number.ilike.%${search}%,clients.name.ilike.%${search}%`);
    }

    // Order by created_at desc for most recent orders first
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query with a timeout
    console.log('Executing Supabase query for orders');
    const { data, error, count } = await query.abortSignal(AbortSignal.timeout(20000)); // 20 second timeout

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    console.log(`Found ${count || 0} orders in database`);

    // Fetch all order items in a single batch query instead of individual queries
    const orderIds = (data || []).map(order => order.id);

    // Only fetch items if we have orders and limit the number of items per order
    let orderItemsMap = {};
    if (orderIds.length > 0) {
      try {
        // Use a separate AbortController for this query
        const itemsController = new AbortController();
        const itemsTimeoutId = setTimeout(() => itemsController.abort(), 10000); // 10 second timeout

        // Only select the fields we need
        const { data: allOrderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('id, order_id, item_id, category_id, quantity, unit_price, total_amount, created_at, updated_at')
          .in('order_id', orderIds)
          .abortSignal(itemsController.signal);

        clearTimeout(itemsTimeoutId);

        if (orderItemsError) {
          console.error('Error fetching order items:', orderItemsError);
        } else {
          // Group items by order_id for faster lookup
          orderItemsMap = (allOrderItems || []).reduce((acc, item) => {
            if (!acc[item.order_id]) {
              acc[item.order_id] = [];
            }
            acc[item.order_id].push(item);
            return acc;
          }, {});
        }
      } catch (itemsError) {
        // If fetching items times out, log the error but continue with the orders
        console.error('Error or timeout fetching order items:', itemsError);
        // Return empty items for all orders
        orderIds.forEach(id => {
          orderItemsMap[id] = [];
        });
      }
    }

    // Transform the data to match the expected format
    const transformedOrders = (data || []).map(order => {
      // Get order items from the map
      const orderItems = orderItemsMap[order.id] || [];

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
    });

    // Return empty array if no orders found - don't generate sample data
    if (transformedOrders.length === 0) {
      console.log('No orders found in database');
    }

    // Create response with proper cache headers
    const response = NextResponse.json({
      orders: transformedOrders,
      totalCount: count || transformedOrders.length,
      pageCount: Math.ceil((count || transformedOrders.length) / limit)
    });

    // Set aggressive cache headers to improve performance
    // Use a longer cache time (60 seconds) with stale-while-revalidate to improve performance
    // while still ensuring data is eventually fresh
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');

    // Add Vary header to ensure proper caching based on query parameters
    response.headers.set('Vary', 'Accept, Accept-Encoding, Cookie');

    // Add ETag for conditional requests
    const crypto = require('crypto');
    const etag = crypto
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
 * Creates a new order with items using the optimized create_complete_order function
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      clientName, // Added client name parameter
      date,
      deliveryDate, // Added delivery date parameter
      isDelivered, // Added is_delivered parameter
      status,
      items,
      payments,
      notes,
      clientType
    } = body;

    // Validate required fields
    if (!clientName || !date || !status || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Generate UUIDs for client_id if not provided
    const finalClientId = clientId || crypto.randomUUID();

    // Call the optimized database function with the updated signature
    const { data, error } = await supabase.rpc('create_complete_order', {
      p_client_id: finalClientId,
      p_client_name: clientName,
      p_date: date,
      p_status: status,
      p_payment_status: 'unpaid', // Default
      p_client_type: clientType || 'regular',
      p_items: items,
      p_payments: payments || [],
      p_notes: notes || [],
      p_delivery_date: deliveryDate || null,
      p_is_delivered: isDelivered || false
    });

    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
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
        { error: error.message || 'Failed to delete order', details: error },
        { status: 500 }
      );
    }

    // Return minimal response to reduce payload size
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
      id // Return the ID so the client can confirm which order was deleted
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/orders:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}