'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AppSheet from '@/components/ui/sheets/AppSheet';
import { FooterBar, SectionLabel } from '@/components/patterns/screen';
import { ChoiceChip } from '@/components/patterns/controls';
import { useClientMutations } from '@/hooks/clients/useClients';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useToast } from '@/components/ui/use-toast';
import { normalizeOptions } from '@/lib/fields/options';
import type { Client } from '@/hooks/clients/useClients';

interface FirstClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefill for the name — the typed query from an inline "New client". */
  initialName?: string;
  /**
   * Handed the created client so the caller selects it straight onto the order.
   */
  onCreated: (client: Client) => void;
}

const box =
  'flex h-10 w-full items-center rounded-lg border border-border bg-background px-3 ' +
  'text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * The guided first client — the client-step twin of `FirstProductSheet`.
 *
 * The everyday `ClientFormSheet` is the full editor (every org-defined field,
 * the shadcn form vocabulary); dropping a first-time user into it mid-walk was
 * the odd note in the guide. This is the guided companion instead: the same
 * screen/controls vocabulary the product step uses, kept to Type → Name → Phone
 * — the org's seeded **Type** options (Walk-in, Regular, …) as chips so the
 * person sees the set is pre-configured, a required name, and the one contact
 * field a print shop reaches for. Email, company and address stay editable
 * later in Clients rather than burying the one order they came to make.
 *
 * Type and phone ride the created client's `custom_data` (only `name` is a v2
 * column); the caller selects the returned client onto the draft.
 */
export default function FirstClientSheet({
  open,
  onOpenChange,
  initialName,
  onCreated,
}: FirstClientSheetProps) {
  const { toast } = useToast();
  const { createClient } = useClientMutations();
  const { fieldDefinitions: clientFields } = useFieldDefinitions('client');

  const typeOptions = useMemo(() => {
    const field = clientFields.find(f => f.field_name === 'type');
    return field ? normalizeOptions(field.options) : [];
  }, [clientFields]);

  const [type, setType] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  // Synchronous double-submit latch, the pattern every write path here uses
  // (useOrderDraft, AddItemSheet, FirstProductSheet): `saving` only disables the
  // button after the re-render commits, so two taps in one tick would both reach
  // save() and create two clients. The ref flips before the first await.
  const savingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setType(null);
    setName(initialName ?? '');
    setPhone('');
    setSaving(false);
  }, [open, initialName]);

  const valid = name.trim() !== '';

  const save = async () => {
    if (!valid || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const customData: Record<string, unknown> = {};
      if (type) customData.type = type;
      if (phone.trim()) customData.phone = phone.trim();
      const created = await createClient({
        name: name.trim(),
        ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
      });
      onCreated(created);
      toast({ title: 'Client created', description: created.name });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Could not save the client',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Your first client"
      size="default"
      footer={
        <FooterBar
          actionLabel="Save & add to order"
          onAction={save}
          disabled={!valid || saving}
          busy={saving}
        />
      }
    >
      <div className="flex flex-col gap-[22px] px-4 py-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Clients carry Phone, Email, Type and more — refine those anytime in Clients. Add your
          first one and this order is theirs.
        </p>

        {typeOptions.length > 0 && (
          <div className="flex w-full flex-col gap-1.5">
            <SectionLabel>TYPE</SectionLabel>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type">
              {typeOptions.map(option => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={type === option.value}
                  onSelect={() => setType(type === option.value ? null : option.value)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>NAME</SectionLabel>
          <input
            autoFocus
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="e.g. Kampala Coffee Works"
            aria-label="Client name"
            className={box + ' placeholder:font-normal placeholder:text-muted-foreground'}
          />
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>PHONE</SectionLabel>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={event => setPhone(event.target.value)}
            placeholder="Optional"
            aria-label="Phone"
            className={box + ' placeholder:font-normal placeholder:text-muted-foreground'}
          />
        </div>
      </div>
    </AppSheet>
  );
}
