import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { orderItemUpdateSchema } from '@/lib/api/validators';

const ITEM_COLUMNS =
  'id, order_id, product_id, product_name_raw, quantity, unit_price, discount, ' +
  'total_amount, custom_data, created_at';

const ORDER_MONEY = 'id, total_amount, amount_paid, balance, payment_status';

type Tenant = NonNullable<Awaited<ReturnType<typeof resolveTenant>>>;

/**
 * One line on an order.
 *
 * Both handlers scope by `order_id` **and** `id`, not `id` alone. The org
 * filter that `tenant.db` applies already stops cross-tenant access; pinning
 * the order too stops a line being edited or removed through the wrong order's
 * URL, which would recompute a total the caller never named.
 */
async function requireOwnedOrder(tenant: Tenant, orderId: string) {
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

async function orderMoney(tenant: Tenant, orderId: string) {
  return tenant.db
    .from('orders')
    .select(ORDER_MONEY)
    .eq('id', orderId)
    .eq('organization_id', tenant.organizationId)
    .single();
}

/** PATCH /api/orders/[id]/items/[itemId] — correct a line. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id, itemId } = await params;

    const parsed = orderItemUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const notOwned = await requireOwnedOrder(tenant, id);
    if (notOwned) return notOwned;

    const { data: item, error } = await tenant.db
      .from('order_items')
      .update(parsed.data)
      .eq('id', itemId)
      .eq('order_id', id)
      .select(ITEM_COLUMNS)
      .maybeSingle();
    if (error) return handleSupabaseError(error);
    if (!item) return handleApiError('NOT_FOUND', 'Item not found on this order');

    const { data: order, error: orderError } = await orderMoney(tenant, id);
    if (orderError) return handleSupabaseError(orderError);

    return NextResponse.json({ item, order });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId] — remove a line.
 *
 * A real delete, and the only one in the app. `order_items` has no status to
 * archive into and no identity outside its order (see `DeletableTable` in
 * tenant-db.ts): a line added by mistake is a wrong total until it is gone.
 *
 * `.select()` on the delete is what makes "already gone" a 404 rather than a
 * silent 200 — a delete matching no rows is not an error to PostgREST.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id, itemId } = await params;

    const notOwned = await requireOwnedOrder(tenant, id);
    if (notOwned) return notOwned;

    const { data: deleted, error } = await tenant.db
      .from('order_items')
      .delete()
      .eq('id', itemId)
      .eq('order_id', id)
      .select('id')
      .maybeSingle();
    if (error) return handleSupabaseError(error);
    if (!deleted) return handleApiError('NOT_FOUND', 'Item not found on this order');

    const { data: order, error: orderError } = await orderMoney(tenant, id);
    if (orderError) return handleSupabaseError(orderError);

    return NextResponse.json({ order });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
