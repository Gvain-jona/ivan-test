import { describe, expect, it } from 'vitest';
import {
  CURRENCY_OPTIONS,
  ORDER_STATUS_WORKFLOW,
  STARTER_FIELDS,
  type StarterField,
} from './presets';

// Guards the static preset data against typos that would only surface as a
// DB error at apply-time (field_name regex, empty select options, bad value
// slugs). These mirror the v2 constraints in field_definitions.

const FIELD_NAME_RE = /^[a-z][a-z0-9_]{0,62}$/; // matches the v2 CHECK
const allFields: StarterField[] = Object.values(STARTER_FIELDS).flat();

describe('starter field presets', () => {
  it('every field_name satisfies the v2 machine-key constraint', () => {
    for (const f of allFields) expect(f.field_name).toMatch(FIELD_NAME_RE);
  });

  it('field_names are unique within each entity', () => {
    for (const fields of Object.values(STARTER_FIELDS)) {
      const names = fields.map(f => f.field_name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('every select field carries non-empty options with slug-safe values', () => {
    const selects = allFields.filter(f => f.field_type === 'select');
    expect(selects.length).toBeGreaterThan(0);
    for (const f of selects) {
      expect(f.options && f.options.length).toBeTruthy();
      for (const opt of f.options ?? []) {
        expect(opt.value).toMatch(/^[a-z0-9_]+$/);
        expect(opt.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('non-select fields carry no options', () => {
    for (const f of allFields.filter(f => f.field_type !== 'select')) {
      expect(f.options).toBeUndefined();
    }
  });
});

describe('order status workflow', () => {
  it('is the order status field, marked is_system', () => {
    const status = STARTER_FIELDS.order.find(f => f.field_name === 'status');
    expect(status?.is_system).toBe(true);
    expect(status?.options).toBe(ORDER_STATUS_WORKFLOW);
  });

  it('has exactly one default and every stage classified by semantic', () => {
    expect(ORDER_STATUS_WORKFLOW.filter(o => o.is_default)).toHaveLength(1);
    for (const o of ORDER_STATUS_WORKFLOW) {
      expect(['open', 'won', 'lost']).toContain(o.semantic);
    }
  });
});

describe('currency options', () => {
  it('are all valid ISO-4217 shaped codes', () => {
    expect(CURRENCY_OPTIONS.length).toBeGreaterThan(0);
    for (const c of CURRENCY_OPTIONS) expect(c.code).toMatch(/^[A-Z]{3}$/);
  });

  // The picker renders "CODE · Name", so the name must be the name alone —
  // the symbol is a separate field, not baked into the label.
  it('carry a bare name and a separate symbol', () => {
    for (const c of CURRENCY_OPTIONS) {
      expect(c.label.trim()).not.toBe('');
      expect(c.label).not.toMatch(/[()]/);
      expect(c.symbol.trim()).not.toBe('');
    }
  });

  it('have no duplicate codes', () => {
    const codes = CURRENCY_OPTIONS.map(c => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
