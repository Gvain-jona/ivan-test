import { settingsBlockPayload } from './settings-patch';
import type { OrganizationSettingsBlocks } from '@/lib/api/validators';

/**
 * Mapping between the invoice-settings form and the three places its values
 * actually live: organizations.settings blocks, the doc:invoice counter, and
 * field_definitions.show_in_documents.
 *
 * Pulled out of the screen because this is where mapping bugs hide — a key
 * spelled wrong here fails silently (the DB whitelist rejects the block, or the
 * value simply never travels), and it is cheap to test directly.
 *
 * Everything is held as strings while editing: an in-place text input has no
 * concept of "unset versus zero", and forcing numbers early turns a cleared
 * field into a real 0.
 */

export interface InvoiceDraft {
  format: string;
  /** The next number to be issued — one ahead of counters.current_value. */
  nextNumber: string;
  resetPolicy: string;
  termsDays: string;
  quoteValidityDays: string;
  currency: string;
  chargeTax: boolean;
  taxLabel: string;
  taxRate: string;
  inclusive: boolean;
  legalName: string;
  address: string;
  phone: string;
  taxId: string;
  bankDetails: string;
  showBankDetails: boolean;
  printFieldIds: string[];
}

export interface CounterLike {
  format: string;
  current_value: number;
  reset_policy: string;
}

const str = (value: unknown) => (value === undefined || value === null ? '' : String(value));
const num = (value: string) => (value.trim() === '' ? undefined : Number(value));

export function buildInvoiceDraft(
  settings: OrganizationSettingsBlocks,
  counter: CounterLike | undefined,
  fields: { id: string; show_in_documents: boolean }[],
): InvoiceDraft {
  return {
    format: str(counter?.format),
    // A counter holds the last number used, so the next one is one higher.
    nextNumber: str((counter?.current_value ?? 0) + 1),
    resetPolicy: str(counter?.reset_policy) || 'never',
    termsDays: str(settings.documents?.terms_days),
    quoteValidityDays: str(settings.documents?.quote_validity_days),
    currency: str(settings.locale?.currency),
    chargeTax: settings.tax?.registered === true,
    taxLabel: str(settings.tax?.label),
    taxRate: str(settings.tax?.rate),
    inclusive: settings.tax?.inclusive === true,
    legalName: str(settings.identity?.legal_name),
    address: str(settings.identity?.address),
    phone: str(settings.identity?.phone),
    taxId: str(settings.identity?.tax_id),
    bankDetails: str(settings.documents?.bank_details),
    showBankDetails: settings.documents?.show_bank_details === true,
    printFieldIds: fields.filter(f => f.show_in_documents).map(f => f.id),
  };
}

/**
 * The settings half of a save. Several blocks travel in one PATCH because the
 * route merges each named block independently.
 *
 * `locale` is only included when a currency is actually set — an empty block
 * would be a no-op the DB trigger still has to consider.
 */
export function invoiceSettingsPatch(draft: InvoiceDraft) {
  const blocks: Record<string, unknown> = {
    documents: settingsBlockPayload({
      terms_days: num(draft.termsDays),
      quote_validity_days: num(draft.quoteValidityDays),
      bank_details: draft.bankDetails,
      show_bank_details: draft.showBankDetails,
    }),
    tax: settingsBlockPayload({
      registered: draft.chargeTax,
      label: draft.taxLabel,
      rate: num(draft.taxRate),
      inclusive: draft.inclusive,
    }),
    identity: settingsBlockPayload({
      legal_name: draft.legalName,
      address: draft.address,
      phone: draft.phone,
      tax_id: draft.taxId,
    }),
  };

  if (draft.currency.trim()) {
    blocks.locale = { currency: draft.currency.trim().toUpperCase() };
  }

  return blocks;
}

/**
 * The numbering half, as a minimal patch — only what actually changed, so a
 * save that didn't touch numbering doesn't trip the route's increase-only
 * check on current_value.
 */
export function counterPatch(draft: InvoiceDraft, counter: CounterLike | undefined) {
  if (!counter) return {};
  const patch: Record<string, unknown> = {};

  if (draft.format && draft.format !== counter.format) patch.format = draft.format;
  if (draft.resetPolicy && draft.resetPolicy !== counter.reset_policy) {
    patch.reset_policy = draft.resetPolicy;
  }

  const nextValue = Number(draft.nextNumber) - 1;
  if (Number.isFinite(nextValue) && nextValue >= 0 && nextValue !== counter.current_value) {
    patch.current_value = nextValue;
  }

  return patch;
}
