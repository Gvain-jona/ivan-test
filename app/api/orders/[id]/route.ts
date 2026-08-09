import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { orderUpdateSchema } from '@/lib/api/validators';

const ORDER_DETAIL_COLUMNS =
  'id, order_number, client_id, order_date, status, total_amount, amount_paid, ' +
  'balance, payment_status, discount_type, discount_value, custom_data, ' +
  'created_at, updated_at, clients(id, name), order_items(*)';

/** One payment as this order sees it: the cash event, at its allocated amount. */
interface OrderPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

interface AllocationWithPayment {
  amount: number;
  payments: Omit<OrderPayment, 'amount'> | null;
}

/**
 * The payments settling one order.
 *
 * Payments no longer record what they pay for: the 2026-07-29 money rewrite
 * dropped entity_type/entity_id from v2.payments and moved that relationship
 * into v2.payment_allocations. Two consequences this read has to honour:
 *
 * - SINGLE RECEIVABLE. Once the order has a live invoice the debt is the
 *   invoice's, and validate_payment_allocation() refuses an allocation aimed
 *   at the order — so newer payments point at the *document*. Reading only
 *   target_type='order' would report "paid nothing" on every invoiced order.
 *   Voided documents are safe to include: void_document() releases their
 *   allocations, so they simply match none.
 * - One payment can settle several targets, so this order's line is the
 *   ALLOCATED amount, never payments.amount. Using the latter would make the
 *   list sum past orders.amount_paid on any split payment.
 */
async function fetchOrderPayments(
  tenant: NonNullable<Awaited<ReturnType<typeof resolveTenant>>>,
  orderId: string,
): Promise<{ payments: OrderPayment[] } | { error: PostgrestError }> {
  const { data: documents, error: documentsError } = await tenant.db
    .from('documents')
    .select('id')
    .eq('entity_type', 'order')
    .eq('entity_id', orderId);
  if (documentsError) return { error: documentsError };

  const targetIds = [
    orderId,
    ...((documents ?? []) as { id: string }[]).map(document => document.id),
  ];

  const { data, error } = await tenant.db
    .from('payment_allocations')
    .select('amount, payments(id, payment_date, payment_method, reference, notes, created_at)')
    .in('target_type', ['order', 'document'])
    .in('target_id', targetIds);
  if (error) return { error };

  const payments = ((data ?? []) as unknown as AllocationWithPayment[])
    .flatMap(row => (row.payments ? [{ ...row.payments, amount: row.amount }] : []))
    // payment_date is a DATE, so same-day payments tie; created_at breaks it.
    .sort(
      (a, b) =>
        b.payment_date.localeCompare(a.payment_date) ||
        b.created_at.localeCompare(a.created_at),
    );

  return { payments };
}

/**
 * GET /api/orders/[id] — order (with client + items embedded) and the
 * payments settling it as a sibling key. Payments reach an order through
 * payment_allocations rather than a column on payments, so PostgREST can't
 * embed them from here — see fetchOrderPayments.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const { data: order, error } = await tenant.db
      .from('orders')
      .select(ORDER_DETAIL_COLUMNS)
      .eq('id', id)
      .eq('organization_id', tenant.organizationId)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!order) return handleApiError('NOT_FOUND', 'Order not found');

    const result = await fetchOrderPayments(tenant, id);
    if ('error' in result) return handleSupabaseError(result.error);

    return NextResponse.json({ order, payments: result.payments });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/orders/[id] — status / order_date / client_id / custom_data,
 * plus the order discount.
 *
 * total_amount and balance stay unwritable: they are trigger-maintained and
 * generated. discount_type/discount_value are the exception because they are
 * the *input* those triggers compute from — writing them re-derives the total
 * via trg_orders_discount_totals rather than setting it.
 *
 * That makes this the first money-affecting write on the route, which is why
 * both queries in this file now carry the organization_id filter that
 * tenant.db (service-role, RLS bypassed) requires. Scoping by id alone was
 * SEC-05 in AUDIT_PROGRESS.md; it is fixed here for orders because a
 * cross-tenant discount write is a different order of problem from a
 * cross-tenant status write. The other [id] routes still need the same pass.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const parsed = orderUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data, error } = await tenant.db
      .from('orders')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', tenant.organizationId)
      .select(
        'id, order_number, client_id, order_date, status, total_amount, amount_paid, ' +
          'balance, payment_status, discount_type, discount_value, custom_data, updated_at',
      )
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Order not found');

    return NextResponse.json({ order: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
