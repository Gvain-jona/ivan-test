import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OPTION_COLOR,
  FIELD_TYPE_TAG_CLASSES,
  NEUTRAL_TAG_CLASSES,
  OPTION_COLORS,
  OPTION_COLOR_NAMES,
  SEMANTIC_COLORS,
  fieldTypeTagClasses,
  isOptionColor,
  optionColorClasses,
  optionColorName,
} from './colors';
import { fieldDefinitionCreateSchema } from '@/lib/api/validators';
import { ORDER_STATUS_WORKFLOW, STARTER_FIELDS } from '@/lib/organization/presets';

describe('option colour palette', () => {
  // The chip label must use the -fg role and the dot the vivid one; swapping
  // them silently drops chip text below AA (the vivid values sit at ~3-4:1).
  it('has classes for every palette name, in the right roles', () => {
    for (const name of OPTION_COLOR_NAMES) {
      expect(OPTION_COLORS[name].chip).toBe(`bg-opt-${name}-bg text-opt-${name}-fg`);
      expect(OPTION_COLORS[name].dot).toBe(`bg-opt-${name}`);
    }
  });

  it('resolves unknown, empty and missing colours to the default', () => {
    for (const input of ['fuchsia', '', null, undefined]) {
      expect(optionColorName(input)).toBe(DEFAULT_OPTION_COLOR);
      expect(optionColorClasses(input)).toBe(OPTION_COLORS[DEFAULT_OPTION_COLOR]);
    }
  });

  it('passes recognised colours through', () => {
    expect(optionColorName('violet')).toBe('violet');
    expect(isOptionColor('violet')).toBe(true);
    expect(isOptionColor('Violet')).toBe(false);
  });

  // The palette exists to render the shipped presets; a preset colour with no
  // palette entry would silently fall back to slate and lose the distinction.
  it('covers every colour used by the starter presets', () => {
    const used = new Set<string>();
    for (const option of ORDER_STATUS_WORKFLOW) if (option.color) used.add(option.color);
    for (const fields of Object.values(STARTER_FIELDS)) {
      for (const field of fields) {
        for (const option of field.options ?? []) if (option.color) used.add(option.color);
      }
    }
    expect(used.size).toBeGreaterThan(0);
    for (const color of used) expect(isOptionColor(color)).toBe(true);
  });

  it('maps every semantic to a palette colour', () => {
    for (const color of Object.values(SEMANTIC_COLORS)) {
      expect(isOptionColor(color)).toBe(true);
    }
  });
});

describe('field type tags', () => {
  // colors.ts declares its own FieldTypeName union to stay off the API layer;
  // this is what stops the two drifting when a new field type is added.
  it('covers exactly the field types the create schema accepts', () => {
    const schemaTypes = fieldDefinitionCreateSchema.shape.field_type.options as string[];
    expect(Object.keys(FIELD_TYPE_TAG_CLASSES).sort()).toEqual([...schemaTypes].sort());
  });

  it('tints only the structured types', () => {
    expect(FIELD_TYPE_TAG_CLASSES.select).toBe(OPTION_COLORS.violet.chip);
    expect(FIELD_TYPE_TAG_CLASSES.relation).toBe(OPTION_COLORS.blue.chip);
    expect(FIELD_TYPE_TAG_CLASSES.dimension).toBe(OPTION_COLORS.teal.chip);
    expect(FIELD_TYPE_TAG_CLASSES.text).toBe(NEUTRAL_TAG_CLASSES);
    expect(FIELD_TYPE_TAG_CLASSES.number).toBe(NEUTRAL_TAG_CLASSES);
    expect(FIELD_TYPE_TAG_CLASSES.date).toBe(NEUTRAL_TAG_CLASSES);
    expect(FIELD_TYPE_TAG_CLASSES.boolean).toBe(NEUTRAL_TAG_CLASSES);
  });

  it('falls back to neutral for an unrecognised type', () => {
    expect(fieldTypeTagClasses('rich_text')).toBe(NEUTRAL_TAG_CLASSES);
  });
});
