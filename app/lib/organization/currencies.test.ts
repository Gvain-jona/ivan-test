import { describe, expect, it } from 'vitest';
import { ALL_CURRENCIES } from './currencies';
import { CURRENCY_OPTIONS } from './presets';

/**
 * The list is generated (scripts/gen-currencies.js), so these guard the
 * generator's output rather than hand-written data — a regeneration against a
 * newer ICU shouldn't be able to quietly break the picker.
 */
describe('ALL_CURRENCIES', () => {
  it('is a substantial browsable set', () => {
    expect(ALL_CURRENCIES.length).toBeGreaterThan(100);
  });

  it('holds only ISO-4217 shaped codes, with no duplicates', () => {
    for (const c of ALL_CURRENCIES) expect(c.code).toMatch(/^[A-Z]{3}$/);
    const codes = ALL_CURRENCIES.map(c => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('gives every currency a name and a symbol to render', () => {
    for (const c of ALL_CURRENCIES) {
      expect(c.name.trim()).not.toBe('');
      expect(c.symbol.trim()).not.toBe('');
      // ICU emits historical entries as 'Name (1998-2008)'; the generator
      // filters them, and a name carrying a date range means it stopped.
      expect(c.name).not.toMatch(/[()]/);
    }
  });

  it('is sorted by name, because the list is browsed rather than searched only', () => {
    const names = ALL_CURRENCIES.map(c => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });

  it('excludes metals and test codes nobody prices work in', () => {
    const codes = new Set(ALL_CURRENCIES.map(c => c.code));
    for (const excluded of ['XAU', 'XAG', 'XPT', 'XXX', 'XTS', 'XDR']) {
      expect(codes.has(excluded)).toBe(false);
    }
  });

  // The picker shows CURRENCY_OPTIONS as a shortlist above the full list. A
  // shortlist code missing from the full list would be offered up top and then
  // be unfindable by search.
  it('contains every shortlisted currency', () => {
    const codes = new Set(ALL_CURRENCIES.map(c => c.code));
    for (const option of CURRENCY_OPTIONS) {
      expect(codes.has(option.code), `${option.code} missing from ALL_CURRENCIES`).toBe(true);
    }
  });
});
