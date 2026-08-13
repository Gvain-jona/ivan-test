'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, ClipboardList, Loader2, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization as useClerkOrganization } from '@clerk/nextjs';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { useMediaQuery } from '@/hooks/use-media-query';
import { apiRequest, PLATFORM_API } from '@/lib/api/client';
import {
  STEP_COUNT,
  nextStep,
  previousStep,
  stepNumber,
  type SetupStepId,
} from '@/lib/onboarding/steps';
import BusinessDetailsStep, { type BusinessDetails } from './BusinessDetailsStep';
import EntityFieldSetupStep from './EntityFieldSetupStep';
import FirstRecordsStep from './FirstRecordsStep';
import SetupShell, { StepFooter, StepHeading } from './SetupShell';

/**
 * First-run wizard: the business's own details first (A1), then the model —
 * product -> client -> order in dependency order, configuring each entity's
 * fields in place — closing with an invitation to create the first records.
 * Finishing marks onboarding complete so the gate stops routing here. See
 * docs/v2-migration/FIRST_RUN_AND_FIELD_SETUP.md and ONBOARDING_REDESIGN.md.
 */
export default function GettingStartedWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { currency: savedCurrency, settings, isLoading: orgLoading, mutate } = useOrganization();
  const { organization: clerkOrg, isLoaded: clerkLoaded } = useClerkOrganization();
  // lg — the same breakpoint SetupShell and OrderSheet switch on.
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [step, setStep] = useState<SetupStepId>('business');
  const [business, setBusiness] = useState<BusinessDetails>(EMPTY_BUSINESS);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  // Seed the form from what the org already has, once.
  //
  // The business name falls back to the **Clerk organization name**, which is
  // already known by the time anyone reaches setup — it is what they typed to
  // create the org. Asking for it again on a blank line would be the app
  // pretending not to know something it does know. `provision_organization`
  // seeds `identity.legal_name` for new orgs, so this mainly catches the org
  // that predates that, which is exactly the one with a blank letterhead.
  //
  // Both sources have to have arrived before seeding, or the race decides the
  // form: Clerk resolving first would seed a blank currency from a
  // still-loading settings fetch, and Continue would then block on a decision
  // the user already made. `loaded` stops a later revalidation from re-seeding
  // over live edits.
  useEffect(() => {
    if (loaded || !clerkLoaded || orgLoading) return;
    const identity = settings.identity;
    setBusiness({
      legal_name: identity?.legal_name ?? clerkOrg?.name ?? '',
      industry: identity?.industry ?? '',
      address: identity?.address ?? '',
      phone: identity?.phone ?? '',
      email: identity?.email ?? '',
      currency: savedCurrency ?? '',
    });
    setLoaded(true);
  }, [loaded, clerkLoaded, orgLoading, clerkOrg?.name, settings.identity, savedCurrency]);

  const advance = () => {
    const next = nextStep(step);
    if (next) setStep(next);
  };
  const back = () => {
    const previous = previousStep(step);
    if (previous) setStep(previous);
  };
  /** The first step has nowhere to go back to. */
  const onBack = previousStep(step) ? back : undefined;

  const saveBusiness = async () => {
    // Required, not optional: v2.issue_document() refuses to raise an invoice
    // or quotation without settings.locale.currency. Continue is disabled
    // without one; this guard is the non-UI half of the same rule.
    if (!business.currency) return;
    setBusy(true);
    try {
      // Blocks, not top-level keys — the DB trigger whitelists identity / tax /
      // documents / locale / platform_access and rejects anything else. Empty
      // fields are omitted rather than sent as '': settings is frozen into
      // document snapshots, and a blank string asserts a blank phone number.
      await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', {
        settings: {
          identity: identityPayload(business),
          locale: { currency: business.currency },
        },
      });
      await mutate();
      advance();
    } catch (error) {
      toast({
        title: 'Could not save your details',
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

  // Hold the first paint until the org's existing details have arrived and
  // seeded the form. Without this the business name, currency and other saved
  // identity fields flash blank — an empty form rendered before Clerk and the
  // settings fetch resolve, then visibly filling in. `loaded` flips true once
  // both have arrived (or on error), so this resolves in a beat and never hangs.
  if (!loaded) return <SetupLoading />;

  // The business step is step 1. On mobile it's the bare A1 hero (no rail);
  // on desktop it renders inside SetupShell so the layout doesn't switch
  // between step 1 and step 2. The breakpoint is already resolved by the time
  // `loaded` lets us render, so this is a single mount with no flash.
  if (step === 'business') {
    const businessStep = (chrome: 'frame' | 'panel') => (
      <BusinessDetailsStep
        value={business}
        onChange={setBusiness}
        onContinue={saveBusiness}
        busy={busy}
        chrome={chrome}
      />
    );
    return isDesktop ? (
      <SetupShell current="business">{businessStep('panel')}</SetupShell>
    ) : (
      businessStep('frame')
    );
  }

  return (
    <SetupShell current={step}>
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
            // An order's lines are set up here rather than in a step of their
            // own: size varies per line, not per order, but "order item" is a
            // system word and nobody setting up a print shop would look for it
            // as a separate stage.
            secondary={{
              entity: 'order_item',
              heading: 'For each item on an order',
              label: 'order item',
            }}
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

/** Shown while the org's saved details load, before the form is seeded. */
function SetupLoading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-setup-canvas">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}

const EMPTY_BUSINESS: BusinessDetails = {
  legal_name: '',
  industry: '',
  address: '',
  phone: '',
  email: '',
  currency: '',
};

/**
 * The identity block, with blanks left out entirely.
 *
 * `settingsBlocks` rejects an empty string for these keys, and the route
 * deep-merges per block, so omitting a key means "leave it alone" — which is
 * the right behaviour for a field the user never filled in. It also keeps a
 * blank string out of the issuer block that `issue_document()` freezes onto
 * every invoice.
 */
function identityPayload(business: BusinessDetails): Record<string, string> {
  const entries: [string, string][] = [
    ['legal_name', business.legal_name],
    ['industry', business.industry],
    ['address', business.address],
    ['phone', business.phone],
    ['email', business.email],
  ];
  return Object.fromEntries(entries.filter(([, value]) => value.trim() !== ''));
}
