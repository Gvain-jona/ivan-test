import { describe, expect, it } from 'vitest';
import { FIELD_NAME_PATTERN, slugifyFieldName } from './slug';

describe('slugifyFieldName', () => {
  it('lowercases and underscores a human label', () => {
    expect(slugifyFieldName('Delivery Date')).toBe('delivery_date');
    expect(slugifyFieldName('VAT number')).toBe('vat_number');
    expect(slugifyFieldName('Job ref')).toBe('job_ref');
  });

  it('drops punctuation and collapses separators', () => {
    expect(slugifyFieldName('Delivery  Date!')).toBe('delivery_date');
    expect(slugifyFieldName('  Finishing  ')).toBe('finishing');
    expect(slugifyFieldName('W x H (mm)')).toBe('w_x_h_mm');
  });

  // A key must start with a letter, so a leading digit can't just be slugged.
  it('strips leading non-letters', () => {
    expect(slugifyFieldName('2nd contact')).toBe('nd_contact');
  });

  // '' means "no usable key yet" — the composer keeps Add dimmed rather than
  // showing an error while the user is still typing.
  it('returns empty when no valid key can be derived', () => {
    for (const input of ['', '   ', '123', '!!!', '_']) {
      expect(slugifyFieldName(input)).toBe('');
    }
  });

  it('always produces something the DB pattern accepts, or nothing', () => {
    for (const input of ['Delivery Date', '2nd contact', 'W x H (mm)', 'a'.repeat(90)]) {
      const slug = slugifyFieldName(input);
      if (slug !== '') expect(slug).toMatch(FIELD_NAME_PATTERN);
    }
  });

  it('truncates over-long labels to a key the column accepts', () => {
    const slug = slugifyFieldName('a'.repeat(90));
    expect(slug.length).toBeLessThanOrEqual(63);
    expect(slug).toMatch(FIELD_NAME_PATTERN);
  });
});
