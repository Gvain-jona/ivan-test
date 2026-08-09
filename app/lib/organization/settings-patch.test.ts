import { describe, expect, it } from 'vitest'
import { settingsBlockPayload } from './settings-patch'

describe('settingsBlockPayload', () => {
  /**
   * An emptied field is a request to remove the value, and `null` is how the
   * API says that — the route deletes the key rather than storing `''`, so an
   * issued document's frozen settings never claim a blank phone number.
   */
  it('sends an emptied field as null', () => {
    expect(settingsBlockPayload({ phone: '0772', email: '', tax_id: '' })).toEqual({
      phone: '0772',
      email: null,
      tax_id: null,
    })
  })

  // undefined is the form never having touched the key, which means "leave it
  // alone" — a different thing from clearing it.
  it('drops a key the form never touched', () => {
    expect(settingsBlockPayload({ phone: '0772', website: undefined })).toEqual({
      phone: '0772',
    })
  })

  // false and 0 are answers: "not registered for tax", "a 0% rate".
  it('keeps false and zero', () => {
    expect(settingsBlockPayload({ registered: false, rate: 0, inclusive: true })).toEqual({
      registered: false,
      rate: 0,
      inclusive: true,
    })
  })

  // A null already in the draft is already a clear; it passes through as one.
  it('passes an explicit null through', () => {
    expect(settingsBlockPayload({ tax_id: null })).toEqual({ tax_id: null })
  })

  it('handles an untouched block', () => {
    expect(settingsBlockPayload({})).toEqual({})
  })
})
