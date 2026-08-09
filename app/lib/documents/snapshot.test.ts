import { describe, expect, it } from 'vitest'
import { issuerInitials, readSnapshot } from './snapshot'

const FALLBACK = { documentNumber: 'INV-0001', documentType: 'invoice' }

// The shape issue_document() actually writes, read off the function source.
const REAL = {
  meta: {
    document_type: 'invoice',
    document_number: 'INV-0044',
    order_number: 'ORD-0042',
    order_date: '2026-08-07',
    issued_at: '2026-08-07T09:00:00Z',
  },
  issuer: {
    legal_name: 'Ivan Prints Ltd',
    trading_name: 'Ivan Prints',
    address: 'Plot 5, Kampala Road',
    phone: '0772 100 200',
    tax_id: '1000123456',
  },
  recipient: {
    client_id: 'c-1',
    name: 'Kampala Traders',
    fields: { Phone: '0772 445 118', Address: 'Plot 12, Nakawa' },
  },
  order_fields: { Delivery: 'Pickup', 'Due date': '2026-08-12' },
  lines: [
    {
      description: 'Roll-up banner',
      quantity: 2,
      unit_price: 90000,
      discount: 0,
      total: 180000,
      fields: { Size: '2×4 ft' },
    },
  ],
  /**
   * Not invented: these are the figures issue_document() actually produced for
   * 480,000 UGX of lines at 10% off, VAT 18% inclusive, measured against the
   * live function on 2026-08-09. They are the tax-exclusive presentation of a
   * deal the customer settles for 432,000 — and (subtotal − discount) + tax
   * lands on that exactly, because documents.total is generated from those
   * three and cannot absorb a rounding error.
   */
  totals: {
    currency: 'UGX',
    subtotal: 406780,
    discount_total: 40678,
    discount_type: 'percent',
    discount_value: 10,
    tax_total: 65898,
    total: 432000,
    tax_label: 'VAT',
    tax_rate: 18,
    tax_registered: true,
    amounts_include_tax: true,
  },
  terms: {
    terms_days: 14,
    due_date: '2026-08-21',
    valid_until: null,
    footer: 'Thank you',
    bank_details: 'Pay to MTN 0772 100 200',
  },
}

describe('readSnapshot', () => {
  it('reads the shape issue_document writes', () => {
    const s = readSnapshot(REAL, FALLBACK)

    expect(s.documentNumber).toBe('INV-0044')
    expect(s.recipientName).toBe('Kampala Traders')
    expect(s.total).toBe(432000)
    expect(s.taxLabel).toBe('VAT')
    expect(s.amountsIncludeTax).toBe(true)
    expect(s.dueDate).toBe('2026-08-21')
    expect(s.bankDetails).toBe('Pay to MTN 0772 100 200')
  })

  // The letterhead is what customers know the business as.
  it('prefers the trading name over the registered one', () => {
    expect(readSnapshot(REAL, FALLBACK).issuerName).toBe('Ivan Prints')
    const noTrading = { ...REAL, issuer: { legal_name: 'Ivan Prints Ltd' } }
    expect(readSnapshot(noTrading, FALLBACK).issuerName).toBe('Ivan Prints Ltd')
  })

  it('label-keys the custom fields and drops empty ones', () => {
    const s = readSnapshot(
      { ...REAL, order_fields: { Delivery: 'Pickup', Material: '', Size: null } },
      FALLBACK,
    )
    expect(s.orderFields).toEqual([['Delivery', 'Pickup']])
  })

  it('reads line fields the same way', () => {
    expect(readSnapshot(REAL, FALLBACK).lines[0].fields).toEqual({ Size: '2×4 ft' })
  })

  it('reads the discount and the rate it was agreed at', () => {
    const s = readSnapshot(REAL, FALLBACK)
    expect(s.discountTotal).toBe(40678)
    expect(s.discountType).toBe('percent')
    expect(s.discountValue).toBe(10)
    // The generated column's own arithmetic, restated: if these three ever
    // stop agreeing, the paper prints a total that doesn't add up.
    expect(s.subtotal - s.discountTotal + s.taxTotal).toBe(s.total)
  })

  /**
   * A document frozen before A1 part 2 has no discount keys at all. It must
   * still render — with no discount line, which is right, because it had no
   * discount.
   */
  it('treats a snapshot with no discount keys as no discount', () => {
    const { discount_total, discount_type, discount_value, ...totals } = REAL.totals
    const s = readSnapshot({ ...REAL, totals }, FALLBACK)
    expect(s.discountTotal).toBe(0)
    expect(s.discountType).toBeNull()
    expect(s.discountValue).toBe(0)
  })

  // An 'amount' discount has no rate to print, so the paper says just "Discount".
  it('reports a fixed discount with no percentage', () => {
    const fixed = {
      ...REAL,
      totals: { ...REAL.totals, discount_type: 'amount', discount_value: 48000 },
    }
    const s = readSnapshot(fixed, FALLBACK)
    expect(s.discountType).toBe('amount')
    expect(s.discountValue).toBe(48000)
  })

  it('ignores a discount_type it does not recognise', () => {
    const odd = { ...REAL, totals: { ...REAL.totals, discount_type: 'settlement' } }
    expect(readSnapshot(odd, FALLBACK).discountType).toBeNull()
  })

  /**
   * The point of freezing a snapshot is that it stays readable. A document
   * written by an older version of the function is still legally a document.
   */
  it('renders something for an empty or malformed snapshot', () => {
    for (const input of [null, undefined, {}, [], 'nonsense', 42]) {
      const s = readSnapshot(input, FALLBACK)
      expect(s.documentNumber).toBe('INV-0001')
      expect(s.documentType).toBe('invoice')
      expect(s.lines).toEqual([])
      expect(s.total).toBe(0)
      expect(s.recipientName).toBeNull()
    }
  })

  it('survives lines that are not objects', () => {
    const s = readSnapshot({ ...REAL, lines: [null, 'x', { description: 'Real' }] }, FALLBACK)
    expect(s.lines).toHaveLength(3)
    expect(s.lines[0].description).toBe('—')
    expect(s.lines[2].description).toBe('Real')
  })
})

describe('issuerInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(issuerInitials('Ivan Prints')).toBe('IP')
    expect(issuerInitials('Kampala Traders Limited')).toBe('KT')
    expect(issuerInitials('Ivan')).toBe('I')
  })

  it('has something to draw when the issuer was never set', () => {
    expect(issuerInitials(null)).toBe('—')
    expect(issuerInitials('   ')).toBe('')
  })
})
