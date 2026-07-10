import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { productUpdateSchema } from '@/lib/api/validators';

const PRODUCT_COLUMNS =
  'id, name, selling_price, status, name_variants, custom_data, created_at, updated_at';

/**
 * GET /api/v2/products/[id]
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
      .eq('organization_id', tenant.organizationId)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Product not found');

    return NextResponse.json({ product: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/v2/products/[id] — update; archive via status, no DELETE.
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
      .eq('organization_id', tenant.organizationId)
      .select(PRODUCT_COLUMNS)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Product not found');

    return NextResponse.json({ product: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
