'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, ClipboardList, Coins, Loader2, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { apiRequest, PLATFORM_API } from '@/lib/api/client';
import {
  STEP_COUNT,
  nextStep,
  previousStep,
  stepNumber,
  type SetupStepId,
} from '@/lib/onboarding/steps';
import CurrencyStep from './CurrencyStep';
import EntityFieldSetupStep from './EntityFieldSetupStep';
import FirstRecordsStep from './FirstRecordsStep';
import SetupShell, { StepFooter, StepHeading } from './SetupShell';
import WelcomeStep from './WelcomeStep';

/**
 * First-run wizard: teaches the model by walking product -> client -> order in
 * dependency order, configuring each entity's fields in place and closing with
 * an invitation to create the first records. Currency comes first (an
 * org-level scalar). Finishing marks onboarding complete so the gate stops
 * routing here. See docs/v2-migration/FIRST_RUN_AND_FIELD_SETUP.md and
 * ONBOARDING_REDESIGN.md.
 */
export default function GettingStartedWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { currency: savedCurrency, mutate } = useOrganization();

  const [step, setStep] = useState<SetupStepId>('welcome');
  const [currency, setCurrency] = useState<string>('');
  const [busy, setBusy] = useState(false);

  // Reflect what the org already has. The wizard's step is component state, so
  // a reload or a second pass restarts at the intro — without this, a currency
  // that IS set would show unselected and, now that it's required, block
  // Continue on a decision the user already made.
  useEffect(() => {
    if (!currency && savedCurrency) setCurrency(savedCurrency);
  }, [currency, savedCurrency]);

  const advance = () => {
    const next = nextStep(step);
    if (next) setStep(next);
  };
  const back = () => {
    const previous = previousStep(step);
    if (previous) setStep(previous);
  };
  /** Every step except the intro can go back; the intro has nowhere to go. */
  const onBack = previousStep(step) ? back : undefined;

  const saveCurrency = async () => {
    // Required, not optional: v2.issue_document() refuses to raise an invoice
    // or quotation without settings.locale.currency. Continue is disabled
    // without one; this guard is the non-UI half of the same rule.
    if (!currency) return;
    // Already the org's currency (a second pass through setup) — nothing to
    // write, so skip the round trip.
    if (currency === savedCurrency) return advance();
    setBusy(true);
    try {
      // settings.locale.currency — a block, not a top-level key. The DB
      // trigger whitelists blocks and rejects anything else.
      await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', {
        settings: { locale: { currency } },
      });
      await mutate();
      advance();
    } catch (error) {
      toast({
        title: 'Could not save currency',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', { onboarding_completed: true });
      await mutate();
      router.replace('/dashboard/orders');
    } catch (error) {
      toast({
        title: 'Could not finish setup',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      setBusy(false);
    }
  };

  return (
    <SetupShell current={step}>
      {step === 'welcome' && <WelcomeStep onStart={advance} />}

      {step === 'currency' && (
        <>
          <StepHeading
            stepNumber={stepNumber(step)}
            stepCount={STEP_COUNT}
            icon={<Coins className="h-5 w-5" />}
            title="Your currency"
            hint="Required — orders, payments, and every invoice you issue are priced in it."
          />
          <CurrencyStep
            value={currency}
            onChange={setCurrency}
            onContinue={saveCurrency}
            onBack={onBack}
            busy={busy}
          />
        </>
      )}

      {step === 'product' && (
        <>
          <StepHeading
            stepNumber={stepNumber(step)}
            stepCount={STEP_COUNT}
            icon={<Package className="h-5 w-5" />}
            title="Your product catalog"
            hint="What you sell. Keep the fields that fit, add your own, or create your first product."
          />
          <EntityFieldSetupStep
            entity="product"
            onContinue={advance}
            onBack={onBack}
          />
        </>
      )}

      {step === 'client' && (
        <>
          <StepHeading
            stepNumber={stepNumber(step)}
            stepCount={STEP_COUNT}
            icon={<Users className="h-5 w-5" />}
            title="Your clients"
            hint="Who you sell to. Only a name is required — everything else is yours to define."
          />
          <EntityFieldSetupStep
            entity="client"
            onContinue={advance}
            onBack={onBack}
          />
        </>
      )}

      {step === 'order' && (
        <>
          <StepHeading
            stepNumber={stepNumber(step)}
            stepCount={STEP_COUNT}
            icon={<ClipboardList className="h-5 w-5" />}
            title="Your orders"
            hint="This includes your status workflow — the stages an order moves through."
          />
          <EntityFieldSetupStep
            entity="order"
            onContinue={advance}
            onBack={onBack}
          />
        </>
      )}

      {step === 'records' && (
        <>
          <StepHeading
            stepNumber={stepNumber(step)}
            stepCount={STEP_COUNT}
            icon={<Check className="h-5 w-5" strokeWidth={3} />}
            tone="success"
            title="Your workspace is set up"
            hint="Add a first record to each if you like — or head straight to the dashboard and do it as work comes in."
          />
          <FirstRecordsStep />
          <StepFooter onBack={onBack} disabled={busy}>
            <Button onClick={finish} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Go to my dashboard
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </StepFooter>
        </>
      )}
    </SetupShell>
  );
}
