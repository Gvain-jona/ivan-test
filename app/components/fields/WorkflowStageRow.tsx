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
    /*
     * Below `sm` the name takes a line of its own and the controls wrap beneath
     * it: at 375px a single row left the input ~100px (~13 characters) and every
     * control a 12–24px tap target, well under the 44px the mobile design
     * philosophy mandates. `flex-wrap` + a full-width, order-first input gets
     * both without a second copy of the markup — from `sm` up the row is
     * unchanged.
     */
    <div className="group flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 sm:gap-1.5">
      {/* Reorder sits side-by-side on touch (two 44px targets can't stack in a
          row this tall) and returns to a stacked pair on pointer devices. */}
      <div className="flex flex-row sm:flex-col">
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
        className="order-first w-full min-w-0 bg-transparent px-1 py-1 text-[13px] font-semibold text-foreground outline-none disabled:opacity-50 sm:order-none sm:w-auto sm:flex-1 sm:py-0"
      />

      {stage.is_default ? (
        /* The badge's width is what made this row wrap a line further than the
           others on a phone, so on touch the same fact is a filled flag — the
           counterpart to the outline flag every other row shows. */
        <span
          aria-label="Starting stage"
          className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded bg-primary/10 text-primary sm:min-h-0 sm:min-w-0 sm:px-1.5 sm:py-0.5 sm:text-[10px] sm:font-semibold"
        >
          <Flag className="h-4 w-4 fill-current sm:hidden" />
          <span className="hidden sm:inline">starts here</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={onSetDefault}
          disabled={disabled}
          aria-label={`Make ${stage.label} the starting stage`}
          /* Full opacity on touch: `group-hover` never fires without a pointer,
             so the hover-reveal would have left this permanently dimmed. */
          className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-opacity hover:text-foreground focus-visible:opacity-100 disabled:pointer-events-none sm:min-h-0 sm:min-w-0 sm:p-1 sm:opacity-60 sm:group-hover:opacity-100"
        >
          <Flag className="h-4 w-4 sm:h-3 sm:w-3" />
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
          className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:min-w-0 sm:p-1"
        >
          <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
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
      className="flex min-h-11 min-w-11 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30 sm:min-h-0 sm:min-w-0"
    >
      <Icon className="h-4 w-4 sm:h-3 sm:w-3" />
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
          className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center gap-0.5 rounded disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:min-w-0 sm:p-0.5"
        >
          <span className={cn('h-4 w-4 rounded-full sm:h-3.5 sm:w-3.5', OPTION_COLORS[current].dot)} />
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
          'h-11 w-auto flex-shrink-0 gap-1 border-0 px-2.5 text-[11px] font-semibold sm:h-6 sm:px-1.5 sm:text-[10px]',
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
