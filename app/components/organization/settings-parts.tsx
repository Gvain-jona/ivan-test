'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * The shared furniture for an organization-settings block: a titled section,
 * a labelled field row, and the Save that commits the whole block.
 *
 * Save is per block, not per field, because PATCH /api/organization merges one
 * level into each named block — a block is the unit the API actually takes.
 */

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function SettingsField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextSetting({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  disabled,
  type = 'text',
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: 'text' | 'email' | 'number';
}) {
  return (
    <SettingsField id={id} label={label} hint={hint}>
      <Input
        id={id}
        type={type}
        inputMode={type === 'number' ? 'numeric' : undefined}
        placeholder={placeholder}
        value={value ?? ''}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
      />
    </SettingsField>
  );
}

/**
 * A row that reads as a sentence with a control at the end — for the on/off
 * decisions where a full field row would overstate the choice.
 */
export function ToggleRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function SaveBlock({
  dirty,
  saving,
  isOwner,
  onSave,
}: {
  dirty: boolean;
  saving: boolean;
  isOwner: boolean;
  onSave: () => void;
}) {
  if (!isOwner) {
    return <p className="text-[11px] text-muted-foreground">Only owners can change this.</p>;
  }
  return (
    <div className="flex justify-end">
      <Button type="button" size="sm" onClick={onSave} disabled={!dirty || saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save
      </Button>
    </div>
  );
}
