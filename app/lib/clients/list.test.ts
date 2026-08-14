import { describe, it, expect } from 'vitest';
import { rollupByClient, filterClients } from './list';

describe('rollupByClient', () => {
  it('sums balance and counts orders per client', () => {
    const map = rollupByClient([
      { client_id: 'a', balance: 100 },
      { client_id: 'a', balance: 80 },
      { client_id: 'b', balance: 0 },
    ]);
    expect(map.a).toEqual({ owing: 180, orders: 2 });
    expect(map.b).toEqual({ owing: 0, orders: 1 });
  });

  it('coerces null/string/NaN balances to zero', () => {
    const map = rollupByClient([
      { client_id: 'a', balance: null },
      { client_id: 'a', balance: '50' },
      { client_id: 'a', balance: 'nope' },
    ]);
    expect(map.a).toEqual({ owing: 50, orders: 3 });
  });

  it('ignores orders with no client_id', () => {
    const map = rollupByClient([
      { client_id: null, balance: 999 },
      { client_id: 'a', balance: 10 },
    ]);
    expect(map).toEqual({ a: { owing: 10, orders: 1 } });
  });
});

describe('filterClients', () => {
  const clients = [
    { id: 'a', name: 'Kampala Traders', custom_data: { phone: '0772445118', type: 'regular' } },
    { id: 'b', name: 'Bright Star Ltd', custom_data: { phone: '0772118440', type: 'regular' } },
    { id: 'c', name: 'Mukono Secondary', custom_data: { phone: '0700445902', type: 'contract' } },
    { id: 'd', name: 'Walk-in Guy', custom_data: null },
  ];
  const rollups = {
    a: { owing: 180, orders: 12 },
    b: { owing: 420, orders: 9 },
    c: { owing: 0, orders: 4 },
  };

  it('returns all clients when nothing is active', () => {
    expect(filterClients(clients, { search: '', type: null, owing: false }, rollups)).toHaveLength(4);
  });

  it('owing keeps only clients with a positive balance', () => {
    const out = filterClients(clients, { search: '', type: null, owing: true }, rollups);
    expect(out.map(c => c.id)).toEqual(['a', 'b']);
  });

  it('type matches the custom_data type value', () => {
    const out = filterClients(clients, { search: '', type: 'contract', owing: false }, rollups);
    expect(out.map(c => c.id)).toEqual(['c']);
  });

  it('search matches name or phone, case-insensitively', () => {
    expect(filterClients(clients, { search: 'bright', type: null, owing: false }, rollups).map(c => c.id)).toEqual(['b']);
    expect(filterClients(clients, { search: '445902', type: null, owing: false }, rollups).map(c => c.id)).toEqual(['c']);
  });

  it('combines chip and search', () => {
    const out = filterClients(clients, { search: 'traders', type: 'regular', owing: true }, rollups);
    expect(out.map(c => c.id)).toEqual(['a']);
  });

  it('a client with no rollup is not owing and has no orders to match', () => {
    const out = filterClients(clients, { search: '', type: null, owing: true }, rollups);
    expect(out.find(c => c.id === 'd')).toBeUndefined();
  });
});
