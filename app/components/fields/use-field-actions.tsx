'use client';

import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  useFieldDefinitions,
  useFieldDefinitionMutations,
  type FieldDefinition,
  type FieldEntity,
} from '@/hooks/fields/useFieldDefinitions';
import type { FieldEdits } from './FieldEditor';
import type { FieldOption } from '@/lib/fields/options';

/**
 * Everything a field list writes, in one place — the components above it are
 * then only state and layout. Shared by first-run setup and the per-entity
 * field manager, so a field behaves the same wherever it's edited.
 *
 * Each mutation revalidates before returning, so callers can rely on the list
 * being current by the time they update their own UI state.
 */
export function useFieldActions(entity: FieldEntity) {
  const { toast } = useToast();
  const { fieldDefinitions, isLoading, mutate } = useFieldDefinitions(entity, { status: 'all' });
  const { createField, updateField, archiveField } = useFieldDefinitionMutations();

  const addField = async (input: Parameters<typeof createField>[0]): Promise<FieldDefinition> => {
    const created = await createField(input);
    await mutate();
    return created;
  };

  const saveField = async (id: string, edits: FieldEdits) => {
    await updateField(id, {
      field_label: edits.field_label.trim(),
      options: edits.options,
      is_required: edits.is_required,
      show_in_documents: edits.show_in_documents,
    });
    await mutate();
  };

  const saveOptions = async (id: string, options: FieldOption[]) => {
    await updateField(id, { options });
    await mutate();
  };

  const restore = async (id: string) => {
    // Called fire-and-forget (`void restore(id)`) from the archive toast's Undo
    // and the archived-row action, so a failure here would otherwise be a silent
    // unhandled rejection — the field just stays archived with no explanation.
    try {
      await updateField(id, { status: 'active' });
      await mutate();
    } catch (error) {
      toast({
        title: 'Could not restore that field',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  /**
   * Archiving is reversible, so it needs no confirm dialog — just a way back.
   * The toast is that way back (undo, not confirm); a confirm here would
   * reintroduce the modal this whole surface removes.
   */
  const archive = async (id: string, label: string) => {
    try {
      await archiveField(id);
      await mutate();
      toast({
        title: `Archived "${label}"`,
        description: 'Existing data stays readable.',
        action: (
          <ToastAction altText={`Restore ${label}`} onClick={() => void restore(id)}>
            Undo
          </ToastAction>
        ),
      });
    } catch (error) {
      toast({
        title: 'Could not archive that field',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return {
    fieldDefinitions,
    isLoading,
    mutate,
    createField,
    addField,
    saveField,
    saveOptions,
    restore,
    archive,
    toast,
  };
}
