import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { orderItemCreateSchema } from '@/lib/api/validators';

const ITEM_COLUMNS =
  'id, order_id, product_id, product_name_raw, quantity, unit_price, discount, ' +
  'total_amount, custom_data, created_at';

/** The order's money after a line changed — the trigger has already run. */
const ORDER_MONEY = 'id, total_amount, amount_paid, balance, payment_status';

/**
 * Lines on an order that already exists.
 *
 * Creation goes through `v2.create_order()` with its lines inline; this route
 * is what B4 (the order hub) needs afterwards. No RPC is involved and none is
 * needed: `trg_items_totals` fires AFTER INSERT/UPDATE/DELETE on
 * `v2.order_items` and calls `recompute_order_totals()`, so writing the row is
 * the whole operation and `orders.total_amount` follows. Verified against
 * `pg_trigger` rather than assumed.
 *
 * Every handler proves the order belongs to the caller's org before touching a
 * line. `tenant.db` is service-role, so that scoped select is the tenant
 * boundary — without it a foreign order id would recompute another org's
 * totals, which is SEC-05 with money attached.
 */
async function requireOwnedOrder(
  tenant: NonNullable<Awaited<ReturnType<typeof resolveTenant>>>,
  orderId: string,
) {
  const { data, error } = await tenant.db
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('organization_id', tenant.organizationId)
    .maybeSingle();

  if (error) return handleSupabaseError(error);
  if (!data) return handleApiError('NOT_FOUND', 'Order not found');
  return null;
}

/** The order's recomputed money, so the client needn't refetch to stay honest. */
async function orderMoney(
  tenant: NonNullable<Awaited<ReturnType<typeof resolveTenant>>>,
  orderId: string,
) {
  return tenant.db
    .from('orders')
    .select(ORDER_MONEY)
    .eq('id', orderId)
    .eq('organization_id', tenant.organizationId)
    .single();
}

/** POST /api/orders/[id]/items — add a line. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const parsed = orderItemCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const notOwned = await requireOwnedOrder(tenant, id);
    if (notOwned) return notOwned;

    const { data: item, error } = await tenant.db
      .from('order_items')
      .insert({ ...parsed.data, order_id: id })
      .select(ITEM_COLUMNS)
      .single();
    if (error) return handleSupabaseError(error);

    const { data: order, error: orderError } = await orderMoney(tenant, id);
    if (orderError) return handleSupabaseError(orderError);

    return NextResponse.json({ item, order }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
