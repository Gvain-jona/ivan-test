import { describe, expect, it } from 'vitest';
import {
  BRAND_PRESET_IDS,
  BRAND_PRESET_LIST,
  BRAND_PRESETS,
  DEFAULT_BRAND_PRESET,
  brandCssText,
  isBrandPresetId,
  type BrandTokens,
} from './brand-presets';

/**
 * Parses an "H S% L%" triplet and returns its WCAG relative luminance.
 * The tokens are stored unwrapped (consumed as `hsl(var(--x))`), so this
 * mirrors what the browser resolves them to.
 */
function luminance(triplet: string): number {
  const [h, s, l] = triplet.split(' ').map(part => Number(part.replace('%', '')));
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r, g, b] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x];
  const m = light - c / 2;
  const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const [rl, gl, bl] = [r + m, g + m, b + m].map(channel);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Page backgrounds from globals.css, which brand colours must sit on. */
const PAGE_BG = { light: '0 0% 100%', dark: '0 0% 3.9%' };

describe('brand presets', () => {
  /**
   * The whole reason this is a closed preset set rather than a colour picker
   * is that contrast is guaranteed up front. That guarantee is only real if
   * it's enforced — a comment claiming "4.6:1" cannot fail a build.
   */
  it.each(BRAND_PRESET_IDS)('%s clears WCAG AA in both themes', id => {
    const preset = BRAND_PRESETS[id];

    for (const theme of ['light', 'dark'] as const) {
      const t: BrandTokens = preset[theme];

      // Button/badge label on the brand colour: normal text, needs 4.5:1.
      expect(contrast(t.primaryForeground, t.primary)).toBeGreaterThanOrEqual(4.5);

      // Menu-item label on the hover surface: also normal text.
      expect(contrast(t.accentForeground, t.accent)).toBeGreaterThanOrEqual(4.5);

      // The brand block itself against the page: non-text UI, needs 3:1,
      // otherwise a primary button has no discernible edge.
      expect(contrast(t.primary, PAGE_BG[theme])).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the focus ring on the brand colour', () => {
    for (const preset of BRAND_PRESET_LIST) {
      expect(preset.light.ring).toBe(preset.light.primary);
      expect(preset.dark.ring).toBe(preset.dark.primary);
    }
  });

  it('gives dark mode a lighter brand and an inverted foreground', () => {
    for (const preset of BRAND_PRESET_LIST) {
      // Not cosmetic: a colour tuned for a white page reads muddy on a
      // near-black one, which is why these are per-theme tokens at all.
      expect(luminance(preset.dark.primary)).toBeGreaterThan(luminance(preset.light.primary));
      expect(luminance(preset.light.primaryForeground)).toBeGreaterThan(
        luminance(preset.dark.primaryForeground),
      );
    }
  });

  it('exposes every id in the ordered list', () => {
    expect(BRAND_PRESET_LIST.map(p => p.id)).toEqual([...BRAND_PRESET_IDS]);
    expect(isBrandPresetId(DEFAULT_BRAND_PRESET)).toBe(true);
  });

  it('rejects anything outside the set', () => {
    for (const value of ['chartreuse', '', '#ff0000', null, undefined, 42]) {
      expect(isBrandPresetId(value)).toBe(false);
    }
  });
});

describe('brandCssText', () => {
  it('emits :root before .dark so the dark override wins', () => {
    const css = brandCssText('ocean');
    // Equal specificity (0,1,0) against the same <html> element — source
    // order is the only thing deciding which applies.
    expect(css.indexOf(':root{')).toBeLessThan(css.indexOf('.dark{'));
  });

  it('sets all five brand tokens in both blocks', () => {
    const css = brandCssText('violet');
    const [root, dark] = css.split('.dark{');
    for (const block of [root, dark]) {
      for (const token of [
        '--primary:',
        '--primary-foreground:',
        '--accent:',
        '--accent-foreground:',
        '--ring:',
      ]) {
        expect(block).toContain(token);
      }
    }
  });

  it('falls back to the default for an unknown id', () => {
    // The id arrives as an untrusted session claim; callers narrow it, but a
    // miss must degrade rather than emit `--primary:undefined`.
    const css = brandCssText('chartreuse' as never);
    expect(css).toBe(brandCssText(DEFAULT_BRAND_PRESET));
    expect(css).not.toContain('undefined');
  });
});
