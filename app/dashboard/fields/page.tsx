'use client';

import React, { useState } from 'react';
import { Plus, SlidersHorizontal, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useFieldDefinitions,
  useFieldDefinitionMutations,
  FIELD_ENTITIES,
} from '@/hooks/fields/useFieldDefinitions';
import type { FieldDefinition, FieldEntity } from '@/hooks/fields/useFieldDefinitions';
import FieldDefinitionFormSheet from '@/components/fields/FieldDefinitionFormSheet';
import { useToast } from '@/components/ui/use-toast';

/**
 * Field Setup — the org's field registry. Every row here becomes a
 * form field (and a validation rule enforced by the DB) on its entity:
 * clients, orders, order items, or products. Archiving removes a field
 * from forms without touching data already stored on records.
 */
export default function FieldSetupPage() {
  const { toast } = useToast();
  const [entity, setEntity] = useState<FieldEntity>('order');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<FieldDefinition | null>(null);

  const { fieldDefinitions, isLoading, mutate } = useFieldDefinitions(entity, { status: 'all' });
  const { updateField, archiveField } = useFieldDefinitionMutations();

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (field: FieldDefinition) => {
    setEditing(field);
    setSheetOpen(true);
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
    <div className="space-y-5 min-h-screen px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Field Setup</h1>
          <p className="text-sm text-muted-foreground">
            Define the custom fields your forms collect — per entity, validated by the database.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Field
        </Button>
      </div>

      <Tabs value={entity} onValueChange={v => setEntity(v as FieldEntity)}>
        <TabsList className="bg-transparent border border-border/40 rounded-lg p-1">
          {FIELD_ENTITIES.map(e => (
            <TabsTrigger
              key={e.value}
              value={e.value}
              className="text-sm font-medium text-muted-foreground py-2 px-4 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
            >
              {e.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {FIELD_ENTITIES.map(e => (
          <TabsContent key={e.value} value={e.value} className="mt-4">
            <div className="border border-[#2B2B40] rounded-lg overflow-x-auto">
              <table className="w-full divide-y divide-[#2B2B40]">
                <thead className="bg-muted/10">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Label</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Machine key</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Group</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Required</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2B40]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Loading fields…
                      </td>
                    </tr>
                  ) : fieldDefinitions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        <SlidersHorizontal className="h-6 w-6 mx-auto mb-2 opacity-60" />
                        <p className="text-sm">
                          No fields defined for {e.label.toLowerCase()}s yet
                        </p>
                      </td>
                    </tr>
                  ) : (
                    fieldDefinitions.map(field => (
                      <tr key={field.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 text-sm text-white">{field.field_label}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground font-mono">
                          {field.field_name}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-white capitalize">
                          {field.field_type}
                          {field.field_type === 'select' && Array.isArray(field.options) && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({field.options.length})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">
                          {field.field_group ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center text-sm text-white">
                          {field.is_required ? 'Yes' : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="secondary"
                            className={
                              field.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-slate-500/10 text-slate-400'
                            }
                          >
                            {field.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="inline-flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(field)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit {field.field_label}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchiveToggle(field)}
                            >
                              {field.status === 'archived' ? (
                                <ArchiveRestore className="h-4 w-4" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {field.status === 'archived' ? 'Restore' : 'Archive'}{' '}
                                {field.field_label}
                              </span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <FieldDefinitionFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        entity={entity}
        field={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
