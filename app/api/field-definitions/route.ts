import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { fieldDefinitionCreateSchema, fieldEntitySchema } from '@/lib/api/validators';

const FIELD_COLUMNS =
  'id, entity, field_name, field_label, field_type, is_required, is_unique, options, ' +
  'related_entity, display_field, conditions, field_group, show_in_documents, ' +
  'inherit_from, sort_order, status';

/**
 * GET /api/field-definitions?entity=order — the field registry that
 * drives dynamic form rendering. Frontend reads this BEFORE rendering
 * any custom_data form (handoff rule).
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const entityParam = request.nextUrl.searchParams.get('entity');
    const entity = entityParam ? fieldEntitySchema.safeParse(entityParam) : null;
    if (entity && !entity.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid entity', entity.error.flatten());
    }
    const status = request.nextUrl.searchParams.get('status') ?? 'active';

    let query = tenant.db
      .from('field_definitions')
      .select(FIELD_COLUMNS)
      .eq('organization_id', tenant.organizationId)
      .order('sort_order')
      .order('field_label');

    if (entity?.success) query = query.eq('entity', entity.data);
    if (status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return handleSupabaseError(error);

    return NextResponse.json({ fieldDefinitions: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * POST /api/field-definitions — define a custom field (owner/admin only;
 * field definitions shape every form and validation rule in the org).
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');
    if (tenant.orgRole === 'staff') {
      return handleApiError('FORBIDDEN', 'Only owners and admins can define fields');
    }

    const parsed = fieldDefinitionCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data, error } = await tenant.db
      .from('field_definitions')
      .insert({ ...parsed.data, organization_id: tenant.organizationId })
      .select(FIELD_COLUMNS)
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ fieldDefinition: data }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
