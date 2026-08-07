import { describe, expect, it } from 'vitest'
import { settingsBlockPayload, unclearableKeys } from './settings-patch'

describe('settingsBlockPayload', () => {
  it('drops empty strings, undefined and null', () => {
    expect(
      settingsBlockPayload({ phone: '0772', email: '', website: undefined, tax_id: null }),
    ).toEqual({ phone: '0772' })
  })

  // The bug this guards: filtering on falsiness instead of on emptiness would
  // silently refuse to save "not registered for tax" and "a 0% rate".
  it('keeps false and 0, which are answers rather than absences', () => {
    expect(settingsBlockPayload({ registered: false, rate: 0, inclusive: true })).toEqual({
      registered: false,
      rate: 0,
      inclusive: true,
    })
  })

  it('returns an empty object for a block with nothing set', () => {
    expect(settingsBlockPayload({ phone: '', email: undefined })).toEqual({})
  })
})

describe('unclearableKeys', () => {
  it('names the keys the user emptied that will keep their value', () => {
    const saved = { phone: '0772', email: 'a@b.co', tax_id: '100' }
    const payload = settingsBlockPayload({ phone: '0772', email: '', tax_id: '' })
    expect(unclearableKeys(saved, payload)).toEqual(['email', 'tax_id'])
  })

  it('says nothing when every stored key is still being sent', () => {
    const saved = { phone: '0772' }
    expect(unclearableKeys(saved, settingsBlockPayload({ phone: '0700' }))).toEqual([])
  })

  // Already empty, so emptying it loses nothing worth reporting.
  it('ignores a key that was stored as an empty string', () => {
    const saved = { address: '', phone: '0772' }
    expect(unclearableKeys(saved, settingsBlockPayload({ address: '', phone: '0772' }))).toEqual([])
  })

  it('ignores keys the user never had stored', () => {
    expect(unclearableKeys({}, settingsBlockPayload({ phone: '' }))).toEqual([])
  })
})
