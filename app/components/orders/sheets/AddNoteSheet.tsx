'use client';

import { useEffect, useState } from 'react';
import AppSheet from '@/components/ui/sheets/AppSheet';
import { FooterBar, SectionLabel } from '@/components/patterns/screen';
import { ScreenFields } from '@/components/fields/ScreenFields';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import type { CustomDataValue } from '@/lib/fields/visibility';
import type { DraftNote } from '@/lib/orders/draft';

interface AddNoteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (note: Omit<DraftNote, 'key'>) => void;
}

/**
 * Write a note against an order — B2c.
 *
 * The frame's TYPE chips are not a fixed list and not a column. `notes` gained
 * `custom_data` and `'note'` joined the field-definition entities in migration
 * 20260807213900 precisely so the list is the org's — which is why B2c and E2
 * draw different types on the canvas and both are right.
 *
 * An org with no note fields configured gets no TYPE section rather than an
 * empty one. That is the honest state: nothing is missing, the org simply
 * doesn't categorise its notes, and the note itself still saves.
 */
export default function AddNoteSheet({ open, onOpenChange, onAdd }: AddNoteSheetProps) {
  const { fieldDefinitions } = useFieldDefinitions('note');
  const [content, setContent] = useState('');
  const [customData, setCustomData] = useState<CustomDataValue>({});

  useEffect(() => {
    if (!open) {
      setContent('');
      setCustomData({});
    }
  }, [open]);

  const trimmed = content.trim();

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add note"
      size="default"
      footer={
        <FooterBar
          actionLabel="Add note"
          onAction={() => {
            onAdd({
              content: trimmed,
              ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
            });
            onOpenChange(false);
          }}
          disabled={trimmed === ''}
        />
      }
    >
      <div className="flex flex-col gap-[22px] px-4 py-4">
        <ScreenFields fields={fieldDefinitions} value={customData} onChange={setCustomData} />

        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>NOTE</SectionLabel>
          <textarea
            autoFocus
            rows={5}
            value={content}
            onChange={event => setContent(event.target.value)}
            placeholder="What should someone know about this order?"
            aria-label="Note"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
    </AppSheet>
  );
}
