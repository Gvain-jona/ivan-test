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

    // Build the query using the optimizer
    const queryOptimizer = new QueryOptimizer('orders')
      .count()
      .paginate(page, pageSize)
      .sort(sort, order as 'asc' | 'desc')
      .join('clients(id, name)');

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
      // Search in order number, client name, etc.
      // This is handled differently because we need to use OR conditions
      const supabase = createClient();
      const { data, count, error } = await supabase
        .from('orders')
        .select('*, clients:client_id(id, name)', { count: 'exact' })
        .or(`order_number.ilike.%${search}%,clients.name.ilike.%${search}%`)
        .order(sort, { ascending: order === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.error('Error searching orders:', error);
        return NextResponse.json(
          { error: 'Failed to search orders' },
          { status: 500 }
        );
      }

      // Get order IDs for related data
      const orderIds = (data || []).map(order => order.id);

      // Batch fetch related data
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

      // Process the data
      const transformedOrders = processOrdersData(data, itemsResult.data, notesResult.data);

      return NextResponse.json({
        orders: transformedOrders,
        totalCount: count || 0,
        pageCount: Math.ceil((count || 0) / pageSize)
      });
    }

    // Execute the query
    const { data, count, error } = await queryOptimizer.execute();

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Get order IDs for related data
    const orderIds = (data || []).map(order => order.id);

    // Batch fetch related data
    const supabase = createClient();
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

    // Process the data
    const transformedOrders = processOrdersData(data, itemsResult.data, notesResult.data);

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
    items: itemsByOrderId.get(order.id) || [],
    notes: notesByOrderId.get(order.id) || []
  }));
}
