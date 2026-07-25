import { describe, expect, it } from 'vitest';
import { starterFieldsToApply } from './apply-presets';
import { STARTER_FIELDS } from './presets';

const names = (entity: 'product' | 'client' | 'order') =>
  new Set(STARTER_FIELDS[entity].map(f => f.field_name));

describe('starterFieldsToApply', () => {
  it('creates every kept starter when the org has none yet', () => {
    const out = starterFieldsToApply('client', names('client'), []);
    expect(out.map(f => f.field_name)).toEqual(
      STARTER_FIELDS.client.map(f => f.field_name),
    );
    expect(out.every(f => f.entity === 'client')).toBe(true);
  });

  it('skips starters the user unchecked', () => {
    const keep = new Set(['phone', 'email']);
    const out = starterFieldsToApply('client', keep, []);
    expect(out.map(f => f.field_name)).toEqual(['phone', 'email']);
  });

  it('skips starters that already exist (idempotent re-entry)', () => {
    const out = starterFieldsToApply('client', names('client'), [{ field_name: 'phone' }]);
    expect(out.map(f => f.field_name)).not.toContain('phone');
    expect(out.map(f => f.field_name)).toContain('email');
  });

  it('carries options + is_system + conditions through', () => {
    const out = starterFieldsToApply('order', names('order'), []);
    const status = out.find(f => f.field_name === 'status');
    expect(status?.is_system).toBe(true);
    expect(Array.isArray(status?.options)).toBe(true);

    const company = starterFieldsToApply('client', names('client'), []).find(
      f => f.field_name === 'company',
    );
    expect(company?.conditions).toEqual({ field: 'type', equals: 'contract' });
  });

  it('returns nothing when all kept starters already exist', () => {
    const existing = STARTER_FIELDS.product.map(f => ({ field_name: f.field_name }));
    expect(starterFieldsToApply('product', names('product'), existing)).toEqual([]);
  });
});
