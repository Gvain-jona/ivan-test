'use client';

import { useMemo, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  useFieldDefinitions,
  useFieldDefinitionMutations,
} from '@/hooks/fields/useFieldDefinitions';
import FieldDefinitionFormSheet from '@/components/fields/FieldDefinitionFormSheet';
import { STARTER_FIELDS, type StarterEntity } from '@/lib/organization/presets';
import { starterFieldsToApply } from '@/lib/organization/apply-presets';

interface EntityFieldSetupStepProps {
  entity: StarterEntity;
  /** Called after the chosen fields are saved, to advance the wizard. */
  onContinue: () => void;
  /** Opens the "create your first record" sheet for this entity. */
  onCreateFirst: () => void;
  createLabel: string;
}

/**
 * One entity's field-setup step: the predefined starter fields (toggle on/
 * off), any fields the org already added, and an escape hatch to define a
 * custom one — all in the context of the entity they belong to (this is the
 * per-entity replacement for the standalone field-setup page). Continue
 * applies the kept starters (idempotent) then advances.
 */
export default function EntityFieldSetupStep({
  entity,
  onContinue,
  onCreateFirst,
  createLabel,
}: EntityFieldSetupStepProps) {
  const { toast } = useToast();
  const { fieldDefinitions, mutate } = useFieldDefinitions(entity, { status: 'all' });
  const { createField } = useFieldDefinitionMutations();
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const starters = STARTER_FIELDS[entity];
  const existingNames = useMemo(
    () => new Set(fieldDefinitions.map(f => f.field_name)),
    [fieldDefinitions],
  );

  // Kept starters, keyed by field_name. Default: everything on. A starter
  // already created in the org is always "kept" and locked on.
  const [unkept, setUnkept] = useState<Set<string>>(new Set());
  const isKept = (name: string) => existingNames.has(name) || !unkept.has(name);

  const toggle = (name: string) => {
    setUnkept(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Custom fields the org added that aren't part of the starter set.
  const customFields = fieldDefinitions.filter(
    f => f.status === 'active' && !starters.some(s => s.field_name === f.field_name),
  );

  const handleContinue = async () => {
    const keep = new Set(starters.map(s => s.field_name).filter(isKept));
    const toCreate = starterFieldsToApply(entity, keep, fieldDefinitions);
    setSaving(true);
    try {
      for (const field of toCreate) await createField(field);
      await mutate();
      onContinue();
    } catch (error) {
      toast({
        title: 'Could not save fields',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {starters.map(field => {
          const created = existingNames.has(field.field_name);
          const options = field.options ?? [];
          return (
            <label
              key={field.field_name}
              htmlFor={`starter-${entity}-${field.field_name}`}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              <Checkbox
                id={`starter-${entity}-${field.field_name}`}
                checked={isKept(field.field_name)}
                disabled={created || saving}
                onCheckedChange={() => toggle(field.field_name)}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{field.field_label}</span>
                  <Badge variant="outline" className="text-xs font-normal capitalize">
                    {field.field_type}
                  </Badge>
                  {created && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Added
                    </Badge>
                  )}
                </span>
                {options.length > 0 && (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {options.map(o => (
                      <span
                        key={o.value}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {o.label}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {customFields.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customFields.map(f => (
            <Badge key={f.id} variant="secondary" className="font-normal">
              {f.field_label}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add your own field
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCreateFirst}>
          {createLabel}
        </Button>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="button" onClick={handleContinue} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save &amp; continue
        </Button>
      </div>

      <FieldDefinitionFormSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        entity={entity}
        field={null}
        onSaved={() => {
          setAddOpen(false);
          void mutate();
        }}
      />
    </div>
  );
}
