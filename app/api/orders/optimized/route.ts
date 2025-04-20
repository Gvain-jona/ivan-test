import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QueryOptimizer } from '@/lib/query-optimizer';

/**
 * GET /api/orders/optimized
 * Optimized endpoint for fetching orders with better performance
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Number of items per page (default: 20)
 * - status: Filter by status (comma-separated list)
 * - paymentStatus: Filter by payment status (comma-separated list)
 * - startDate: Filter by start date (ISO format)
 * - endDate: Filter by end date (ISO format)
 * - search: Search term for order number, client name, etc.
 * - clientId: Filter by client ID
 * - sort: Field to sort by (default: date)
 * - order: Sort order (asc or desc, default: desc)
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status')?.split(',') || [];
    const paymentStatus = searchParams.get('paymentStatus')?.split(',') || [];
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const search = searchParams.get('search') || '';
    const clientId = searchParams.get('clientId') || '';
    const sort = searchParams.get('sort') || 'date';
    const order = searchParams.get('order') || 'desc';

    // Build the query using the optimizer - don't use join to avoid foreign key issues
    const queryOptimizer = new QueryOptimizer('orders')
      .count()
      .paginate(page, pageSize)
      .sort(sort, order as 'asc' | 'desc');
    // We'll use client_name directly from orders table instead of joining

    // Initialize the optimizer
    try {
      await queryOptimizer.init();
    } catch (error) {
      console.error('Failed to initialize query optimizer:', error);
      // Return empty results instead of error to avoid UI issues
      return NextResponse.json({
        orders: [],
        totalCount: 0,
        pageCount: 0
      });
    }

    // Apply filters
    if (status.length > 0) {
      queryOptimizer.filter('status', 'in', status);
    }

    if (paymentStatus.length > 0) {
      queryOptimizer.filter('payment_status', 'in', paymentStatus);
    }

    if (startDate) {
      queryOptimizer.filter('date', '>=', startDate);
    }

    if (endDate) {
      queryOptimizer.filter('date', '<=', endDate);
    }

    if (clientId) {
      queryOptimizer.filter('client_id', '=', clientId);
    }

    if (search) {
      try {
        // Search in order number, client name, etc.
        // This is handled differently because we need to use OR conditions
        const supabase = await createClient();
        if (!supabase) {
          throw new Error('Failed to create Supabase client');
        }

        const { data, count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .or(`order_number.ilike.%${search}%,client_name.ilike.%${search}%`)
          .order(sort, { ascending: order === 'asc' })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) {
          console.error('Error searching orders:', error);
          return NextResponse.json(
            { error: 'Failed to search orders' },
            { status: 500 }
          );
        }

        // If no data, return empty results
        if (!data || data.length === 0) {
          return NextResponse.json({
            orders: [],
            totalCount: 0,
            pageCount: 0
          });
        }

        // Get order IDs for related data
        const orderIds = data.map(order => order.id);

        // Batch fetch related data
        // Only fetch related data if we have order IDs
        let itemsData: any[] = [];
        let notesData: any[] = [];

        if (orderIds.length > 0) {
          try {
            const [itemsResult, notesResult] = await Promise.all([
              supabase
                .from('order_items')
                .select('*')
                .in('order_id', orderIds),
              supabase
                .from('notes')
                .select('*')
                .eq('linked_item_type', 'order')
                .in('linked_item_id', orderIds)
            ]);

            itemsData = itemsResult.data || [];
            notesData = notesResult.data || [];
          } catch (relatedError) {
            console.error('Error fetching related data for search:', relatedError);
            // Continue with empty arrays for related data
          }
        }

        // Process the data
        const transformedOrders = processOrdersData(data, itemsData, notesData);

        return NextResponse.json({
          orders: transformedOrders,
          totalCount: count || 0,
          pageCount: Math.ceil((count || 0) / pageSize)
        });
      } catch (searchError) {
        console.error('Error in search functionality:', searchError);
        return NextResponse.json(
          { error: 'An error occurred while searching orders' },
          { status: 500 }
        );
      }
    }

    // Execute the query
    let data, count, error;
    try {
      const result = await queryOptimizer.execute();
      data = result.data;
      count = result.count;
      error = result.error;

      if (error) {
        console.error('Error fetching orders:', error);
        // Return empty results instead of error to avoid UI issues
        return NextResponse.json({
          orders: [],
          totalCount: 0,
          pageCount: 0
        });
      }

      // Check if data is empty or null
      if (!data || data.length === 0) {
        // Return empty results
        return NextResponse.json({
          orders: [],
          totalCount: 0,
          pageCount: 0
        });
      }
    } catch (queryError) {
      console.error('Error executing query:', queryError);
      // Return empty results instead of error to avoid UI issues
      return NextResponse.json({
        orders: [],
        totalCount: 0,
        pageCount: 0
      });
    }

    // Get order IDs for related data
    const orderIds = (data || []).map(order => order.id);

    // Batch fetch related data
    let itemsData: any[] = [];
    let notesData: any[] = [];

    // Only fetch related data if we have order IDs
    if (orderIds.length > 0) {
      try {
        const supabase = await createClient();
        if (!supabase) {
          throw new Error('Failed to create Supabase client');
        }

        const [itemsResult, notesResult] = await Promise.all([
          supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds),
          supabase
            .from('notes')
            .select('*')
            .eq('linked_item_type', 'order')
            .in('linked_item_id', orderIds)
        ]);

        itemsData = itemsResult.data || [];
        notesData = notesResult.data || [];
      } catch (error) {
        console.error('Error fetching related data:', error);
        // Continue with empty arrays for related data
      }
    }

    // Process the data
    const transformedOrders = processOrdersData(data || [], itemsData, notesData);

    return NextResponse.json({
      orders: transformedOrders,
      totalCount: count || 0,
      pageCount: Math.ceil((count || 0) / pageSize)
    });
  } catch (error) {
    console.error('Unexpected error in optimized orders API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Process orders data with related items and notes
 */
function processOrdersData(orders: any[], items: any[] = [], notes: any[] = []) {
  // Group items and notes by order_id for quick lookup
  const itemsByOrderId = new Map();
  items.forEach(item => {
    if (!itemsByOrderId.has(item.order_id)) {
      itemsByOrderId.set(item.order_id, []);
    }
    itemsByOrderId.get(item.order_id).push(item);
  });

  const notesByOrderId = new Map();
  notes.forEach(note => {
    if (!notesByOrderId.has(note.linked_item_id)) {
      notesByOrderId.set(note.linked_item_id, []);
    }
    notesByOrderId.get(note.linked_item_id).push(note);
  });

  // Map the orders with their related data
  return (orders || []).map(order => ({
    id: order.id,
    order_number: order.order_number,
    client_id: order.client_id,
    // Use the client_name directly from the order
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
    created_by: order.created_by,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: itemsByOrderId.get(order.id) || [],
    notes: notesByOrderId.get(order.id) || []
  }));
}
