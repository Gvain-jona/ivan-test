import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { searchParams } = new URL(request.url);
    const status = searchParams.getAll('status');
    const paymentStatus = searchParams.getAll('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    let query = supabase
      .from('orders')
      .select('status, payment_status, total_amount, balance, client_id, client_name', {
        count: 'exact',
      });

    if (status.length) query = query.in('status', status);
    if (paymentStatus.length) query = query.in('payment_status', paymentStatus);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,client_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) return handleSupabaseError(error);

    const orders = data ?? [];
    const totalOrders = count ?? 0;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const pendingOrders = orders.filter(o =>
      o.status === 'pending' || o.status === 'in_progress',
    ).length;
    const completedOrders = orders.filter(o =>
      o.status === 'completed' || o.status === 'delivered',
    ).length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    const unpaidOrders = orders.filter(o =>
      o.payment_status === 'unpaid' || o.payment_status === 'partially_paid',
    ).length;
    const unpaidTotal = orders
      .filter(o => o.payment_status === 'unpaid' || o.payment_status === 'partially_paid')
      .reduce((sum, o) => sum + (o.balance || 0), 0);

    const clientDebtMap = new Map<string, { id: string; name: string; debt: number; orderCount: number }>();
    for (const order of orders) {
      if (
        (order.payment_status === 'unpaid' || order.payment_status === 'partially_paid') &&
        order.balance > 0 &&
        order.client_id
      ) {
        const existing = clientDebtMap.get(order.client_id);
        if (existing) {
          existing.debt += order.balance;
          existing.orderCount += 1;
        } else {
          clientDebtMap.set(order.client_id, {
            id: order.client_id,
            name: order.client_name || 'Unknown Client',
            debt: order.balance,
            orderCount: 1,
          });
        }
      }
    }

    const clientsWithDebt = Array.from(clientDebtMap.values()).sort((a, b) => b.debt - a.debt);

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
        clientsWithDebt,
      },
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
