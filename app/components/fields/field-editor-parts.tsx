'use client';

import { Check, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export type SaveStatus = 'idle' | 'saving' | 'saved';

/**
 * A labelled section of the field editor. The note beside the label explains
 * the setting in the user's terms rather than the schema's — it's the
 * difference between "OPTIONS" and knowing what options are for.
 */
export function EditorGroup({
  label,
  note,
  status,
  children,
}: {
  label: string;
  note?: string;
  status?: SaveStatus;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {note && <p className="text-[9.5px] text-muted-foreground">{note}</p>}
        <SaveIndicator status={status} />
      </div>
      {children}
    </div>
  );
}

function SaveIndicator({ status }: { status?: SaveStatus }) {
  if (status === 'saving') {
    return <Loader2 className="ml-auto h-3 w-3 animate-spin text-muted-foreground" />;
  }
  if (status === 'saved') {
    return (
      <span className="ml-auto flex items-center gap-0.5 text-[9.5px] font-semibold text-success">
        <Check className="h-3 w-3" strokeWidth={3} />
        Saved
      </span>
    );
  }
  return null;
}

/** One on/off rule, with the consequence of turning it on spelled out. */
export function EditorRule({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={title}
      />
    </div>
  );
}
