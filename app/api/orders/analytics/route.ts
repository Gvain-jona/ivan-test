import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleUnexpectedError } from '@/lib/api-error';

/**
 * GET /api/orders/analytics
 * Retrieves analytics calculated from all orders with optional filtering
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
      .select('*, clients:client_id(id, name)', { count: 'exact' });

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
      query = query.or(`order_number.ilike.%${search}%,clients.name.ilike.%${search}%`);
    }

    // Execute the query with a timeout
    console.log('Executing Supabase query for order analytics');
    const { data, error, count } = await query.abortSignal(AbortSignal.timeout(20000)); // 20 second timeout

    if (error) {
      console.error('Error fetching order analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order analytics' },
        { status: 500 }
      );
    }

    // Calculate analytics from the complete dataset
    const totalOrders = count || 0;
    const totalRevenue = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Count orders by status
    const pendingOrders = data?.filter(order =>
      order.status === 'pending' ||
      order.status === 'in_progress' ||
      order.status === 'draft'
    ).length || 0;

    const completedOrders = data?.filter(order =>
      order.status === 'completed' ||
      order.status === 'delivered'
    ).length || 0;

    // Calculate completion rate
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

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

    // Calculate clients with debt
    const clientsWithDebt = [];
    const clientDebtMap = new Map();

    // Process orders to find clients with debt
    data?.forEach(order => {
      if (
        (order.payment_status === 'unpaid' || order.payment_status === 'partially_paid') &&
        order.balance > 0 &&
        order.client_id
      ) {
        const clientId = order.client_id;
        const clientName = order.clients?.name || 'Unknown Client';

        if (!clientDebtMap.has(clientId)) {
          clientDebtMap.set(clientId, {
            id: clientId,
            name: clientName,
            debt: 0,
            orderCount: 0
          });
        }

        const clientData = clientDebtMap.get(clientId);
        clientData.debt += order.balance;
        clientData.orderCount += 1;
        clientDebtMap.set(clientId, clientData);
      }
    });

    // Convert map to array and sort by debt amount (highest first)
    clientDebtMap.forEach(client => {
      clientsWithDebt.push(client);
    });

    clientsWithDebt.sort((a, b) => b.debt - a.debt);

    // Return the analytics
    return NextResponse.json({
      analytics: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        pendingOrders,
        completedOrders,
        completionRate,
        unpaidTotal,
        unpaidOrders,
        clientsWithDebt
      }
    });
  } catch (error) {
    console.error('Error in order analytics API:', error);
    return handleUnexpectedError(error);
  }
}
