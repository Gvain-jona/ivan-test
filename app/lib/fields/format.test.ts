import { describe, expect, it } from 'vitest'
import { formatFieldValue } from './format'

const select = {
  field_type: 'select',
  options: [
    { value: 'roll_up_banner', label: 'Roll-up banner' },
    { value: 'matte', label: 'Matte' },
  ],
}

describe('formatFieldValue', () => {
  // The stored value is a machine key; the org named it something else.
  it('resolves a select to the label the org gave it', () => {
    expect(formatFieldValue('matte', select)).toBe('Matte')
  })

  // An option removed from the list after a record used it must still show
  // what that record actually holds, not a blank.
  it('falls back to the raw value for an option no longer in the list', () => {
    expect(formatFieldValue('retired_option', select)).toBe('retired_option')
  })

  it('reads a dimension as the text it was entered with', () => {
    expect(formatFieldValue({ raw: '2×4 ft' }, { field_type: 'dimension' })).toBe('2×4 ft')
  })

  it('composes a dimension from width and height when there is no raw', () => {
    expect(formatFieldValue({ w: 2, h: 4 }, { field_type: 'dimension' })).toBe('2 × 4')
  })

  it('renders booleans as words', () => {
    expect(formatFieldValue(true, { field_type: 'boolean' })).toBe('Yes')
    expect(formatFieldValue(false, { field_type: 'boolean' })).toBe('No')
  })

  it('groups numbers', () => {
    expect(formatFieldValue(90000, { field_type: 'number' })).toBe('90,000')
  })

  /**
   * Callers drop the row on null. A field the org defined but this record
   * never filled in should not render as a blank line.
   */
  it('returns null for anything absent or empty', () => {
    for (const empty of [undefined, null, '']) {
      expect(formatFieldValue(empty, { field_type: 'text' })).toBeNull()
    }
    expect(formatFieldValue({}, { field_type: 'dimension' })).toBeNull()
  })

  // false is an answer, not an absence — the guard must not treat it as empty.
  it('keeps a false boolean', () => {
    expect(formatFieldValue(false, { field_type: 'boolean' })).toBe('No')
  })

  it('passes text through', () => {
    expect(formatFieldValue('Vinyl', { field_type: 'text' })).toBe('Vinyl')
  })
})
