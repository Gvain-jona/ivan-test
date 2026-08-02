/**
 * The machine key derived from a field's label. It's the key stored inside
 * every record's custom_data, so it's immutable after creation and must match
 * the DB's rule exactly.
 */

/** Mirrors `field_name` in fieldDefinitionCreateSchema and the v2 column. */
export const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;

/**
 * "Delivery Date!" -> "delivery_date". Returns '' when a label can't produce a
 * usable key (e.g. "123", "!!!"), which callers should treat as "not yet
 * addable" rather than an error to show mid-typing.
 */
/**
 * "Business Cards" -> "business_cards". A select option's stored value.
 *
 * Looser than a field name — it isn't a column key, so it may start with a
 * digit and has no length rule. Unlike slugifyFieldName this never returns ''
 * for a label containing any alphanumeric, since every option must stay
 * selectable.
 */
export function slugifyOptionValue(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function slugifyFieldName(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    // A key must start with a letter, so drop any leading digits.
    .replace(/^[^a-z]+/, '')
    .slice(0, 63);
  return FIELD_NAME_PATTERN.test(slug) ? slug : '';
}
