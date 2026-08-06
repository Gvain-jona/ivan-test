/**
 * The brand colours an organization can choose from.
 *
 * A fixed set rather than a free colour picker, on purpose: every light/dark
 * pair below was solved for WCAG 2 AA once, at authoring time, so there is no
 * runtime path where an org picks a pale yellow and ships invisible button
 * text. See the measured table under BRAND_PRESETS.
 *
 * Light and dark carry different lightness *and* opposite foreground polarity
 * — a brand tuned for a white page is muddy on a near-black one. That is the
 * standard dark-mode treatment and the reason primaryForeground is a token
 * rather than a constant.
 *
 * This module is client-safe (pure data — no auth, no server imports): the
 * settings picker imports it directly. The server-side resolution lives in
 * ./brand.ts.
 *
 * Swapping in a free colour picker later means replacing buildTokens() with
 * oklch ramp generation (fixed L/C, org hue, chroma clamped to sRGB) and
 * running the same contrast gate. Nothing downstream changes — brandCssText()
 * is the seam.
 */

export const BRAND_PRESET_IDS = [
  'ember',
  'amber',
  'forest',
  'teal',
  'ocean',
  'indigo',
  'violet',
  'crimson',
] as const;

export type BrandPresetId = (typeof BRAND_PRESET_IDS)[number];

/** Matches the orange this app shipped with, so existing orgs don't shift. */
export const DEFAULT_BRAND_PRESET: BrandPresetId = 'ember';

export interface BrandTokens {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
}

export interface BrandPreset {
  id: BrandPresetId;
  label: string;
  /**
   * Ready-to-render CSS colours for the picker swatch. A swatch is a sample
   * of the colour itself, not a themed surface, so it shows the light pair in
   * both themes — and the foreground comes from that same verified pair
   * rather than --primary-foreground, which flips to near-black in dark mode
   * and would be unreadable on this chip.
   */
  swatch: string;
  swatchForeground: string;
  light: BrandTokens;
  dark: BrandTokens;
}

/**
 * Per-preset solved values: hue, then the saturation/lightness that clears the
 * contrast gate in each theme.
 *
 * Measured (WCAG 2, normal text needs 4.5:1, non-text UI needs 3:1):
 *
 *              primary-fg on primary      primary on page bg
 *   preset     light      dark            light    dark      accent L / D
 *   ember      4.62:1     6.00:1          4.62:1   6.63:1    11.7 / 13.4
 *   amber      4.66:1     6.09:1          4.66:1   6.73:1     9.8 / 11.6
 *   forest     4.70:1     6.04:1          4.70:1   6.67:1     8.7 / 10.7
 *   teal       4.64:1     6.46:1          4.64:1   7.14:1     8.5 / 10.6
 *   ocean      4.63:1     6.04:1          4.63:1   6.67:1    11.2 / 12.8
 *   indigo     4.67:1     6.11:1          4.67:1   6.74:1    14.5 / 15.8
 *   violet     4.66:1     6.07:1          4.66:1   6.70:1    13.5 / 15.0
 *   crimson    4.62:1     6.06:1          4.62:1   6.69:1    12.6 / 14.4
 *
 * These are solved values, not eyeballed ones, and ./brand-presets.test.ts
 * re-derives every ratio on each run — so adding a preset or nudging a
 * lightness fails the suite rather than silently shipping a 3.9:1 button.
 * Adjust the numbers until it passes; don't relax the test.
 */
const SPECS: Array<{
  id: BrandPresetId;
  label: string;
  hue: number;
  light: [sat: number, lightness: number];
  dark: [sat: number, lightness: number];
}> = [
  { id: 'ember',   label: 'Ember',   hue: 16,  light: [100, 42.5], dark: [100, 58] },
  { id: 'amber',   label: 'Amber',   hue: 38,  light: [95, 32.5],  dark: [95, 42] },
  { id: 'forest',  label: 'Forest',  hue: 152, light: [70, 30.5],  dark: [65, 40.5] },
  { id: 'teal',    label: 'Teal',    hue: 174, light: [80, 28.5],  dark: [70, 40] },
  { id: 'ocean',   label: 'Ocean',   hue: 205, light: [90, 41],    dark: [90, 54] },
  { id: 'indigo',  label: 'Indigo',  hue: 245, light: [75, 64.5],  dark: [80, 74.5] },
  { id: 'violet',  label: 'Violet',  hue: 272, light: [72, 59],    dark: [80, 71] },
  { id: 'crimson', label: 'Crimson', hue: 350, light: [85, 49],    dark: [85, 68] },
];

/**
 * --accent is the hover surface every shadcn primitive reaches for (dropdown,
 * select, command, context menu) — a low-chroma tint of the brand, never the
 * brand at full saturation, which would turn each menu hover into a saturated
 * block. Its lightness is fixed per theme, so the tint is uniform across
 * presets and only the hue moves.
 */
function buildTokens(hue: number, sat: number, lightness: number, theme: 'light' | 'dark'): BrandTokens {
  const primary = `${hue} ${sat}% ${lightness}%`;
  return {
    primary,
    ring: primary,
    primaryForeground: theme === 'light' ? '0 0% 100%' : '0 0% 9%',
    accent: theme === 'light' ? `${hue} 60% 96%` : `${hue} 45% 18%`,
    accentForeground: theme === 'light' ? `${hue} 60% 20%` : '0 0% 98%',
  };
}

export const BRAND_PRESETS: Record<BrandPresetId, BrandPreset> = Object.fromEntries(
  SPECS.map((s) => [
    s.id,
    {
      id: s.id,
      label: s.label,
      swatch: `hsl(${s.hue} ${s.light[0]}% ${s.light[1]}%)`,
      swatchForeground: 'hsl(0 0% 100%)',
      light: buildTokens(s.hue, s.light[0], s.light[1], 'light'),
      dark: buildTokens(s.hue, s.dark[0], s.dark[1], 'dark'),
    },
  ]),
) as Record<BrandPresetId, BrandPreset>;

/** Ordered list for the picker; Object.values order isn't guaranteed by type. */
export const BRAND_PRESET_LIST: BrandPreset[] = SPECS.map((s) => BRAND_PRESETS[s.id]);

export function isBrandPresetId(value: unknown): value is BrandPresetId {
  return typeof value === 'string' && (BRAND_PRESET_IDS as readonly string[]).includes(value);
}

/**
 * The CSS an org's brand injects, as an unlayered :root/.dark pair.
 *
 * Three cascade facts this depends on — change any of them and the brand
 * silently stops applying:
 *   1. It must be emitted as a <style> element, never a style="" attribute.
 *      An inline declaration outranks every selector, so .dark could never
 *      override :root and the brand would be stuck at its light value.
 *   2. It is unlayered, so it outranks globals.css's `@layer base` tokens
 *      regardless of source order. That is what @layer is for.
 *   3. `.dark` must come after `:root`. Both match <html> at specificity
 *      (0,1,0), so source order decides the winner.
 *
 * Only a known preset id reaches this function, so no caller-controlled text
 * is ever interpolated into a stylesheet.
 */
export function brandCssText(id: BrandPresetId): string {
  const p = BRAND_PRESETS[id] ?? BRAND_PRESETS[DEFAULT_BRAND_PRESET];
  const vars = (t: BrandTokens) =>
    [
      `--primary:${t.primary}`,
      `--primary-foreground:${t.primaryForeground}`,
      `--accent:${t.accent}`,
      `--accent-foreground:${t.accentForeground}`,
      `--ring:${t.ring}`,
    ].join(';');
  return `:root{${vars(p.light)}}.dark{${vars(p.dark)}}`;
}
