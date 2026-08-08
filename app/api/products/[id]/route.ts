import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { productUpdateSchema } from '@/lib/api/validators';
import { buildRollup, money, ROLLUP_ROW_CAP } from '@/lib/api/rollup';

const PRODUCT_COLUMNS =
  'id, name, selling_price, status, name_variants, custom_data, created_at, updated_at';

/** The lines this product has appeared on, newest first, with their order. */
const PRODUCT_LINE_COLUMNS =
  'id, quantity, unit_price, total_amount, custom_data, created_at, ' +
  'orders(id, order_number, order_date, clients(name))';

/**
 * GET /api/products/[id] — the product, the lines it has been sold on, and
 * what that adds up to.
 *
 * Lines come from `order_items`, which is the only place a sale of a product
 * is recorded — `products` holds the catalogue entry and nothing about
 * history. `exact` says whether the sums cover every line or stopped at the
 * cap, so the screen shows a real figure or none. See lib/api/rollup.
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
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Product not found');

    const { data: lines, error: linesError, count } = await tenant.db
      .from('order_items')
      .select(PRODUCT_LINE_COLUMNS, { count: 'exact' })
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .range(0, ROLLUP_ROW_CAP - 1);

    if (linesError) return handleSupabaseError(linesError);

    const rows = (lines ?? []) as unknown as {
      quantity: unknown;
      total_amount: unknown;
    }[];

    const rollup = buildRollup(rows, count, all =>
      all.reduce(
        (acc, row) => ({
          units: acc.units + money(row.quantity),
          revenue: acc.revenue + money(row.total_amount),
        }),
        { units: 0, revenue: 0 },
      ),
    );

    return NextResponse.json({ product: data, lines: (lines ?? []).slice(0, 10), rollup });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/products/[id] — update; archive via status, no DELETE.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { id } = await params;

    const parsed = productUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data, error } = await tenant.db
      .from('products')
      .update(parsed.data)
      .eq('id', id)
      .select(PRODUCT_COLUMNS)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Product not found');

    return NextResponse.json({ product: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
