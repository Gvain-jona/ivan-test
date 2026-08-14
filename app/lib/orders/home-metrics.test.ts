import { describe, expect, it } from 'vitest';
import { homeMetrics } from './home-metrics';
import type { FieldOption } from '@/lib/fields/options';

const STATUSES: FieldOption[] = [
  { value: 'quotation', label: 'Quotation', semantic: 'open', is_default: true },
  { value: 'printing', label: 'Printing', semantic: 'open' },
  { value: 'delivered', label: 'Delivered', semantic: 'won' },
  { value: 'cancelled', label: 'Cancelled', semantic: 'lost' },
];

const order = (status: string, balance: number | null) => ({ status, balance });

describe('homeMetrics', () => {
  it('splits quotations out of in-process open work by the default status', () => {
    const orders = [
      order('quotation', 0),
      order('quotation', 500),
      order('printing', 100),
      order('delivered', 0),
      order('cancelled', 0),
    ];
    const m = homeMetrics(orders, STATUSES);
    expect(m.quotations).toHaveLength(2);
    // printing is the only open, non-quotation order.
    expect(m.inProcessCount).toBe(1);
  });

  it('sums outstanding balances and ignores negatives/nulls', () => {
    const orders = [order('printing', 300), order('delivered', 200), order('quotation', null), order('printing', -50)];
    // 300 + 200 + 0 + 0 (negative clamped)
    expect(homeMetrics(orders, STATUSES).toCollect).toBe(500);
  });

  it('finds the quotation stage even when it is renamed (default flag, not the word)', () => {
    const renamed: FieldOption[] = [
      { value: 'estimate', label: 'Estimate', semantic: 'open', is_default: true },
      { value: 'press', label: 'On the press', semantic: 'open' },
    ];
    const m = homeMetrics([order('estimate', 0), order('press', 0)], renamed);
    expect(m.quotations.map(q => q.status)).toEqual(['estimate']);
    expect(m.inProcessCount).toBe(1);
  });

  it('is empty and zero for no orders', () => {
    const m = homeMetrics([], STATUSES);
    expect(m).toEqual({ toCollect: 0, inProcessCount: 0, quotations: [] });
  });
});
