import { describe, it, expect } from 'vitest';
import { filterProducts, hasLiveProduct } from './list';

const products = [
  { id: 'a', name: 'Roll-up banner', status: 'active', custom_data: { category: 'banners' } },
  { id: 'b', name: 'A5 flyers', status: 'active', custom_data: { category: 'flyers' } },
  { id: 'c', name: 'Foamex sign', status: 'draft', custom_data: { category: 'large_format' } },
  { id: 'd', name: 'Old poster', status: 'archived', custom_data: { category: 'flyers' } },
  { id: 'e', name: 'No fields', status: 'active', custom_data: null },
];

describe('filterProducts', () => {
  it('drops archived products but keeps active and draft', () => {
    const out = filterProducts(products, { search: '', category: null });
    expect(out.map(p => p.id)).toEqual(['a', 'b', 'c', 'e']);
  });

  it('category matches the custom_data category value', () => {
    const out = filterProducts(products, { search: '', category: 'flyers' });
    expect(out.map(p => p.id)).toEqual(['b']);
  });

  it('search matches name or category, case-insensitively', () => {
    expect(filterProducts(products, { search: 'BANNER', category: null }).map(p => p.id)).toEqual(['a']);
    expect(filterProducts(products, { search: 'flyer', category: null }).map(p => p.id)).toEqual(['b']);
  });

  it('combines category chip and search', () => {
    const out = filterProducts(products, { search: 'roll', category: 'banners' });
    expect(out.map(p => p.id)).toEqual(['a']);
  });

  it('a product with no custom_data survives an empty filter', () => {
    const out = filterProducts(products, { search: '', category: null });
    expect(out.find(p => p.id === 'e')).toBeDefined();
  });
});

describe('hasLiveProduct', () => {
  it('is true when any product is not archived', () => {
    expect(hasLiveProduct(products)).toBe(true);
  });

  it('is false when every product is archived', () => {
    expect(hasLiveProduct([{ id: 'd', name: 'Old', status: 'archived', custom_data: null }])).toBe(false);
  });

  it('is false for an empty list', () => {
    expect(hasLiveProduct([])).toBe(false);
  });
});
