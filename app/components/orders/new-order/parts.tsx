'use client';

import { NEUTRAL_TAG_CLASSES, optionColorClasses } from '@/lib/fields/colors';
import { formatFieldValue } from '@/lib/fields/format';
import { normalizeOptions } from '@/lib/fields/options';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import type { DraftNote, DraftPayment } from '@/lib/orders/draft';

/** The one-line "nothing here yet" under a section that has an action. */
export function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-muted-foreground">{children}</p>;
}

/** `v2.payments.payment_method` is a fixed enum, so these labels are ours. */
const METHOD_LABELS: Record<DraftPayment['payment_method'], string> = {
  cash: 'Cash',
  mobile_money: 'Mobile money',
  bank: 'Bank',
  credit: 'Credit',
};

export function methodLabel(method: DraftPayment['payment_method']): string {
  return METHOD_LABELS[method];
}

/**
 * A note on the draft, with the org's own labels for whatever it categorised.
 *
 * The chips come from `note` field definitions, so an org that doesn't
 * categorise its notes gets a card with just the text — nothing is missing,
 * that org simply has no note types.
 */
export function NoteCard({
  note,
  fields,
  onRemove,
}: {
  note: DraftNote;
  fields: FieldDefinition[];
  /**
   * Absent on a saved note: `/api/notes` has no PATCH or DELETE, so the hub
   * has nothing to wire a remove button to. Present on a draft, where removal
   * is just dropping it from the list before the order is created.
   */
  onRemove?: () => void;
}) {
  const chips = fields.flatMap(field => {
    const raw = note.custom_data?.[field.field_name];
    const label = formatFieldValue(raw, field);
    if (label === null) return [];

    const option = normalizeOptions(field.options).find(entry => entry.value === raw);
    return [
      {
        key: field.field_name,
        label,
        color: option ? optionColorClasses(option.color).chip : NEUTRAL_TAG_CLASSES,
      },
    ];
  });

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {chips.map(chip => (
            <span
              key={chip.key}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.color}`}
            >
              {chip.label}
            </span>
          ))}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 text-[12px] font-medium text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        )}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[13px] text-foreground">{note.content}</p>
    </div>
  );
}
