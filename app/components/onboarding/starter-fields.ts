import type { StarterEntity, StarterField } from '@/lib/organization/presets';

/**
 * Turn a starter field's `conditions` into the plain-language qualifier the
 * design shows next to it ("shows only for Contract clients"), resolving the
 * stored option value back to the human label it was slugged from.
 *
 * Returns undefined for anything it can't phrase, so an unrecognised condition
 * shape silently shows no note rather than leaking JSON at the user.
 */
export function conditionNote(
  field: StarterField,
  siblings: readonly StarterField[],
  entity: StarterEntity,
): string | undefined {
  const condition = field.conditions as { field?: string; equals?: unknown } | undefined;
  if (!condition?.field || condition.equals === undefined) return undefined;
  const target = siblings.find(s => s.field_name === condition.field);
  const label =
    target?.options?.find(o => o.value === condition.equals)?.label ?? String(condition.equals);
  return `shows only for ${label} ${entity}s`;
}
