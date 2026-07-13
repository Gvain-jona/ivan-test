import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { paymentInputSchema } from '@/lib/api/validators';

/**
 * POST /api/orders/[id]/payments — record a payment against an order.
 * Direct insert per the handoff (single-row write); the DB trigger
 * recomputes the order's amount_paid, and balance / payment_status are
 * generated columns. Returns the payment plus the recomputed money
 * fields so the client can update caches without a refetch.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const parsed = paymentInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    // Ownership check before writing: the scoped select proves this
    // order id belongs to the caller's org — without it, a foreign id
    // would create a payment whose trigger recomputes another org's
    // order totals.
    const { data: order, error: orderError } = await tenant.db
      .from('orders')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (orderError) return handleSupabaseError(orderError);
    if (!order) return handleApiError('NOT_FOUND', 'Order not found');

    const { data: payment, error } = await tenant.db
      .from('payments')
      .insert({
        entity_type: 'order',
        entity_id: id,
        amount: parsed.data.amount,
        payment_date: parsed.data.payment_date ?? new Date().toISOString().slice(0, 10),
        payment_method: parsed.data.payment_method ?? 'cash',
        notes: parsed.data.notes ?? null,
        created_by: tenant.userId,
      })
      .select('id, amount, payment_date, payment_method, notes, created_at')
      .single();
    if (error) return handleSupabaseError(error);

    const { data: updatedOrder, error: refetchError } = await tenant.db
      .from('orders')
      .select('id, total_amount, amount_paid, balance, payment_status')
      .eq('id', id)
      .single();
    if (refetchError) return handleSupabaseError(refetchError);

    return NextResponse.json({ payment, order: updatedOrder }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
