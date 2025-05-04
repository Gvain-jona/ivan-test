import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleUnexpectedError } from '@/lib/api-error';

/**
 * GET /api/orders/metrics
 * Retrieves metrics calculated from all orders with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters for filtering
    const status = searchParams.getAll('status');
    const paymentStatus = searchParams.getAll('paymentStatus');
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;
    const search = searchParams.get('search') || null;

    // Create Supabase client
    const supabase = await createClient();

    // Start building the query - don't use joins since we've denormalized the data
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    if (paymentStatus && paymentStatus.length > 0) {
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
      query = query.or(`order_number.ilike.%${search}%,client_name.ilike.%${search}%`);
    }

    // Execute the query with a timeout
    console.log('Executing Supabase query for order metrics');
    const { data, error, count } = await query.abortSignal(AbortSignal.timeout(20000)); // 20 second timeout

    if (error) {
      console.error('Error fetching order metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order metrics' },
        { status: 500 }
      );
    }

    // Calculate metrics from the complete dataset
    const totalOrders = count || 0;
    const totalRevenue = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const pendingOrders = data?.filter(order =>
      order.status === 'pending' ||
      order.status === 'in_progress' ||
      order.status === 'draft'
    ).length || 0;

    // Calculate active clients (unique client IDs)
    const activeClientsSet = new Set(data?.map(order => order.client_id) || []);
    const activeClients = activeClientsSet.size;

    // Calculate completed orders
    const completedOrders = data?.filter(order =>
      order.status === 'completed' ||
      order.status === 'delivered'
    ).length || 0;

    // Calculate unpaid orders
    const unpaidOrders = data?.filter(order =>
      order.payment_status === 'unpaid' ||
      order.payment_status === 'partially_paid'
    ).length || 0;

    // Calculate unpaid total
    const unpaidTotal = data?.filter(order =>
      order.payment_status === 'unpaid' ||
      order.payment_status === 'partially_paid'
    ).reduce((sum, order) => sum + (order.balance || 0), 0) || 0;

    // Return the metrics
    return NextResponse.json({
      metrics: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        activeClients,
        completedOrders,
        unpaidOrders,
        unpaidTotal,
        // Add any other metrics needed
      }
    });
  } catch (error) {
    console.error('Error in order metrics API:', error);
    return handleUnexpectedError(error);
  }
}
