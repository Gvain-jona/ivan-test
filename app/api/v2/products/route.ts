import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { productCreateSchema, listQuerySchema } from '@/lib/api/validators';

const PRODUCT_COLUMNS =
  'id, name, selling_price, status, name_variants, custom_data, created_at, updated_at';

/**
 * GET /api/v2/products — list products for the caller's org.
 * Query: status (default 'active'), search (name ilike), limit, offset.
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const params = request.nextUrl.searchParams;
    const paging = listQuerySchema.parse({
      limit: params.get('limit') ?? undefined,
      offset: params.get('offset') ?? undefined,
    });
    const status = params.get('status') ?? 'active';
    const search = params.get('search');

    let query = tenant.db
      .from('products')
      .select(PRODUCT_COLUMNS, { count: 'exact' })
      .eq('organization_id', tenant.organizationId)
      .order('name')
      .range(paging.offset, paging.offset + paging.limit - 1);

    if (status !== 'all') query = query.eq('status', status);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) return handleSupabaseError(error);

    return NextResponse.json({ products: data, total: count ?? 0 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * POST /api/v2/products — create a product in the caller's org.
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const parsed = productCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data, error } = await tenant.db
      .from('products')
      .insert({
        ...parsed.data,
        organization_id: tenant.organizationId,
        created_by: tenant.userId,
      })
      .select(PRODUCT_COLUMNS)
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
