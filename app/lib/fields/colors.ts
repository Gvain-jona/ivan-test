/**
 * The named colour palette a field option / status stage can carry, and the
 * field-type tag colours, as theme-token class strings.
 *
 * `FieldOption.color` is a free string in the DB (see ./options), so the app
 * needs one place that decides which names are real and what each one looks
 * like. This is that place — the status workflow editor's swatch picker, the
 * option chips, the status badges and the field type tags all read from here.
 *
 * Class strings are literal so Tailwind can see them; the underlying values
 * are CSS variables defined for both themes in app/globals.css. Never compose
 * an `opt-*` class name at a call site — the JIT can't find it and it will be
 * purged from the build.
 */

/** Palette order — also the order the swatch picker offers. */
export const OPTION_COLOR_NAMES = [
  'slate',
  'amber',
  'blue',
  'violet',
  'teal',
  'green',
  'red',
] as const;

export type OptionColorName = (typeof OPTION_COLOR_NAMES)[number];

/** Applied when an option has no colour, or one we don't recognise. */
export const DEFAULT_OPTION_COLOR: OptionColorName = 'slate';

export interface OptionColorClasses {
  /** Chip/tag background + label colour. Label uses the -fg role (AA on -bg). */
  chip: string;
  /** Solid fill for the stage dot / swatch — the vivid role, not the text one. */
  dot: string;
}

export const OPTION_COLORS: Record<OptionColorName, OptionColorClasses> = {
  slate: { chip: 'bg-opt-slate-bg text-opt-slate-fg', dot: 'bg-opt-slate' },
  amber: { chip: 'bg-opt-amber-bg text-opt-amber-fg', dot: 'bg-opt-amber' },
  blue: { chip: 'bg-opt-blue-bg text-opt-blue-fg', dot: 'bg-opt-blue' },
  violet: { chip: 'bg-opt-violet-bg text-opt-violet-fg', dot: 'bg-opt-violet' },
  teal: { chip: 'bg-opt-teal-bg text-opt-teal-fg', dot: 'bg-opt-teal' },
  green: { chip: 'bg-opt-green-bg text-opt-green-fg', dot: 'bg-opt-green' },
  red: { chip: 'bg-opt-red-bg text-opt-red-fg', dot: 'bg-opt-red' },
};

export function isOptionColor(value: unknown): value is OptionColorName {
  return (
    typeof value === 'string' && (OPTION_COLOR_NAMES as readonly string[]).includes(value)
  );
}

/** Resolve a raw `FieldOption.color` to a palette name, never throwing. */
export function optionColorName(color?: string | null): OptionColorName {
  return isOptionColor(color) ? color : DEFAULT_OPTION_COLOR;
}

/** Resolve a raw `FieldOption.color` straight to its classes. */
export function optionColorClasses(color?: string | null): OptionColorClasses {
  return OPTION_COLORS[optionColorName(color)];
}

/**
 * An option's `semantic` classifies what a stage MEANS to workflow logic
 * (open / won / lost) independently of its name or colour. These are the
 * colours for the semantic tag itself, not for the stage.
 */
export const SEMANTIC_COLORS: Record<'open' | 'won' | 'lost', OptionColorName> = {
  open: 'slate',
  won: 'green',
  lost: 'red',
};

/**
 * Field types, mirroring the enum in `fieldDefinitionCreateSchema`
 * (app/lib/api/validators.ts) — that schema is the source of truth; the
 * colocated test fails if the two drift.
 */
export type FieldTypeName =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'relation'
  | 'dimension';

/** Untinted tag, for the types that carry no structure worth signalling. */
export const NEUTRAL_TAG_CLASSES = 'bg-muted text-muted-foreground';

/**
 * Type tag colour per field type. Only the structured types are tinted —
 * colour here means "this field has shape beyond a scalar", so text/number/
 * date/boolean stay neutral and the eye goes to the ones that don't.
 */
export const FIELD_TYPE_TAG_CLASSES: Record<FieldTypeName, string> = {
  text: NEUTRAL_TAG_CLASSES,
  number: NEUTRAL_TAG_CLASSES,
  date: NEUTRAL_TAG_CLASSES,
  boolean: NEUTRAL_TAG_CLASSES,
  select: OPTION_COLORS.violet.chip,
  relation: OPTION_COLORS.blue.chip,
  dimension: OPTION_COLORS.teal.chip,
};

/** Tag classes for a raw `field_type` string, neutral if unrecognised. */
export function fieldTypeTagClasses(fieldType: string): string {
  return FIELD_TYPE_TAG_CLASSES[fieldType as FieldTypeName] ?? NEUTRAL_TAG_CLASSES;
}
