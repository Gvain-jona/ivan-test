'use client';

import { Textarea } from '@/components/ui/textarea';
import { useSettingsBlock } from '@/hooks/organization/useSettingsBlock';
import { SaveBlock, SettingsField, SettingsSection, TextSetting } from './settings-parts';

/**
 * Who the business is, as it appears on a document.
 *
 * This is the block v2.issue_document() freezes into every invoice and
 * quotation snapshot as the issuer, which makes it the one piece of org config
 * that can't be filled in later: a document issued before it is set carries a
 * blank letterhead forever, because an issued snapshot is immutable by design.
 *
 * First-run collects currency only, so an org that skipped straight to
 * invoicing has none of this. That is the gap this form closes.
 */
export default function BusinessIdentityForm() {
  const { draft, set, save, dirty, saving, isOwner, isLoading } = useSettingsBlock('identity');
  const disabled = !isOwner || isLoading || saving;

  return (
    <SettingsSection
      title="Business details"
      description="Printed at the top of every invoice, quotation and receipt."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextSetting
          id="identity-legal-name"
          label="Registered name"
          hint="The name on your registration, if it differs from your trading name."
          value={draft.legal_name}
          onChange={v => set('legal_name', v)}
          disabled={disabled}
        />
        <TextSetting
          id="identity-trading-name"
          label="Trading name"
          placeholder="What customers call you"
          value={draft.trading_name}
          onChange={v => set('trading_name', v)}
          disabled={disabled}
        />
        <TextSetting
          id="identity-phone"
          label="Phone"
          value={draft.phone}
          onChange={v => set('phone', v)}
          disabled={disabled}
        />
        <TextSetting
          id="identity-email"
          label="Email"
          type="email"
          value={draft.email}
          onChange={v => set('email', v)}
          disabled={disabled}
        />
        <TextSetting
          id="identity-tax-id"
          label="Tax ID (TIN)"
          hint="Shown on documents where a tax number is required."
          value={draft.tax_id}
          onChange={v => set('tax_id', v)}
          disabled={disabled}
        />
        <TextSetting
          id="identity-website"
          label="Website"
          value={draft.website}
          onChange={v => set('website', v)}
          disabled={disabled}
        />
      </div>

      <SettingsField id="identity-address" label="Address">
        <Textarea
          id="identity-address"
          rows={2}
          value={draft.address ?? ''}
          disabled={disabled}
          onChange={event => set('address', event.target.value)}
        />
      </SettingsField>

      <SaveBlock dirty={dirty} saving={saving} isOwner={isOwner} onSave={save} />
    </SettingsSection>
  );
}
