'use client';

import { Switch } from '@/components/ui/switch';
import { useSettingsBlock } from '@/hooks/organization/useSettingsBlock';
import { SaveBlock, SettingsSection, TextSetting, ToggleRow } from './settings-parts';

/**
 * Whether and how the business charges tax.
 *
 * `inclusive` is the load-bearing one: it decides whether a line price already
 * contains tax, and v2.documents stores the answer per document
 * (`amounts_include_tax`) precisely because subtotal and tax_total are
 * ambiguous without it. Changing it here changes future documents only —
 * issued ones keep the answer they were frozen with.
 *
 * The rate and label are only asked for once tax is switched on; an org that
 * doesn't charge tax shouldn't have to dismiss two fields about it.
 */
export default function TaxSettingsForm() {
  const { draft, set, save, dirty, saving, isOwner, isLoading } = useSettingsBlock('tax');
  const disabled = !isOwner || isLoading || saving;
  const registered = draft.registered === true;

  return (
    <SettingsSection title="Tax" description="Applied to new documents as you issue them.">
      <ToggleRow label="Charge tax" hint="Turn on if you're registered for VAT or sales tax.">
        <Switch
          checked={registered}
          disabled={disabled}
          aria-label="Charge tax"
          onCheckedChange={checked => set('registered', checked)}
        />
      </ToggleRow>

      {registered && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextSetting
              id="tax-label"
              label="Name"
              placeholder="VAT"
              hint="How it's labelled on the document."
              value={draft.label}
              onChange={v => set('label', v)}
              disabled={disabled}
            />
            <TextSetting
              id="tax-rate"
              label="Rate (%)"
              type="number"
              placeholder="18"
              value={draft.rate === undefined ? '' : String(draft.rate)}
              // Empty clears back to undefined so the key is omitted rather
              // than sent as 0, which would mean "a real 0% rate".
              onChange={v => set('rate', v === '' ? undefined : Number(v))}
              disabled={disabled}
            />
          </div>

          <ToggleRow
            label="Prices include tax"
            hint="On: your listed prices already contain tax. Off: tax is added on top."
          >
            <Switch
              checked={draft.inclusive === true}
              disabled={disabled}
              aria-label="Prices include tax"
              onCheckedChange={checked => set('inclusive', checked)}
            />
          </ToggleRow>
        </>
      )}

      <SaveBlock dirty={dirty} saving={saving} isOwner={isOwner} onSave={save} />
    </SettingsSection>
  );
}
