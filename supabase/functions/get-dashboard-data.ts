import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface DashboardData {
  totalOrders: number;
  totalEarnings: number;
  pendingPayments: number;
  recentOrders: any[];
  ordersByStatus: Record<string, number>;
  monthlyRevenue: Record<string, number>;
  upcomingTasks: any[];
  lowStockItems?: any[];
}

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user who called this function
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError) {
      return new Response(JSON.stringify({ error: userError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Get dashboard data

    // 1. Total orders
    const { data: totalOrdersData, error: totalOrdersError } = await supabaseClient
      .from('orders')
      .select('id', { count: 'exact', head: true })

    // 2. Total earnings
    const { data: totalEarningsData, error: totalEarningsError } = await supabaseClient
      .from('orders')
      .select('total_amount')
      .match({ payment_status: 'paid' })

    // 3. Pending payments
    const { data: pendingPaymentsData, error: pendingPaymentsError } = await supabaseClient
      .from('orders')
      .select('balance')
      .or('payment_status.eq.partially_paid,payment_status.eq.unpaid')

    // 4. Recent orders
    const { data: recentOrdersData, error: recentOrdersError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        date,
        total_amount,
        payment_status,
        status,
        clients (
          name
        )
      `)
      .order('date', { ascending: false })
      .limit(5)

    // 5. Orders by status
    const { data: ordersByStatusData, error: ordersByStatusError } = await supabaseClient
      .from('orders')
      .select('status')

    // 6. Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: monthlyRevenueData, error: monthlyRevenueError } = await supabaseClient
      .from('order_payments')
      .select('amount, payment_date')
      .gte('payment_date', sixMonthsAgo.toISOString())
      .order('payment_date')

    // 7. Upcoming tasks
    const { data: upcomingTasksData, error: upcomingTasksError } = await supabaseClient
      .from('tasks')
      .select(`
        id,
        title,
        description,
        due_date,
        priority,
        status,
        users!assigned_to (
          name
        )
      `)
      .match({ status: 'pending' })
      .order('due_date')
      .limit(5)

    // Process the data
    const totalOrders = totalOrdersData?.count || 0;

    const totalEarnings = totalEarningsData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    
    const pendingPayments = pendingPaymentsData?.reduce((sum, order) => sum + (order.balance || 0), 0) || 0;
    
    // Process orders by status
    const ordersByStatus: Record<string, number> = {};
    if (ordersByStatusData) {
      ordersByStatusData.forEach(order => {
        const status = order.status;
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
      });
    }

    // Process monthly revenue
    const monthlyRevenue: Record<string, number> = {};
    if (monthlyRevenueData) {
      monthlyRevenueData.forEach(payment => {
        const month = new Date(payment.payment_date).toLocaleString('default', { month: 'short' });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (payment.amount || 0);
      });
    }

    const dashboardData: DashboardData = {
      totalOrders,
      totalEarnings,
      pendingPayments,
      recentOrders: recentOrdersData || [],
      ordersByStatus,
      monthlyRevenue,
      upcomingTasks: upcomingTasksData || [],
    };

    return new Response(
      JSON.stringify(dashboardData),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      },
    )
  }
}) 