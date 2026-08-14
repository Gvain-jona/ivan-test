import { describe, expect, it } from 'vitest';
import { starterFieldRows } from './seed-defaults';
import { STARTER_FIELDS, type StarterEntity } from '@/lib/organization/presets';

const ORG = '00000000-0000-0000-0000-000000000001';

describe('starterFieldRows', () => {
  const rows = starterFieldRows(ORG);

  it('stamps every row with the organization id', () => {
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.organization_id === ORG)).toBe(true);
  });

  it('emits one row per starter field across every entity', () => {
    const expected = (Object.keys(STARTER_FIELDS) as StarterEntity[]).reduce(
      (n, entity) => n + STARTER_FIELDS[entity].length,
      0,
    );
    expect(rows).toHaveLength(expected);
    for (const entity of Object.keys(STARTER_FIELDS) as StarterEntity[]) {
      expect(rows.some(r => r.entity === entity)).toBe(true);
    }
  });

  it('seeds the order status workflow as a system field', () => {
    // Status is the one field the app cannot run without (Home segmentation,
    // the stage editor, status chips), so it must arrive is_system.
    const status = rows.find(r => r.entity === 'order' && r.field_name === 'status');
    expect(status).toBeDefined();
    expect(status?.is_system).toBe(true);
    expect(status?.field_type).toBe('select');
    expect(Array.isArray(status?.options)).toBe(true);
  });

  it('defaults non-system fields to is_system false and status active', () => {
    const phone = rows.find(r => r.entity === 'client' && r.field_name === 'phone');
    expect(phone?.is_system).toBe(false);
    expect(rows.every(r => r.status === 'active')).toBe(true);
  });

  it('carries select options through verbatim', () => {
    const category = rows.find(r => r.entity === 'product' && r.field_name === 'category');
    expect(category?.options).toEqual(
      STARTER_FIELDS.product.find(f => f.field_name === 'category')?.options,
    );
  });
});
