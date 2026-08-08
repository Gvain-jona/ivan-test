import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { clientUpdateSchema } from '@/lib/api/validators';
import { buildRollup, money, ROLLUP_ROW_CAP } from '@/lib/api/rollup';

const CLIENT_COLUMNS = 'id, name, status, custom_data, created_at, updated_at';

/**
 * GET /api/clients/[id] — the client, plus what they've been billed and what
 * they still owe.
 *
 * The money is summed from the client's orders rather than stored: there is no
 * balance column on `clients`, and there shouldn't be — it would be a
 * derived number that drifts. `exact` says whether the sums cover every order
 * or stopped at the cap, so the screen can show a real figure or none at all
 * rather than a quietly wrong one. See lib/api/rollup.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const { data, error } = await tenant.db
      .from('clients')
      .select(CLIENT_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Client not found');

    const { data: orders, error: ordersError, count } = await tenant.db
      .from('orders')
      .select('total_amount, amount_paid, balance', { count: 'exact' })
      .eq('client_id', id)
      .range(0, ROLLUP_ROW_CAP - 1);

    if (ordersError) return handleSupabaseError(ordersError);

    const rollup = buildRollup(
      (orders ?? []) as { total_amount: unknown; amount_paid: unknown; balance: unknown }[],
      count,
      rows =>
        rows.reduce(
          (acc, row) => ({
            billed: acc.billed + money(row.total_amount),
            paid: acc.paid + money(row.amount_paid),
            outstanding: acc.outstanding + money(row.balance),
          }),
          { billed: 0, paid: 0, outstanding: 0 },
        ),
    );

    return NextResponse.json({ client: data, rollup });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/clients/[id] — update name/status/custom_data.
 * Archiving IS the delete path (status: 'archived'); no DELETE handler
 * by design — v2 never hard-deletes business records.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const parsed = clientUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data, error } = await tenant.db
      .from('clients')
      .update(parsed.data)
      .eq('id', id)
      .select(CLIENT_COLUMNS)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Client not found');

    return NextResponse.json({ client: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
