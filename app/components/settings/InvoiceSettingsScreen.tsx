'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, Divided, ScreenFooter, ScreenHeader, Section } from '@/components/patterns/screen';
import {
  EditRow,
  SwitchRow,
  ToggleChip,
  ValueRow,
} from '@/components/patterns/settings-rows';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { useCounters } from '@/hooks/organization/useCounters';
import {
  useFieldDefinitions,
  useFieldDefinitionMutations,
} from '@/hooks/fields/useFieldDefinitions';
import { apiRequest, PLATFORM_API } from '@/lib/api/client';
import {
  buildInvoiceDraft,
  counterPatch,
  invoiceSettingsPatch,
  type InvoiceDraft as Draft,
} from '@/lib/organization/invoice-settings-draft';

const RESET_POLICIES = ['never', 'yearly', 'monthly'] as const;

const str = (value: unknown) => (value === undefined || value === null ? '' : String(value));

/**
 * Invoice settings (F3 on the Pencil canvas).
 *
 * Everything a document says about itself that isn't the order: how it's
 * numbered, what it defaults to, whether tax applies, whose letterhead it
 * carries, how to pay it, and which custom fields print.
 *
 * One Save, three destinations — the frame shows a single footer action, and
 * the split behind it is an implementation detail the user shouldn't have to
 * know: settings blocks go to PATCH /api/organization (which merges per block,
 * so several can travel together), numbering goes to PATCH /api/counters, and
 * the print toggles are field_definitions rows.
 *
 * Values edit in place. There are no chevrons on these rows, and per the
 * mobile guardrails a signifier that isn't wired shouldn't be drawn — so
 * tapping a value turns it into an input rather than opening anything.
 */
export default function InvoiceSettingsScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const { settings, orgRole, mutate: mutateOrg } = useOrganization();
  const { counters, updateCounter, mutate: mutateCounters } = useCounters();
  const { fieldDefinitions, mutate: mutateFields } = useFieldDefinitions(undefined, {
    status: 'active',
  });
  const { updateField } = useFieldDefinitionMutations();

  const isOwner = orgRole === 'owner';
  const invoiceCounter = counters.find(c => c.counter_key === 'doc:invoice');

  const [editing, setEditing] = useState<keyof Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  // Rebuild the draft whenever the server values actually change — keyed on a
  // serialized snapshot so a fresh object identity per render doesn't re-arm it.
  const serverKey = JSON.stringify({
    settings,
    invoiceCounter,
    fields: fieldDefinitions.map(f => ({ id: f.id, show_in_documents: f.show_in_documents })),
  });
  useEffect(() => {
    const server = JSON.parse(serverKey) as Parameters<typeof buildInvoiceDraft> extends never
      ? never
      : {
          settings: Parameters<typeof buildInvoiceDraft>[0];
          invoiceCounter?: Parameters<typeof buildInvoiceDraft>[1];
          fields: Parameters<typeof buildInvoiceDraft>[2];
        };
    setDraft(buildInvoiceDraft(server.settings ?? {}, server.invoiceCounter, server.fields));
    setEditing(null);
  }, [serverKey]);

  const printableFields = useMemo(
    () => fieldDefinitions.filter(f => f.status === 'active'),
    [fieldDefinitions],
  );

  if (!draft) return null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft(current => (current ? { ...current, [key]: value } : current));

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', {
        settings: invoiceSettingsPatch(draft),
      });

      const numbering = counterPatch(draft, invoiceCounter);
      if (Object.keys(numbering).length > 0) await updateCounter('doc:invoice', numbering);

      const wanted = new Set(draft.printFieldIds);
      await Promise.all(
        printableFields
          .filter(f => wanted.has(f.id) !== f.show_in_documents)
          .map(f => updateField(f.id, { show_in_documents: wanted.has(f.id) })),
      );

      await Promise.all([mutateOrg(), mutateCounters(), mutateFields()]);
      toast({ title: 'Invoice settings saved' });
    } catch (error) {
      toast({
        title: 'Could not save',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  /** A row that becomes an input when tapped. */
  const field = (
    key: keyof Draft,
    label: string,
    options: { type?: 'text' | 'number'; suffix?: string; placeholder?: string } = {},
  ) => {
    const value = str(draft[key]);
    if (editing === key && isOwner) {
      return (
        <EditRow
          label={label}
          value={value}
          type={options.type}
          placeholder={options.placeholder}
          onChange={next => set(key, next as Draft[typeof key])}
          onCommit={() => setEditing(null)}
        />
      );
    }
    return (
      <ValueRow
        label={label}
        value={value ? `${value}${options.suffix ?? ''}` : ''}
        placeholder={isOwner ? 'Set' : '—'}
        onEdit={isOwner ? () => setEditing(key) : undefined}
      />
    );
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <ScreenHeader title="Invoice settings" onBack={() => router.back()} />

      <div className="flex-1 space-y-[22px] px-4 py-[18px]">
        <Section label="NUMBERING">
          <Card>
            <Divided>
              {field('format', 'Format', { placeholder: 'INV-{YYYY}-{N5}' })}
              {field('nextNumber', 'Next number', { type: 'number' })}
              <ValueRow
                label="Resets"
                value={draft.resetPolicy}
                onEdit={
                  isOwner
                    ? () => {
                        const i = RESET_POLICIES.indexOf(
                          draft.resetPolicy as (typeof RESET_POLICIES)[number],
                        );
                        set('resetPolicy', RESET_POLICIES[(i + 1) % RESET_POLICIES.length]);
                      }
                    : undefined
                }
              />
            </Divided>
          </Card>
        </Section>

        <Section label="DEFAULTS">
          <Card>
            <Divided>
              {field('termsDays', 'Payment terms', { type: 'number', suffix: ' days' })}
              {field('quoteValidityDays', 'Quotation valid for', {
                type: 'number',
                suffix: ' days',
              })}
              {field('currency', 'Currency', { placeholder: 'UGX' })}
            </Divided>
          </Card>
        </Section>

        <Section label="TAX">
          <Card>
            <Divided>
              <SwitchRow
                label="Charge tax"
                checked={draft.chargeTax}
                onChange={next => set('chargeTax', next)}
                disabled={!isOwner}
              />
              {draft.chargeTax ? field('taxLabel', 'Name', { placeholder: 'VAT' }) : null}
              {draft.chargeTax ? field('taxRate', 'Rate', { type: 'number', suffix: '%' }) : null}
              {draft.chargeTax ? (
                <SwitchRow
                  label="Prices include tax"
                  checked={draft.inclusive}
                  onChange={next => set('inclusive', next)}
                  disabled={!isOwner}
                />
              ) : null}
            </Divided>
          </Card>
        </Section>

        <Section label="LETTERHEAD">
          <Card>
            <Divided>
              {field('legalName', 'Business name')}
              {field('address', 'Address')}
              {field('phone', 'Phone')}
              {field('taxId', 'Tax ID (TIN)')}
            </Divided>
          </Card>
        </Section>

        <Section label="PAYMENT INSTRUCTIONS">
          <textarea
            rows={3}
            disabled={!isOwner}
            value={draft.bankDetails}
            onChange={event => set('bankDetails', event.target.value)}
            placeholder="Pay to MTN Mobile Money 0772 100 200 — quote the invoice number."
            className="w-full rounded-[10px] border border-border bg-background p-3 text-[12.5px] leading-[18px] text-foreground outline-none focus:border-primary disabled:opacity-60"
          />
          <div className="mt-2">
            <SwitchRow
              label="Print on invoices"
              checked={draft.showBankDetails}
              onChange={next => set('showBankDetails', next)}
              disabled={!isOwner}
            />
          </div>
        </Section>

        <Section label="FIELDS THAT PRINT">
          {printableFields.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground">
              No custom fields yet. Fields you add to orders, clients or products can be printed
              on documents.
            </p>
          ) : (
            <div className="flex flex-wrap gap-[7px]">
              {printableFields.map(f => {
                const on = draft.printFieldIds.includes(f.id);
                return (
                  <ToggleChip
                    key={f.id}
                    label={f.field_label}
                    selected={on}
                    disabled={!isOwner}
                    onToggle={() =>
                      set(
                        'printFieldIds',
                        on
                          ? draft.printFieldIds.filter(id => id !== f.id)
                          : [...draft.printFieldIds, f.id],
                      )
                    }
                  />
                );
              })}
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Only affects documents issued from now on. Ones already issued keep what they were
            printed with.
          </p>
        </Section>
      </div>

      {isOwner && (
        <ScreenFooter actionLabel="Save changes" onAction={handleSave} busy={saving} />
      )}
    </div>
  );
}
