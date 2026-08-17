import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { orderCreateSchema, listQuerySchema } from '@/lib/api/validators';
import { notify } from '@/lib/notifications/notify';
import type { Json } from '@/types/supabase-v2';

const ORDER_LIST_COLUMNS =
  'id, order_number, client_id, order_date, status, total_amount, amount_paid, ' +
  'balance, payment_status, custom_data, created_at, clients(name)';

/**
 * The org's order date field, if it has one.
 *
 * "Due soon" is a filter on a **custom field**, not a column — `due_date` is a
 * starter field, and an org may have renamed it, removed it, or never added
 * one. The field name is resolved here rather than accepted from the caller:
 * it lands in a jsonb path inside a PostgREST filter, and a client-supplied
 * column reference is not something to pass through on trust.
 *
 * Returns null when the org tracks no date on orders, in which case no due
 * filter is applied — the list UI only offers the chip when one exists.
 */
async function resolveDueField(
  tenant: NonNullable<Awaited<ReturnType<typeof resolveTenant>>>,
): Promise<string | null> {
  const { data } = await tenant.db
    .from('field_definitions')
    .select('field_name')
    .eq('organization_id', tenant.organizationId)
    .eq('entity', 'order')
    .eq('field_type', 'date')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as { field_name: string } | null)?.field_name ?? null;
}

/**
 * Orders whose client name matches, as ids.
 *
 * The frame's search box says "client or order number", and both halves have
 * to be one query so paging stays correct. PostgREST can't `or` across an
 * embedded relation, so the client ids are resolved first and folded into a
 * single `or` over two real columns on `orders`.
 */
async function clientIdsMatching(
  tenant: NonNullable<Awaited<ReturnType<typeof resolveTenant>>>,
  search: string,
): Promise<string[]> {
  const { data } = await tenant.db
    .from('clients')
    .select('id')
    .eq('organization_id', tenant.organizationId)
    .ilike('name', `%${search}%`)
    .limit(50);

  return ((data ?? []) as { id: string }[]).map(row => row.id);
}

/**
 * GET /api/orders — list orders for the caller's org.
 *
 * Query: status, payment_status, client_id, search (order number or client
 * name), start_date, end_date, due_within_days, limit, offset. Newest first.
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
    if (startDate) query = query.gte('order_date', startDate);
    if (endDate) query = query.lte('order_date', endDate);

    if (search) {
      // Escape the PostgREST `or` separators before they reach the filter
      // string: a comma or a paren in the search box would otherwise be read
      // as syntax and silently change which orders come back.
      const safe = search.replace(/[(),]/g, ' ');
      const ids = await clientIdsMatching(tenant, safe);
      query = query.or(
        ids.length > 0
          ? `order_number.ilike.%${safe}%,client_id.in.(${ids.join(',')})`
          : `order_number.ilike.%${safe}%`,
      );
    }

    const dueWithinDays = Number(params.get('due_within_days'));
    if (Number.isFinite(dueWithinDays) && dueWithinDays > 0) {
      const dueField = await resolveDueField(tenant);
      if (dueField) {
        // Between today and N days out. `custom_data->>field` compares as text,
        // which is exactly right for ISO dates and wrong for nothing else.
        const today = new Date();
        const until = new Date(today);
        until.setDate(until.getDate() + dueWithinDays);
        const iso = (d: Date) => d.toISOString().slice(0, 10);
        query = query
          .gte(`custom_data->>${dueField}`, iso(today))
          .lte(`custom_data->>${dueField}`, iso(until));
      }
    }

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

    // Emit the activity (app-layer, §7). Non-fatal: a notification is a side
    // effect of the order, never a reason to fail creating it.
    const created = order as { order_number?: string; clients?: { name?: string } | null };
    const { error: notifyError } = await notify(tenant.db, {
      verb: 'order.created',
      category: 'order_activity',
      actorUserId: tenant.userId,
      object: { type: 'order', id: String(orderId) },
      data: {
        order_number: created?.order_number ?? null,
        client_name: created?.clients?.name ?? null,
      },
      groupKey: `order:${String(orderId)}`,
      audience: { scope: 'org' },
    });
    if (notifyError) console.error('notify order.created failed:', notifyError.message);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
