import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { can } from '@/lib/auth/permissions';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { orderUpdateSchema } from '@/lib/api/validators';

const ORDER_DETAIL_COLUMNS =
  'id, order_number, client_id, order_date, status, total_amount, amount_paid, ' +
  'balance, payment_status, custom_data, created_at, updated_at, ' +
  'clients(id, name), order_items(*)';

/**
 * GET /api/orders/[id] — order (with client + items embedded) and
 * its payments as a sibling key; payments are polymorphic
 * (entity_type/entity_id), so they can't be embedded by PostgREST.
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
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!order) return handleApiError('NOT_FOUND', 'Order not found');

    const { data: payments, error: paymentsError } = await tenant.db
      .from('payments')
      .select('id, amount, payment_date, payment_method, notes, created_at')
      .eq('entity_type', 'order')
      .eq('entity_id', id)
      .order('payment_date', { ascending: false });

    if (paymentsError) return handleSupabaseError(paymentsError);

    return NextResponse.json({ order, payments });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/orders/[id] — status / order_date / client_id /
 * custom_data only. Money fields are trigger-maintained or generated;
 * they are not accepted here by schema design.
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

    // Cancel is v2's "delete" — destructive enough to gate. Workflow
    // status changes stay open to all members (staff run production).
    if (parsed.data.status === 'cancelled' && !can(tenant.orgRole, 'orders:cancel')) {
      return handleApiError('FORBIDDEN', 'You do not have permission to cancel orders');
    }

    const { data, error } = await tenant.db
      .from('orders')
      .update(parsed.data)
      .eq('id', id)
      .select(
        'id, order_number, client_id, order_date, status, total_amount, amount_paid, ' +
          'balance, payment_status, custom_data, updated_at',
      )
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Order not found');

    return NextResponse.json({ order: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
