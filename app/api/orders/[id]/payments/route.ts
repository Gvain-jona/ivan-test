import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import type { z } from 'zod';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { paymentInputSchema } from '@/lib/api/validators';

type AllocationTarget = { target_type: 'order' | 'document'; target_id: string };

/**
 * SINGLE RECEIVABLE: once an order has a live invoice, the debt is the
 * invoice's, and validate_payment_allocation() refuses an allocation aimed at
 * the order. Resolve the right target up front rather than letting the
 * trigger reject a payment the user has already entered.
 */
async function resolveAllocationTarget(
  tenant: NonNullable<Awaited<ReturnType<typeof resolveTenant>>>,
  orderId: string,
): Promise<AllocationTarget | { error: NonNullable<PostgrestError> }> {
  const { data: liveInvoice, error } = await tenant.db
    .from('documents')
    .select('id')
    .eq('entity_type', 'order')
    .eq('entity_id', orderId)
    .eq('document_type', 'invoice')
    .not('status', 'in', '(draft,void)')
    .maybeSingle();

  if (error) return { error };
  return liveInvoice?.id
    ? { target_type: 'document', target_id: liveInvoice.id }
    : { target_type: 'order', target_id: orderId };
}

/** The v2.record_payment payload: one cash event plus what it settles. */
function buildPaymentPayload(
  input: z.infer<typeof paymentInputSchema>,
  clientId: string | null,
  target: AllocationTarget,
) {
  return {
    direction: 'in',
    // The order's client is the payment's party. Both null together for a
    // walk-in — a check constraint rejects one without the other.
    party_type: clientId ? 'client' : null,
    party_id: clientId,
    amount: input.amount,
    payment_date: input.payment_date ?? new Date().toISOString().slice(0, 10),
    payment_method: input.payment_method ?? 'cash',
    notes: input.notes ?? null,
    allocations: [{ ...target, amount: input.amount }],
  };
}

/**
 * POST /api/orders/[id]/payments — record a payment against an order.
 *
 * Two rows, not one: the 2026-07-29 money rewrite separated the cash event
 * (v2.payments) from what it settles (v2.payment_allocations), and dropped
 * entity_type/entity_id from payments entirely. orders.amount_paid is
 * recomputed by a trigger on the ALLOCATION — a payment with no allocation
 * is unapplied credit and moves no order.
 *
 * Both writes go through v2.record_payment() so they land in one
 * transaction. Doing them as two round trips could leave money recorded but
 * unattached to the order the user was looking at.
 *
 * Returns the payment plus the recomputed money fields so the client can
 * update caches without a refetch (balance / payment_status are generated).
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
    // order totals. client_id comes back too: it's the payment's party.
    const { data: order, error: orderError } = await tenant.db
      .from('orders')
      .select('id, client_id')
      .eq('id', id)
      .maybeSingle();
    if (orderError) return handleSupabaseError(orderError);
    if (!order) return handleApiError('NOT_FOUND', 'Order not found');

    const target = await resolveAllocationTarget(tenant, id);
    if ('error' in target) return handleSupabaseError(target.error);

    const { data: paymentId, error } = await tenant.db.rpc('record_payment_as_org', {
      p_org: tenant.organizationId,
      p_user: tenant.userId,
      payload: buildPaymentPayload(parsed.data, order.client_id ?? null, target),
    });
    if (error) return handleSupabaseError(error);

    const { data: payment, error: paymentError } = await tenant.db
      .from('payments')
      .select('id, amount, payment_date, payment_method, reference, notes, created_at')
      .eq('id', paymentId)
      .single();
    if (paymentError) return handleSupabaseError(paymentError);

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
