import { describe, expect, it } from 'vitest';
import { normalizeOptions } from './options';

describe('normalizeOptions', () => {
  it('returns [] for null/undefined', () => {
    expect(normalizeOptions(null)).toEqual([]);
    expect(normalizeOptions(undefined)).toEqual([]);
  });

  it('maps a legacy string array to value=label options', () => {
    expect(normalizeOptions(['Pickup', 'Delivery'])).toEqual([
      { value: 'Pickup', label: 'Pickup' },
      { value: 'Delivery', label: 'Delivery' },
    ]);
  });

  it('passes object options through, carrying color/semantic/is_default', () => {
    const opts = [
      { value: 'design', label: 'Design', color: 'amber', semantic: 'open' },
      { value: 'delivered', label: 'Delivered', color: 'green', semantic: 'won', is_default: true },
    ];
    expect(normalizeOptions(opts)).toEqual(opts);
  });

  it('falls back to value when an object option omits a label', () => {
    expect(normalizeOptions([{ value: 'ready' }])).toEqual([{ value: 'ready', label: 'ready' }]);
  });

  it('drops object entries with no usable value', () => {
    expect(normalizeOptions([{ label: 'no value' }, { value: '' }, 'ok'])).toEqual([
      { value: 'ok', label: 'ok' },
    ]);
  });

  it('maps a legacy keyed object to options', () => {
    expect(normalizeOptions({ a: 1, b: 2 })).toEqual([
      { value: 'a', label: 'a' },
      { value: 'b', label: 'b' },
    ]);
  });

  it('ignores unknown semantic values', () => {
    expect(normalizeOptions([{ value: 'x', semantic: 'bogus' }])).toEqual([
      { value: 'x', label: 'x' },
    ]);
  });
});
