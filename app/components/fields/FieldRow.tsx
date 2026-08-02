'use client';

import { ChevronDown, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { fieldTypeTagClasses } from '@/lib/fields/colors';
import type { FieldOption } from '@/lib/fields/options';

export interface FieldRowProps {
  label: string;
  fieldType: string;
  /** Select options, previewed inline so the row shows its shape at a glance. */
  options?: FieldOption[];
  /** Kept (during setup) / active (in the field manager). */
  checked: boolean;
  onCheckedChange?: (next: boolean) => void;
  /**
   * Locked on — system fields, and fields that already exist in the org. The
   * switch stays visibly on but can't be moved.
   */
  locked?: boolean;
  /** Why it's locked, for the switch's accessible name and its tooltip. */
  lockedReason?: string;
  /** Short qualifier after the tag, e.g. "shows only for Contract clients". */
  note?: string;
  /** Small pill after the label, e.g. "Added". */
  badge?: string;
  /**
   * Briefly highlight the row — used right after it's added, so the eye finds
   * the new field in place instead of the list reopening or jumping.
   */
  flash?: boolean;
  /**
   * Opens the row's editor. Only pass this when there is actually something to
   * edit — the chevron is a promise that expanding does something.
   */
  onToggleExpand?: () => void;
  expanded?: boolean;
  /** The editor, rendered inside the row while expanded. */
  children?: React.ReactNode;
  /** Replaces the option chips while expanded, e.g. "Just added · editing". */
  subtitle?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * One field in an entity's field list — the row shared by first-run setup and
 * the per-entity field manager.
 *
 * Switched off, the content dims but stays legible: turning a field off is a
 * choice the user should still be able to read and reverse, not a disappearance.
 *
 * Deliberately has no expand chevron yet. Inline editing arrives in redesign
 * phase 4; showing the affordance before it works would break the "every
 * signifier is wired" rule in CLAUDE.md.
 */
export default function FieldRow({
  label,
  fieldType,
  options,
  checked,
  onCheckedChange,
  locked,
  lockedReason,
  note,
  badge,
  flash,
  onToggleExpand,
  expanded,
  children,
  subtitle,
  disabled,
  className,
}: FieldRowProps) {
  return (
    <div className={rowSurfaceClasses({ flash, locked, disabled, className })}>
      <div className="flex items-start gap-3">
        <div className={cn('min-w-0 flex-1 space-y-1.5', !checked && 'opacity-60')}>
          <FieldRowMeta
            label={label}
            fieldType={fieldType}
            locked={locked}
            lockedReason={lockedReason}
            badge={badge}
            note={note}
          />
          <FieldRowDetail subtitle={subtitle} options={options} expanded={expanded} />
        </div>

        <ExpandToggle
          label={label}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          disabled={disabled}
        />

        <FieldRowSwitch
          label={label}
          checked={checked}
          onCheckedChange={onCheckedChange}
          locked={locked}
          lockedReason={lockedReason}
          disabled={disabled}
        />
      </div>

      {expanded && children && <div className="mt-3">{children}</div>}
    </div>
  );
}

/** The row's own surface: flat by default, ringed while the add-flash runs. */
function rowSurfaceClasses({
  flash,
  locked,
  disabled,
  className,
}: Pick<FieldRowProps, 'flash' | 'locked' | 'disabled' | 'className'>) {
  return cn(
    'rounded-xl border bg-card p-3 transition-all duration-500',
    flash ? 'border-primary ring-2 ring-primary/40' : 'border-border',
    !locked && !disabled && !flash && 'hover:border-primary/40',
    className,
  );
}

/**
 * What sits under the row's name: either a status line while it's open, or a
 * preview of its options while it's closed — never both, so a collapsed row
 * shows its shape and an open one doesn't repeat what the editor already has.
 */
function FieldRowDetail({
  subtitle,
  options,
  expanded,
}: Pick<FieldRowProps, 'subtitle' | 'options' | 'expanded'>) {
  if (subtitle) return <p className="text-[11px] text-muted-foreground">{subtitle}</p>;
  if (expanded || !options?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(option => (
        <span
          key={option.value}
          className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
        >
          {option.label}
        </span>
      ))}
    </div>
  );
}

/**
 * The chevron that opens the row's editor. Renders nothing without a handler,
 * so a row with nothing to edit shows no affordance promising otherwise.
 */
function ExpandToggle({
  label,
  expanded,
  onToggleExpand,
  disabled,
}: Pick<FieldRowProps, 'label' | 'expanded' | 'onToggleExpand' | 'disabled'>) {
  if (!onToggleExpand) return null;
  return (
    <button
      type="button"
      onClick={onToggleExpand}
      disabled={disabled}
      aria-expanded={!!expanded}
      aria-label={`${expanded ? 'Close' : 'Edit'} ${label}`}
      className="flex-shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
    </button>
  );
}

/** The keep/drop control, named for what it does to the field it sits beside. */
function FieldRowSwitch({
  label,
  checked,
  onCheckedChange,
  locked,
  lockedReason,
  disabled,
}: Pick<
  FieldRowProps,
  'label' | 'checked' | 'onCheckedChange' | 'locked' | 'lockedReason' | 'disabled'
>) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={locked || disabled}
      aria-label={locked ? `${label} — ${lockedReason ?? 'always on'}` : `Keep ${label}`}
    />
  );
}

/** The row's identity line: name, type tag, and any qualifiers on it. */
function FieldRowMeta({
  label,
  fieldType,
  locked,
  lockedReason,
  badge,
  note,
}: Pick<FieldRowProps, 'label' | 'fieldType' | 'locked' | 'lockedReason' | 'badge' | 'note'>) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span
        className={cn(
          'rounded px-1.5 py-0.5 text-[10px] font-semibold',
          fieldTypeTagClasses(fieldType),
        )}
      >
        {fieldType}
      </span>
      {locked && (
        <Lock className="h-3 w-3 text-muted-foreground" aria-label={lockedReason ?? 'Always on'} />
      )}
      {badge && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {badge}
        </span>
      )}
      {note && <span className="text-[11px] text-muted-foreground">· {note}</span>}
    </div>
  );
}
