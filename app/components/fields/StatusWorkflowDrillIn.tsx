'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import StatusWorkflowEditor from '@/components/fields/StatusWorkflowEditor';
import { useDebouncedSave } from '@/components/fields/use-debounced-save';
import type { FieldOption } from '@/lib/fields/options';

interface StatusWorkflowDrillInProps {
  /** Singular entity noun, for the editor's subtitle. */
  entityLabel: string;
  initialOptions: FieldOption[];
  /**
   * Persist the stages. For a field that already exists this is a PATCH; for
   * one still staged it just records the edit for Continue to apply.
   */
  onSave: (options: FieldOption[]) => Promise<void>;
  /** Copy for the save note — the two cases genuinely differ. */
  persistence: 'immediate' | 'staged';
  onBack: () => void;
  disabled?: boolean;
}

/**
 * Hosts the status workflow editor and owns when its changes are written.
 *
 * Separate from the editor so the editor stays a controlled component the
 * field manager can reuse later with different persistence, and separate from
 * the setup step so the debounce hook isn't called conditionally.
 */
export default function StatusWorkflowDrillIn({
  entityLabel,
  initialOptions,
  onSave,
  persistence,
  onBack,
  disabled,
}: StatusWorkflowDrillInProps) {
  const [options, setOptions] = useState<FieldOption[]>(initialOptions);
  const { status, failure, markDirty } = useDebouncedSave(options, onSave);

  return (
    <div className="space-y-2">
      <StatusWorkflowEditor
        value={options}
        onChange={next => {
          markDirty();
          setOptions(next);
        }}
        onBack={onBack}
        entityLabel={entityLabel}
        disabled={disabled}
      />

      {failure ? (
        <p className="text-[10.5px] font-semibold text-destructive">{failure}</p>
      ) : status === 'saving' ? (
        <p className="flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </p>
      ) : (
        <p className="flex items-center gap-1 text-[10.5px] font-semibold text-success">
          <Check className="h-3 w-3" strokeWidth={3} />
          {persistence === 'immediate'
            ? 'Stages save as you edit them'
            : 'Stages save when you continue'}
        </p>
      )}
    </div>
  );
}
