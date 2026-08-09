import { describe, expect, it } from 'vitest'
import {
  buildInvoiceDraft,
  counterPatch,
  invoiceSettingsPatch,
  type InvoiceDraft,
} from './invoice-settings-draft'

const counter = { format: 'INV-{YYYY}-{N5}', current_value: 44, reset_policy: 'yearly' }

const draftFrom = (over: Partial<InvoiceDraft> = {}): InvoiceDraft => ({
  ...buildInvoiceDraft({}, undefined, []),
  ...over,
})

describe('buildInvoiceDraft', () => {
  it('reads each value out of the block it actually lives in', () => {
    const draft = buildInvoiceDraft(
      {
        locale: { currency: 'UGX' },
        tax: { registered: true, label: 'VAT', rate: 18, inclusive: true },
        documents: { terms_days: 14, quote_validity_days: 30, bank_details: 'MTN 0772' },
        identity: { legal_name: 'Ivan Prints', tax_id: '1000123456' },
      },
      counter,
      [{ id: 'f-1', show_in_documents: true }, { id: 'f-2', show_in_documents: false }],
    )

    expect(draft.currency).toBe('UGX')
    expect(draft.taxRate).toBe('18')
    expect(draft.termsDays).toBe('14')
    expect(draft.taxId).toBe('1000123456')
    expect(draft.printFieldIds).toEqual(['f-1'])
  })

  // A counter stores the last number handed out, not the next one.
  it('shows the next number as one past the counter', () => {
    expect(buildInvoiceDraft({}, counter, []).nextNumber).toBe('45')
    expect(buildInvoiceDraft({}, { ...counter, current_value: 0 }, []).nextNumber).toBe('1')
  })

  it('leaves unset values empty rather than inventing zeros', () => {
    const draft = buildInvoiceDraft({}, undefined, [])
    expect(draft.termsDays).toBe('')
    expect(draft.taxRate).toBe('')
    expect(draft.chargeTax).toBe(false)
    expect(draft.resetPolicy).toBe('never')
  })
})

describe('invoiceSettingsPatch', () => {
  it('routes every value to its own block', () => {
    const patch = invoiceSettingsPatch(
      draftFrom({
        termsDays: '14',
        chargeTax: true,
        taxRate: '18',
        legalName: 'Ivan Prints',
        currency: 'ugx',
      }),
    )

    expect(patch.documents).toMatchObject({ terms_days: 14 })
    expect(patch.tax).toMatchObject({ registered: true, rate: 18 })
    expect(patch.identity).toMatchObject({ legal_name: 'Ivan Prints' })
    // Currency is an ISO code; the input is not case-sensitive.
    expect(patch.locale).toEqual({ currency: 'UGX' })
  })

  it('omits locale entirely when no currency is set', () => {
    expect(invoiceSettingsPatch(draftFrom({ currency: '  ' })).locale).toBeUndefined()
  })

  /**
   * An emptied field asks for the value to be removed, and null is how the
   * API says that (A5). false is not an absence — it is "not registered for
   * tax" — so it travels as itself.
   */
  it('sends emptied fields as null and keeps false', () => {
    const patch = invoiceSettingsPatch(draftFrom({ legalName: '', chargeTax: false }))
    expect((patch.identity as Record<string, unknown>).legal_name).toBeNull()
    expect(patch.tax).toMatchObject({ registered: false })
  })

  // The same must hold for the number fields, or Payment terms would be the
  // one setting you still could not remove.
  it('sends an emptied number field as null too', () => {
    const patch = invoiceSettingsPatch(draftFrom({ termsDays: '', quoteValidityDays: '30' }))
    expect(patch.documents).toMatchObject({ terms_days: null, quote_validity_days: 30 })
  })

  /**
   * Currency is the one key that cannot be cleared — the schema refuses null,
   * because an org unable to name a currency cannot issue anything. So a blank
   * currency omits the block rather than trying to remove the key.
   */
  it('never asks to clear the currency', () => {
    expect(invoiceSettingsPatch(draftFrom({ currency: '' })).locale).toBeUndefined()
  })
})

describe('counterPatch', () => {
  it('sends nothing when numbering is untouched', () => {
    const draft = buildInvoiceDraft({}, counter, [])
    expect(counterPatch(draft, counter)).toEqual({})
  })

  it('converts the next number back to the counter value', () => {
    const draft = buildInvoiceDraft({}, counter, [])
    expect(counterPatch({ ...draft, nextNumber: '1000' }, counter)).toEqual({
      current_value: 999,
    })
  })

  it('sends format and reset policy only when they changed', () => {
    const draft = buildInvoiceDraft({}, counter, [])
    expect(counterPatch({ ...draft, resetPolicy: 'monthly' }, counter)).toEqual({
      reset_policy: 'monthly',
    })
  })

  it('ignores a next number that is not a usable figure', () => {
    const draft = buildInvoiceDraft({}, counter, [])
    expect(counterPatch({ ...draft, nextNumber: '' }, counter)).toEqual({})
    expect(counterPatch({ ...draft, nextNumber: 'abc' }, counter)).toEqual({})
    // 0 would mean a counter value of -1.
    expect(counterPatch({ ...draft, nextNumber: '0' }, counter)).toEqual({})
  })

  it('does nothing without a counter to patch', () => {
    expect(counterPatch(draftFrom({ format: 'X' }), undefined)).toEqual({})
  })
})
