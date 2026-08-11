'use client';

import { CustomFieldInput } from './CustomFieldInput';
import { ChoiceChip } from '@/components/patterns/controls';
import { SectionLabel } from '@/components/patterns/screen';
import { normalizeOptions } from '@/lib/fields/options';
import { optionColorClasses } from '@/lib/fields/colors';
import { visibleFields, type CustomDataValue } from '@/lib/fields/visibility';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';

/**
 * An entity's governed custom fields, rendered in the redesign's vocabulary.
 *
 * Sibling to `CustomFieldsForm`, not a replacement for it: that one dresses the
 * same registry in shadcn form controls and still serves the pre-redesign
 * client/product sheets. They share the registry, the option normalizer and the
 * `conditions` interpreter (`lib/fields/visibility`) — only the clothes differ,
 * and they converge when those sheets are redesigned. Don't add a third.
 *
 * What the B2 frame shows as "DUE DATE" and "DELIVERY" are not columns; they
 * are the `due_date` and `delivery_method` starter fields. So this component is
 * what makes the screen match the frame for the shipped starter set *and* stay
 * correct for an org that renamed, removed or added to it.
 */

/** Beyond this many options a chip row stops being scannable. */
const MAX_CHIP_OPTIONS = 8;

const BOX =
  'flex h-10 w-full items-center rounded-lg border border-border bg-background px-3 ' +
  'text-sm font-medium text-foreground outline-none placeholder:font-normal ' +
  'placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring';

interface FieldControlProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

/**
 * The control for one field.
 *
 * Empty resolves to `undefined`, never null or `''` — custom_data omits empty
 * values by convention and the DB rejects JSON nulls in it.
 */
function FieldControl({ field, value, onChange, disabled }: FieldControlProps) {
  const id = `sf-${field.field_name}`;

  switch (field.field_type) {
    case 'select': {
      const options = normalizeOptions(field.options);

      // Past a handful, chips become a wall; a native select is the better
      // mobile affordance anyway — it opens the OS picker.
      if (options.length > MAX_CHIP_OPTIONS) {
        return (
          <select
            id={id}
            className={BOX}
            disabled={disabled}
            value={typeof value === 'string' ? value : ''}
            onChange={event => onChange(event.target.value || undefined)}
          >
            <option value="">{`Choose ${field.field_label.toLowerCase()}`}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      return (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={field.field_label}>
          {options.map(option => (
            <ChoiceChip
              key={option.value}
              label={option.label}
              selected={value === option.value}
              // Tapping the selected chip clears it, which is the only way to
              // unset an optional choice once made.
              onSelect={() => onChange(value === option.value ? undefined : option.value)}
              chipClass={option.color ? optionColorClasses(option.color).chip : undefined}
            />
          ))}
        </div>
      );
    }

    case 'date':
      return (
        <input
          id={id}
          type="date"
          className={BOX}
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={event => onChange(event.target.value || undefined)}
        />
      );

    case 'number':
      return (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className={BOX}
          disabled={disabled}
          value={typeof value === 'number' ? value : ''}
          onChange={event =>
            onChange(event.target.value === '' ? undefined : Number(event.target.value))
          }
        />
      );

    case 'boolean':
      return (
        <div className="flex gap-2" role="radiogroup" aria-label={field.field_label}>
          {[
            { label: 'Yes', on: true },
            { label: 'No', on: false },
          ].map(choice => (
            <ChoiceChip
              key={choice.label}
              label={choice.label}
              selected={value === choice.on}
              onSelect={() => onChange(value === choice.on ? undefined : choice.on)}
            />
          ))}
        </div>
      );

    case 'dimension':
      return <DimensionControl field={field} value={value} onChange={onChange} disabled={disabled} />;

    // The composer can't create a relation field yet (its target can't be set),
    // so an org only has one if it came through the API. Delegated rather than
    // reimplemented — it needs client/product lookups this file has no reason
    // to carry, and a half-built version would be worse than a plain one.
    case 'relation':
      return <CustomFieldInput field={field} value={value} onChange={onChange} disabled={disabled} />;

    case 'text':
    default:
      return (
        <input
          id={id}
          className={BOX}
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={event => onChange(event.target.value || undefined)}
        />
      );
  }
}

interface DimensionValue {
  w?: number;
  h?: number;
  raw: string;
}

/**
 * Width × height, with the free-text form kept in sync.
 *
 * `raw` stays directly editable because plenty of real sizes aren't two
 * numbers — "A4", "2.8 m", "per sqm".
 */
function DimensionControl({ field, value, onChange, disabled }: FieldControlProps) {
  const dim = (value ?? {}) as Partial<DimensionValue>;

  const update = (patch: Partial<DimensionValue>) => {
    const next = { ...dim, ...patch };
    if (('w' in patch || 'h' in patch) && next.w != null && next.h != null) {
      next.raw = `${next.w}x${next.h}`;
    }
    onChange(next.raw || next.w != null || next.h != null ? next : undefined);
  };

  const numeric = (v: string) => (v === '' ? undefined : Number(v));

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        placeholder="W"
        aria-label={`${field.field_label} width`}
        className={`${BOX} w-16`}
        disabled={disabled}
        value={dim.w ?? ''}
        onChange={event => update({ w: numeric(event.target.value) })}
      />
      <span className="text-sm text-muted-foreground">×</span>
      <input
        type="number"
        inputMode="decimal"
        placeholder="H"
        aria-label={`${field.field_label} height`}
        className={`${BOX} w-16`}
        disabled={disabled}
        value={dim.h ?? ''}
        onChange={event => update({ h: numeric(event.target.value) })}
      />
      <input
        placeholder="e.g. 2×4 ft"
        aria-label={`${field.field_label} as written`}
        className={`${BOX} min-w-0 flex-1`}
        disabled={disabled}
        value={dim.raw ?? ''}
        onChange={event => update({ raw: event.target.value })}
      />
    </div>
  );
}

/** Controls narrow enough to sit two-up on a 375px screen. */
function isCompact(field: FieldDefinition): boolean {
  return field.field_type === 'date' || field.field_type === 'number';
}

export interface ScreenFieldsProps {
  /** Definitions for one entity, from `useFieldDefinitions`. */
  fields: FieldDefinition[];
  /** The record's custom_data. */
  value: CustomDataValue;
  /** Called with the FULL next custom_data object (handoff rule). */
  onChange: (next: CustomDataValue) => void;
  /**
   * A core column rendered as the first cell of the same grid — B2 passes its
   * ORDER DATE box here so it pairs with the org's `due_date` field exactly as
   * the frame draws it, instead of sitting in a rhythm of its own.
   */
  leading?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Fields in the org's `sort_order`, compact ones paired two-up.
 *
 * `field_group` is deliberately not rendered as a heading here: the redesign's
 * screens are already sectioned, and a second level of grouping inside one
 * section reads as noise. Grouping still orders the fields.
 */
export function ScreenFields({
  fields,
  value,
  onChange,
  leading,
  disabled,
}: ScreenFieldsProps) {
  const visible = visibleFields(fields, value, { excludeStatus: true });

  const setField = (fieldName: string, fieldValue: unknown) => {
    const next = { ...value };
    if (fieldValue === undefined) {
      delete next[fieldName];
    } else {
      next[fieldName] = fieldValue;
    }
    onChange(next);
  };

  const cells: { key: string; compact: boolean; node: React.ReactNode }[] = [];

  if (leading) cells.push({ key: '_leading', compact: true, node: leading });

  for (const field of visible) {
    cells.push({
      key: field.field_name,
      compact: isCompact(field),
      node: (
        <div className="flex w-full min-w-0 flex-col gap-1.5">
          <SectionLabel>
            {field.field_label.toUpperCase()}
            {field.is_required && <span className="ml-0.5 text-destructive">*</span>}
          </SectionLabel>
          <FieldControl
            field={field}
            value={value[field.field_name]}
            onChange={next => setField(field.field_name, next)}
            disabled={disabled}
          />
        </div>
      ),
    });
  }

  if (cells.length === 0) return null;

  // Consecutive compact cells pair up; anything else takes a full row.
  const rows: (typeof cells)[] = [];
  for (const cell of cells) {
    const last = rows[rows.length - 1];
    if (cell.compact && last && last.length === 1 && last[0].compact) {
      last.push(cell);
    } else {
      rows.push([cell]);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {rows.map(row => (
        <div key={row[0].key} className="flex w-full items-start gap-3">
          {row.map(cell => (
            <div key={cell.key} className="min-w-0 flex-1">
              {cell.node}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
