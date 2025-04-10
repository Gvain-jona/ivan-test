import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OrdersParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  paymentStatus?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface OrdersResponse {
  orders: any[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
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

    // Get query parameters
    const url = new URL(req.url);
    const params: OrdersParams = {
      page: parseInt(url.searchParams.get('page') || '1'),
      pageSize: parseInt(url.searchParams.get('pageSize') || '10'),
      sortBy: url.searchParams.get('sortBy') || 'date',
      sortOrder: (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      status: url.searchParams.get('status') || undefined,
      paymentStatus: url.searchParams.get('paymentStatus') || undefined,
      clientId: url.searchParams.get('clientId') || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      search: url.searchParams.get('search') || undefined,
    };

    // Build the query
    let query = supabaseClient
      .from('orders')
      .select(`
        id,
        date,
        status,
        payment_status,
        total_amount,
        amount_paid,
        balance,
        clients (
          id,
          name
        ),
        users!created_by (
          id,
          name
        ),
        count() OVER() as total_count
      `, { count: 'exact' });

    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.paymentStatus) {
      query = query.eq('payment_status', params.paymentStatus);
    }

    if (params.clientId) {
      query = query.eq('client_id', params.clientId);
    }

    if (params.startDate) {
      query = query.gte('date', params.startDate);
    }

    if (params.endDate) {
      query = query.lte('date', params.endDate);
    }

    if (params.search) {
      query = query.or(`clients.name.ilike.%${params.search}%`);
    }

    // Apply pagination
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;

    // Apply sorting
    query = query.order(params.sortBy, {
      ascending: params.sortOrder === 'asc'
    });

    // Execute the query with range
    const { data: orders, error: ordersError, count } = await query.range(from, to);

    if (ordersError) {
      return new Response(
        JSON.stringify({ error: ordersError.message }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Calculate total pages
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / params.pageSize);

    const response: OrdersResponse = {
      orders: orders || [],
      totalCount,
      totalPages,
      page: params.page,
      pageSize: params.pageSize,
    };

    return new Response(
      JSON.stringify(response),
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