import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { fieldDefinitionUpdateSchema } from '@/lib/api/validators';

const FIELD_COLUMNS =
  'id, entity, field_name, field_label, field_type, is_required, is_unique, options, ' +
  'related_entity, display_field, conditions, field_group, show_in_documents, ' +
  'inherit_from, sort_order, status';

/**
 * PATCH /api/field-definitions/[id] — edit a field definition.
 * field_name and entity are immutable (the machine key is embedded in
 * every record's custom_data); archiving is the delete path
 * (status: 'archived' — definitions are never hard-deleted).
 * Owner/admin only, same as creation.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');
    if (tenant.orgRole === 'staff') {
      return handleApiError('FORBIDDEN', 'Only owners and admins can edit fields');
    }

    const { id } = await params;

    const parsed = fieldDefinitionUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data, error } = await tenant.db
      .from('field_definitions')
      .update(parsed.data)
      .eq('id', id)
      .select(FIELD_COLUMNS)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Field definition not found');

    return NextResponse.json({ fieldDefinition: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
