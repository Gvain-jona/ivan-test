'use client';

import { ChevronDown, ChevronUp, Flag, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  OPTION_COLORS,
  OPTION_COLOR_NAMES,
  SEMANTIC_COLORS,
  optionColorClasses,
  optionColorName,
  type OptionColorName,
} from '@/lib/fields/colors';
import type { FieldOption } from '@/lib/fields/options';

export type Semantic = NonNullable<FieldOption['semantic']>;

/** What each semantic means, in the terms the info strip uses. */
export const SEMANTICS: { value: Semantic; hint: string }[] = [
  { value: 'open', hint: 'work in progress' },
  { value: 'won', hint: 'counts as earned' },
  { value: 'lost', hint: 'cancelled' },
];

/** One stage of a workflow: its colour, name, meaning, and place in the order. */
export function WorkflowStageRow({
  stage,
  first,
  last,
  onMove,
  onUpdate,
  onSetDefault,
  onRemove,
  disabled,
}: {
  stage: FieldOption;
  first: boolean;
  last: boolean;
  onMove: (delta: number) => void;
  onUpdate: (patch: Partial<FieldOption>) => void;
  onSetDefault: () => void;
  /** Omitted when this stage can't be removed — the × then isn't rendered. */
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="group flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5">
      <div className="flex flex-col">
        <ReorderButton direction="up" disabled={disabled || first} onClick={() => onMove(-1)} />
        <ReorderButton direction="down" disabled={disabled || last} onClick={() => onMove(1)} />
      </div>

      <ColorPicker
        color={stage.color}
        label={stage.label}
        onPick={color => onUpdate({ color })}
        disabled={disabled}
      />

      {/* Renaming changes the label only. `value` is what already sits in the
          order.status column of existing orders, so it's frozen at creation. */}
      <input
        value={stage.label}
        onChange={event => onUpdate({ label: event.target.value })}
        aria-label={`Rename ${stage.label}`}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent px-1 text-[13px] font-semibold text-foreground outline-none disabled:opacity-50"
      />

      {stage.is_default ? (
        <span className="flex-shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          starts here
        </span>
      ) : (
        <button
          type="button"
          onClick={onSetDefault}
          disabled={disabled}
          aria-label={`Make ${stage.label} the starting stage`}
          className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-60 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 disabled:pointer-events-none"
        >
          <Flag className="h-3 w-3" />
        </button>
      )}

      {/* Changing what a stage means never touches its colour — the shop picked
          that, and the two carry different information. */}
      <SemanticSelect
        value={(stage.semantic ?? 'open') as Semantic}
        onChange={semantic => onUpdate({ semantic })}
        disabled={disabled}
      />

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${stage.label}`}
          className="flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ReorderButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'up' | 'down';
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'up' ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Move ${direction}`}
      className="rounded text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}

function ColorPicker({
  color,
  label,
  onPick,
  disabled,
}: {
  color?: string;
  label: string;
  onPick: (color: OptionColorName) => void;
  disabled?: boolean;
}) {
  const current = optionColorName(color);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Colour for ${label}`}
          className="flex flex-shrink-0 items-center gap-0.5 rounded p-0.5 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className={cn('h-3.5 w-3.5 rounded-full', OPTION_COLORS[current].dot)} />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-1.5">
          {OPTION_COLOR_NAMES.map(name => (
            <button
              key={name}
              type="button"
              onClick={() => onPick(name)}
              aria-label={name}
              aria-pressed={name === current}
              className={cn(
                'h-6 w-6 rounded-full ring-offset-2 ring-offset-popover transition-all',
                OPTION_COLORS[name].dot,
                name === current && 'ring-2 ring-foreground',
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The stage's meaning, shown as the tag the design makes the point about. */
export function SemanticSelect({
  value,
  onChange,
  disabled,
}: {
  value: Semantic;
  onChange: (next: Semantic) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={next => onChange(next as Semantic)} disabled={disabled}>
      <SelectTrigger
        aria-label="What this stage means"
        className={cn(
          'h-6 w-auto flex-shrink-0 gap-1 border-0 px-1.5 text-[10px] font-semibold',
          optionColorClasses(SEMANTIC_COLORS[value]).chip,
        )}
      >
        {value}
      </SelectTrigger>
      <SelectContent>
        {SEMANTICS.map(({ value: semantic, hint }) => (
          <SelectItem key={semantic} value={semantic}>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-semibold text-foreground">{semantic}</span>
              <span className="text-[11px] text-muted-foreground">{hint}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
