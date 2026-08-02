'use client';

import { useMemo, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FieldComposer, { FIELD_EXAMPLE, type ComposedField } from '@/components/fields/FieldComposer';
import type { FieldEdits } from '@/components/fields/FieldEditor';
import {
  FIXED_FIELDS,
  STARTER_FIELDS,
  type StarterEntity,
  type StarterField,
} from '@/lib/organization/presets';
import { starterFieldsToApply } from '@/lib/organization/apply-presets';
import { normalizeOptions } from '@/lib/fields/options';
import { SectionLabel, StepFooter } from './SetupShell';
import EntityFieldList from './EntityFieldList';
import StatusWorkflowDrillIn from '@/components/fields/StatusWorkflowDrillIn';
import { useFieldActions } from '@/components/fields/use-field-actions';

interface EntityFieldSetupStepProps {
  entity: StarterEntity;
  /** Called after the chosen fields are saved, to advance the wizard. */
  onContinue: () => void;
  /** Returns to the previous step; omitted only where there isn't one. */
  onBack?: () => void;
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
  onBack,
}: EntityFieldSetupStepProps) {
  const {
    fieldDefinitions,
    mutate,
    createField,
    addField,
    saveField,
    saveOptions,
    archive,
    toast,
  } = useFieldActions(entity);
  const [saving, setSaving] = useState(false);
  /** Id of the field just added, so its row can flash into place. */
  const [justAdded, setJustAdded] = useState<string | null>(null);
  /** Only one row is open at a time — the list stays scannable. */
  const [expanded, setExpanded] = useState<string | null>(null);
  /** A system field that has taken over the panel (currently just status). */
  const [drillIn, setDrillIn] = useState<string | null>(null);

  const starters = STARTER_FIELDS[entity];
  const existingNames = useMemo(
    () => new Set(fieldDefinitions.map(f => f.field_name)),
    [fieldDefinitions],
  );
  // Starters count as taken even before they're created: a starter that's
  // still switched on will be created on Continue, so adding the same name now
  // would collide then rather than here.
  const allNames = useMemo(
    () => new Set([...existingNames, ...starters.map(s => s.field_name)]),
    [existingNames, starters],
  );

  // Kept starters, keyed by field_name. Default: everything on. A starter
  // already created in the org is always "kept" and locked on.
  const [unkept, setUnkept] = useState<Set<string>>(new Set());
  const isKept = (name: string) => existingNames.has(name) || !unkept.has(name);

  // Edits made to a starter before it exists. Staged, like the toggles, and
  // applied together on Continue — so "these aren't my categories" can be
  // fixed in place instead of needing a second pass after they're created.
  const [starterEdits, setStarterEdits] = useState<Record<string, FieldEdits>>({});
  const draftFor = (field: StarterField): FieldEdits =>
    starterEdits[field.field_name] ?? {
      field_label: field.field_label,
      options: field.options ?? [],
      is_required: field.is_required ?? false,
      show_in_documents: false,
    };

  const toggle = (name: string) => {
    setUnkept(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Starters that don't exist yet — the only ones there's a choice about.
  const pendingStarters = starters.filter(s => !existingNames.has(s.field_name));
  // Everything the org actually has, starters included once they're created.
  // One list, so it reads as the whole picture of what this entity tracks and
  // a created starter is editable rather than a dead locked row.
  const orgFields = fieldDefinitions.filter(f => f.status === 'active');

  /**
   * Composer additions are created immediately — unlike the starter toggles,
   * which are staged and applied on Continue ("kept — will be created").
   *
   * The new row then opens into its editor straight away: naming a field is
   * rarely the whole intent (a Select still needs its options), and the design
   * treats add -> expand -> settle as one motion rather than two trips.
   */
  const handleAdd = async (field: ComposedField) => {
    const created = await addField({ entity, ...field });
    setJustAdded(created.id);
    setExpanded(created.id);
    window.setTimeout(
      () => setJustAdded(current => (current === created.id ? null : current)),
      1200,
    );
  };

  const handleContinue = async () => {
    const keep = new Set(starters.map(s => s.field_name).filter(isKept));
    const toCreate = starterFieldsToApply(entity, keep, fieldDefinitions, starterEdits);
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

  // A system field takes over the panel rather than expanding inline: its
  // workflow is a surface of its own, not a few settings under a row.
  const drillStarter = starters.find(s => s.field_name === drillIn);
  if (drillIn && drillStarter) {
    const created = fieldDefinitions.find(f => f.field_name === drillIn);
    return (
      <div className="space-y-5">
        <StatusWorkflowDrillIn
          entityLabel={entity}
          persistence={created ? 'immediate' : 'staged'}
          initialOptions={
            created ? normalizeOptions(created.options) : draftFor(drillStarter).options
          }
          onSave={async options => {
            if (created) {
              await saveOptions(created.id, options);
            } else {
              setStarterEdits(current => ({
                ...current,
                [drillIn]: { ...draftFor(drillStarter), options },
              }));
            }
          }}
          onBack={() => setDrillIn(null)}
          disabled={saving}
        />
        <StepFooter onBack={() => setDrillIn(null)} disabled={saving}>
          <Button type="button" onClick={() => setDrillIn(null)}>
            Done
          </Button>
        </StepFooter>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg bg-setup-surface px-3 py-2">
        <Lock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground">
          Always included: {FIXED_FIELDS[entity].join(' · ')}
        </p>
      </div>

      <div className="space-y-2">
        <SectionLabel>Starter fields · toggle off what you don&apos;t need</SectionLabel>
        <EntityFieldList
          entity={entity}
          starters={starters}
          pendingStarters={pendingStarters}
          orgFields={orgFields}
          isKept={isKept}
          onToggleKeep={toggle}
          draftFor={draftFor}
          onDraftChange={(name, next) => setStarterEdits(current => ({ ...current, [name]: next }))}
          expanded={expanded}
          onExpand={setExpanded}
          onDrillIn={setDrillIn}
          justAdded={justAdded}
          onSave={saveField}
          onArchive={(id, label) => {
            setExpanded(null);
            void archive(id, label);
          }}
          disabled={saving}
        />
      </div>

      <FieldComposer
        example={FIELD_EXAMPLE[entity]}
        taken={allNames}
        entityLabel={entity}
        onAdd={handleAdd}
        disabled={saving}
      />

      <StepFooter onBack={onBack} disabled={saving}>
        <Button type="button" onClick={handleContinue} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </StepFooter>
    </div>
  );
}
