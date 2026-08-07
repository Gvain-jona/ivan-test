'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/hooks/organization/useOrganization';
import {
  useFieldDefinitions,
  useFieldDefinitionMutations,
  FIELD_ENTITIES,
  type FieldDefinition,
} from '@/hooks/fields/useFieldDefinitions';
import { SettingsSection } from './settings-parts';

/**
 * Which custom fields print on a document, all in one place.
 *
 * Each field's editor already carries this switch, but only one field at a
 * time and only from inside the entity it belongs to — so "what actually
 * appears on my invoice" was a question you could only answer by opening every
 * field in turn. A document is composed across entities (delivery from the
 * order, size from the line, category from the product), which is exactly the
 * view a per-entity editor can't give.
 *
 * Toggling writes immediately rather than collecting a Save: it is one
 * reversible boolean per chip, and a Save button over chips invites the reader
 * to think a batch is pending.
 */
export default function DocumentFieldsForm() {
  const { orgRole } = useOrganization();
  const { fieldDefinitions, isLoading } = useFieldDefinitions(undefined, { status: 'active' });
  const { updateField } = useFieldDefinitionMutations();
  const { toast } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const isOwner = orgRole === 'owner';

  const toggle = async (field: FieldDefinition) => {
    if (!isOwner || pending) return;
    setPending(field.id);
    try {
      await updateField(field.id, { show_in_documents: !field.show_in_documents });
    } catch (error) {
      toast({
        title: 'Could not change that field',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setPending(null);
    }
  };

  const groups = FIELD_ENTITIES.map(entity => ({
    ...entity,
    fields: fieldDefinitions.filter(f => f.entity === entity.value),
  })).filter(group => group.fields.length > 0);

  return (
    <SettingsSection
      title="Fields that print"
      description={
        isOwner
          ? 'Custom fields to include on invoices, quotations and receipts.'
          : 'Set by an owner. Custom fields included on documents.'
      }
    >
      {isLoading ? (
        <p className="text-[13px] text-muted-foreground">Loading fields…</p>
      ) : groups.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          No custom fields yet. Fields you add to orders, clients or products can be printed here.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.value} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.fields.map(field => {
                  const on = field.show_in_documents;
                  return (
                    <button
                      key={field.id}
                      type="button"
                      role="switch"
                      aria-checked={on}
                      disabled={!isOwner || pending !== null}
                      onClick={() => toggle(field)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px]',
                        'transition-colors focus-visible:outline-none focus-visible:ring-2',
                        'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        on
                          ? 'border-primary bg-accent text-accent-foreground'
                          : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {pending === field.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : on ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : null}
                      {field.field_label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Only affects documents issued from now on. Ones already issued keep what they were
        printed with.
      </p>
    </SettingsSection>
  );
}
