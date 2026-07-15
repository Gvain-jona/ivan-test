import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { orderItemInputSchema } from '@/lib/api/validators';
import type { Json } from '@/types/supabase-v2';

const ITEM_COLUMNS =
  'id, order_id, product_id, product_name_raw, quantity, unit_price, discount, ' +
  'total_amount, custom_data, created_at, updated_at, products(name)';

const ORDER_MONEY_COLUMNS = 'id, total_amount, amount_paid, balance, payment_status';

/**
 * POST /api/orders/[id]/items — add a line to an existing order.
 * Direct insert per the payments-route pattern (single-row write); the
 * DB trigger recomputes the order's total_amount, and balance /
 * payment_status regenerate. Returns the item plus the recomputed
 * order money fields. Line total_amount is app-computed here
 * (qty × price − discount) — it is not a generated column.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const parsed = orderItemInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    // Ownership check before writing: the scoped select proves this
    // order id belongs to the caller's org — without it, a foreign id
    // would attach a line (and retotal) another org's order.
    const { data: order, error: orderError } = await tenant.db
      .from('orders')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (orderError) return handleSupabaseError(orderError);
    if (!order) return handleApiError('NOT_FOUND', 'Order not found');

    const { quantity, unit_price, discount = 0 } = parsed.data;

    const { data: item, error } = await tenant.db
      .from('order_items')
      .insert({
        order_id: id,
        product_id: parsed.data.product_id ?? null,
        product_name_raw: parsed.data.product_name_raw ?? null,
        quantity,
        unit_price,
        discount,
        total_amount: quantity * unit_price - discount,
        custom_data: (parsed.data.custom_data ?? {}) as Json,
      })
      .select(ITEM_COLUMNS)
      .single();
    if (error) return handleSupabaseError(error);

    const { data: updatedOrder, error: refetchError } = await tenant.db
      .from('orders')
      .select(ORDER_MONEY_COLUMNS)
      .eq('id', id)
      .single();
    if (refetchError) return handleSupabaseError(refetchError);

    return NextResponse.json({ item, order: updatedOrder }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
