'use client';

import { useState } from 'react';
import { ChevronLeft, Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { slugifyOptionValue } from '@/lib/fields/slug';
import { SEMANTIC_COLORS } from '@/lib/fields/colors';
import type { FieldOption } from '@/lib/fields/options';
import { SemanticSelect, WorkflowStageRow, type Semantic } from './WorkflowStageRow';

interface StatusWorkflowEditorProps {
  /** The stages, in workflow order. */
  value: FieldOption[];
  onChange: (next: FieldOption[]) => void;
  onBack: () => void;
  /** Entity the workflow belongs to, for the subtitle. */
  entityLabel: string;
  disabled?: boolean;
}

/**
 * The order status workflow: the stages an order moves through, and what each
 * one *means* to the app.
 *
 * The meaning lives in `semantic`, not the name — Home segmentation and
 * done/cancelled logic read `open | won | lost`, so a shop can call a stage
 * anything and the app still knows what it is.
 *
 * Reordering is buttons rather than the design's drag handles: there's no
 * drag-and-drop library in the project, and adding one for a list of seven
 * wasn't worth the dependency. Buttons are also reachable by keyboard, which
 * a hand-rolled drag wouldn't have been.
 */
export default function StatusWorkflowEditor({
  value,
  onChange,
  onBack,
  entityLabel,
  disabled,
}: StatusWorkflowEditorProps) {
  const [draft, setDraft] = useState('');
  const [draftSemantic, setDraftSemantic] = useState<Semantic>('open');

  const trimmed = draft.trim();
  const newValue = slugifyOptionValue(trimmed);
  const duplicate = newValue !== '' && value.some(stage => stage.value === newValue);
  const canAdd = !disabled && newValue !== '' && !duplicate;

  const update = (index: number, patch: Partial<FieldOption>) =>
    onChange(value.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  /** Exactly one stage starts the workflow, so setting one clears the rest. */
  const setDefault = (index: number) =>
    onChange(value.map((stage, i) => ({ ...stage, is_default: i === index })));

  const add = () => {
    if (!canAdd) return;
    onChange([
      ...value,
      {
        value: newValue,
        label: trimmed,
        semantic: draftSemantic,
        color: SEMANTIC_COLORS[draftSemantic],
      },
    ]);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Back to fields"
          className="h-11 w-11 flex-shrink-0 sm:h-8 sm:w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-foreground">Status</h3>
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="rounded bg-opt-violet-bg px-1.5 py-0.5 text-[10px] font-semibold text-opt-violet-fg">
              select
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {entityLabel}s · system field, can&apos;t be removed
          </p>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-[11.5px] text-info">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Rename these stages to match your shop. What each one <strong>means</strong> is set by its
          tag — open is work in progress, won counts as earned, lost is cancelled. The app reads the
          tag, never the name.
        </span>
      </p>

      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Stages · use the arrows to reorder
        </p>
        {value.map((stage, index) => (
          <WorkflowStageRow
            key={stage.value}
            stage={stage}
            first={index === 0}
            last={index === value.length - 1}
            onMove={delta => move(index, delta)}
            onUpdate={patch => update(index, patch)}
            onSetDefault={() => setDefault(index)}
            // Removing the last stage is blocked, not warned: an empty options
            // array is NOT "unconstrained" to v2.value_in_options — only NULL
            // is. An active status field with [] rejects every order status
            // write, so this would brick order saving rather than loosen it.
            onRemove={
              value.length > 1 ? () => onChange(value.filter((_, i) => i !== index)) : undefined
            }
            disabled={disabled}
          />
        ))}
        {value.length === 1 && (
          <p className="text-[10.5px] text-muted-foreground">
            An order has to be in some stage, so the last one can&apos;t be removed. Add another
            first if you want to replace it.
          </p>
        )}
      </div>

      <form
        className="space-y-1.5"
        onSubmit={event => {
          event.preventDefault();
          add();
        }}
      >
        {/* Same wrap as FieldComposer: the stage name owns the first line on
            touch, its tag and Add sit beneath with real tap targets. */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
          <input
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder="Name a stage — e.g. Proofing"
            aria-label="New stage name"
            disabled={disabled}
            className="w-full min-w-0 bg-transparent px-1 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50 sm:w-auto sm:flex-1 sm:py-0"
          />
          <SemanticSelect value={draftSemantic} onChange={setDraftSemantic} disabled={disabled} />
          <Button
            type="submit"
            size="sm"
            disabled={!canAdd}
            className="ml-auto h-11 px-5 sm:ml-0 sm:h-8 sm:px-3"
          >
            Add
          </Button>
        </div>
        {duplicate ? (
          <p className="text-[10.5px] font-semibold text-destructive">
            &ldquo;{trimmed}&rdquo; is already a stage.
          </p>
        ) : (
          <p className="text-[10.5px] text-muted-foreground">
            New stages start as open — change the tag if the stage ends the job.
          </p>
        )}
      </form>
    </div>
  );
}
