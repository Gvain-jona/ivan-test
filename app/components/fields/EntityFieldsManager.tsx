'use client';

import { useState } from 'react';
import { Plus, Pencil, Archive, ArchiveRestore, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useFieldDefinitions,
  useFieldDefinitionMutations,
} from '@/hooks/fields/useFieldDefinitions';
import type { FieldDefinition, FieldEntity } from '@/hooks/fields/useFieldDefinitions';
import FieldDefinitionFormSheet from '@/components/fields/FieldDefinitionFormSheet';
import { useToast } from '@/components/ui/use-toast';
import { normalizeOptions } from '@/lib/fields/options';

interface EntityFieldsManagerProps {
  entity: FieldEntity;
  /** Singular human label for empty-state copy, e.g. "product". */
  entityLabel: string;
}

/**
 * Manage one entity's custom fields in place — the per-entity replacement
 * for the retired standalone /dashboard/fields page (field setup lives with
 * the entity it belongs to). Add/edit reuses FieldDefinitionFormSheet;
 * archiving hides a field from forms without touching stored data.
 */
export default function EntityFieldsManager({ entity, entityLabel }: EntityFieldsManagerProps) {
  const { toast } = useToast();
  const { fieldDefinitions, isLoading, mutate } = useFieldDefinitions(entity, { status: 'all' });
  const { updateField, archiveField } = useFieldDefinitionMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FieldDefinition | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (field: FieldDefinition) => {
    setEditing(field);
    setFormOpen(true);
  };

  const handleArchiveToggle = async (field: FieldDefinition) => {
    try {
      if (field.status === 'archived') {
        await updateField(field.id, { status: 'active' });
        toast({ title: 'Field restored', description: field.field_label });
      } else {
        await archiveField(field.id);
        toast({ title: 'Field archived', description: field.field_label });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update field',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Custom fields on every {entityLabel}. Validated by the database; archiving hides a field
          without touching saved data.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New field
        </Button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading fields…</p>
      ) : fieldDefinitions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <SlidersHorizontal className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No custom fields on {entityLabel}s yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {fieldDefinitions.map(field => {
            const optionCount =
              field.field_type === 'select' ? normalizeOptions(field.options).length : 0;
            return (
              <li
                key={field.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{field.field_label}</span>
                    <Badge variant="outline" className="text-xs font-normal capitalize">
                      {field.field_type}
                      {optionCount ? ` · ${optionCount}` : ''}
                    </Badge>
                    {field.is_required && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        Required
                      </Badge>
                    )}
                    {field.status === 'archived' && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{field.field_name}</span>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(field)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit {field.field_label}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleArchiveToggle(field)}>
                    {field.status === 'archived' ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {field.status === 'archived' ? 'Restore' : 'Archive'} {field.field_label}
                    </span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <FieldDefinitionFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        entity={entity}
        field={editing}
        onSaved={() => {
          setFormOpen(false);
          void mutate();
        }}
      />
    </div>
  );
}
