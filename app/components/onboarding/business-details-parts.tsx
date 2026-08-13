'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { INDUSTRY_OPTIONS } from '@/lib/organization/presets';

/**
 * A1's furniture, transcribed from the frame: 20px gutters, a 44px field box
 * at 8px radius with a 1px border and 12px side padding, its 11/500 uppercase
 * label 6px above, and values at 14.5/500.
 */

/** The frame's page: 20px gutters, 52px above the mark, 28px below the action. */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-7 pt-[52px]">
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/** The frame's 44px box, as an editable field. */
export function TextBox({
  value,
  onChange,
  placeholder,
  label,
  type = 'text',
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  label: string;
  type?: 'text' | 'tel' | 'email';
}) {
  return (
    <input
      type={type}
      inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[14.5px] font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

/** The same box, as something that opens a picker. */
export function OpenBox({
  value,
  placeholder,
  label,
  onOpen,
}: {
  value: string;
  placeholder: string;
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={
          value
            ? 'truncate text-[14.5px] font-medium text-foreground'
            : 'truncate text-[14.5px] text-muted-foreground'
        }
      >
        {value || placeholder}
      </span>
      <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </button>
  );
}

/**
 * The industry shortlist, plus a box for a trade that isn't on it.
 *
 * Stored as free text, so the list is a suggestion rather than a taxonomy —
 * nothing downstream branches on the value yet, and inventing an enum would
 * make it harder to add the branch honestly later.
 */
export function IndustryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [other, setOther] = useState(
    value && !INDUSTRY_OPTIONS.includes(value) ? value : '',
  );

  return (
    <div className="space-y-5">
      <ul className="overflow-hidden rounded-xl border border-border">
        {INDUSTRY_OPTIONS.map((option, index) => (
          <li key={option}>
            {index > 0 && <div className="h-px bg-border" />}
            <button
              type="button"
              onClick={() => onChange(option)}
              className="flex w-full items-center justify-between px-3.5 py-3 text-left text-[14.5px] font-medium text-foreground"
            >
              {option}
              {value === option && <span className="text-[13px] text-primary">Selected</span>}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">SOMETHING ELSE</span>
        <div className="flex gap-2">
          <input
            value={other}
            onChange={event => setOther(event.target.value)}
            placeholder="Describe what you do"
            aria-label="Other industry"
            className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-[14.5px] font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={() => other.trim() && onChange(other.trim())}
            disabled={other.trim() === ''}
            className="h-11 flex-shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  );
}
