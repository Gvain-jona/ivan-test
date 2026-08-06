'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { apiRequest, PLATFORM_API } from '@/lib/api/client';
import { applyBrandPreset } from '@/components/theme/apply-brand';
import { BRAND_PRESET_LIST, type BrandPresetId } from '@/lib/theme/brand-presets';

/**
 * The organization's brand colour.
 *
 * A closed set of presets rather than a colour field: each one's light and
 * dark values are contrast-verified at authoring time, so no choice here can
 * produce unreadable buttons. See app/lib/theme/brand-presets.ts.
 *
 * Saving writes Clerk org metadata, which reaches the app as a session claim
 * on the next token refresh — so the new colour is also applied locally right
 * away, otherwise the owner would watch nothing happen for a minute.
 */
export default function BrandColorPicker() {
  const { brandColor, orgRole, isLoading, mutate } = useOrganization();
  const { toast } = useToast();
  const [saving, setSaving] = useState<BrandPresetId | null>(null);

  const isOwner = orgRole === 'owner';

  const select = async (id: BrandPresetId) => {
    if (!isOwner || id === brandColor || saving) return;
    setSaving(id);
    // Repaint first: the choice is reversible and the round trip is the slow
    // part, so the swatch shouldn't sit inert while it completes.
    applyBrandPreset(id);
    try {
      await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', { brand_color: id });
      await mutate();
    } catch (error) {
      applyBrandPreset(brandColor);
      toast({
        title: 'Could not save brand colour',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-foreground">Brand colour</h3>
        <p className="text-[13px] text-muted-foreground">
          {isOwner
            ? 'Used for buttons, links and focus rings across the app.'
            : 'Set by an owner. Used for buttons, links and focus rings.'}
        </p>
      </div>

      <fieldset disabled={!isOwner || isLoading} className="border-0 p-0">
        <legend className="sr-only">Brand colour</legend>
        <div role="radiogroup" aria-label="Brand colour" className="flex flex-wrap gap-2">
          {BRAND_PRESET_LIST.map(preset => {
            const selected = preset.id === brandColor;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={preset.label}
                onClick={() => select(preset.id)}
                className={[
                  'flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[13px]',
                  'transition-colors focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  selected
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="grid h-6 w-6 place-items-center rounded-full"
                  style={{ backgroundColor: preset.swatch, color: preset.swatchForeground }}
                >
                  {saving === preset.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : selected ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : null}
                </span>
                {preset.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
