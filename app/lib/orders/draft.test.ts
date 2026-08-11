import { describe, expect, it } from 'vitest';
import {
  discountAmount,
  discountLabel,
  draftTotals,
  lineTotal,
  type DraftDiscount,
  type DraftItem,
  type DraftPayment,
} from './draft';

const item = (over: Partial<DraftItem> = {}): DraftItem => ({
  key: 'k',
  product_id: null,
  name: 'Roll-up banner',
  quantity: 2,
  unit_price: 90_000,
  ...over,
});

const payment = (amount: number): DraftPayment => ({
  key: 'p',
  amount,
  payment_method: 'cash',
  payment_date: '2026-08-07',
});

const none: DraftDiscount = { type: null, value: 0 };

describe('lineTotal', () => {
  it('multiplies quantity by unit price', () => {
    expect(lineTotal(item())).toBe(180_000);
  });

  it('subtracts the line discount as an absolute amount', () => {
    expect(lineTotal(item({ discount: 20_000 }))).toBe(160_000);
  });

  it('floors at zero rather than letting a line go negative', () => {
    // A discount bigger than the line is a typo; a negative line would
    // silently subtract from the rest of the order.
    expect(lineTotal(item({ discount: 500_000 }))).toBe(0);
  });
});

describe('discountAmount', () => {
  it('takes a percentage of the subtotal', () => {
    expect(discountAmount(480_000, { type: 'percent', value: 10 })).toBe(48_000);
  });

  it('takes an amount as typed', () => {
    expect(discountAmount(480_000, { type: 'amount', value: 30_000 })).toBe(30_000);
  });

  it('is zero when no discount is set', () => {
    expect(discountAmount(480_000, none)).toBe(0);
  });

  it('never exceeds the subtotal, so a total cannot go negative', () => {
    expect(discountAmount(100_000, { type: 'amount', value: 250_000 })).toBe(100_000);
  });

  it('caps a percentage at 100, matching the DB CHECK', () => {
    expect(discountAmount(480_000, { type: 'percent', value: 150 })).toBe(480_000);
  });

  it('ignores a zero or negative value', () => {
    expect(discountAmount(480_000, { type: 'percent', value: 0 })).toBe(0);
    expect(discountAmount(480_000, { type: 'amount', value: -5 })).toBe(0);
  });
});

describe('draftTotals', () => {
  it('walks lines → discount → payments, the way the frame reads', () => {
    const totals = draftTotals({
      items: [
        item({ key: 'a', quantity: 2, unit_price: 90_000 }),
        item({ key: 'b', quantity: 1_000, unit_price: 250 }),
        item({ key: 'c', quantity: 500, unit_price: 100 }),
      ],
      discount: { type: 'percent', value: 10 },
      payments: [payment(300_000)],
    });

    expect(totals).toEqual({
      subtotal: 480_000,
      discountAmount: 48_000,
      total: 432_000,
      paid: 300_000,
      balance: 132_000,
    });
  });

  it('is all zeroes for an empty draft', () => {
    expect(draftTotals({ items: [], discount: none, payments: [] })).toEqual({
      subtotal: 0,
      discountAmount: 0,
      total: 0,
      paid: 0,
      balance: 0,
    });
  });

  it('reports overpayment as a negative balance rather than clamping it', () => {
    // Money that arrived and isn't owed is something someone has to see.
    const totals = draftTotals({
      items: [item({ quantity: 1, unit_price: 50_000 })],
      discount: none,
      payments: [payment(80_000)],
    });
    expect(totals.balance).toBe(-30_000);
  });

  it('leaves rounding to the formatter rather than inventing a rule', () => {
    // 7% of 100,001 is 7000.07. The DB rounds at currency_scale(); this
    // preview must not round somewhere else and disagree with it.
    const totals = draftTotals({
      items: [item({ quantity: 1, unit_price: 100_001 })],
      discount: { type: 'percent', value: 7 },
      payments: [],
    });
    expect(totals.discountAmount).toBeCloseTo(7000.07, 5);
  });
});

describe('discountLabel', () => {
  it('names the percentage so the summary explains its own figure', () => {
    expect(discountLabel({ type: 'percent', value: 10 })).toBe('Discount (10%)');
  });

  it('stays plain for an absolute amount', () => {
    expect(discountLabel({ type: 'amount', value: 30_000 })).toBe('Discount');
  });
});
