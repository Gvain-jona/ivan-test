import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';
import { CreateOrderSchema, UpdateOrderSchema } from '@/lib/orders/validators';

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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('orders')
      .select(
        `id, order_number, client_id, client_name, client_type, date, status, payment_status,
         total_amount, amount_paid, balance, created_by, delivery_date, is_delivered,
         created_at, updated_at`,
        { count: 'exact' },
      );

    if (status.length) query = query.in('status', status);
    if (paymentStatus.length) query = query.in('payment_status', paymentStatus);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,client_name.ilike.%${search}%`,
      );
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return handleSupabaseError(error);

    const orderIds = (data ?? []).map(o => o.id);
    let itemsMap: Record<string, unknown[]> = {};

    if (orderIds.length) {
      const { data: allItems, error: itemsError } = await supabase
        .from('order_items')
        .select(
          'id, order_id, item_id, category_id, item_name, category_name, size, quantity, unit_price, total_amount, created_at, updated_at',
        )
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('GET /api/orders: failed to fetch order items', itemsError);
      } else {
        itemsMap = (allItems ?? []).reduce<Record<string, unknown[]>>((acc, item) => {
          const key = item.order_id ?? '';
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {});
      }
    }

    const orders = (data ?? []).map(order => ({
      ...order,
      client_name: order.client_name || 'Unknown Client',
      client_type: order.client_type || 'regular',
      total_amount: order.total_amount || 0,
      amount_paid: order.amount_paid || 0,
      balance: order.balance || 0,
      items: itemsMap[order.id] ?? [],
    }));

    const totalCount = count ?? orders.length;

    return NextResponse.json({
      orders,
      totalCount,
      pageCount: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
    }

    const { clientId, clientName, date, deliveryDate, isDelivered, status, clientType, items, payments, notes } =
      parsed.data;

    const { data, error } = await supabase.rpc('create_complete_order', {
      p_client_id: clientId ?? crypto.randomUUID(),
      p_client_name: clientName,
      p_date: date,
      p_status: status,
      p_payment_status: 'unpaid',
      p_client_type: clientType,
      p_items: items,
      p_payments: payments,
      p_notes: notes,
      p_delivery_date: deliveryDate ?? undefined,
      p_is_delivered: isDelivered,
    });

    if (error) return handleSupabaseError(error);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const body = await request.json();
    const parsed = UpdateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
    }
    const { id, clientId, date, status, items } = parsed.data;

    const { error } = await supabase.rpc('update_order', {
      p_order_id: id,
      p_date: date,
      p_status: status,
      p_items: items,
    } as never);

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return handleApiError('FORBIDDEN', 'Only admins and managers can delete orders');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return handleApiError('VALIDATION_ERROR', 'Order ID is required');
    }

    const { error } = await supabase.rpc('delete_order', { p_order_id: id });
    if (error) return handleSupabaseError(error);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
