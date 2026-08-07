'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { StarterEntity } from '@/lib/organization/presets';
import { StepFooter } from './SetupShell';
import EntityFieldSection, { type EntityFieldSectionHandle } from './EntityFieldSection';

interface SecondaryEntity {
  entity: StarterEntity;
  /** Section heading, in the user's terms — never the entity's system name. */
  heading: string;
  /** Plain-language singular used in the composer's copy. */
  label: string;
}

interface EntityFieldSetupStepProps {
  entity: StarterEntity;
  /**
   * A second entity set up in the same step, because the user thinks of it as
   * part of the first. Orders passes order_item: "size" belongs to a line, not
   * to the order, but nobody setting up a print shop thinks of an order line as
   * a separate thing to configure.
   */
  secondary?: SecondaryEntity;
  /** Called after the chosen fields are saved, to advance the wizard. */
  onContinue: () => void;
  /** Returns to the previous step; omitted only where there isn't one. */
  onBack?: () => void;
}

/**
 * One step's field setup: one or two entities, one Continue.
 *
 * The step is a shell — every per-entity concern lives in EntityFieldSection.
 * What stays here is what genuinely spans the sections: the footer, the order
 * they're applied in, and hiding the rest of the panel when a system field
 * (the status workflow) takes it over.
 *
 * Sections apply in order, primary first, and a failure stops the rest rather
 * than pressing on: half-created starters with an error toast reads as
 * "nothing happened" while having changed the org.
 */
export default function EntityFieldSetupStep({
  entity,
  secondary,
  onContinue,
  onBack,
}: EntityFieldSetupStepProps) {
  const { toast } = useToast();
  const primaryRef = useRef<EntityFieldSectionHandle>(null);
  const secondaryRef = useRef<EntityFieldSectionHandle>(null);
  const [saving, setSaving] = useState(false);
  /** A system field has taken the panel over — only the primary has one. */
  const [drillActive, setDrillActive] = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    try {
      await primaryRef.current?.apply();
      await secondaryRef.current?.apply();
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
      <EntityFieldSection
        ref={primaryRef}
        entity={entity}
        disabled={saving}
        onDrillInChange={setDrillActive}
      />

      {secondary && !drillActive && (
        <EntityFieldSection
          ref={secondaryRef}
          entity={secondary.entity}
          heading={secondary.heading}
          entityLabel={secondary.label}
          disabled={saving}
        />
      )}

      {drillActive ? (
        <StepFooter onBack={() => primaryRef.current?.closeDrillIn()} disabled={saving}>
          <Button type="button" onClick={() => primaryRef.current?.closeDrillIn()}>
            Done
          </Button>
        </StepFooter>
      ) : (
        <StepFooter onBack={onBack} disabled={saving}>
          <Button type="button" onClick={handleContinue} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </StepFooter>
      )}
    </div>
  );
}
