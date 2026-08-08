import { describe, expect, it } from 'vitest'
import { describeDocumentState } from './document-state'

const TODAY = '2026-08-07'
const doc = (over: Partial<Parameters<typeof describeDocumentState>[0]> = {}) => ({
  status: 'issued',
  total: 100,
  amount_paid: 0,
  ...over,
})

describe('describeDocumentState', () => {
  it('reports terminal states from the status alone', () => {
    expect(describeDocumentState(doc({ status: 'void' }), TODAY)).toEqual({
      label: 'Void',
      tone: 'muted',
    })
    expect(describeDocumentState(doc({ status: 'declined' }), TODAY).tone).toBe('danger')
    expect(describeDocumentState(doc({ status: 'accepted' }), TODAY).tone).toBe('good')
    expect(describeDocumentState(doc({ status: 'expired' }), TODAY).label).toBe('Expired')
    expect(describeDocumentState(doc({ status: 'draft' }), TODAY).label).toBe('Draft')
  })

  // A terminal state wins even with money and dates attached.
  it('prefers a terminal state over anything the dates or money say', () => {
    const state = describeDocumentState(
      doc({ status: 'void', due_date: '2026-01-01', amount_paid: 100 }),
      TODAY,
    )
    expect(state.label).toBe('Void')
  })

  it('reports a settled document as Paid, not as due', () => {
    const state = describeDocumentState(
      doc({ total: 100, amount_paid: 100, due_date: '2026-09-01' }),
      TODAY,
    )
    expect(state).toEqual({ label: 'Paid', tone: 'good' })
  })

  // Overpayment still settles it.
  it('treats more paid than owed as Paid', () => {
    expect(describeDocumentState(doc({ total: 100, amount_paid: 120 }), TODAY).label).toBe('Paid')
  })

  // A zero-total document is not "paid" just because nothing was owed.
  it('does not call a zero-total document Paid', () => {
    expect(describeDocumentState(doc({ total: 0, amount_paid: 0 }), TODAY).label).toBe('Issued')
  })

  it('counts overdue days from the due date', () => {
    expect(describeDocumentState(doc({ due_date: '2026-08-01' }), TODAY)).toEqual({
      label: 'Overdue 6 days',
      tone: 'danger',
    })
  })

  it('says day, singular, at one', () => {
    expect(describeDocumentState(doc({ due_date: '2026-08-06' }), TODAY).label).toBe('Overdue 1 day')
  })

  // Due today is not yet overdue.
  it('is not overdue on the due date itself', () => {
    const state = describeDocumentState(doc({ due_date: TODAY }), TODAY)
    expect(state).toEqual({ label: 'Due', tone: 'muted', date: TODAY })
  })

  it('hands the date back unformatted for the caller to render', () => {
    expect(describeDocumentState(doc({ due_date: '2026-08-21' }), TODAY)).toEqual({
      label: 'Due',
      tone: 'muted',
      date: '2026-08-21',
    })
  })

  it('falls back to validity when there are no payment terms', () => {
    expect(describeDocumentState(doc({ valid_until: '2026-08-12' }), TODAY)).toEqual({
      label: 'Valid to',
      tone: 'muted',
      date: '2026-08-12',
    })
  })

  it('distinguishes sent from issued when nothing else applies', () => {
    expect(describeDocumentState(doc({ status: 'sent' }), TODAY).label).toBe('Sent')
    expect(describeDocumentState(doc(), TODAY).label).toBe('Issued')
  })
})
