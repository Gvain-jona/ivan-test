import { BRAND_PRESETS, type BrandPresetId } from '@/lib/theme/brand-presets';

const STYLE_ID = 'brand-tokens-live';

/**
 * Applies a brand preset in the current tab, immediately.
 *
 * Needed because the brand arrives as a Clerk session-token claim, and tokens
 * refresh on roughly a minute — without this, an owner who saves a colour
 * stares at the old one until the next refresh. On the next full load the
 * server-rendered <style> from BrandStyle takes over and this becomes
 * redundant, which is why it is keyed by id and simply replaced.
 *
 * Deliberately a <style> element and not documentElement.style.setProperty:
 * an inline style attribute outranks every selector, so setting --primary
 * there would pin the light-theme value and break dark mode until reload.
 * This element is appended last, so among unlayered rules of equal
 * specificity it wins — including over the server-rendered brand style.
 */
export function applyBrandPreset(id: BrandPresetId): void {
  if (typeof document === 'undefined') return;
  const preset = BRAND_PRESETS[id];
  if (!preset) return;

  const vars = (t: typeof preset.light) =>
    [
      `--primary:${t.primary}`,
      `--primary-foreground:${t.primaryForeground}`,
      `--accent:${t.accent}`,
      `--accent-foreground:${t.accentForeground}`,
      `--ring:${t.ring}`,
    ].join(';');

  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `:root{${vars(preset.light)}}.dark{${vars(preset.dark)}}`;
}
