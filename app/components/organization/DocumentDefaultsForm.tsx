'use client';

import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSettingsBlock } from '@/hooks/organization/useSettingsBlock';
import {
  SaveBlock,
  SettingsField,
  SettingsSection,
  TextSetting,
  ToggleRow,
} from './settings-parts';

/**
 * Defaults every new document starts from.
 *
 * Defaults, not rules: POST /api/documents takes `terms_days` and
 * `validity_days` per issue, so the Issue sheet can override either without
 * coming back here. What's set here is what it offers first.
 *
 * `terms_days` becomes documents.due_date, which is what debt aging measures
 * from — so "0" and "unset" differ in meaning: unset is due on receipt.
 */
export default function DocumentDefaultsForm() {
  const { draft, set, save, dirty, saving, isOwner, isLoading } = useSettingsBlock('documents');
  const disabled = !isOwner || isLoading || saving;

  const numeric = (value: number | undefined) => (value === undefined ? '' : String(value));
  const toNumber = (value: string) => (value === '' ? undefined : Number(value));

  return (
    <SettingsSection
      title="Document defaults"
      description="What a new invoice or quotation starts with. Each one can still be changed as you issue it."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextSetting
          id="documents-terms-days"
          label="Payment terms (days)"
          type="number"
          placeholder="14"
          hint="Leave empty for due on receipt."
          value={numeric(draft.terms_days)}
          onChange={v => set('terms_days', toNumber(v))}
          disabled={disabled}
        />
        <TextSetting
          id="documents-quote-validity"
          label="Quotation valid for (days)"
          type="number"
          placeholder="14"
          value={numeric(draft.quote_validity_days)}
          onChange={v => set('quote_validity_days', toNumber(v))}
          disabled={disabled}
        />
      </div>

      <SettingsField
        id="documents-bank-details"
        label="Payment instructions"
        hint="How a customer pays you — mobile money number, bank account, or both."
      >
        <Textarea
          id="documents-bank-details"
          rows={3}
          placeholder="Pay to MTN Mobile Money 0772 100 200 — quote the invoice number."
          value={draft.bank_details ?? ''}
          disabled={disabled}
          onChange={event => set('bank_details', event.target.value)}
        />
      </SettingsField>

      <ToggleRow
        label="Show payment instructions"
        hint="Print them on invoices. Quotations never show them."
      >
        <Switch
          checked={draft.show_bank_details === true}
          disabled={disabled}
          aria-label="Show payment instructions"
          onCheckedChange={checked => set('show_bank_details', checked)}
        />
      </ToggleRow>

      <SettingsField id="documents-footer" label="Footer note">
        <Textarea
          id="documents-footer"
          rows={2}
          placeholder="Thank you for your business."
          value={draft.footer ?? ''}
          disabled={disabled}
          onChange={event => set('footer', event.target.value)}
        />
      </SettingsField>

      <SaveBlock dirty={dirty} saving={saving} isOwner={isOwner} onSave={save} />
    </SettingsSection>
  );
}
