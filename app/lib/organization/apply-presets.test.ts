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

// Edits a user makes to a starter before it's created are staged, so the field
// has to be created as they shaped it rather than as the template shipped it.
describe('starterFieldsToApply — staged edits', () => {
  it('applies a relabelled starter', () => {
    const out = starterFieldsToApply('product', names('product'), [], {
      category: { field_label: 'Product line' },
    });
    expect(out.find(f => f.field_name === 'category')?.field_label).toBe('Product line');
  });

  it('replaces a select starter’s options wholesale', () => {
    const options = [
      { value: 'stickers', label: 'Stickers' },
      { value: 't_shirts', label: 'T-shirts' },
    ];
    const out = starterFieldsToApply('product', names('product'), [], {
      category: { options },
    });
    expect(out.find(f => f.field_name === 'category')?.options).toEqual(options);
  });

  it('leaves untouched starters exactly as the preset ships them', () => {
    const edited = starterFieldsToApply('product', names('product'), [], {
      category: { field_label: 'Product line' },
    });
    const pristine = starterFieldsToApply('product', names('product'), []);
    const unitEdited = edited.find(f => f.field_name === 'unit');
    expect(unitEdited).toEqual(pristine.find(f => f.field_name === 'unit'));
  });

  it('ignores a blank label rather than creating an unnamed field', () => {
    const out = starterFieldsToApply('product', names('product'), [], {
      category: { field_label: '   ' },
    });
    expect(out.find(f => f.field_name === 'category')?.field_label).toBe('Category');
  });

  // Options on a text field would write something no form renderer reads.
  it('does not attach edited options to a non-select starter', () => {
    const out = starterFieldsToApply('client', names('client'), [], {
      phone: { options: [{ value: 'x', label: 'X' }] },
    });
    expect(out.find(f => f.field_name === 'phone')?.options).toBeUndefined();
  });

  it('carries the rule toggles through', () => {
    const out = starterFieldsToApply('client', names('client'), [], {
      phone: { is_required: true, show_in_documents: true },
    });
    const phone = out.find(f => f.field_name === 'phone');
    expect(phone?.is_required).toBe(true);
    expect(phone?.show_in_documents).toBe(true);
  });

  it('ignores overrides for starters that were dropped', () => {
    const out = starterFieldsToApply('product', new Set(['unit']), [], {
      category: { field_label: 'Product line' },
    });
    expect(out.map(f => f.field_name)).toEqual(['unit']);
  });
});
