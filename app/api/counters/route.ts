import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import { counterUpdateSchema } from '@/lib/api/validators';

const COUNTER_COLUMNS = 'counter_key, current_value, format, period_key, reset_policy';

/**
 * GET /api/counters — the org's numbering sequences.
 *
 * One row per key ('order', 'doc:invoice', 'doc:quotation', …). The rows are
 * also the org's list of *legal document types*: validate_document_type()
 * checks for a `doc:{type}` counter, so there is no enum or lookup table
 * anywhere — a type is issuable exactly when its counter exists.
 */
export async function GET() {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await tenant.db
      .from('counters')
      .select(COUNTER_COLUMNS)
      .order('counter_key', { ascending: true });

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ counters: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PATCH /api/counters — numbering config for one counter. Owner only.
 *
 * Keyed by a body field rather than a path segment because counter keys carry
 * a colon (`doc:invoice`); a path would mean encoding it on every call for no
 * gain.
 *
 * Deliberately cannot create a counter. A new `doc:{type}` row is what makes a
 * document type legal for the org, so creating one from a settings PATCH would
 * quietly grant an issuing capability from a screen about number formats. That
 * belongs to its own explicit action.
 *
 * current_value is increase-only: see counterUpdateSchema. The check is
 * read-then-write rather than a DB constraint, which is a benign race under
 * owner-only, low-concurrency editing — and the failure mode of losing that
 * race is a rejected edit, not a duplicated document number, because
 * next_number() takes a row lock of its own.
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');
    if (tenant.orgRole === 'staff') {
      return handleApiError('FORBIDDEN', 'Only owners can change numbering');
    }

    const parsed = counterUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const { counter_key: counterKey, ...patch } = parsed.data;

    const { data: existing, error: readError } = await tenant.db
      .from('counters')
      .select(COUNTER_COLUMNS)
      .eq('counter_key', counterKey)
      .maybeSingle();

    if (readError) return handleSupabaseError(readError);
    if (!existing) return handleApiError('NOT_FOUND', 'Counter not found');

    if (
      patch.current_value !== undefined &&
      patch.current_value < (existing as { current_value: number }).current_value
    ) {
      return handleApiError(
        'VALIDATION_ERROR',
        `Numbering can only move forward — ${counterKey} is already at ` +
          `${(existing as { current_value: number }).current_value}. ` +
          'Lowering it would reissue a number that already exists.',
      );
    }

    const { data, error } = await tenant.db
      .from('counters')
      .update(patch)
      .eq('counter_key', counterKey)
      .select(COUNTER_COLUMNS)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return handleApiError('NOT_FOUND', 'Counter not found');

    return NextResponse.json({ counter: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
