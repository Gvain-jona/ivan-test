import type { Json } from '@/types/supabase-v2';

/**
 * A select field's option, normalized. `value` is stored in custom_data
 * (or the order.status column); `label` is displayed; `color`/`semantic`
 * drive chips and workflow logic. Mirrors the shape the v2
 * validate_custom_data trigger / value_in_options() accept.
 */
export interface FieldOption {
  value: string;
  label: string;
  color?: string;
  is_default?: boolean;
  semantic?: 'open' | 'won' | 'lost';
}

function isSemantic(v: unknown): v is FieldOption['semantic'] {
  return v === 'open' || v === 'won' || v === 'lost';
}

/**
 * Normalize a field_definition's raw `options` jsonb into a consistent
 * FieldOption list. Tolerates every shape the DB accepts so old and new
 * data render identically:
 *   - string array   ["a","b"]                       (legacy)
 *   - object array    [{value,label,color,...}]        (current)
 *   - keyed object    {"a": ...,"b": ...}              (legacy)
 * Malformed object entries (no string `value`) are dropped, not rendered.
 */
export function normalizeOptions(options: Json | null | undefined): FieldOption[] {
  if (options == null) return [];

  if (Array.isArray(options)) {
    return options.flatMap((o): FieldOption[] => {
      if (typeof o === 'string') return [{ value: o, label: o }];
      if (o && typeof o === 'object' && !Array.isArray(o)) {
        const rec = o as Record<string, unknown>;
        if (typeof rec.value !== 'string' || rec.value.length === 0) return [];
        return [
          {
            value: rec.value,
            label: typeof rec.label === 'string' && rec.label.length > 0 ? rec.label : rec.value,
            ...(typeof rec.color === 'string' ? { color: rec.color } : {}),
            ...(rec.is_default === true ? { is_default: true } : {}),
            ...(isSemantic(rec.semantic) ? { semantic: rec.semantic } : {}),
          },
        ];
      }
      return [];
    });
  }

  if (typeof options === 'object') {
    return Object.keys(options as Record<string, unknown>).map(k => ({ value: k, label: k }));
  }

  return [];
}
