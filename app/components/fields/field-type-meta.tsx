import { Calendar, Hash, Link2, List, Ruler, ToggleLeft, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FieldTypeName } from '@/lib/fields/colors';

export interface FieldTypeMeta {
  value: FieldTypeName;
  label: string;
  /**
   * What the type is for, in the words someone running a print shop would
   * use. Never "string", "enum" or "foreign key" — the picker is where a
   * non-technical user decides what kind of thing they're tracking.
   */
  description: string;
  Icon: LucideIcon;
}

export const FIELD_TYPE_META: readonly FieldTypeMeta[] = [
  { value: 'text', label: 'Text', description: 'Any words or numbers', Icon: Type },
  { value: 'number', label: 'Number', description: 'Amounts you can add up', Icon: Hash },
  { value: 'date', label: 'Date', description: 'A day on the calendar', Icon: Calendar },
  {
    value: 'boolean',
    label: 'Yes / No',
    description: 'A simple on-or-off switch',
    Icon: ToggleLeft,
  },
  {
    value: 'select',
    label: 'Select',
    description: 'Choice from a list you define',
    Icon: List,
  },
  {
    value: 'relation',
    label: 'Relation',
    description: 'Points at another record',
    Icon: Link2,
  },
  {
    value: 'dimension',
    label: 'Dimension',
    description: 'Width × height with units',
    Icon: Ruler,
  },
] as const;

/**
 * The types the inline composer offers.
 *
 * `relation` is deliberately absent: it needs a target entity and display
 * field, which the composer has nowhere to ask for, and a relation without a
 * target renders as "Unsupported relation" in every form. It returns when the
 * field editor can set the target. A `select` with no options, by contrast, is
 * a designed state — it warns rather than blocking.
 */
export const COMPOSABLE_FIELD_TYPES: readonly FieldTypeMeta[] = FIELD_TYPE_META.filter(
  type => type.value !== 'relation',
);

export function fieldTypeMeta(value: string): FieldTypeMeta | undefined {
  return FIELD_TYPE_META.find(type => type.value === value);
}
