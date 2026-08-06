import { resolveBrandTokens } from '@/lib/theme/brand';

/**
 * Emits the active organization's brand tokens as a global stylesheet.
 *
 * Rendered from app/dashboard/layout.tsx, which already awaits
 * resolveTenant() and is therefore already dynamic and org-aware — the root
 * layout stays org-free so `/` and `/auth/signin` pay no auth cost.
 *
 * Rendering this inside the dashboard subtree is fine: a <style> applies to
 * the whole document, so Radix portals (which mount to document.body,
 * outside this tree) still inherit the variables.
 *
 * The content is a fixed lookup keyed by a validated preset id, never
 * caller-supplied text. See brandCssText() for the three cascade rules this
 * depends on.
 */
export default async function BrandStyle() {
  const css = await resolveBrandTokens();
  return <style data-brand-tokens dangerouslySetInnerHTML={{ __html: css }} />;
}
