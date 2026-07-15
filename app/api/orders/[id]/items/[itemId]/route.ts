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
  'total_amount, custom_data, created_at, updated_at, products(name)';

const ORDER_MONEY_COLUMNS = 'id, total_amount, amount_paid, balance, payment_status';

type RouteParams = { params: Promise<{ id: string; itemId: string }> };

/**
 * PATCH /api/orders/[id]/items/[itemId] — edit a line. The route
 * fetches the current row (which is also the org+order ownership
 * check), merges the partial payload, re-checks the product-or-name
 * invariant, and recomputes the line total server-side. The DB trigger
 * then retotals the order; regenerated money fields come back in the
 * response.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id, itemId } = await params;

    const parsed = orderItemUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data: current, error: currentError } = await tenant.db
      .from('order_items')
      .select('id, product_id, product_name_raw, quantity, unit_price, discount')
      .eq('id', itemId)
      .eq('order_id', id)
      .maybeSingle();
    if (currentError) return handleSupabaseError(currentError);
    if (!current) return handleApiError('NOT_FOUND', 'Order item not found');

    const merged = { ...current, ...parsed.data };
    if (merged.product_id == null && merged.product_name_raw == null) {
      return handleApiError(
        'VALIDATION_ERROR',
        'An item needs a product_id or a product_name_raw',
      );
    }

    const { data: item, error } = await tenant.db
      .from('order_items')
      .update({
        ...parsed.data,
        total_amount:
          merged.quantity * merged.unit_price - (merged.discount ?? 0),
      })
      .eq('id', itemId)
      .eq('order_id', id)
      .select(ITEM_COLUMNS)
      .maybeSingle();
    if (error) return handleSupabaseError(error);
    if (!item) return handleApiError('NOT_FOUND', 'Order item not found');

    const { data: updatedOrder, error: refetchError } = await tenant.db
      .from('orders')
      .select(ORDER_MONEY_COLUMNS)
      .eq('id', id)
      .single();
    if (refetchError) return handleSupabaseError(refetchError);

    return NextResponse.json({ item, order: updatedOrder });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId] — remove a line. Line items
 * are order composition (no status column, no archive lifecycle of
 * their own), so this is the one sanctioned hard delete — see
 * HardDeletableTable in app/lib/auth/tenant-db.ts. An order keeps at
 * least one item (creation requires one; an empty order is
 * meaningless), so removing the last line is rejected.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id, itemId } = await params;

    const { data: siblings, error: siblingsError } = await tenant.db
      .from('order_items')
      .select('id')
      .eq('order_id', id);
    if (siblingsError) return handleSupabaseError(siblingsError);

    if (!siblings?.some((row: { id: string }) => row.id === itemId)) {
      return handleApiError('NOT_FOUND', 'Order item not found');
    }
    if (siblings.length <= 1) {
      return handleApiError('VALIDATION_ERROR', 'An order needs at least one item');
    }

    const { error } = await tenant.db
      .from('order_items')
      .delete()
      .eq('id', itemId)
      .eq('order_id', id);
    if (error) return handleSupabaseError(error);

    const { data: updatedOrder, error: refetchError } = await tenant.db
      .from('orders')
      .select(ORDER_MONEY_COLUMNS)
      .eq('id', id)
      .single();
    if (refetchError) return handleSupabaseError(refetchError);

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
