import { describe, expect, it } from 'vitest';
import { COMPOSABLE_FIELD_TYPES, FIELD_TYPE_META, fieldTypeMeta } from './field-type-meta';
import { fieldDefinitionCreateSchema } from '@/lib/api/validators';

describe('field type metadata', () => {
  it('covers exactly the types the create schema accepts', () => {
    const schemaTypes = fieldDefinitionCreateSchema.shape.field_type.options as string[];
    expect(FIELD_TYPE_META.map(t => t.value).sort()).toEqual([...schemaTypes].sort());
  });

  it('gives every type a plain-language description', () => {
    for (const type of FIELD_TYPE_META) {
      expect(type.label.trim()).not.toBe('');
      expect(type.description.trim()).not.toBe('');
      // The picker is where a non-technical user chooses; jargon defeats it.
      expect(type.description.toLowerCase()).not.toMatch(
        /string|integer|boolean|enum|foreign key|jsonb|varchar/,
      );
    }
  });

  // A relation with no target renders as "Unsupported relation" in every
  // form, and the composer has nowhere to ask for one — so it must stay out
  // until the field editor can set the target.
  it('excludes relation from what the composer can create', () => {
    expect(COMPOSABLE_FIELD_TYPES.map(t => t.value)).not.toContain('relation');
    expect(COMPOSABLE_FIELD_TYPES).toHaveLength(FIELD_TYPE_META.length - 1);
  });

  it('looks up by value and returns undefined for anything else', () => {
    expect(fieldTypeMeta('select')?.label).toBe('Select');
    expect(fieldTypeMeta('rich_text')).toBeUndefined();
  });
});
