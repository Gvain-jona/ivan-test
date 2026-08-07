import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { noteCreateSchema } from '@/lib/api/validators';

const NOTE_COLUMNS =
  'id, entity_type, entity_id, content, custom_data, created_by, created_at, updated_at';

/**
 * GET /api/notes?entity_type=order&entity_id=<uuid> — notes for one
 * record via the polymorphic notes engine.
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const entityType = request.nextUrl.searchParams.get('entity_type');
    const entityId = request.nextUrl.searchParams.get('entity_id');
    if (!entityType || !entityId) {
      return handleApiError('VALIDATION_ERROR', 'entity_type and entity_id are required');
    }

    const { data, error } = await tenant.db
      .from('notes')
      .select(NOTE_COLUMNS)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ notes: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * POST /api/notes — attach a note to any record in the caller's org.
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const parsed = noteCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { data, error } = await tenant.db
      .from('notes')
      .insert({
        ...parsed.data,
        created_by: tenant.userId,
      })
      .select(NOTE_COLUMNS)
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ note: data }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
