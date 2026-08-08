import { normalizeOptions } from './options';
import type { Json } from '@/types/supabase-v2';

/**
 * Rendering one custom_data value for display.
 *
 * The stored value is not what a person should read. A `select` stores the
 * option's machine value (`roll_up_banner`) while the org named it "Roll-up
 * banner"; a `dimension` stores `{ raw, w, h }`; a `boolean` stores true. Every
 * screen showing custom fields needs the same translation, so it lives here
 * rather than in each of them.
 *
 * Returns null for anything absent or empty, which callers use to drop the row
 * entirely — a field the org defined but this record never filled in should
 * not render as a blank line.
 */

interface FieldLike {
  field_type: string;
  options?: Json | null;
}

export function formatFieldValue(value: unknown, field: FieldLike): string | null {
  if (value === undefined || value === null || value === '') return null;

  switch (field.field_type) {
    case 'select': {
      // Fall back to the raw value: an option removed from the list after a
      // record used it should still show what that record actually holds.
      const match = normalizeOptions(field.options).find(option => option.value === value);
      return match?.label ?? String(value);
    }

    case 'boolean':
      return value === true ? 'Yes' : 'No';

    case 'dimension': {
      if (typeof value !== 'object') return String(value);
      const dimension = value as { raw?: unknown; w?: unknown; h?: unknown };
      if (typeof dimension.raw === 'string' && dimension.raw !== '') return dimension.raw;
      if (dimension.w != null && dimension.h != null) return `${dimension.w} × ${dimension.h}`;
      return null;
    }

    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);

    default:
      return String(value);
  }
}
