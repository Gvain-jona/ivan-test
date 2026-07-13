import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { orderCreateSchema, listQuerySchema } from '@/lib/api/validators';
import type { Json } from '@/types/supabase-v2';

const ORDER_LIST_COLUMNS =
  'id, order_number, client_id, order_date, status, total_amount, amount_paid, ' +
  'balance, payment_status, custom_data, created_at, clients(name)';

/**
 * GET /api/orders — list orders for the caller's org.
 * Query: status, payment_status, client_id, search (order_number ilike),
 * limit, offset. Sorted newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const params = request.nextUrl.searchParams;
    const paging = listQuerySchema.parse({
      limit: params.get('limit') ?? undefined,
      offset: params.get('offset') ?? undefined,
    });

    let query = tenant.db
      .from('orders')
      .select(ORDER_LIST_COLUMNS, { count: 'exact' })
      .order('order_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(paging.offset, paging.offset + paging.limit - 1);

    const status = params.get('status');
    const paymentStatus = params.get('payment_status');
    const clientId = params.get('client_id');
    const search = params.get('search');
    const startDate = params.get('start_date');
    const endDate = params.get('end_date');

    // status / payment_status accept comma-separated lists (multi-select filters)
    if (status) query = query.in('status', status.split(','));
    if (paymentStatus) query = query.in('payment_status', paymentStatus.split(','));
    if (clientId) query = query.eq('client_id', clientId);
    if (search) query = query.ilike('order_number', `%${search}%`);
    if (startDate) query = query.gte('order_date', startDate);
    if (endDate) query = query.lte('order_date', endDate);

    const { data, error, count } = await query;
    if (error) return handleSupabaseError(error);

    return NextResponse.json({ orders: data, total: count ?? 0 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * POST /api/orders — create order + items (+ payments) atomically.
 *
 * Goes through v2.create_order_as_org, the service-role shim that
 * injects org/user context before delegating to v2.create_order
 * (which reads both from JWT claims the service key doesn't carry).
 * When Clerk lands and requests run as RLS-scoped users, this switches
 * to calling create_order directly — same payload, one line.
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const parsed = orderCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data: orderId, error } = await tenant.db.rpc('create_order_as_org', {
      p_org: tenant.organizationId,
      p_user: tenant.userId,
      // Zod-validated request.json() output — JSON by construction.
      payload: parsed.data as unknown as Json,
    });
    if (error) return handleSupabaseError(error);

    const { data: order, error: fetchError } = await tenant.db
      .from('orders')
      .select(`${ORDER_LIST_COLUMNS}, order_items(*)`)
      .eq('id', orderId)
      .single();
    if (fetchError) return handleSupabaseError(fetchError);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
